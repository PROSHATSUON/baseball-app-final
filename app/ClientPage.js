'use client';
import { useState, useMemo, useRef, useEffect } from 'react';

// --- SVG アイコン定義 ---
const SpeakerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>);
const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const ArrowUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>);
const ArrowDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>);
const ChevronDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const ChevronUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>);
const ExternalLinkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>);
const DiamondBgIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" className="w-full h-full opacity-[0.06] text-blue-500 pointer-events-none"><polygon points="50,5 95,50 50,95 5,50" /></svg>);
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const VideoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>);
// ★新規追加アイコン
const CategoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>);
const LevelIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>);

const IPA_FONT_STYLE = { fontFamily: '"Lucida Sans Unicode", "Arial Unicode MS", "Segoe UI Symbol", sans-serif' };

// --- 安全な表示用コンポーネント ---
function DetailRow({ label, content }) {
  if (!content) return null;
  const safeContent = (typeof content === 'object') ? JSON.stringify(content) : String(content);
  return (
    <div>
      <span className="text-[10px] font-bold text-blue-600 uppercase block mb-0.5">{label}</span>
      <span className="text-gray-700">{safeContent}</span>
    </div>
  );
}

// --- ブロックレンダラー ---
const RenderBlock = ({ block }) => {
  const { type } = block;
  const value = block[type];
  if (type === 'divider') return <hr className="my-6 border-gray-200" />;
  if (!value) return null;
  const text = value.rich_text ? value.rich_text.map(t => t.plain_text).join('') : '';
  const caption = value.caption ? value.caption.map(t => t.plain_text).join('') : '';
  const url = value.url || value.external?.url || value.file?.url || "";

  switch (type) {
    case 'heading_1': return <h2 className="text-2xl font-black text-slate-800 mt-8 mb-4 border-b pb-2 border-blue-200">{text}</h2>;
    case 'heading_2': return <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3 border-l-4 border-blue-500 pl-3">{text}</h3>;
    case 'heading_3': return <h4 className="text-lg font-bold text-slate-700 mt-4 mb-2">{text}</h4>;
    case 'paragraph': return <p className="text-slate-600 mb-4 leading-relaxed text-sm whitespace-pre-wrap">{text}</p>;
    case 'bulleted_list_item': return <li className="text-slate-600 ml-4 mb-1 text-sm list-disc pl-1">{text}</li>;
    case 'numbered_list_item': return <li className="text-slate-600 ml-4 mb-1 text-sm list-decimal pl-1">{text}</li>;
    case 'quote': return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-500 my-4 bg-gray-50 py-3 pr-2 text-sm rounded-r">{text}</blockquote>;
    case 'image': 
      return (<figure className="my-6"><div className="rounded-xl overflow-hidden shadow-sm border border-gray-100"><img src={url} alt="Article Image" className="w-full h-auto" /></div>{caption && <figcaption className="text-center text-xs text-gray-400 mt-2">{caption}</figcaption>}</figure>);
    case 'audio':
      return (<div className="my-6"><audio controls src={url} className="w-full h-10 focus:outline-none" />{caption && <p className="text-xs text-slate-500 text-center mt-1">{caption}</p>}</div>);
    case 'file':
      const cleanUrl = url?.split('?')[0].toLowerCase() || "";
      if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].some(ext => cleanUrl.endsWith(ext))) {
        return (<div className="my-6"><audio controls src={url} className="w-full h-10 focus:outline-none" /></div>);
      }
      return null;
    default: return null;
  }
};

