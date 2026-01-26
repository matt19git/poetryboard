"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// 1. Helper: Format Date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

// 2. Helper: Deterministic Randomness
const getCardVisuals = (id: any) => {
  const safeId = String(id || '0');
  const num = safeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    rotation: (num % 10) - 5,   // Rotate -5deg to +5deg
    offsetY: (num % 30) - 15,   // Shift up/down 15px
    pinColor: num % 2 === 0 ? 'bg-red-600' : 'bg-blue-600',
    pinOffset: (num % 60) + 20, // Pin position along the top
  };
};

export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoem, setSelectedPoem] = useState<any>(null);

  useEffect(() => {
    const fetchPoems = async () => {
      const { data } = await supabase
        .from('poems')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setPoems(data);
      setLoading(false);
    };

    fetchPoems();
  }, []);

  // --- STYLE FACTORY ---
  const getThemeStyles = (style: any) => {
    const isTerminal = style.isTerminal;
    
    let styles = {
      cardBg: '#fff',
      bgImage: 'none',
      textColor: '#000',
      fontFamily: 'serif',
      shadow: 'shadow-[3px_5px_10px_rgba(0,0,0,0.3)]',
      border: '',
      bgSize: 'auto',
      accentColor: '#000'
    };

    if (style.id === 'notepad') {
      styles.cardBg = '#fef9c3'; 
      styles.bgImage = "linear-gradient(transparent 1.9rem, #94a3b8 1.9rem)";
      styles.bgSize = '100% 2rem';
      styles.textColor = '#1e3a8a'; 
      styles.fontFamily = '"Caveat", cursive';
      styles.accentColor = '#1e3a8a';
    } else if (style.id === 'quill') {
      styles.cardBg = '#eaddcf'; 
      styles.bgImage = "url('https://www.transparenttextures.com/patterns/wood-pattern.png')";
      styles.textColor = '#3e2723'; 
      styles.fontFamily = '"Playfair Display", serif';
      styles.accentColor = '#3e2723';
    } else if (isTerminal) {
      styles.cardBg = '#000';
      styles.textColor = '#22c55e'; 
      styles.fontFamily = '"Fira Code", monospace';
      styles.border = 'border-2 border-green-500';
      styles.shadow = 'shadow-[0_0_15px_rgba(0,255,0,0.3)]';
      styles.accentColor = '#22c55e';
    } else {
      styles.cardBg = '#fff';
      styles.textColor = '#000';
      styles.fontFamily = '"Courier Prime", monospace';
      styles.accentColor = '#000';
    }
    
    return styles;
  };

  return (
    <>
      <div className="min-h-screen w-full relative bg-[#8b5a2b] font-sans">
        
        {/* 🪵 1. BACKGROUND */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{ 
            backgroundColor: '#8b5a2b',
            backgroundImage: `url("https://www.transparenttextures.com/patterns/cork-board.png")`,
          }}
        ></div>

        {/* 📌 2. HEADER */}
        <div className="sticky top-0 z-40 w-full bg-black/10 backdrop-blur-sm border-b border-black/5 p-4 flex justify-between items-center shadow-sm">
          <div className="bg-white/90 px-6 py-2 transform -rotate-1 shadow-lg border border-gray-200">
             <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">The Board 📌</h1>
          </div>
          
          <Link 
            href="/" 
            className="bg-white border-2 border-gray-800 text-gray-900 font-bold py-2 px-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
          >
            Post a Poem +
          </Link>
        </div>

        {/* 🃏 3. CARD CONTAINER */}
        <div className="relative z-10 w-full p-8 pb-40">
          <div className="flex flex-wrap justify-center items-start gap-12">
            
            {loading && (
               <div className="text-white/60 font-bold text-2xl animate-pulse mt-20 w-full text-center">Pinning poems...</div>
            )}

            {poems.map((poem) => {
              const style = poem.style_data || {};
              const visuals = getCardVisuals(poem.id);
              const theme = getThemeStyles(style);

              return (
                <div
                  key={poem.id}
                  onClick={() => setSelectedPoem(poem)}
                  // 🛑 SWITCHED TO DIV WITH CURSOR POINTER
                  className="relative shrink-0 w-[300px] h-[300px] cursor-pointer group transition-all duration-300 hover:z-30 hover:scale-105"
                  style={{
                    transform: `rotate(${visuals.rotation}deg) translateY(${visuals.offsetY}px)`,
                  }}
                >
                  {/* 📍 THE PIN */}
                  <div 
                    className="absolute -top-3 z-20 drop-shadow-md"
                    style={{ left: `${visuals.pinOffset}%` }}
                  >
                    <div className={`w-4 h-4 rounded-full ${visuals.pinColor} border border-black/20 shadow-inner`}></div>
                    <div className="w-0.5 h-2.5 bg-gray-400 mx-auto -mt-0.5 shadow-sm"></div>
                  </div>

                  {/* 📄 THE PAPER (Mini Preview) */}
                  <div 
                    className={`
                      relative w-full h-full p-6 pt-10 flex flex-col overflow-hidden
                      ${theme.shadow} ${theme.border}
                    `}
                    style={{
                      backgroundColor: theme.cardBg,
                      backgroundImage: theme.bgImage,
                      backgroundSize: theme.bgSize,
                      color: theme.textColor,
                      fontFamily: theme.fontFamily,
                    }}
                  >
                    {/* Content - FADE OUT MASK */}
                    <div 
                      className="whitespace-pre-wrap break-words text-base leading-relaxed mb-2 flex-1 w-full"
                      style={{ 
                          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
                      }}
                    >
                      {poem.content}
                    </div>

                    {/* Footer */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 p-4 pt-0 flex justify-between items-end opacity-60 pointer-events-none"
                    >
                      <span className="text-xs font-bold italic truncate max-w-[65%]">
                        — {poem.author_name || "Anonymous"}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest opacity-80">
                        {formatDate(poem.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🔎 4. EXPANSION MODAL (Z-INDEX 100) */}
      {selectedPoem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPoem(null)}
          ></div>

          {/* Modal Content */}
          {(() => {
             const style = selectedPoem.style_data || {};
             const theme = getThemeStyles(style);
             
             return (
               <div 
                 className={`
                   relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-200
                   ${theme.border}
                 `}
                 style={{
                   backgroundColor: theme.cardBg,
                   backgroundImage: theme.bgImage,
                   backgroundSize: theme.bgSize, 
                   backgroundAttachment: 'local', 
                   color: theme.textColor,
                   fontFamily: theme.fontFamily,
                 }}
                 onClick={(e) => e.stopPropagation()} 
               >
                 {/* Close Button */}
                 <button 
                   onClick={() => setSelectedPoem(null)}
                   className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-50"
                   aria-label="Close"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>

                 {/* Full Content */}
                 <div className="whitespace-pre-wrap break-words text-xl md:text-2xl leading-loose min-h-[40vh]">
                   {selectedPoem.content}
                 </div>

                 {/* Modal Footer */}
                 <div 
                   className="mt-12 pt-6 border-t border-current flex justify-between items-end opacity-70"
                   style={{ borderColor: theme.textColor }}
                 >
                   <div>
                     <span className="text-lg font-bold italic block">— {selectedPoem.author_name || "Anonymous"}</span>
                     <div className="flex gap-2 mt-2">
                       {selectedPoem.word_bank?.map((w: string) => (
                         <span key={w} className="text-xs px-2 py-1 rounded-full bg-black/5 border border-black/5">
                           {w}
                         </span>
                       ))}
                     </div>
                   </div>
                   <span className="text-sm uppercase tracking-widest">
                     {formatDate(selectedPoem.created_at)}
                   </span>
                 </div>
               </div>
             );
          })()}
        </div>
      )}
    </>
  );
}