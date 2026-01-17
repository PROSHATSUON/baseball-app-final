import ClientPage from './ClientPage';

// 【追加】これを書くとビルドエラーが消え、常に最新データを取得するようになります
export const dynamic = 'force-dynamic';

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
          page_size: 100,
          start_cursor: startCursor,
        }),
        next: { revalidate: 0 }
      });

      if (!res.ok) throw new Error(`Notion API Error: ${res.status}`);

      const data = await res.json();
      allResults = [...allResults, ...data.results];
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    const results = allResults.map((page) => {
      const p = page.properties;
      
      let audioLink = '';
      if (p['音声']?.files?.length > 0) {
        audioLink = p['音声'].files[0].file?.url || p['音声'].files[0].external?.url;
      } else {
        audioLink = p['音声']?.url;
      }

      let exampleAudioLink = '';
      if (p['例文音声']?.files?.length > 0) {
        exampleAudioLink = p['例文音声'].files[0].file?.url || p['例文音声'].files[0].external?.url;
      }

      return {
        id: page.id,
        word: p['単語']?.title?.[0]?.plain_text || 'No Title',
        meaning: p['意味']?.rich_text?.[0]?.plain_text || '',
        ipa: p['発音記号']?.rich_text?.[0]?.plain_text || '',
        katakana: p['カタカナ発音']?.rich_text?.[0]?.plain_text || '',
        genre: p['ジャンル']?.select?.name || 'その他',
        difficulty: p['難易度']?.select?.name || '-',
        audioUrl: audioLink || '',
        exampleAudioUrl: exampleAudioLink || '',
        memo: p['メモ']?.rich_text?.[0]?.plain_text || '',
        example: p['例文']?.rich_text?.[0]?.plain_text || '',
        exampleTranslation: p['例文訳']?.rich_text?.[0]?.plain_text || '',
        videoUrl: p['動画']?.url || '',
        videoTime: p['動画時間']?.rich_text?.[0]?.plain_text || '',
        videoSentence: p['動画英文']?.rich_text?.[0]?.plain_text || '',
        videoTranslation: p['動画訳']?.rich_text?.[0]?.plain_text || '',
        lastViewed: p['最終表示日']?.date?.start || '-',
      };
    });

    return <ClientPage words={results || []} />;

  } catch (error) {
    console.error(error);
    return <div className="p-10 text-red-600">データの読み込みに失敗しました: {error.message}</div>;
  }
}
