import ClientPage from './ClientPage';
import { Client } from '@notionhq/client';

export const dynamic = 'force-dynamic';

// --- 単語取得 (既存のまま) ---
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

    return allResults.map((page) => {
      const p = page.properties;
      const getFile = (prop) => prop?.files?.[0]?.file?.url || prop?.files?.[0]?.external?.url || prop?.url || '';
      const getText = (prop) => prop?.rich_text?.[0]?.plain_text || '';
      const getTitle = (prop) => prop?.title?.[0]?.plain_text || 'No Title';
      const getSelect = (prop) => prop?.select?.name || '';

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
        lastViewed: p['最終表示日']?.date?.start || '-',
      };
    });
  } catch (error) {
    console.error("Word Fetch Error:", error);
    return [];
  }
}

// --- ブログ取得 (20件 & 中身取得) ---
async function getBlogPosts() {
  const blogDatabaseId = process.env.NOTION_BLOG_DB_ID; 
  const apiKey = process.env.NOTION_API_KEY;
  if (!blogDatabaseId || !apiKey) return [];

  const notion = new Client({ auth: apiKey });

  try {
    // 記事一覧を取得（20件）
    const response = await notion.databases.query({
      database_id: blogDatabaseId,
      page_size: 20, // ★20件に変更
      sorts: [{ property: 'Date', direction: 'descending' }],
      filter: { property: 'Title', title: { is_not_empty: true } },
    });

    // 中身（ブロック）を並行取得
    const postsWithContent = await Promise.all(
      response.results.map(async (page) => {
        const p = page.properties;
        let contentBlocks = [];
        try {
          const blocksRes = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 50, // 記事が長い場合、最初の50ブロックまで
          });
          contentBlocks = blocksRes.results;
        } catch (e) {
          console.error(`Block fetch error: ${page.id}`);
        }

        return {
          id: page.id,
          title: p['Title']?.title?.[0]?.plain_text || 'No Title',
          date: p['Date']?.date?.start || '',
          tag: p['Tag']?.select?.name || 'Blog',
          summary: p['Summary']?.rich_text?.[0]?.plain_text || '',
          url: page.url,
          content: contentBlocks, // 中身データ
        };
      })
    );
    return postsWithContent;
  } catch (error) {
    console.error("Blog Fetch Error:", error);
    return [];
  }
}

export default async function Home() {
  const [words, posts] = await Promise.all([getWords(), getBlogPosts()]);
  return <ClientPage words={words} posts={posts} />;
}