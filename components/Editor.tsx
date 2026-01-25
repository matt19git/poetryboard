"use client";
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
// 📦 IMPORT THE LIBRARY
import getCaretCoordinates from 'textarea-caret';

// ------------------------------------------------------------------
// 🔧 DYNAMIC THEME CONFIGURATION
// ------------------------------------------------------------------
const THEMES = [
  {
    id: 'quill',
    name: 'Quill',
    bgHex: '#2c241b',
    bgClass: "bg-[#2c241b] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]",
    uiHex: "#eaddcf", 
    controlsClass: "bg-[#3e2723] text-[#eaddcf] border border-[#5d4037]",
    paperClass: "bg-[#eaddcf] shadow-[0_0_50px_rgba(0,0,0,0.6)] border-y-[12px] border-[#d6c4b0] rounded-sm",
    paperStyle: { maxWidth: '700px', minHeight: '60vh' }, 
    fontClass: "font-serif text-2xl leading-loose",
    inkHex: "#3e2723", 
    placeholder: "Dip your quill...",
    sound: '/sounds/scratch.mp3',
    
    imageConfig: {
      src: '/quill.png',
      // CALIBRATION: Positive Y moves DOWN, Negative Y moves UP
      tipOffset: { x: -150, y: -500 }, 
      // SIZE: Reduced to w-20 (mobile) / w-24 (desktop)
      className: "w-20 md:w-24 rotate-12 drop-shadow-xl pointer-events-none transition-transform duration-75 ease-out",
      type: 'cursor' 
    }
  },
  {
    id: 'notepad',
    name: 'Yellow Pad',
    bgHex: '#cbd5e1',
    bgClass: "bg-slate-300",
    uiHex: "#475569", 
    controlsClass: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50",
    paperClass: "bg-[#fef9c3] shadow-xl border-t-[40px] border-slate-800 rounded-b-lg",
    paperStyle: {
      maxWidth: '600px', 
      minHeight: '60vh',
      backgroundImage: "linear-gradient(transparent 2.9rem, #94a3b8 2.9rem)", 
      backgroundSize: "100% 3rem", 
      backgroundAttachment: "local"
    },
    fontClass: "font-handwriting text-3xl leading-[3rem]", 
    inkHex: "#1e3a8a", 
    placeholder: "Jot something down...",
    sound: '/sounds/scribble.mp3',

    imageConfig: {
      src: '/pencil.png',
      // CALIBRATION: Pencil usually needs less offset than quill
      tipOffset: { x: -100, y: -40 },
      // SIZE: Reduced to w-12 (mobile) / w-16 (desktop)
      className: "w-12 md:w-16 -rotate-6 drop-shadow-lg pointer-events-none transition-transform duration-75 ease-out",
      type: 'cursor'
    }
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    bgHex: '#e5e7eb',
    bgClass: 'bg-gray-200',
    uiHex: "#1f2937", 
    controlsClass: "bg-white text-black border border-gray-300",
    paperClass: 'bg-white shadow-lg',
    paperStyle: { maxWidth: '800px', minHeight: '60vh' },
    fontClass: 'font-typewriter text-xl',
    inkHex: "#000000",
    placeholder: 'Start typing...',
    hasTypewriterEffect: true,
    sound: '/sounds/type.mp3',

    // 🖼️ TYPEWRITER IMAGE (Fixed Bottom)
    imageConfig: {
      src: '/typewriter.png',
      className: "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-30 pointer-events-none drop-shadow-2xl",
      type: 'screen' 
    }
  },
  {
    id: 'terminal',
    name: 'Terminal',
    bgHex: '#000000',
    bgClass: '!bg-black', 
    uiHex: "#22c55e", 
    controlsClass: '!bg-black !text-green-500 border border-green-700 hover:bg-green-900/20 font-mono',
    paperClass: '!bg-black border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] relative',
    paperStyle: { maxWidth: '800px', minHeight: '60vh' },
    fontClass: 'font-mono text-lg',
    inkHex: "#22c55e", 
    placeholder: '> INITIALIZE_POEM...',
    isTerminal: true,
    sound: null
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
  
  // ⚡ REFS for Direct DOM Manipulation (Zero Lag)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorImageRef = useRef<HTMLImageElement>(null);
  const dingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.bgHex;
  }, [currentTheme]);

  // ✅ NEW: Trigger cursor position immediately on load (wait for fonts)
  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        updateCursorPosition();
      });
    } else {
      // Fallback for browsers that don't support document.fonts
      setTimeout(updateCursorPosition, 100);
    }
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      dingRef.current = new Audio('/sounds/ding.mp3');
      if (dingRef.current) dingRef.current.volume = 0.6;
    }
    
    const fetchWords = async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const { data } = await supabase.from('daily_challenges').select('words').eq('release_date', today).single();
      setDailyWords(data?.words || ["soul", "echo", "night", "dance", "light"]);
    };
    fetchWords();
  }, []);

  useEffect(() => {
    const found = dailyWords.filter(w => poem.toLowerCase().includes(w.toLowerCase()));
    setUsedWords(found);
  }, [poem, dailyWords]);

  // 📍 CURSOR TRACKING ENGINE
  const updateCursorPosition = () => {
    if (!textareaRef.current || !cursorImageRef.current || currentTheme.imageConfig?.type !== 'cursor') return;

    const textarea = textareaRef.current;
    const image = cursorImageRef.current;
    const config = currentTheme.imageConfig;

    // 1. Get exact pixel coordinates
    const coordinates = getCaretCoordinates(textarea, textarea.selectionEnd);

    // 2. Adjust for scrolling
    const scrollTop = textarea.scrollTop;

    // 3. Calculate final position
    const top = coordinates.top - scrollTop + (config.tipOffset?.y || 0);
    const left = coordinates.left + (config.tipOffset?.x || 0);

    // 4. Move Image
    image.style.transform = `translate(${left}px, ${top}px)`;
    image.style.opacity = '1'; // Make visible immediately
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPoem(e.target.value);
    requestAnimationFrame(updateCursorPosition);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    requestAnimationFrame(updateCursorPosition);

    if (!currentTheme.sound && !currentTheme.hasTypewriterEffect) return;

    if (currentTheme.hasTypewriterEffect && e.key === 'Enter') {
      if (dingRef.current) {
        dingRef.current.currentTime = 0;
        dingRef.current.play().catch(() => {});
      }
      return; 
    }

    if (currentTheme.sound) {
      const sound = new Audio(currentTheme.sound);
      sound.volume = 0.5;
      sound.playbackRate = 0.9 + Math.random() * 0.2; 
      sound.play().catch(() => {});
    }
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

  const getWordStyle = (word: string, isUsed: boolean) => {
    if (currentTheme.isTerminal) {
      if (isUsed) return "bg-green-500 text-black border-green-500 line-through decoration-black";
      return "bg-black border-green-500";
    }
    if (isUsed) return "bg-emerald-100 text-emerald-800 border-emerald-300 line-through opacity-60";
    return `${currentTheme.controlsClass} opacity-100`;
  };

  if (hasSubmitted) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-700 ${currentTheme.bgClass}`}
        style={{ backgroundColor: currentTheme.bgHex }}
      >
        <div className={`text-center space-y-6 p-12 rounded-xl shadow-2xl max-w-md w-full mx-4 ${currentTheme.isTerminal ? 'border-2 border-green-500 bg-black' : 'bg-white'}`}>
          <h2 className={`text-4xl font-bold ${currentTheme.fontClass}`} style={{ color: currentTheme.inkHex }}>
              Preserved. 🫰
          </h2>
          <Link 
            href="/board" 
            className={`block w-full py-4 font-bold uppercase tracking-widest rounded-lg hover:scale-105 transition-transform ${currentTheme.controlsClass}`}
          >
            View the Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full flex flex-col flex-1 overflow-x-hidden transition-colors duration-700 min-h-screen ${currentTheme.bgClass}`}
      style={{ backgroundColor: currentTheme.bgHex }}
    >
      {/* HEADER SECTION */}
      <div className="flex-none pt-8 pb-6 px-4 z-20 flex flex-col items-center gap-6 relative">
        <Link 
          href="/board" 
          className="absolute right-6 top-8 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: currentTheme.uiHex }}
        >
           View Board →
        </Link>

        <div className="text-center space-y-2">
           <h1 className="text-4xl font-serif font-bold transition-colors duration-300" style={{ color: currentTheme.uiHex }}>
             Poetry Snaps 🫰
           </h1>
           <p className="text-sm italic opacity-80 transition-colors duration-300" style={{ color: currentTheme.uiHex }}>
             Write a poem using today's words.
           </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {dailyWords.map(word => {
            const isUsed = usedWords.includes(word);
            return (
              <span 
                key={word} 
                className={`px-4 py-2 text-sm font-bold rounded-lg border-2 shadow-sm transition-all duration-300 ${getWordStyle(word, isUsed)}`}
                style={{ color: (currentTheme.isTerminal && !isUsed) ? '#22c55e' : undefined }}
              >
                {word}
              </span>
            );
          })}
        </div>

        <div className="flex gap-2">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setCurrentTheme(theme)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all shadow-sm transform hover:-translate-y-0.5 ${
                currentTheme.id === theme.id 
                ? "ring-2 ring-offset-2 ring-offset-transparent ring-current scale-105" 
                : "opacity-60 hover:opacity-100"
              } ${currentTheme.controlsClass}`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      {/* EDITOR WORKSPACE */}
      <main className="flex-1 overflow-y-auto relative w-full flex justify-center perspective-1000 pb-20 px-4">
        <div className="w-full max-w-5xl flex justify-center items-start min-h-full">
            
            {/* PAPER CONTAINER */}
            <div 
              className={`relative w-full flex-1 mx-auto transition-all duration-500 flex flex-col ${currentTheme.paperClass}`}
              style={currentTheme.paperStyle}
            >
              
              <textarea
                ref={textareaRef}
                className={`w-full flex-1 bg-transparent border-none outline-none resize-none p-10 md:p-16 ${currentTheme.fontClass} placeholder-opacity-40`}
                style={{ color: currentTheme.inkHex, caretColor: currentTheme.inkHex }}
                placeholder={currentTheme.placeholder}
                value={poem}
                onChange={handleInput} 
                onKeyDown={handleKeyDown}
                onClick={updateCursorPosition} // Update on click
                onScroll={updateCursorPosition} // Update on scroll
                spellCheck={false}
              />

              {/* ✍️ FOLLOWER IMAGE (Quill/Pencil) */}
              {currentTheme.imageConfig && currentTheme.imageConfig.type === 'cursor' && (
                  <img 
                    ref={cursorImageRef}
                    src={currentTheme.imageConfig.src}
                    // 'opacity: 0' initially, but the useEffect will set it to 1 immediately
                    className={`absolute left-0 top-0 z-50 will-change-transform ${currentTheme.imageConfig.className}`}
                    alt="Writing Tool"
                    style={{ opacity: 0 }} 
                  />
              )}

              <div className="p-10 md:p-16 pt-0 flex flex-col gap-6 mt-auto">
                <input 
                    type="text"
                    placeholder={currentTheme.isTerminal ? "AUTHOR_ID_UNKNOWN" : "— Sign your name"}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ color: currentTheme.inkHex }}
                    className={`bg-transparent border-b border-dashed border-current outline-none text-center italic opacity-60 pb-2 ${currentTheme.fontClass}`}
                />
                <button
                  onClick={handleSnap}
                  disabled={!allWordsUsed || isSubmitting}
                  className={`w-full py-4 font-bold transition-all uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none ${currentTheme.controlsClass}`}
                >
                  {allWordsUsed ? "Submit to Board 🫰" : "Complete Word Bank"}
                </button>
              </div>
            </div>

        </div>
      </main>

      {/* 🖼️ SCREEN IMAGE (Typewriter - Fixed Bottom) */}
      {currentTheme.imageConfig && currentTheme.imageConfig.type === 'screen' && (
         <img 
           src={currentTheme.imageConfig.src}
           className={currentTheme.imageConfig.className}
           alt="Theme Fixed Prop"
         />
      )}
    </div>
  );
}