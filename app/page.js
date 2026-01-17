'use client';
import { useState, useMemo, useRef } from 'react';

// --- アイコン類 ---
const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const PlayCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
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

// 時計アイコン（動画時間用）
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
// --------------------

export default function ClientPage({ words }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [videoModalItem, setVideoModalItem] = useState(null);
  const audioRef = useRef(null);

  const GENRES = ["ALL", "基本用語", "打撃/走塁", "投球/守備", "頻出表現"];

  const filteredWords = useMemo(() => {
    return words.filter((item) => {
      const matchGenre = selectedGenre === 'ALL' || item.genre === selectedGenre;
      const matchSearch = 
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.katakana.includes(searchQuery);
      return matchGenre && matchSearch;
    });
  }, [searchQuery, selectedGenre, words]);

  const playAudio = (e, rawUrl) => {
    e.stopPropagation();
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
      alert(`再生エラー: ブラウザが音声をブロックしました。\n\n詳細: ${err.message}`);
    });
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-800 bg-[#f8f9fa]">
      <audio ref={audioRef} style={{ display: 'none' }} preload="none" />

      {/* --- ヘッダー --- */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="p-3">
          <input
            type="text"
            placeholder="単語・意味・カタカナ検索"
            className="w-full rounded-lg bg-gray-100 border border-gray-200 px-4 py-2.5 text-base focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto px-3 pb-2 gap-2 scrollbar-hide">
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

      {/* --- リスト --- */}
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
                       <div className="bg-white border-l-2 border-orange-200 pl-3 py-2 space-y-1">
                         <div className="flex items-start gap-3">
                           <span className="flex-1 text-slate-700 italic font-medium">"{item.example}"</span>
                           {item.exampleAudioUrl && (
                             <button 
                               onClick={(e) => playAudio(e, item.exampleAudioUrl)}
                               className="flex-shrink-0 text-orange-400 hover:text-orange-600 transition-colors p-1"
                               title="例文を再生"
                             >
                               <PlayCircleIcon />
                             </button>
                           )}
                         </div>
                         {item.exampleTranslation && (
                           <div className="text-xs text-gray-500 pl-1">
                             {item.exampleTranslation}
                           </div>
                         )}
                       </div>
                     </div>
                  )}

                  {item.memo && <DetailRow label="MEMO" content={item.memo} />}
                  
                  <div className="pt-3 flex items-center justify-between">
                    {item.lastViewed !== '-' && (
                      <div className="text-[10px] text-gray-300">Last Check: {item.lastViewed}</div>
                    )}
                    {item.videoUrl && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoModalItem(item);
                        }}
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

      {/* --- 動画ポップアップ（3つの情報を表示） --- */}
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
                src={`https://www.youtube.com/embed/${getYoutubeId(videoModalItem.videoUrl)}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-5 text-white bg-slate-800">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-xl font-extrabold text-orange-400">{videoModalItem.word}</h3>
                
                {/* ① 動画の時間があれば表示 */}
                {videoModalItem.videoTime && (
                  <div className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded text-xs font-mono text-gray-300">
                    <ClockIcon />
                    <span>{videoModalItem.videoTime}</span>
                  </div>
                )}
              </div>

              {/* ② 英文 と ③ 日本語訳 がある場合 */}
              {videoModalItem.videoSentence ? (
                <div className="space-y-2 mt-3 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <p className="text-lg font-bold text-white leading-snug">
                    "{videoModalItem.videoSentence}"
                  </p>
                  <p className="text-sm text-gray-300">
                    {videoModalItem.videoTranslation}
                  </p>
                </div>
              ) : (
                // ない場合は、いつもの「意味」を表示
                <p className="text-sm font-bold mt-1 text-gray-200">
                  {videoModalItem.meaning}
                </p>
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
