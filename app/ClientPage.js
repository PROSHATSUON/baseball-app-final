'use client';
import { useState, useMemo, useRef, useEffect } from 'react';

// --- アイコン ---
const SpeakerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>);
const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const VideoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const ArrowUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>);
const ArrowDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>);
const ChevronDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const ChevronUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>);
const ExternalLinkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>);

const IPA_FONT_STYLE = { fontFamily: '"Lucida Sans Unicode", "Arial Unicode MS", "Segoe UI Symbol", sans-serif' };

// --- Notionブロックレンダラー ---
const RenderBlock = ({ block }) => {
  const { type } = block;
  const value = block[type];
  if (!value) return null;
  
  const text = value.rich_text?.map(t => t.plain_text).join('') || '';

  switch (type) {
    case 'heading_1': return <h2 className="text-2xl font-black text-slate-800 mt-6 mb-3 border-b pb-1 border-blue-200">{text}</h2>;
    case 'heading_2': return <h3 className="text-xl font-bold text-slate-700 mt-5 mb-2 border-l-4 border-blue-500 pl-3">{text}</h3>;
    case 'heading_3': return <h4 className="text-lg font-bold text-slate-700 mt-4 mb-2">{text}</h4>;
    case 'paragraph': return <p className="text-slate-600 mb-3 leading-relaxed text-sm whitespace-pre-wrap">{text}</p>;
    case 'bulleted_list_item': return <li className="text-slate-600 ml-4 mb-1 text-sm list-disc pl-1">{text}</li>;
    case 'numbered_list_item': return <li className="text-slate-600 ml-4 mb-1 text-sm list-decimal pl-1">{text}</li>;
    case 'quote': return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-500 my-3 bg-gray-50 py-2 pr-2 text-sm">{text}</blockquote>;
    case 'image': 
      const src = value.type === 'external' ? value.external.url : value.file.url;
      return <div className="my-4 rounded-xl overflow-hidden shadow-sm border border-gray-100"><img src={src} alt="Article Image" className="w-full h-auto" /></div>;
    default: return null;
  }
};

