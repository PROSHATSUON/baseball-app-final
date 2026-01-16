'use client';
import { useState, useMemo } from 'react';

export default function ClientPage({ words }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

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
    if (!rawUrl) return;
    const old = document.getElementById('audio-player');
    if (old) old.remove();

    let fileId = "";
    const match1 = rawUrl.match(/id=([a-zA-Z0-9_-]{25,})/);
    const match2 = rawUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (match1) fileId = match1[1]; else if (match2) fileId = match2[1];
    const playUrl = fileId ? `https://docs.google.com/uc?export=download&id=${fileId}` : rawUrl;

    const audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.src = playUrl;
    audio.autoplay = true;
    audio.onended = () => audio.remove();
    document.body.appendChild(audio);
  };

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-800 bg-[#f8f9fa]">
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
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-[10px] hover:bg-orange-200"
                      >
                        ▶
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
                    <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center w-full py-2.5 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                      📺 YouTubeで確認
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
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
