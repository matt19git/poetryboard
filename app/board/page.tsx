"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// Random rotation helper (keeps it static once loaded)
const getRandomRotation = () => Math.floor(Math.random() * 6) - 3; 

export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toLocaleDateString('en-CA');
      
      const { data } = await supabase
        .from('poems')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (data) {
        // Prepare the data with visual defaults
        const processed = data.map(poem => ({
          ...poem,
          // Fallback theme if missing
          style_data: poem.style_data || {
             paperClass: 'bg-yellow-200 shadow-md',
             fontClass: 'font-serif',
             inkHex: '#000000'
          },
          rotation: getRandomRotation(),
        }));
        setPoems(processed);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleAddSnap = async (id: number, currentSnaps: number) => {
    // Optimistic UI update
    setPoems(poems.map(p => p.id === id ? { ...p, snaps: (p.snaps || 0) + 1 } : p));
    // DB update
    await supabase.from('poems').update({ snaps: (currentSnaps || 0) + 1 }).eq('id', id);
  };

  if (loading) return (
    <div className="w-full h-screen flex items-center justify-center bg-stone-200 font-serif text-stone-500 italic">
      Loading board...
    </div>
  );

  return (
    // 1. SAFETY WRAPPER: Forces the background color on this page specifically
    <div className="min-h-screen w-full bg-stone-200 text-stone-800 font-sans">
      
      {/* HEADER */}
      <div className="fixed top-0 left-0 w-full z-50 bg-stone-200/90 backdrop-blur-md border-b border-stone-300 px-6 py-4 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
             Today's Board <span className="text-2xl">📌</span>
           </h1>
           <p className="text-xs uppercase tracking-widest opacity-60 font-bold mt-1">
             Cleared Daily at Midnight
           </p>
        </div>
        <Link href="/" className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
          + New Poem
        </Link>
      </div>

      {/* EMPTY STATE */}
      {poems.length === 0 && (
        <div className="h-screen w-full flex flex-col items-center justify-center opacity-40">
          <div className="text-6xl mb-4">🕸️</div>
          <p className="font-serif text-xl italic">The board is empty.</p>
        </div>
      )}

      {/* 2. THE GRID CONTAINER */}
      {/* 'pt-32' gives space for the header. 'grid-cols-...' handles the layout. */}
      <div className="w-full max-w-7xl mx-auto pt-32 pb-20 px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        
        {poems.map((poem) => (
          // 3. THE ANCHOR (Grid Cell)
          // 'aspect-square' FORCES this to be a square box, preventing the "long strip" glitch
          <div 
            key={poem.id}
            className="relative w-full aspect-square group perspective-1000"
          >
            {/* 4. THE CARD (Rotated Note) */}
            <div 
              className={`
                absolute inset-0 
                flex flex-col p-6 
                cursor-pointer 
                transition-all duration-300 ease-out
                shadow-lg hover:shadow-2xl
                ${poem.style_data.paperClass}

                /* HOVER EFFECT: Pop up, straighten, and expand height if needed */
                group-hover:z-50
                group-hover:scale-110
                group-hover:rotate-0
                group-hover:h-auto group-hover:min-h-full
              `}
              style={{
                transform: `rotate(${poem.rotation}deg)`
              }}
            >
              {/* Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-800 rounded-full border border-white/30 shadow-sm z-10"></div>

              {/* Poem Text */}
              <div className="flex-1 overflow-hidden relative mb-2">
                <p 
                  className={`text-lg leading-relaxed whitespace-pre-wrap ${poem.style_data.fontClass}`}
                  style={{ color: poem.style_data.inkHex }}
                >
                  {poem.content}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-black/10 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate w-24" style={{ color: poem.style_data.inkHex }}>
                  {poem.author_name}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAddSnap(poem.id, poem.snaps); }}
                  className="bg-white/50 hover:bg-white px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
                >
                  <span>🫰</span>
                  <span className="text-xs font-bold">{poem.snaps || 0}</span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}