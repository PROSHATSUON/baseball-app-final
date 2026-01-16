import ClientPage from './ClientPage';

export default async function Home() {
  const databaseId = process.env.NOTION_DB_ID;
  const apiKey = process.env.NOTION_API_KEY;

  if (!databaseId || !apiKey) {
    return <div className="p-10 text-red-600 font-bold">Error: 環境変数（APIキー/DB ID）が設定されていません</div>;
  }

  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  try {
    // データがなくなるまで繰り返し取得するループ（100件の壁を突破）
    while (hasMore) {
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [{ property: '単語', direction: 'ascending' }],
          page_size: 100, // 上限の100件
          start_cursor: startCursor, // 「続きはここから」という目印
        }),
        next: { revalidate: 0 }
      });

      if (!res.ok) throw new Error(`Notion API Error: ${res.status}`);

      const data = await res.json();
      allResults = [...allResults, ...data.results];
      
      // まだ続きがあるかチェック
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    // 全件取得後にデータを整形
    const results = allResults.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        word: p['単語']?.title?.[0]?.plain_text || 'No Title',
        meaning: p['意味']?.rich_text?.[0]?.plain_text || '',
        ipa: p['発音記号']?.rich_text?.[0]?.plain_text || '',
        katakana: p['カタカナ発音']?.rich_text?.[0]?.plain_text || '',
        genre: p['ジャンル']?.select?.name || 'その他',
        difficulty: p['難易度']?.select?.name || '-',
        audioUrl: p['音声']?.url || '',
        memo: p['メモ']?.rich_text?.[0]?.plain_text || '',
        example: p['例文']?.rich_text?.[0]?.plain_text || '',
        lastViewed: p['最終表示日']?.date?.start || '-',
        videoUrl: p['動画']?.url || '',
      };
    });

    return <ClientPage words={results} />;

  } catch (error) {
    console.error(error);
    return <div className="p-10 text-red-600">データの読み込みに失敗しました: {error.message}</div>;
  }
}
