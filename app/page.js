import ClientPage from './ClientPage';

export const dynamic = 'force-dynamic';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = process.env.NOTION_DB_ID;
const NOTION_BLOG_DB_ID = process.env.NOTION_BLOG_DB_ID;

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// --- ヘルパー関数: Notionへの通信 ---
async function fetchNotion(url, method = 'GET', body = null) {
  try {
    const options = { method, headers, next: { revalidate: 0 } };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(url, options);
    
    if (!res.ok) {
      // エラーなら内容をコンソールに出す
      const errText = await res.text();
      console.error(`Notion API Error (${res.status}):`, errText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
}

// --- 1. 単語帳の取得 ---
async function getWords() {
  if (!NOTION_DB_ID || !NOTION_API_KEY) return [];

  const data = await fetchNotion(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, 'POST', {
    page_size: 100,
    sorts: [{ property: '単語', direction: 'ascending' }],
  });

  if (!data) return [];

  return data.results.map((page) => {
    const p = page.properties;
    const getText = (prop) => prop?.rich_text?.[0]?.plain_text || '';
    const getTitle = (prop) => prop?.title?.[0]?.plain_text || 'No Title';
    const getSelect = (prop) => prop?.select?.name || '';
    const getFile = (prop) => prop?.files?.[0]?.file?.url || prop?.files?.[0]?.external?.url || prop?.url || '';

    return {
      id: page.id,
      word: getTitle(p['単語']),
      meaning: getText(p['意味']),
      ipa: getText(p['発音記号']),
      katakana: getText(p['カタカナ発音']),
      genre: getSelect(p['ジャンル']) || 'その他',
      difficulty: getSelect(p['難易度']) || '-',
      audioUrl: getFile(p['音声']),
      exampleAudioUrl: getFile(p['例文音声']),
      memo: getText(p['メモ']),
      example: getText(p['例文']),
      exampleTranslation: getText(p['例文訳']),
      videoUrl: p['動画']?.url || '',
      videoTime: getText(p['動画時間']),
      videoSentence: getText(p['動画英文']),
      videoTranslation: getText(p['動画訳']),
    };
  });
}

// --- 2. ブログ記事の取得（ライブラリ不使用） ---
async function getBlogPosts() {
  if (!NOTION_BLOG_DB_ID || !NOTION_API_KEY) return [];

  // 記事一覧を取得
  const data = await fetchNotion(`https://api.notion.com/v1/databases/${NOTION_BLOG_DB_ID}/query`, 'POST', {
    page_size: 20,
    sorts: [{ property: 'Date', direction: 'descending' }],
  });

  if (!data) return [];

  // 各記事の中身（ブロック）を取得
  const postsWithContent = await Promise.all(
    data.results.map(async (page) => {
      const p = page.properties;
      
      // ブロック（本文）を取得
      const blockData = await fetchNotion(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=50`);
      const contentBlocks = blockData ? blockData.results : [];

      return {
        id: page.id,
        title: p['Title']?.title?.[0]?.plain_text || 'No Title',
        date: p['Date']?.date?.start || '',
        tag: p['Tag']?.select?.name || 'Blog',
        summary: p['Summary']?.rich_text?.[0]?.plain_text || '',
        url: page.url,
        content: contentBlocks,
      };
    })
  );

  return postsWithContent;
}

export default async function Home() {
  const [words, posts] = await Promise.all([getWords(), getBlogPosts()]);
  return <ClientPage words={words} posts={posts} />;
}