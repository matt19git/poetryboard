"use client";
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// 🎨 THEME CONFIGURATION
const THEMES = [
  {
    id: 'quill',
    name: 'Quill & Scroll',
    bgClass: "bg-[#2c241b] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]",
    paperClass: "bg-[#eaddcf] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-y-[12px] border-[#d6c4b0] rounded-sm",
    paperStyle: { maxWidth: '600px' }, // 👈 Constrained width
    fontClass: "font-serif text-stone-900",
    inkColor: "text-[#3e2723]",
    placeholder: "Dip your quill...",
    buttonClass: "bg-[#5d4037] text-[#eaddcf] border border-[#3e2723] hover:bg-[#3e2723]"
  },
  {
    id: 'notepad',
    name: 'Yellow Pad',
    bgClass: "bg-slate-200",
    paperClass: "bg-[#fef9c3] shadow-2xl border-t-[40px] border-slate-800 rounded-b-lg",
    paperStyle: {
      maxWidth: '550px', // 👈 Constrained width
      backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px)",
      backgroundSize: "100% 2rem",
      lineHeight: "2rem"
    },
    fontClass: "font-handwriting text-2xl tracking-wide",
    inkColor: "text-blue-900",
    placeholder: "Jot something down...",
    buttonClass: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg rounded-full"
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    bgClass: "bg-[#1c1917]", // Dark moody desk
    paperClass: "bg-white shadow-2xl relative z-10", // White paper
    paperStyle: { maxWidth: '650px', minHeight: '600px', paddingTop: '60px' },
    fontClass: "font-typewriter tracking-tight",
    inkColor: "text-black",
    placeholder: "CLICK CLACK...",
    buttonClass: "bg-stone-100 text-black font-mono border-2 border-black hover:bg-stone-300",
    hasTypewriterEffect: true // 👈 Flag to trigger sounds & visuals
  },
  {
    id: 'hacker',
    name: 'Hacker Mode',
    bgClass: "bg-black",
    paperClass: "bg-black border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]",
    paperStyle: { maxWidth: '700px', fontFamily: 'Courier New, monospace' },
    fontClass: "font-mono",
    inkColor: "text-green-500",
    placeholder: "Initializing sequence...",
    buttonClass: "bg-green-900 text-green-100 border border-green-500 hover:bg-green-700 uppercase tracking-widest",
    isHacker: true
  }
];

