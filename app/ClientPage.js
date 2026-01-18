'use client';
import { useState, useMemo, useRef, useEffect } from 'react';

// --- アイコンコンポーネント ---
const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
    <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"></polygon>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const FlipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);
// --------------------

export default function ClientPage({ words }) {
  // 安全装置
  const safeWords = (words && Array.isArray(words)) ? words : [];

  // --- 状態管理 ---
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'test'
  
  // リスト用
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [videoModalItem, setVideoModalItem] = useState(null);

  // テスト用
  const [testPhase, setTestPhase] = useState('select'); // 'select', 'playing', 'result'
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const audioRef = useRef(null);
  const GENRES = ["ALL", "基本用語", "打撃/走塁", "投球/守備", "頻出表現"];

  // --- 共通機能：音声再生 ---
  const playAudio = (e, rawUrl) => {
    e?.stopPropagation(); // カードのフリップ等を防ぐ
    if (!rawUrl || !audioRef.current) return;

    let fileId = "";
    const match1 = rawUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    const match2 = rawUrl.match(/id=([a-zA-Z0-9_-]{25,})/);
    if (match1) fileId = match1[1]; else if (match2) fileId = match2[1];
    
    const playUrl = fileId ? `https://docs.google.com/uc?export=download&id=${fileId}` : rawUrl;

    const player = audioRef.current;
    player.src = playUrl;
    player.load();
    player.play().catch((err) => {
      console.error("Playback failed:", err);
      alert(`再生エラー: ${err.message}`);
    });
  };

  // YouTube ID抽出
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // YouTube開始時間の抽出
  const getYoutubeStartTime = (url) => {
    if (!url) return 0;
    const match = url.match(/[?&](t|start)=([^&]+)/);
    if (!match) return 0;
    
    const timeStr = match[2];
    if (!isNaN(timeStr)) return timeStr;
    
    let seconds = 0;
    const h = timeStr.match(/(\d+)h/);
    const m = timeStr.match(/(\d+)m/);
    const s = timeStr.match(/(\d+)s/);
    
    if (h) seconds += parseInt(h[1]) * 3600;
    if (m) seconds += parseInt(m[1]) * 60;
    if (s) seconds += parseInt(s[1]);
    
    return seconds > 0 ? seconds : 0;
  };

  // --- テスト機能 ---
  const startTest = (genre) => {
    let candidates = safeWords;
    if (genre !== 'ALL') {
      candidates = safeWords.filter(w => w.genre === genre);
    }

    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    if (selected.length === 0) {
      alert("このジャンルには単語がありません");
      return;
    }

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
    } else {
      setTestPhase('result');
    }
  };

  const restartTest = () => {
    setTestPhase('select');
    setTestQuestions([]);
    setCurrentQuestionIndex(0);
    setIsFlipped(false);
  };

  // --- リスト機能 ---
  const filteredWords = useMemo(() => {
    return safeWords.filter((item) => {
      const matchGenre = selectedGenre === 'ALL' || item.genre === selectedGenre;
      const matchSearch = 
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.katakana.includes(searchQuery);
      return matchGenre && matchSearch;
    });
  }, [searchQuery, selectedGenre, safeWords]);


  return (
    <div className="min-h-screen pb-20 font-sans text-gray-800 bg-[#f8f9fa]">
      <audio ref={audioRef} style={{ display: 'none' }} preload="none" />

      {/* --- タブ切り替え --- */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'list' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            単語リスト
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'test' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            テストモード
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 単語リスト表示エリア              */}
      {/* ========================================== */}
      {activeTab === 'list' && (
        <>
          {/* 検索・フィルター */}
          <div className="bg-white border-b border-gray-100 pb-2">
            <div className="p-3">
              <input
                type="text"
                placeholder="単語・意味・カタカナ検索"
                className="w-full rounded-lg bg-gray-100 border border-gray-200 px-4 py-2.5 text-base focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex overflow-x-auto px-3 gap-2 scrollbar-hide">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedGenre === genre ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="px-4 py-1 text-right text-[10px] text-gray-400">
              {filteredWords.length} Words Found
            </div>
          </div>

          {/* リスト本体 */}
          <div className="p-3 space-y-3">
            {filteredWords.length === 0 ? (
              <div className="text-center py-20 text-gray-400">見つかりませんでした</div>
            ) : (
              filteredWords.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                    expandedId === item.id ? 'border-orange-400 shadow-md ring-1 ring-orange-100' : 'border-gray-200 shadow-sm active:scale-[0.99]'
                  }`}
                >
                  <div className="p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{item.word}</h3>
                        {item.audioUrl && (
                          <button 
                            onClick={(e) => playAudio(e, item.audioUrl)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <SpeakerIcon />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span>{item.ipa}</span>
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.difficulty}</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-600 text-right max-w-[40%] leading-snug">
                      {item.meaning}
                    </div>
                  </div>

                  {expandedId === item.id && (
                    <div className="bg-slate-50 border-t border-gray-100 px-5 py-4 text-sm space-y-3 animate-fadeIn">
                      <DetailRow label="カタカナ" content={item.katakana} />
                      <DetailRow label="ジャンル" content={item.genre} />
                      
                      {item.example && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-orange-500 block mb-1">EXAMPLE</span>
                          <div className="bg-white border-l-2 border-orange-200 pl-3 py-3 space-y-2">
                            <div className="flex items-start gap-3">
                              <span className="flex-1 text-slate-700 italic font-medium text-base leading-relaxed">"{item.example}"</span>
                              {item.exampleAudioUrl && (
                                <button 
                                  onClick={(e) => playAudio(e, item.exampleAudioUrl)}
                                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95 ml-1"
                                >
                                  <PlayIcon />
                                </button>
                              )}
                            </div>
                            {item.exampleTranslation && (
                              <div className="text-xs text-gray-500 pl-1 border-t border-gray-100 pt-2">{item.exampleTranslation}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {item.memo && <DetailRow label="MEMO" content={item.memo} />}

                      <div className="pt-3 flex items-center justify-between">
                        {item.lastViewed !== '-' && <div className="text-[10px] text-gray-300">Last Check: {item.lastViewed}</div>}
                        {item.videoUrl && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setVideoModalItem(item); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-full border border-red-100 hover:bg-red-100 hover:shadow-md transition-all active:scale-95"
                          >
                            <VideoIcon />
                            <span className="text-sm">Watch Video</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* テストモード表示エリア             */}
      {/* ========================================== */}
      {activeTab === 'test' && (
        <div className="p-4 h-[calc(100vh-80px)] flex flex-col">
          {testPhase === 'select' && (
            <div className="flex-1 flex flex-col justify-center items-center space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-black text-slate-800 text-center">
                <span className="text-orange-500 block text-lg mb-1">TEST MODE</span>
                ジャンルを選択
              </h2>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => startTest(genre)}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-500 hover:bg-orange-50 transition-all font-bold text-slate-700 active:scale-95"
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">選択したジャンルからランダムに10問出題されます</p>
            </div>
          )}

          {testPhase === 'playing' && (
            <div className="flex-1 flex flex-col max-w-md mx-auto w-full relative">
              {/* プログレスバー */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                  <span>Question {currentQuestionIndex + 1}</span>
                  <span>{testQuestions.length}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* カード本体 */}
              <div 
                className="flex-1 relative perspective-1000 group cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-2xl bg-white border border-gray-200 ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* --- 表面 (Front) --- */}
                  <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center z-10">
                    <span className="text-xs font-bold text-orange-500 mb-2">TAP TO FLIP</span>
                    <h3 className="text-4xl font-black text-slate-800 mb-4 leading-tight">
                      {testQuestions[currentQuestionIndex].word}
                    </h3>
                    <div className="flex items-center gap-3 justify-center mb-8">
                      <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded text-sm">
                        {testQuestions[currentQuestionIndex].ipa}
                      </span>
                    </div>
                    {/* 音声ボタン (表面) */}
                    {testQuestions[currentQuestionIndex].audioUrl && (
                      <button 
                        onClick={(e) => playAudio(e, testQuestions[currentQuestionIndex].audioUrl)}
                        className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-md hover:bg-orange-500 hover:text-white transition-all active:scale-90"
                      >
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>

                  {/* --- 裏面 (Back) --- */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-50 flex flex-col items-center justify-center p-6 text-center rounded-2xl overflow-y-auto">
                    <span className="text-xs font-bold text-gray-400 mb-4">ANSWER</span>
                    
                    <div className="text-2xl font-bold text-slate-800 mb-6 w-full break-words">
                      {testQuestions[currentQuestionIndex].meaning}
                    </div>

                    {testQuestions[currentQuestionIndex].example && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200 w-full text-left shadow-sm">
                         <div className="flex items-start gap-3 mb-2">
                           <span className="flex-1 text-slate-700 italic font-medium">
                             "{testQuestions[currentQuestionIndex].example}"
                           </span>
                           {testQuestions[currentQuestionIndex].exampleAudioUrl && (
                             <button 
                               onClick={(e) => playAudio(e, testQuestions[currentQuestionIndex].exampleAudioUrl)}
                               className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center active:scale-95"
                             >
                               <PlayIcon />
                             </button>
                           )}
                         </div>
                         {testQuestions[currentQuestionIndex].exampleTranslation && (
                           <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                             {testQuestions[currentQuestionIndex].exampleTranslation}
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 次へボタン */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={nextCard}
                  className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {currentQuestionIndex < testQuestions.length - 1 ? 'NEXT CARD →' : 'FINISH TEST'}
                </button>
              </div>
            </div>
          )}

          {testPhase === 'result' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-2">
                🎉
              </div>
              <h2 className="text-3xl font-black text-slate-800">Test Completed!</h2>
              <p className="text-gray-500">10問のトレーニングが完了しました。<br/>お疲れ様でした！</p>
              
              <button
                onClick={restartTest}
                className="w-full max-w-xs bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 active:scale-95 transition-all"
              >
                もう一度テストする
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className="text-gray-400 font-bold hover:text-gray-600 text-sm"
              >
                単語リストに戻る
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- 動画モーダル (リスト・テスト共通) --- */}
      {videoModalItem && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setVideoModalItem(null)}
        >
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                // autoplayを削除しました。これで読み込みループが止まります。
                src={`https://www.youtube.com/embed/${getYoutubeId(videoModalItem.videoUrl)}?start=${getYoutubeStartTime(videoModalItem.videoUrl)}&playsinline=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-5 text-white bg-slate-800">
              <div className="flex items-baseline justify-between mb-2">
                {/* ここを変更：単語の横に意味を追加しました */}
                <h3 className="text-xl font-extrabold text-orange-400">
                  {videoModalItem.word}
                  <span className="ml-3 text-sm text-gray-300 font-normal">
                    {videoModalItem.meaning}
                  </span>
                </h3>
                {videoModalItem.videoTime && (
                  <div className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded text-xs font-mono text-gray-300 flex-shrink-0">
                    <ClockIcon />
                    <span>{videoModalItem.videoTime}</span>
                  </div>
                )}
              </div>

              {videoModalItem.videoSentence ? (
                <div className="space-y-2 mt-3 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <p className="text-lg font-bold text-white leading-snug">"{videoModalItem.videoSentence}"</p>
                  <p className="text-sm text-gray-300">{videoModalItem.videoTranslation}</p>
                </div>
              ) : (
                /* ここは意味がヘッダーに出たので削除してもいいですが、念のため残しておきます */
                <p className="text-sm font-bold mt-1 text-gray-200 opacity-0">{videoModalItem.meaning}</p>
              )}
            </div>

            <button 
              onClick={() => setVideoModalItem(null)}
              className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-md transition-all z-10"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* CSS for 3D Flip */}
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}

function DetailRow({ label, content }) {
  if (!content) return null;
  return (
    <div>
      <span className="text-[10px] font-bold text-orange-500 uppercase block mb-0.5">{label}</span>
      <span className="text-gray-700">{content}</span>
    </div>
  );
}