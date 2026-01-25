"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// 🎲 RANDOMIZER HELPERS
// These generate the "messy" look without breaking the layout.
const getRandomRotation = () => Math.floor(Math.random() * 10) - 5; // Tilt between -5deg and 5deg
const getRandomOffset = () => Math.floor(Math.random() * 20) - 10; // Shift +/- 10px

export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. FORCE RESET BODY BACKGROUND
    // This ensures the board is always light gray, even if the user came from 'Terminal' mode.
    document.body.style.backgroundColor = '#e7e5e4'; // stone-200

    const fetch = async () => {
      const today = new Date().toLocaleDateString('en-CA');

      const { data } = await supabase
        .from('poems')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (data) {
        // 2. PRE-CALCULATE POSITIONS
        // We attach these random values once on load so cards don't jitter while you browse.
        const scatteredPoems = data.map(poem => ({
          ...poem,
          style_data: poem.style_data || {
             paperClass: 'bg-yellow-200 shadow-md',
             fontClass: 'font-serif',
             inkHex: '#000000'
          },
          rotation: getRandomRotation(),
          xOffset: getRandomOffset(),
          yOffset: getRandomOffset(),
        }));
        setPoems(scatteredPoems);
      }
      setLoading(false);
    };
    fetch();

    return () => {
      // Cleanup: Reset body background to default when leaving
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleAddSnap = async (id: number, currentSnaps: number) => {
    setPoems(poems.map(p => p.id === id ? { ...p, snaps: (p.snaps || 0) + 1 } : p));
    await supabase.from('poems').update({ snaps: (currentSnaps || 0) + 1 }).eq('id', id);
  };

  if (loading) return (
    <div className="bg-stone-200 min-h-screen flex items-center justify-center font-serif text-stone-600 italic text-2xl animate-pulse">
      Gathering the scattered notes...
    </div>
  );

  return (
    <main className="bg-stone-200 min-h-screen w-full relative overflow-x-hidden">
      
      {/* 🏷️ HEADER (Fixed Top) */}
      <div className="fixed top-0 left-0 w-full z-40 bg-stone-200/95 backdrop-blur-md border-b border-stone-300 py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-2">
             Today's Board <span className="text-2xl text-red-600">📌</span>
           </h1>
           <p className="text-xs text-stone-500 uppercase tracking-widest mt-1 font-bold">
             Cleared Daily at Midnight
           </p>
        </div>
        <Link href="/" className="px-5 py-2.5 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs rounded-full hover:scale-105 hover:bg-stone-800 transition-all shadow-lg">
          + New Poem
        </Link>
      </div>

      {/* 🕸️ EMPTY STATE */}
      {poems.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-screen opacity-40 space-y-6">
          <div className="text-7xl grayscale">🕸️</div>
          <p className="font-serif text-xl italic text-stone-600">The board is empty.</p>
        </div>
      )}

      {/* 📦 GRID LAYOUT (The Solution) */}
      {/* We use a GRID instead of Flex. This guarantees cards cannot overlap because they live in separate cells. */}
      <div className="pt-32 pb-32 px-6 w-full max-w-[1800px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        
        {poems.map((poem) => (
          // ⚓ GRID CELL (Invisible Safe Zone)
          // Each poem gets a dedicated 80 (height 20rem) block of space.
          <div 
            key={poem.id}
            className="relative h-80 w-full group perspective-1000" 
          >
            {/* 🃏 THE CARD (Rotated & Offset) */}
            <div 
              className={`
                absolute inset-0
                flex flex-col
                transition-all duration-300 ease-[cubic-bezier(0.25, 0.8, 0.25, 1)]
                origin-center
                cursor-pointer
                shadow-md
                ${poem.style_data.paperClass}

                /* HOVER ACTIONS: */
                /* 1. Scale Up */
                /* 2. Straighten (rotate-0) */
                /* 3. Center (translate-0) */
                /* 4. Rise to Top (z-50) */
                /* 5. Expand Height (min-h-full) */
                group-hover:scale-110 
                group-hover:rotate-0 
                group-hover:translate-x-0 group-hover:translate-y-0
                group-hover:z-50 
                group-hover:h-auto group-hover:min-h-full
                group-hover:shadow-2xl
              `}
              style={{ 
                // Apply the "messy" offsets here. 
                // Because they are inside a grid cell, even with offsets they won't overlap heavily.
                transform: `rotate(${poem.rotation}deg) translate(${poem.xOffset}px, ${poem.yOffset}px)` 
              }}
            >
              {/* Push Pin Visual */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-800 rounded-full shadow-sm z-20 border border-white/20"></div>

              {/* Poem Content */}
              <div className="flex-1 p-6 md:p-8 flex flex-col relative">
                <p 
                  className={`
                    text-lg 
                    leading-relaxed 
                    whitespace-pre-wrap 
                    overflow-hidden
                    /* On hover, we remove the line clamp so you can read everything */
                    line-clamp-6 group-hover:line-clamp-none
                    ${poem.style_data.fontClass}
                  `}
                  style={{ color: poem.style_data.inkHex }}
                >
                  {poem.content}
                </p>
                
                {/* Fade Out Effect (Hides on hover) */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/5 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity"></div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-4 pt-0 mt-auto flex justify-between items-center border-t border-black/5 mx-2 mb-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate max-w-[50%]" style={{ color: poem.style_data.inkHex }}>
                  {poem.author_name}
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSnap(poem.id, poem.snaps);
                  }}
                  className="px-3 py-1 bg-white/40 hover:bg-white rounded-full flex items-center gap-1.5 transition-colors shadow-sm"
                >
                   <span>🫰</span>
                   <span className="text-xs font-bold text-stone-800">{poem.snaps || 0}</span>
                </button>
              </div>

            </div>
          </div>
        ))}

      </div>
    </main>
  );
}