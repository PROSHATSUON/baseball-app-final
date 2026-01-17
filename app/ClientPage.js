'use client';
import { useState, useMemo, useRef } from 'react';

export default function ClientPage({ words }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [videoModalUrl, setVideoModalUrl] = useState(null);
  
  // 画面にあるオーディオタグを操作するための「リモコン」
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

  // 【最終版】音声再生機能（HTMLオーディオタグ操作方式）
  const playAudio = (e, rawUrl) => {
    e.stopPropagation();
    if (!rawUrl || !audioRef.current) return;

    let fileId = "";
    const match1 = rawUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    const match2 = rawUrl.match(/id=([a-zA-Z0-9_-]{25,})/);
    
    if (match1) fileId = match1[1];
    else if (match2) fileId = match2[1];

    // drive.google.com ではなく docs.google.com を使うと安定する
    const playUrl = fileId 
      ? `https://docs.google.com/uc?export=download&id=${fileId}` 
      : rawUrl;

    // プレーヤーに曲をセットして再生
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
      
      {/* --- ここが重要：隠しオーディオプレーヤー --- */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="none" />

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
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-xs hover:bg-orange-200 active:scale-95 transition-transform"
                      >
                        🔊
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
                       <div className="text-slate-700 italic border-l-2 border-orange-200 pl-2 py-1 bg-white">
                         "{item.example}"
                       </div>
                     </div>
                  )}
                  {item.memo && <DetailRow label="MEMO" content={item.memo} />}
                  {item.lastViewed !== '-' && (
                    <div className="text-[10px] text-right text-gray-300 pt-2">Last Check: {item.lastViewed}</div>
                  )}
                  {item.videoUrl && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoModalUrl(item.videoUrl);
                      }}
                      className="mt-3 flex items-center justify-center w-full py-2.5 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      📺 動画を再生
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {videoModalUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setVideoModalUrl(null)}
        >
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${getYoutubeId(videoModalUrl)}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <button 
              onClick={() => setVideoModalUrl(null)}
              className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-md transition-all"
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
