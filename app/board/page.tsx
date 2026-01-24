"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('poems').select('*').order('created_at', { ascending: false });
      if (data) setPoems(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleAddSnap = async (id: number, currentSnaps: number) => {
    await supabase.from('poems').update({ snaps: (currentSnaps || 0) + 1 }).eq('id', id);
    setPoems(poems.map(p => p.id === id ? { ...p, snaps: (p.snaps || 0) + 1 } : p));
  };

  if (loading) return <div className="corkboard min-h-screen flex items-center justify-center font-serif text-white italic text-2xl">Unpinning the poems...</div>;

  return (
    <main className="corkboard min-h-screen p-6 md:p-12 overflow-x-hidden">
      {/* This container handles the multi-column square layout */}
      <div className="max-w-[1600px] mx-auto columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
        {poems.map((poem, index) => {
          const style = poem.style_data || { color: 'bg-yellow-200', font: 'font-serif', border: 'rounded-sm' };
          const rotation = (index % 2 === 0 ? '-' : '') + (Math.random() * 2).toFixed(1) + 'deg';
          
          return (
            <div 
              key={poem.id}
              style={{ transform: `rotate(${rotation})` }}
              className={`break-inside-avoid paper-note p-8 ${style.color} ${style.border} relative group cursor-pointer transition-all duration-300 max-h-[300px] hover:max-h-[2000px] overflow-hidden shadow-xl`}
            >
              {/* Pushpin UI */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-600 rounded-full shadow-inner ring-1 ring-red-400 z-20"></div>
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-1 h-4 bg-stone-400/30 blur-[1px] rotate-12"></div>
              
              <p className={`${style.font} text-xl leading-relaxed text-stone-800 italic`}>
                "{poem.content}"
              </p>
              
              <div className="mt-8 pt-6 border-t border-stone-800/10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-600">— {poem.author_name}</span>
                <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     handleAddSnap(poem.id, poem.snaps);
                   }}
                   className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full hover:bg-white transition-colors border border-stone-800/10"
                >
                  <span className="text-sm">🫰</span>
                  <span className="font-bold text-xs">{poem.snaps || 0}</span>
                </button>
              </div>

              {/* Gradient fade to hint there is more text to read */}
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/5 to-transparent group-hover:hidden"></div>
            </div>
          );
        })}
      </div>
    </main>
  );
}