export default function ClientPage({ words, posts }) {
  const safeWords = (words && Array.isArray(words)) ? words : [];
  const safePosts = (posts && Array.isArray(posts)) ? posts : [];

  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  
  // モーダル用state
  const [videoModalItem, setVideoModalItem] = useState(null);
  const [blogModalPost, setBlogModalPost] = useState(null);

  const [testPhase, setTestPhase] = useState('select');
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [showScrollBtns, setShowScrollBtns] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  const audioRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const GENRES = ["ALL", "基本用語", "打撃/走塁", "投球/守備", "頻出表現"];

  // スクロール制御
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.scrollY;
      setShowScrollBtns(currentScrollTop > 100);

      if (activeTab === 'list') {
        if (currentScrollTop < 10) setIsHeaderVisible(true);
        else if (currentScrollTop > lastScrollTopRef.current && currentScrollTop > 60) setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollTopRef.current = currentScrollTop;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const toggleHeader = () => setIsHeaderVisible(!isHeaderVisible);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  const playAudio = (e, rawUrl) => {
    e?.stopPropagation();
    if (!rawUrl || !audioRef.current) return;
    let fileId = "";
    const match1 = rawUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    const match2 = rawUrl.match(/id=([a-zA-Z0-9_-]{25,})/);
    if (match1) fileId = match1[1]; else if (match2) fileId = match2[1];
    const playUrl = fileId ? `https://docs.google.com/uc?export=download&id=${fileId}` : rawUrl;
    audioRef.current.src = playUrl;
    audioRef.current.load();
    audioRef.current.play().catch(console.error);
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const getYoutubeStartTime = (url) => {
    if (!url) return 0;
    const match = url.match(/[?&](t|start)=([^&]+)/);
    if (!match) return 0;
    return parseInt(match[2]) || 0;
  };

  // テスト機能
  const startTest = (genre) => {
    let candidates = genre === 'ALL' ? safeWords : safeWords.filter(w => w.genre === genre);
    const selected = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 10);
    if (selected.length === 0) return alert("単語がありません");
    setTestQuestions(selected);
    setCurrentQuestionIndex(0);
    setIsFlipped(false);
    setTestPhase('playing');
  };

  const nextCard = (e) => {
    e.stopPropagation();
    if (currentQuestionIndex < testQuestions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 150);
    } else setTestPhase('result');
  };

  const restartTest = () => { setTestPhase('select'); setTestQuestions([]); setCurrentQuestionIndex(0); setIsFlipped(false); };

  const filteredWords = useMemo(() => {
    return safeWords.filter((item) => {
      const matchGenre = selectedGenre === 'ALL' || item.genre === selectedGenre;
      const matchSearch = (item.word + item.meaning + item.katakana).toLowerCase().includes(searchQuery.toLowerCase());
      return matchGenre && matchSearch;
    });
  }, [searchQuery, selectedGenre, safeWords]);

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-[#f8f9fa]">
      <audio ref={audioRef} style={{ display: 'none' }} preload="none" />

      {/* ヘッダー */}
      <div className={`fixed top-0 left-0 w-full z-30 bg-white shadow-sm transition-transform duration-500 ease-in-out border-b border-gray-200 ${(activeTab === 'list' && !isHeaderVisible) ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="px-4 pt-3 pb-2 bg-white relative z-20">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {['list', 'test', 'blog'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab === 'list' ? '単語リスト' : tab === 'test' ? 'テストモード' : 'ブログ'}
              </button>
            ))}
          </div>
        </div>
        {/* リスト用検索バー */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white ${(activeTab === 'list') ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pb-8">
            <div className="px-3 pb-3">
              <input type="text" placeholder="単語・意味・カタカナ検索" className="w-full rounded-lg bg-gray-100 border border-gray-200 px-4 py-2.5 text-base focus:bg-white focus:border-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex overflow-x-auto px-3 gap-2 scrollbar-hide">
              {GENRES.map((genre) => (
                <button key={genre} onClick={() => setSelectedGenre(genre)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedGenre === genre ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{genre}</button>
              ))}
            </div>
            <div className="px-4 py-1 text-right text-[10px] text-gray-400">{filteredWords.length} Words Found</div>
          </div>
          <div onClick={toggleHeader} className="absolute bottom-0 left-0 w-full flex justify-center pb-1 cursor-pointer bg-gradient-to-t from-white to-transparent z-10">
            <div className="flex items-center gap-1 text-gray-300 hover:text-blue-500"><span className="text-[9px] font-bold">CLOSE</span><ChevronUpIcon /></div>
          </div>
        </div>
      </div>

      {/* MENUボタン */}
      <div className={`fixed top-0 left-0 w-full z-40 flex justify-center pointer-events-none transition-transform duration-500 ${(activeTab === 'list' && !isHeaderVisible) ? 'translate-y-0' : '-translate-y-full'}`}>
        <button onClick={toggleHeader} className="mt-[-2px] bg-white/90 backdrop-blur-sm border border-gray-200 border-t-0 rounded-b-xl px-6 py-1 shadow-md text-blue-600 pointer-events-auto flex flex-col items-center"><ChevronDownIcon /><span className="text-[9px] font-bold mt-0.5">MENU</span></button>
      </div>

      {/* メインエリア */}
      <div className="transition-all duration-500 ease-in-out" style={{ paddingTop: activeTab === 'list' ? (isHeaderVisible ? '240px' : '60px') : '80px' }}>
        
        {/* === 単語リスト === */}
        {activeTab === 'list' && (
          <div className="p-3 space-y-3 pb-24">
            {filteredWords.length === 0 ? <div className="text-center py-20 text-gray-400">見つかりませんでした</div> : 
              filteredWords.map((item) => (
                <div key={item.id} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${expandedId === item.id ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200 shadow-sm active:scale-[0.99]'}`}>
                  <div className="p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{item.word}</h3>
                        {item.audioUrl && <button onClick={(e) => playAudio(e, item.audioUrl)} className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 active:scale-95"><SpeakerIcon /></button>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono"><span style={IPA_FONT_STYLE}>{item.ipa}</span><span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.difficulty}</span></div>
                    </div>
                    <div className="text-sm font-bold text-gray-600 text-right max-w-[40%] leading-snug">{item.meaning}</div>
                  </div>
                  {expandedId === item.id && (
                    <div className="bg-slate-50 border-t border-gray-100 px-5 py-4 text-sm space-y-3 animate-fadeIn">
                      <DetailRow label="カタカナ" content={item.katakana} />
                      {item.example && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-blue-600 block mb-1">EXAMPLE</span>
                          <div className="bg-white border-l-2 border-blue-200 pl-3 py-3 space-y-2">
                            <div className="flex items-start gap-3">
                              <span className="flex-1 text-slate-700 italic font-medium text-base">"{item.example}"</span>
                              {item.exampleAudioUrl && <button onClick={(e) => playAudio(e, item.exampleAudioUrl)} className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full active:scale-95 ml-1 flex items-center justify-center"><PlayIcon /></button>}
                            </div>
                            {item.exampleTranslation && <div className="text-xs text-gray-500 pl-1 border-t border-gray-100 pt-2">{item.exampleTranslation}</div>}
                          </div>
                        </div>
                      )}
                      {item.memo && <DetailRow label="MEMO" content={item.memo} />}
                      {item.videoUrl && <div className="pt-2"><button onClick={(e) => { e.stopPropagation(); setVideoModalItem(item); }} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-full shadow-md active:scale-[0.95]"><VideoIcon /><span>動画を視聴</span></button></div>}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* === テストモード === */}
        {activeTab === 'test' && (
          <div className="p-4 min-h-full flex flex-col">
            {testPhase === 'select' ? (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6 animate-fadeIn py-10">
                <h2 className="text-2xl font-black text-slate-800 text-center"><span className="text-blue-600 block text-lg mb-1">TEST MODE</span>ジャンルを選択</h2>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {GENRES.map(g => <button key={g} onClick={() => startTest(g)} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:bg-blue-50 font-bold text-slate-700 active:scale-95">{g}</button>)}
                </div>
              </div>
            ) : testPhase === 'playing' ? (
              <div className="flex-1 flex flex-col max-w-md mx-auto w-full relative py-4">
                <div className="mb-4 flex justify-between text-xs font-bold text-gray-400"><span>Q {currentQuestionIndex + 1}</span><span>{testQuestions.length}</span></div>
                <div className="h-2 bg-gray-200 rounded-full mb-4"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}></div></div>
                <div className="flex-1 min-h-[400px] relative perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                  <div className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-2xl bg-white border border-gray-200 ${isFlipped ? 'rotate-y-180' : ''}`}>
                    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center z-10">
                      <span className="text-xs font-bold text-blue-600 mb-2">TAP TO FLIP</span>
                      <h3 className="text-4xl font-black text-slate-800 mb-4">{testQuestions[currentQuestionIndex].word}</h3>
                      <div className="flex gap-3 justify-center mb-8"><span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" style={IPA_FONT_STYLE}>{testQuestions[currentQuestionIndex].ipa}</span></div>
                      {testQuestions[currentQuestionIndex].audioUrl && <button onClick={(e) => playAudio(e, testQuestions[currentQuestionIndex].audioUrl)} className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-md active:scale-90"><SpeakerIcon /></button>}
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-50 flex flex-col items-center justify-center p-6 text-center rounded-2xl overflow-y-auto">
                      <span className="text-xs font-bold text-gray-400 mb-4">ANSWER</span>
                      <div className="text-2xl font-bold text-slate-800 mb-6">{testQuestions[currentQuestionIndex].meaning}</div>
                      {testQuestions[currentQuestionIndex].example && <div className="bg-white p-4 rounded-xl border border-gray-200 w-full text-left shadow-sm text-sm">"{testQuestions[currentQuestionIndex].example}"</div>}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center"><button onClick={nextCard} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">{currentQuestionIndex < testQuestions.length - 1 ? 'NEXT CARD →' : 'FINISH TEST'}</button></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-fadeIn py-10">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-2">🎉</div>
                <h2 className="text-3xl font-black text-slate-800">Test Completed!</h2>
                <button onClick={restartTest} className="w-full max-w-xs bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">もう一度テストする</button>
                <button onClick={() => setActiveTab('list')} className="text-gray-400 font-bold text-sm">単語リストに戻る</button>
              </div>
            )}
          </div>
        )}

        {/* === ブログタブ (アプリ内表示) === */}
        {activeTab === 'blog' && (
          <div className="p-3 space-y-3 pb-24">
            {safePosts.length === 0 ? <div className="text-center py-20 text-gray-400">No Articles</div> : 
              safePosts.map((post) => (
                <div key={post.id} onClick={() => setBlogModalPost(post)} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99] overflow-hidden group cursor-pointer">
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{post.tag}</span>
                      <span>{post.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-snug group-hover:text-blue-700 transition-colors">{post.title}</h3>
                    {post.summary && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.summary}</p>}
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                      <span>READ MORE</span><ExternalLinkIcon />
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* --- 動画モーダル --- */}
      {videoModalItem && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setVideoModalItem(null)}>
          <div className="relative w-full max-w-2xl bg-slate-800 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYoutubeId(videoModalItem.videoUrl)}?autoplay=1&start=${getYoutubeStartTime(videoModalItem.videoUrl)}&playsinline=1&rel=0`} title="YouTube" frameBorder="0" allowFullScreen></iframe></div>
            <div className="p-5 text-white">
              <h3 className="text-xl font-extrabold text-orange-400 mb-2">{videoModalItem.word}<span className="ml-3 text-sm text-gray-300 font-normal">{videoModalItem.meaning}</span></h3>
              {videoModalItem.videoSentence && <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700"><p className="text-lg font-bold leading-snug">"{videoModalItem.videoSentence}"</p><p className="text-sm text-gray-400 mt-1">{videoModalItem.videoTranslation}</p></div>}
            </div>
            <button onClick={() => setVideoModalItem(null)} className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-md">✕</button>
          </div>
        </div>
      )}

      {/* --- ★ブログ記事モーダル --- */}
      {blogModalPost && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setBlogModalPost(null)}>
          <div className="bg-white w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className="p-5 border-b border-gray-100 bg-white z-10 flex justify-between items-start sticky top-0">
              <div>
                <div className="flex gap-2 text-xs text-gray-400 mb-2 font-mono"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{blogModalPost.tag}</span><span>{blogModalPost.date}</span></div>
                <h2 className="text-xl font-black text-slate-800 leading-snug">{blogModalPost.title}</h2>
              </div>
              <button onClick={() => setBlogModalPost(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">✕</button>
            </div>
            {/* 記事本文 */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white scrollbar-hide">
              {blogModalPost.content && blogModalPost.content.length > 0 ? (
                blogModalPost.content.map(block => <RenderBlock key={block.id} block={block} />)
              ) : (
                <div className="text-center py-10 text-gray-400">記事の読み込みに失敗しました、または本文がありません。<br/><a href={blogModalPost.url} target="_blank" className="text-blue-500 underline mt-2 block">Notionで開く</a></div>
              )}
              {/* 記事下部アクション */}
              <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                <a href={blogModalPost.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors">
                  <span>Notionで元の記事を見る</span><ExternalLinkIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* スクロールボタン */}
      {showScrollBtns && activeTab === 'list' && (
        <div className={`fixed right-4 z-40 flex flex-col gap-3 transition-all duration-300 ${isHeaderVisible ? 'top-[310px]' : 'top-[60px]'}`}>
          <button onClick={scrollToTop} className="w-10 h-10 bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-700 active:scale-95"><ArrowUpIcon /></button>
          <button onClick={scrollToBottom} className="w-10 h-10 bg-white text-slate-800 border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95"><ArrowDownIcon /></button>
        </div>
      )}

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

function DetailRow({ label, content }) {
  if (!content) return null;
  return <div><span className="text-[10px] font-bold text-blue-600 uppercase block mb-0.5">{label}</span><span className="text-gray-700">{content}</span></div>;
}