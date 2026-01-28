import ClientPage from './ClientPage';

// 常に最新データを取得する設定
export const dynamic = 'force-dynamic';

// ==========================================
// 1. 既存の単語データを取得する関数（ロジック変更なし）
// ==========================================
async function getWords() {
  const databaseId = process.env.NOTION_DB_ID;
  const apiKey = process.env.NOTION_API_KEY;

  if (!databaseId || !apiKey) return [];

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

    // マッピング処理（既存のまま）
    return allResults.map((page) => {
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

  } catch (error) {
    console.error("Word Fetch Error:", error);
    return [];
  }
}

// ==========================================
// 2. 新規：ブログデータを取得する関数
// ==========================================
async function getBlogPosts() {
  // ★ブログ用のDB IDを環境変数から取得
  const blogDatabaseId = process.env.NOTION_BLOG_DB_ID; 
  const apiKey = process.env.NOTION_API_KEY; // APIキーは共通でOK

  if (!blogDatabaseId || !apiKey) return [];

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${blogDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          { property: 'Date', direction: 'descending' }, // 日付の新しい順
        ],
        filter: {
          property: 'Title',
          title: { is_not_empty: true }, // タイトルがあるものだけ
        },
      }),
      next: { revalidate: 0 }
    });

    if (!res.ok) throw new Error(`Notion Blog API Error: ${res.status}`);

    const data = await res.json();

    return data.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        // Notionの列名に合わせて取得（Title, Date, Tag, Summary）
        title: p['Title']?.title?.[0]?.plain_text || 'No Title',
        date: p['Date']?.date?.start || '',
        tag: p['Tag']?.select?.name || 'Blog',
        summary: p['Summary']?.rich_text?.[0]?.plain_text || '',
        url: page.url, // Notionページへのリンク
      };
    });

  } catch (error) {
    console.error("Blog Fetch Error:", error);
    return [];
  }
}

// ==========================================
// メインコンポーネント
// ==========================================
export default async function Home() {
  // 単語とブログを並行して取得
  const [words, posts] = await Promise.all([getWords(), getBlogPosts()]);

  // ClientPageに両方を渡す
  return <ClientPage words={words} posts={posts} />;
}