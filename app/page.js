import ClientPage from './ClientPage';
import { Client } from '@notionhq/client';

export const dynamic = 'force-dynamic';

async function getWords() {
  const databaseId = process.env.NOTION_DB_ID;
  const apiKey = process.env.NOTION_API_KEY;

  if (!databaseId || !apiKey) {
    console.error("【エラー】単語帳のIDまたはAPIキーが設定されていません");
    return [];
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: '単語', direction: 'ascending' }],
      }),
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`【単語取得エラー】Notion APIがエラーを返しました: ${res.status} - ${errorText}`);
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();
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
        lastViewed: p['最終表示日']?.date?.start || '-',
      };
    });
  } catch (error) {
    console.error("【単語取得クラッシュ】", error);
    return [];
  }
}

async function getBlogPosts() {
  const blogDatabaseId = process.env.NOTION_BLOG_DB_ID; 
  const apiKey = process.env.NOTION_API_KEY;

  if (!blogDatabaseId) {
    console.error("【エラー】ブログDBのID (NOTION_BLOG_DB_ID) がVercelに設定されていません！");
    return [];
  }

  const notion = new Client({ auth: apiKey });

  try {
    console.log("ブログ記事の取得を開始します...");
    const response = await notion.databases.query({
      database_id: blogDatabaseId,
      page_size: 20,
      sorts: [{ property: 'Date', direction: 'descending' }],
      // フィルターを一時的に外して、とにかくデータが取れるかテスト
    });

    console.log(`ブログ記事が ${response.results.length} 件見つかりました。`);

    const postsWithContent = await Promise.all(
      response.results.map(async (page) => {
        const p = page.properties;
        
        // 列の名前チェックログ
        if (!p['Title']) console.warn(`【警告】記事ID: ${page.id} に 'Title' という列が見つかりません。Notionの列名を確認してください。`);

        let contentBlocks = [];
        try {
          const blocksRes = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 50,
          });
          contentBlocks = blocksRes.results;
        } catch (e) {
          console.error(`【ブロック取得エラー】記事ID: ${page.id} の中身が取れませんでした。`, e.message);
        }

        return {
          id: page.id,
          title: p['Title']?.title?.[0]?.plain_text || 'No Title (列名違いの可能性)',
          date: p['Date']?.date?.start || '',
          tag: p['Tag']?.select?.name || 'Blog',
          summary: p['Summary']?.rich_text?.[0]?.plain_text || '',
          url: page.url,
          content: contentBlocks,
        };
      })
    );

    return postsWithContent;

  } catch (error) {
    console.error("【ブログ取得・重大エラー】:", error.body || error);
    return [];
  }
}

export default async function Home() {
  const [words, posts] = await Promise.all([getWords(), getBlogPosts()]);
  return <ClientPage words={words} posts={posts} />;
}