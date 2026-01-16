{\rtf1\ansi\ansicpg932\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 'use client';\
import \{ useState, useMemo \} from 'react';\
\
export default function ClientPage(\{ words \}) \{\
  const [searchQuery, setSearchQuery] = useState('');\
  const [selectedGenre, setSelectedGenre] = useState('ALL');\
  const [expandedId, setExpandedId] = useState(null);\
\
  // \uc0\u12472 \u12515 \u12531 \u12523 \u19968 \u35239 \
  const GENRES = ["ALL", "\uc0\u22522 \u26412 \u29992 \u35486 ", "\u25171 \u25731 /\u36208 \u22593 ", "\u25237 \u29699 /\u23432 \u20633 ", "\u38971 \u20986 \u34920 \u29694 "];\
\
  // \uc0\u26908 \u32034 \u12392 \u12472 \u12515 \u12531 \u12523 \u12391 \u12487 \u12540 \u12479 \u12434 \u32094 \u12426 \u36796 \u12416 \u65288 \u12371 \u12371 \u12364 \u29190 \u36895 \u12398 \u31192 \u35363 \u65289 \
  const filteredWords = useMemo(() => \{\
    return words.filter((item) => \{\
      const matchGenre = selectedGenre === 'ALL' || item.genre === selectedGenre;\
      const matchSearch = \
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) || \
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||\
        item.katakana.includes(searchQuery);\
      return matchGenre && matchSearch;\
    \});\
  \}, [searchQuery, selectedGenre, words]);\
\
  // \uc0\u38899 \u22768 \u20877 \u29983 \u27231 \u33021 \u65288 Safari\u23550 \u24540 \u65289 \
  const playAudio = (e, rawUrl) => \{\
    e.stopPropagation();\
    if (!rawUrl) return;\
    const old = document.getElementById('audio-player');\
    if (old) old.remove();\
\
    // Google\uc0\u12489 \u12521 \u12452 \u12502 \u12394 \u12393 \u12398 URL\u12434 \u20877 \u29983 \u21487 \u33021 \u24418 \u24335 \u12395 \u22793 \u25563 \
    let fileId = "";\
    const match1 = rawUrl.match(/id=([a-zA-Z0-9_-]\{25,\})/);\
    const match2 = rawUrl.match(/\\/d\\/([a-zA-Z0-9_-]\{25,\})/);\
    if (match1) fileId = match1[1]; else if (match2) fileId = match2[1];\
    const playUrl = fileId ? `https://docs.google.com/uc?export=download&id=$\{fileId\}` : rawUrl;\
\
    const audio = document.createElement('audio');\
    audio.id = 'audio-player';\
    audio.src = playUrl;\
    audio.autoplay = true;\
    audio.onended = () => audio.remove();\
    document.body.appendChild(audio);\
  \};\
\
  return (\
    <div className="min-h-screen pb-20 font-sans text-gray-800 bg-[#f8f9fa]">\
      \
      \{/* --- \uc0\u12504 \u12483 \u12480 \u12540  --- */\}\
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">\
        <div className="p-3">\
          \{/* \uc0\u26908 \u32034 \u12496 \u12540  */\}\
          <input\
            type="text"\
            placeholder="\uc0\u21336 \u35486 \u12539 \u24847 \u21619 \u12539 \u12459 \u12479 \u12459 \u12490 \u26908 \u32034 "\
            className="w-full rounded-lg bg-gray-100 border border-gray-200 px-4 py-2.5 text-base focus:bg-white focus:border-orange-500 focus:outline-none transition-all"\
            value=\{searchQuery\}\
            onChange=\{(e) => setSearchQuery(e.target.value)\}\
          />\
        </div>\
\
        \{/* \uc0\u12472 \u12515 \u12531 \u12523 \u12479 \u12502 \u65288 \u27178 \u12473 \u12463 \u12525 \u12540 \u12523 \u23550 \u24540 \u65289  */\}\
        <div className="flex overflow-x-auto px-3 pb-2 gap-2 scrollbar-hide">\
          \{GENRES.map((genre) => (\
            <button\
              key=\{genre\}\
              onClick=\{() => setSelectedGenre(genre)\}\
              className=\{`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors $\{\
                selectedGenre === genre \
                  ? 'bg-orange-500 text-white shadow-md' \
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'\
              \}`\}\
            >\
              \{genre\}\
            </button>\
          ))\}\
        </div>\
        \
        \{/* \uc0\u20214 \u25968 \u34920 \u31034  */\}\
        <div className="px-4 py-1 text-right text-[10px] text-gray-400">\
          \{filteredWords.length\} Words Found\
        </div>\
      </div>\
\
      \{/* --- \uc0\u12522 \u12473 \u12488 \u34920 \u31034  --- */\}\
      <div className="p-3 space-y-3">\
        \{filteredWords.length === 0 ? (\
          <div className="text-center py-20 text-gray-400">\uc0\u35211 \u12388 \u12363 \u12426 \u12414 \u12379 \u12435 \u12391 \u12375 \u12383 </div>\
        ) : (\
          filteredWords.map((item) => (\
            <div\
              key=\{item.id\}\
              onClick=\{() => setExpandedId(expandedId === item.id ? null : item.id)\}\
              className=\{`bg-white rounded-xl border transition-all duration-200 overflow-hidden $\{\
                expandedId === item.id ? 'border-orange-400 shadow-md ring-1 ring-orange-100' : 'border-gray-200 shadow-sm active:scale-[0.99]'\
              \}`\}\
            >\
              \{/* \uc0\u12459 \u12540 \u12489 \u34920 \u38754  */\}\
              <div className="p-4 flex justify-between items-start">\
                <div className="flex-1">\
                  <div className="flex items-center gap-2 mb-1">\
                    <h3 className="text-lg font-extrabold text-slate-800 leading-tight">\{item.word\}</h3>\
                    \{/* \uc0\u38899 \u22768 \u12508 \u12479 \u12531  */\}\
                    \{item.audioUrl && (\
                      <button \
                        onClick=\{(e) => playAudio(e, item.audioUrl)\}\
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-[10px] hover:bg-orange-200"\
                      >\
                        \uc0\u9654 \
                      </button>\
                    )\}\
                  </div>\
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">\
                    <span>\{item.ipa\}</span>\
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">\{item.difficulty\}</span>\
                  </div>\
                </div>\
                <div className="text-sm font-bold text-gray-600 text-right max-w-[40%] leading-snug">\
                  \{item.meaning\}\
                </div>\
              </div>\
