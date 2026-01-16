import ClientPage from './ClientPage';

export default async function Home() {
  // 環境変数がなければエラー表示
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DB_ID) {
    return <div className="p-10 text-red-600 font-bold">Error: 環境変数（APIキー/DB ID）が設定されていません</div>;
  }

  const databaseId = process.env.NOTION_DB_ID;
  const apiKey = process.env.NOTION_API_KEY;

  let results = [];
  
  try {
    // Notion APIからデータを取得（キャッシュなしで常に最新）
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      // 並び替え：単語のアルファベット順
      body: JSON.stringify({
        sorts: [{ property: '単語', direction: 'ascending' }],
        page_size: 100 // 一度に取得する件数
      }),
      next: { revalidate: 0 } 
    });

    if (!res.ok) throw new Error(`Notion API Error: ${res.status}`);

    const data = await res.json();

    // 取得したデータを使いやすい形に整形
    results = data.results.map((page) => {
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

  } catch (error) {
    console.error(error);
    return <div className="p-10 text-red-600">データの読み込みに失敗しました</div>;
  }

  // 取得したデータを「見た目担当」のファイルに渡す
  return <ClientPage words={results} />;
}