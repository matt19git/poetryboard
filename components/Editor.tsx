"use client";
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import getCaretCoordinates from 'textarea-caret';

// ------------------------------------------------------------------
// 🔧 THEME CONFIGURATION
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
    
    // 🎵 AUDIO
    sound: '/sounds/quillsound.mp3',
    isContinuousSound: true, 
    restartOnNewline: true, 
    volumeBoost: 1.0,
    
    imageConfig: {
      src: '/quill.png',
      tipOffset: { x: 0, y: -80 }, 
      className: "w-20 md:w-24 rotate-12 drop-shadow-xl pointer-events-none transition-transform ease-out",
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
    sound: '/sounds/pencilsound.mp3',
    isContinuousSound: true, 
    restartOnNewline: true, 
    volumeBoost: 1.0, 

    imageConfig: {
      src: '/pencil.png',
      tipOffset: { x: 0, y: -40 },
      className: "w-12 md:w-16 -rotate-6 drop-shadow-lg pointer-events-none transition-transform ease-out",
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
    volumeBoost: 1.0,
    
    imageConfig: {
      src: '/typewriter.png',
      className: "relative z-30 w-full max-w-[500px] mx-auto -mt-16 pointer-events-none drop-shadow-2xl",
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
    
    sound: '/sounds/terminalsoundeffect.mp3',
    isContinuousSound: true,
    isTerminal: true,
    volumeBoost: 0.4, 
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
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  
  // 🔊 VOLUME STATE (Default 0.5)
  const [masterVolume, setMasterVolume] = useState(0.5);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorImageRef = useRef<HTMLImageElement>(null);
  
  // Audio Refs
  const dingRef = useRef<HTMLAudioElement | null>(null);
  const continuousAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Game Loop Refs
  const lastInteractionTime = useRef<number>(0);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  // 💾 LOAD VOLUME
  useEffect(() => {
    const savedVol = localStorage.getItem('poem-volume');
    if (savedVol !== null) {
      setMasterVolume(parseFloat(savedVol));
    }
  }, []);

  // 💾 SAVE VOLUME
  const handleVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    localStorage.setItem('poem-volume', newVol.toString());
    
    // Immediate Update for Typewriter Ding
    if (dingRef.current) dingRef.current.volume = newVol;
    
    // Immediate Update for Continuous Audio
    if (continuousAudioRef.current) {
        const boost = currentTheme.volumeBoost || 1.0;
        const targetVol = Math.min(1, newVol * boost);
        if (!continuousAudioRef.current.paused) {
            continuousAudioRef.current.volume = targetVol;
        }
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.bgHex;
  }, [currentTheme]);

  // 🎵 AUDIO ENGINE
  useEffect(() => {
    lastInteractionTime.current = 0; 

    if (currentTheme.isContinuousSound && currentTheme.sound) {
      if (!continuousAudioRef.current) {
        continuousAudioRef.current = new Audio(currentTheme.sound);
        continuousAudioRef.current.loop = true; 
        continuousAudioRef.current.volume = masterVolume;
        continuousAudioRef.current.playbackRate = 1.0;
      } else {
        continuousAudioRef.current.volume = masterVolume; 
      }
    } else {
      if (continuousAudioRef.current) {
        continuousAudioRef.current.pause();
        continuousAudioRef.current = null;
      }
    }

    if (currentTheme.isContinuousSound) {
      checkInterval.current = setInterval(() => {
        const audio = continuousAudioRef.current;
        if (!audio) return;

        const boost = currentTheme.volumeBoost || 1.0;
        const targetVol = Math.min(1, masterVolume * boost);

        const now = Date.now();
        // Wait 500ms before fading out
        const isTypingActive = lastInteractionTime.current > 0 && (now - lastInteractionTime.current) < 500;

        if (isTypingActive) {
          if (audio.volume < targetVol) audio.volume = targetVol;
          if (audio.paused) {
            const p = audio.play();
            if (p) p.catch(() => {});
          }
        } else {
          // Fade out logic
          if (!audio.paused) {
             if (audio.volume > 0.05) {
                audio.volume = Math.max(0, audio.volume - 0.05); 
             } else {
                audio.pause();
                audio.volume = targetVol; 
             }
          }
        }
      }, 100);
    }

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
      if (continuousAudioRef.current) continuousAudioRef.current.pause();
    };
  }, [currentTheme, masterVolume]);

  useEffect(() => {
    const config = currentTheme.imageConfig;
    const img = cursorImageRef.current;
    
    if (config?.type === 'cursor' && img) {
      if (hasStartedTyping) {
         img.style.transitionDuration = '0s'; 
         updateCursorPosition(); 
      } else {
         const startX = window.innerWidth * 0.8;
         const startY = window.innerHeight * 0.25;
         
         img.style.transitionDuration = '0s'; 
         img.style.transform = `translate(${startX}px, ${startY}px)`;
         img.style.opacity = '1'; 
      }
    }
  }, [currentTheme, hasStartedTyping]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      dingRef.current = new Audio('/sounds/ding.mp3');
      if (dingRef.current) dingRef.current.volume = masterVolume;
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

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const coordinates = getCaretCoordinates(textarea, textarea.selectionEnd);
    const rect = textarea.getBoundingClientRect();
    
    const top = rect.top + window.scrollY + coordinates.top - textarea.scrollTop;
    
    if (cursorImageRef.current && currentTheme.imageConfig?.type === 'cursor') {
       const image = cursorImageRef.current;
       const config = currentTheme.imageConfig;
       const left = rect.left + window.scrollX + coordinates.left + (config.tipOffset?.x || 0);
       const imgTop = top + (config.tipOffset?.y || 0);

       if (image.style.transitionDuration === '0s' && hasStartedTyping) {
          image.style.transitionDuration = '0.8s'; 
          setTimeout(() => {
             if (cursorImageRef.current) cursorImageRef.current.style.transitionDuration = '75ms';
          }, 800);
       } 
       else if (hasStartedTyping && image.style.transitionDuration === '0s') {
          image.style.transitionDuration = '75ms';
       }

       image.style.transform = `translate(${left}px, ${imgTop}px)`;
       image.style.opacity = '1';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPoem(e.target.value);
    lastInteractionTime.current = Date.now();

    if (!hasStartedTyping) {
      setHasStartedTyping(true);
      setTimeout(() => requestAnimationFrame(updateCursorPosition), 10);
    } else {
      requestAnimationFrame(updateCursorPosition);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (hasStartedTyping) requestAnimationFrame(updateCursorPosition);
    lastInteractionTime.current = Date.now();

    if (e.key === 'Enter') {
      if (currentTheme.restartOnNewline && continuousAudioRef.current) {
        continuousAudioRef.current.currentTime = 0;
        const boost = currentTheme.volumeBoost || 1.0;
        continuousAudioRef.current.volume = Math.min(1, masterVolume * boost);
        const p = continuousAudioRef.current.play();
        if (p) p.catch(()=>{});
      }
    }

    if (currentTheme.hasTypewriterEffect && e.key === 'Enter') {
      if (dingRef.current) {
        dingRef.current.currentTime = 0;
        dingRef.current.volume = masterVolume;
        dingRef.current.play().catch(() => {});
      }
      return; 
    }

    if (currentTheme.sound && !currentTheme.isContinuousSound) {
        const sound = new Audio(currentTheme.sound);
        const boost = currentTheme.volumeBoost || 1.0;
        sound.volume = Math.min(1, masterVolume * boost);
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
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-700 ${currentTheme.bgClass}`} style={{ backgroundColor: currentTheme.bgHex }}>
        <div className={`text-center space-y-6 p-12 rounded-xl shadow-2xl max-w-md w-full mx-4 ${currentTheme.isTerminal ? 'border-2 border-green-500 bg-black' : 'bg-white'}`}>
          <h2 className={`text-4xl font-bold ${currentTheme.fontClass}`} style={{ color: currentTheme.inkHex }}>Preserved. 🫰</h2>
          <Link href="/board" className={`block w-full py-4 font-bold uppercase tracking-widest rounded-lg hover:scale-105 transition-transform ${currentTheme.controlsClass}`}>View the Board</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col flex-1 overflow-x-hidden transition-colors duration-700 min-h-screen ${currentTheme.bgClass}`} style={{ backgroundColor: currentTheme.bgHex }}>
      
      {/* 🎵 STABLE AUDIO TAG */}
      {currentTheme.isContinuousSound && (
        <audio 
          ref={continuousAudioRef}
          src={currentTheme.sound}
          key={currentTheme.id} 
          loop 
          preload="auto"
          className="hidden"
        />
      )}

      {/* HEADER */}
      <div className="flex-none pt-8 pb-6 px-4 z-20 flex flex-col items-center gap-6 relative">
        
        {/* RIGHT: Volume & Link */}
        <div className="absolute right-6 top-8 flex items-center gap-6">
            
            {/* 🔊 VISIBLE VOLUME SLIDER */}
            <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
                <button 
                    onClick={() => handleVolumeChange(masterVolume === 0 ? 0.5 : 0)}
                    className="text-lg opacity-80 hover:opacity-100 hover:scale-110 transition-all"
                    style={{ color: currentTheme.uiHex }}
                >
                    {masterVolume === 0 ? "🔇" : "🔊"}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={masterVolume} 
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-24 h-1.5 rounded-full appearance-none cursor-pointer bg-gray-400/30 accent-current"
                    style={{ accentColor: currentTheme.uiHex }}
                />
            </div>

            <Link href="/board" className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity" style={{ color: currentTheme.uiHex }}>
                View Board →
            </Link>
        </div>

        <div className="text-center space-y-2">
           <h1 className="text-4xl font-serif font-bold transition-colors duration-300" style={{ color: currentTheme.uiHex }}>Poetry Snaps 🫰</h1>
           <p className="text-sm italic opacity-80 transition-colors duration-300" style={{ color: currentTheme.uiHex }}>Write a poem using today's words.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {dailyWords.map(word => {
            const isUsed = usedWords.includes(word);
            return (
              <span key={word} className={`px-4 py-2 text-sm font-bold rounded-lg border-2 shadow-sm transition-all duration-300 ${getWordStyle(word, isUsed)}`} style={{ color: (currentTheme.isTerminal && !isUsed) ? '#22c55e' : undefined }}>{word}</span>
            );
          })}
        </div>
        <div className="flex gap-2">
          {THEMES.map(theme => (
            <button key={theme.id} onClick={() => setCurrentTheme(theme)} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all shadow-sm transform hover:-translate-y-0.5 ${currentTheme.id === theme.id ? "ring-2 ring-offset-2 ring-offset-transparent ring-current scale-105" : "opacity-60 hover:opacity-100"} ${currentTheme.controlsClass}`}>{theme.name}</button>
          ))}
        </div>
      </div>

      {/* WORKSPACE */}
      <main className="flex-1 overflow-y-auto relative w-full flex justify-center perspective-1000 pb-20 px-4">
        <div className="w-full max-w-5xl flex flex-col items-center min-h-full">
            
            {/* PAPER */}
            <div className={`relative w-full flex-1 mx-auto transition-all duration-500 flex flex-col ${currentTheme.paperClass}`} style={currentTheme.paperStyle}>
              <textarea
                ref={textareaRef}
                className={`w-full flex-1 bg-transparent border-none outline-none resize-none p-10 md:p-16 ${currentTheme.fontClass} placeholder-opacity-40`}
                style={{ color: currentTheme.inkHex, caretColor: currentTheme.inkHex }}
                placeholder={currentTheme.placeholder}
                value={poem}
                onChange={handleInput} 
                onKeyDown={handleKeyDown}
                onClick={() => {
                   if (!hasStartedTyping) {
                      setHasStartedTyping(true);
                      setTimeout(() => requestAnimationFrame(updateCursorPosition), 10);
                   } else {
                      updateCursorPosition();
                   }
                }}
                onScroll={updateCursorPosition}
                spellCheck={false}
              />
              <div className="p-10 md:p-16 pt-0 flex flex-col gap-6 mt-auto">
                <input type="text" placeholder={currentTheme.isTerminal ? "AUTHOR_ID_UNKNOWN" : "— Sign your name"} value={author} onChange={(e) => setAuthor(e.target.value)} style={{ color: currentTheme.inkHex }} className={`bg-transparent border-b border-dashed border-current outline-none text-center italic opacity-60 pb-2 ${currentTheme.fontClass}`} />
                <button onClick={handleSnap} disabled={!allWordsUsed || isSubmitting} className={`w-full py-4 font-bold transition-all uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none ${currentTheme.controlsClass}`}>{allWordsUsed ? "Submit to Board 🫰" : "Complete Word Bank"}</button>
              </div>
            </div>

            {/* 🖼️ TYPEWRITER IMAGE */}
            {currentTheme.imageConfig && currentTheme.imageConfig.type === 'screen' && (
              <img src={currentTheme.imageConfig.src} className={currentTheme.imageConfig.className} alt="Typewriter" />
            )}
        </div>
      </main>

      {/* ✍️ GLOBAL CURSOR IMAGE */}
      {currentTheme.imageConfig && currentTheme.imageConfig.type === 'cursor' && (
          <img 
            ref={cursorImageRef}
            src={currentTheme.imageConfig.src}
            className={`fixed top-0 left-0 z-[100] will-change-transform ${currentTheme.imageConfig.className}`}
            alt="Writing Tool"
            style={{ opacity: 0 }} 
          />
      )}
    </div>
  );
}