\
              \{/* \uc0\u35443 \u32048 \u65288 \u12450 \u12467 \u12540 \u12487 \u12451 \u12458 \u12531 \u65289  */\}\
              \{expandedId === item.id && (\
                <div className="bg-slate-50 border-t border-gray-100 px-5 py-4 text-sm space-y-3 animate-fadeIn">\
                  \
                  <DetailRow label="\uc0\u12459 \u12479 \u12459 \u12490 " content=\{item.katakana\} />\
                  <DetailRow label="\uc0\u12472 \u12515 \u12531 \u12523 " content=\{item.genre\} />\
                  \
                  \{item.example && (\
                     <div className="pt-1">\
                       <span className="text-[10px] font-bold text-orange-500 block mb-1">EXAMPLE</span>\
                       <div className="text-slate-700 italic border-l-2 border-orange-200 pl-2 py-1 bg-white">\
                         "\{item.example\}"\
                       </div>\
                     </div>\
                  )\}\
\
                  \{item.memo && <DetailRow label="MEMO" content=\{item.memo\} />\}\
                  \
                  \{item.lastViewed !== '-' && (\
                    <div className="text-[10px] text-right text-gray-300 pt-2">\
                      Last Check: \{item.lastViewed\}\
                    </div>\
                  )\}\
\
                  \{/* \uc0\u21205 \u30011 \u12522 \u12531 \u12463  */\}\
                  \{item.videoUrl && (\
                    <a \
                      href=\{item.videoUrl\} \
                      target="_blank" \
                      rel="noopener noreferrer"\
                      className="mt-3 flex items-center justify-center w-full py-2.5 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors"\
                    >\
                      \uc0\u9654 \u65039  YouTube\u12391 \u30906 \u35469 \
                    </a>\
                  )\}\
                </div>\
              )\}\
            </div>\
          ))\
        )\}\
      </div>\
    </div>\
  );\
\}\
\
// \uc0\u35443 \u32048 \u34892 \u12398 \u12511 \u12491 \u12467 \u12531 \u12509 \u12540 \u12493 \u12531 \u12488 \
function DetailRow(\{ label, content \}) \{\
  if (!content) return null;\
  return (\
    <div>\
      <span className="text-[10px] font-bold text-orange-500 uppercase block mb-0.5">\{label\}</span>\
      <span className="text-gray-700">\{content\}</span>\
    </div>\
  );\
\}}