export default function ClientPage({ words, posts }) {
  const safeWords = (words && Array.isArray(words)) ? words : [];
  const safePosts = (posts && Array.isArray(posts)) ? posts : [];

  const [activeTab, setActiveTab] = useState('home');
  const [filterMode, setFilterMode] = useState('genre');
  
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('Level 1');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedId, setExpandedId] = useState(null);
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
  
  const GENRES = ["ALL", "打撃・走塁", "投球・守備", "成績・契約", "実況", "SNS"];
  const LEVELS = ["ALL", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];

  useEffect(() => {
    if (blogModalPost || videoModalItem) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [blogModalPost, videoModalItem]);

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
  
  const getYoutubeStartTime = (url) => {
    if (!url) return 0;
    const match = url.match(/[?&](t|start)=([^&]+)/);
    if (!match) return 0;
    return parseInt(match[2]) || 0;
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const navigateToList = (type, value) => {
    setFilterMode(type);
    if (type === 'genre') setSelectedGenre(value);
    if (type === 'level') setSelectedLevel(value);
    setActiveTab('list');
    window.scrollTo({ top: 0 });
  };

  const startTest = (type, value) => {
    let candidates = safeWords;
    if (type === 'genre') {
      if (value !== 'ALL') candidates = safeWords.filter(w => w.genre === value);
    } else if (type === 'level') {
      if (value !== 'ALL') candidates = safeWords.filter(w => w.difficulty === value);
    }
    const selected = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 10);
    if (selected.length === 0) return alert("該当する単語がありません");
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
      const word = String(item.word || '');
      const meaning = String(item.meaning || '');
      const katakana = String(item.katakana || '');
      const matchSearch = (word + meaning + katakana).toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchSearch) return false;
      
      if (filterMode === 'genre') {
        return selectedGenre === 'ALL' || item.genre === selectedGenre;
      } else if (filterMode === 'level') {
        const diff = String(item.difficulty || '');
        return selectedLevel === 'ALL' || diff === selectedLevel;
      }
      return true;
    });
  }, [searchQuery, filterMode, selectedGenre, selectedLevel, safeWords]);

  // --- HOME コンポーネント (オシャレな背景・中央配置・アイコン付き) ---
  const HomeView = () => (
    <div className="min-h-screen flex flex-col justify-center animate-fadeIn relative overflow-hidden bg-slate-50">
      {/* ★オシャレな背景パターン（野球の縫い目を抽象化） */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 C 45 0, 60 15, 60 30 C 60 45, 45 60, 30 60 C 15 60, 0 45, 0 30 C 0 15, 15 0, 30 0 Z M 30 5 C 16 5, 5 16, 5 30 C 5 44, 16 55, 30 55 C 44 55, 55 44, 55 30 C 55 16, 44 5, 30 5 Z' fill='none' stroke='%23334155' stroke-width='2'/%3E%3Cpath d='M 15 10 Q 25 20, 15 30 Q 5 40, 15 50' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-dasharray='4 6'/%3E%3Cpath d='M 45 10 Q 35 20, 45 30 Q 55 40, 45 50' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-dasharray='4 6'/%3E%3C/svg%3E")`, backgroundSize: '120px 120px' }}></div>
      
      <div className="p-6 flex flex-col gap-8 max-w-md mx-auto w-full z-10 pb-20">
        {/* タイトル */}
        <div className="text-center">
          <h1 className="text-6xl font-black text-slate-800 tracking-tighter mb-2 drop-shadow-sm">Basevo</h1>
          <p className="text-xs font-bold text-blue-600 tracking-[0.4em] uppercase">- baseball vocabulary -</p>
        </div>

        {/* ジャンル */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CategoryIcon />
            <h2 className="text-xl font-bold text-slate-700 tracking-wider">ジャンル</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {GENRES.map(g => (
              <button key={g} onClick={() => navigateToList('genre', g)} className="bg-white border-2 border-slate-200 py-4 rounded-2xl text-sm font-bold text-slate-600 shadow-sm active:scale-[0.97] hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all">
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* レベル */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LevelIcon />
            <h2 className="text-xl font-bold text-slate-700 tracking-wider">レベル</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => navigateToList('level', l)} className="flex items-center justify-center bg-white border-2 border-slate-200 py-4 px-2 rounded-2xl shadow-sm active:scale-[0.97] hover:border-blue-400 group transition-all hover:shadow-md">
                <span className="font-bold text-slate-700 group-hover:text-blue-600">{l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* テストモード & コラム */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <button onClick={() => setActiveTab('test')} className="bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-2xl p-5 shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center h-32">
            <span className="font-bold text-xl mb-1">テストモード</span>
            <span className="text-xs font-bold opacity-60 tracking-widest uppercase">Test</span>
          </button>
          <button onClick={() => setActiveTab('blog')} className="bg-white border-2 border-slate-200 text-slate-800 rounded-2xl p-5 shadow-md active:scale-95 transition-transform flex flex-col items-center justify-center h-32 hover:border-blue-400 hover:shadow-lg">
            <span className="font-bold text-xl mb-1">コラム</span>
            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Column</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-[#f8f9fa]">
      <audio ref={audioRef} style={{ display: 'none' }} preload="none" />

      {/* ヘッダー (Listタブのみ表示) */}
      <div className={`fixed top-0 left-0 w-full z-30 bg-white shadow-sm transition-transform duration-500 ease-in-out border-b border-gray-200 ${(activeTab === 'list' && !isHeaderVisible) ? '-translate-y-full' : 'translate-y-0'} ${activeTab !== 'list' ? 'hidden' : ''}`}>
        <div className="px-4 pt-3 pb-2 bg-white relative z-20 flex items-center justify-between">
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors font-bold text-xs px-2 py-1 bg-gray-50 rounded-lg">
            <HomeIcon /> <span>HOME</span>
          </button>
          <div className="text-sm font-bold text-slate-700">
            {filterMode === 'genre' ? 'ジャンル別' : 'レベル別'}リスト
          </div>
          <div className="w-16"></div>
        </div>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white ${(activeTab === 'list') ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pb-8">
            <div className="px-3 pb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                <input type="text" placeholder="リスト内検索..." className="w-full rounded-lg bg-gray-100 border border-gray-200 pl-10 pr-4 py-2.5 text-base focus:bg-white focus:border-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center px-3 gap-2">
              {filterMode === 'genre' 
                ? GENRES.map((genre) => (
                    <button key={genre} onClick={() => setSelectedGenre(genre)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors mb-1 ${selectedGenre === genre ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{genre}</button>
                  ))
                : LEVELS.map((level) => (
                    <button key={level} onClick={() => setSelectedLevel(level)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors mb-1 ${selectedLevel === level ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{level}</button>
                  ))
              }
            </div>
            
            <div className="px-4 py-1 text-right text-[10px] text-gray-400">{filteredWords.length} Words Found</div>
          </div>
          <div onClick={toggleHeader} className="absolute bottom-0 left-0 w-full flex justify-center pb-1 cursor-pointer bg-gradient-to-t from-white to-transparent z-10">
            <div className="flex items-center gap-1 text-gray-300 hover:text-blue-500"><span className="text-[9px] font-bold">CLOSE</span><ChevronUpIcon /></div>
          </div>
        </div>
      </div>

      {/* MENUボタン (Listの時だけ表示) */}
      {activeTab === 'list' && (
        <div className={`fixed top-0 left-0 w-full z-40 flex justify-center pointer-events-none transition-transform duration-500 ${(activeTab === 'list' && !isHeaderVisible) ? 'translate-y-0' : '-translate-y-full'}`}>
          <button onClick={toggleHeader} className="mt-[-2px] bg-white/90 backdrop-blur-sm border border-gray-200 border-t-0 rounded-b-xl px-6 py-1 shadow-md text-blue-600 pointer-events-auto flex flex-col items-center"><ChevronDownIcon /><span className="text-[9px] font-bold mt-0.5">MENU</span></button>
        </div>
      )}

      {/* HOMEに戻るボタン (Test/Columnの時だけ表示) */}
      {(activeTab === 'test' || activeTab === 'blog') && (
        <div className="fixed top-0 left-0 w-full z-30 bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
           <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 font-bold text-xs px-3 py-1.5 bg-gray-100 rounded-lg">
             <HomeIcon /> <span>HOME</span>
           </button>
           <span className="font-bold text-slate-700">{activeTab === 'test' ? 'TEST MODE' : 'COLUMN'}</span>
           <div className="w-16"></div>
        </div>
      )}

      {/* メインエリア */}
      <div className="transition-all duration-500 ease-in-out" style={{ paddingTop: activeTab === 'home' ? '0px' : (activeTab === 'list' ? (isHeaderVisible ? '260px' : '60px') : '80px') }}>
        
        {/* === HOME画面 === */}
        {activeTab === 'home' && <HomeView />}

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
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span style={IPA_FONT_STYLE}>{item.ipa}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${String(item.difficulty || '').includes('1') ? 'bg-green-50 text-green-600 border-green-100' : String(item.difficulty || '').includes('5') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {item.difficulty}
                        </span>
                      </div>
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

        {/* === テストモード (ジャンル・レベル両方から選択可能) === */}
        {activeTab === 'test' && (
          <div className="p-4 min-h-full flex flex-col">
            {testPhase === 'select' ? (
              <div className="flex-1 flex flex-col justify-start items-center space-y-8 animate-fadeIn py-6 overflow-y-auto pb-20">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-black text-slate-800">TEST MODE</h2>
                  <p className="text-xs text-gray-400 font-bold">Select mode to start</p>
                </div>

                {/* ジャンルから選択 */}
                <div className="w-full max-w-sm">
                  <h3 className="text-sm font-bold text-slate-500 mb-3 text-center tracking-widest">ジャンルから選択</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {GENRES.map(g => (
                      <button key={g} onClick={() => startTest('genre', g)} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:bg-blue-50 font-bold text-slate-700 active:scale-95 transition-all text-sm">
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* レベルから選択 (日本語説明削除) */}
                <div className="w-full max-w-sm">
                  <h3 className="text-sm font-bold text-slate-500 mb-3 text-center tracking-widest">レベルから選択</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {LEVELS.map(l => (
                      <button key={l} onClick={() => startTest('level', l)} className="p-3 flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:bg-blue-50 active:scale-95 transition-all">
                        <span className="font-bold text-slate-700">{l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : testPhase === 'playing' ? (
              <div className="flex-1 flex flex-col max-w-md mx-auto w-full relative py-4 items-center">
                <div className="w-full mb-4">
                   <div className="flex justify-between text-xs font-bold text-gray-400 mb-2"><span>Question {currentQuestionIndex + 1}</span><span>{testQuestions.length}</span></div>
                   <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}></div></div>
                </div>
                <div className="mb-6 w-full">
                  <button onClick={nextCard} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.97] transition-all hover:bg-blue-700">{currentQuestionIndex < testQuestions.length - 1 ? 'NEXT CARD →' : 'FINISH TEST'}</button>
                </div>
                <div className="relative w-full aspect-square perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                  <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center z-10 bg-white rounded-3xl shadow-xl border-2 border-slate-100">
                      <span className="text-xs font-bold text-blue-500 tracking-widest mb-4">TAP TO FLIP</span>
                      <h3 className="text-4xl font-black text-slate-800 mb-6 leading-tight break-words max-w-full">{testQuestions[currentQuestionIndex].word}</h3>
                      <div className="flex gap-2 justify-center mb-8"><span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-mono border border-gray-200" style={IPA_FONT_STYLE}>{testQuestions[currentQuestionIndex].ipa}</span></div>
                      {testQuestions[currentQuestionIndex].audioUrl && <button onClick={(e) => playAudio(e, testQuestions[currentQuestionIndex].audioUrl)} className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm border border-blue-100 active:scale-90"><SpeakerIcon /></button>}
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white text-slate-800 flex flex-col items-center justify-center p-8 text-center rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center p-12 z-0"><DiamondBgIcon /></div>
                      <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center scrollbar-hide relative z-10">
                        <span className="text-xs font-bold text-blue-500 mb-4 tracking-widest">ANSWER</span>
                        <div className="text-2xl font-black mb-6 leading-snug break-words max-w-full">{testQuestions[currentQuestionIndex].meaning}</div>
                        {testQuestions[currentQuestionIndex].example && (
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 w-full text-left shadow-sm">
                            <p className="text-sm font-medium italic text-slate-700 mb-2">"{testQuestions[currentQuestionIndex].example}"</p>
                            {testQuestions[currentQuestionIndex].exampleTranslation && <p className="text-xs text-slate-500 border-t border-blue-100 pt-2">{testQuestions[currentQuestionIndex].exampleTranslation}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-fadeIn py-10">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mb-4 shadow-sm">🎉</div>
                <h2 className="text-3xl font-black text-slate-800">Test Completed!</h2>
                <div className="flex flex-col w-full max-w-xs gap-3">
                  <button onClick={restartTest} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">もう一度テストする</button>
                  <button onClick={() => setActiveTab('home')} className="text-gray-400 font-bold text-sm py-2">HOMEに戻る</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === コラム（ブログ）タブ === */}
        {activeTab === 'blog' && (
          <div className="p-3 space-y-3 pb-24">
            {safePosts.length === 0 ? <div className="text-center py-20 text-gray-400">No Columns</div> : 
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
            <div className="aspect-video bg-black relative"><iframe className="absolute top-0 left-0 w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(videoModalItem.videoUrl)}?autoplay=1&start=${getYoutubeStartTime(videoModalItem.videoUrl)}&playsinline=1&rel=0`} title="YouTube" frameBorder="0" allowFullScreen></iframe></div>
            <div className="p-5 text-white">
              <h3 className="text-xl font-extrabold text-orange-400 mb-2">{videoModalItem.word}<span className="ml-3 text-sm text-gray-300 font-normal">{videoModalItem.meaning}</span></h3>
            </div>
            <button onClick={() => setVideoModalItem(null)} className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-md">✕</button>
          </div>
        </div>
      )}

      {/* --- コラム記事モーダル --- */}
      {blogModalPost && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setBlogModalPost(null)}>
          <div className="bg-white w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 bg-white z-10 flex justify-between items-start sticky top-0">
              <div>
                <div className="flex gap-2 text-xs text-gray-400 mb-2 font-mono"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{blogModalPost.tag}</span><span>{blogModalPost.date}</span></div>
                <h2 className="text-xl font-black text-slate-800 leading-snug">{blogModalPost.title}</h2>
              </div>
              <button onClick={() => setBlogModalPost(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white overscroll-contain">
              {blogModalPost.content && blogModalPost.content.length > 0 ? (
                blogModalPost.content.map(block => <RenderBlock key={block.id} block={block} />)
              ) : (
                <div className="text-center py-10 text-gray-400">記事の読み込みに失敗しました、または本文がありません。</div>
              )}
              <div className="pb-10"></div>
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
        .aspect-video { aspect-ratio: 16 / 9; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}