export default function Editor() {
  const [poem, setPoem] = useState("");
  const [author, setAuthor] = useState("");
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [dailyWords, setDailyWords] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Sound Refs
  const audioType = useRef<HTMLAudioElement | null>(null);
  const audioDing = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load sounds once
    audioType.current = new Audio('/sounds/type.mp3');
    audioDing.current = new Audio('/sounds/ding.mp3');
    
    // Fetch words
    const fetchWords = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('daily_challenges').select('words').eq('release_date', today).single();
      setDailyWords(data?.words || ["soul", "echo", "night", "dance", "light"]);
    };
    fetchWords();
  }, []);

  useEffect(() => {
    const found = dailyWords.filter(w => poem.toLowerCase().includes(w.toLowerCase()));
    setUsedWords(found);
  }, [poem, dailyWords]);

  // 🎵 THE SOUND ENGINE
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Play sound if in Typewriter mode
    if (currentTheme.hasTypewriterEffect) {
      // If Enter was pressed (new line), play Ding
      if (newValue.length > poem.length && newValue.endsWith('\n')) {
        if (audioDing.current) {
          audioDing.current.currentTime = 0;
          audioDing.current.play().catch(() => {}); // Catch error if user hasn't interacted yet
        }
      } else {
        // Otherwise play click
        if (audioType.current) {
          audioType.current.currentTime = 0;
          audioType.current.play().catch(() => {});
        }
      }
    }
    setPoem(newValue);
  };

  const allWordsUsed = dailyWords.length > 0 && usedWords.length === dailyWords.length;

  const handleSnap = async () => {
    if (!allWordsUsed) return;
    setIsSubmitting(true);
    confetti({ particleCount: 150, spread: 70 });

    const { error } = await supabase.from('poems').insert([{ 
      content: poem, 
      author_name: author || "Anonymous",
      word_bank: dailyWords,
      style_data: currentTheme
    }]);

    if (!error) setHasSubmitted(true);
    setIsSubmitting(false);
  };

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center space-y-6 p-10 bg-white rounded-xl shadow-xl">
          <h2 className="text-4xl font-serif font-bold">It is written. 🫰</h2>
          <Link href="/board" className="block w-full py-4 bg-stone-900 text-white rounded-lg hover:scale-105 transition-transform">
            View on the Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${currentTheme.bgClass} flex flex-col`}>
      
      {/* HEADER: Theme Picker & Progress */}
      <div className="pt-6 pb-2 px-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between border border-stone-200">
          
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setCurrentTheme(theme)}
                className={`whitespace-nowrap px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${
                  currentTheme.id === theme.id 
                  ? "bg-stone-800 text-white shadow-md" 
                  : "text-stone-400 hover:bg-stone-100"
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono font-bold text-stone-400 pl-4 border-l border-stone-200">
            {usedWords.length}/{dailyWords.length}
          </div>
        </div>
        
        {/* Required Words Row */}
        <div className="max-w-xl mx-auto mt-4 flex flex-wrap justify-center gap-2">
           {dailyWords.map(word => (
             <span key={word} className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
               usedWords.includes(word) 
               ? "bg-green-500 text-white shadow-sm" 
               : "bg-white/20 text-stone-500 backdrop-blur-sm"
             }`}>
               {word}
             </span>
           ))}
        </div>
      </div>

      {/* THE DESK (Centered Area) */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10 relative overflow-hidden">
        
        {/* THE PAPER */}
        <div 
          className={`relative w-full transition-all duration-500 flex flex-col ${currentTheme.paperClass} min-h-[500px] md:min-h-[600px]`}
          style={{
             ...currentTheme.paperStyle,
             margin: '0 auto' // Centers the paper horizontally
          }}
        >
           {/* Hacker Mode Matrix Decor */}
           {currentTheme.isHacker && (
             <div className="absolute top-0 right-0 p-2 text-[10px] text-green-800 font-mono">
               SYSTEM_READY<br/>ENCRYPTION: OFF
             </div>
           )}

           <textarea
             className={`w-full flex-1 bg-transparent border-none outline-none resize-none text-xl md:text-2xl leading-loose p-8 md:p-12 ${currentTheme.fontClass} ${currentTheme.inkColor} placeholder-opacity-40`}
             placeholder={currentTheme.placeholder}
             value={poem}
             onChange={handleTyping}
             spellCheck={false}
           />

           <div className="p-8 md:p-12 pt-0 flex flex-col gap-4">
             <input 
                type="text"
                placeholder="— Identity signature"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={`bg-transparent border-b border-dashed border-current outline-none text-right italic opacity-60 pb-2 ${currentTheme.fontClass} ${currentTheme.inkColor}`}
             />
             <button
               onClick={handleSnap}
               disabled={!allWordsUsed || isSubmitting}
               className={`w-full py-4 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.buttonClass}`}
             >
               {allWordsUsed ? "EXECUTE / SUBMIT 🫰" : "INCOMPLETE DATA"}
             </button>
           </div>
        </div>

        {/* TYPEWRITER BOTTOM EFFECT (Only shows in Typewriter mode) */}
        {currentTheme.hasTypewriterEffect && (
           <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[150px] bg-[#1a1a1a] rounded-t-[50px] shadow-2xl z-20 flex items-start justify-center border-t-8 border-[#333]">
              <div className="w-[700px] h-[20px] bg-black mt-4 rounded-full shadow-[0_0_10px_black] relative">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[40px] bg-gray-300 rounded-sm">
                    <span className="block text-center text-[10px] text-gray-500 mt-1">ROYAL</span>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}