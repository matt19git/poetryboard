"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SinglePoem() {
  const params = useParams();
  const [poem, setPoem] = useState<any>(null);
  const [displayedContent, setDisplayedContent] = useState('');

  // Sound Refs
  const audioType = useRef<HTMLAudioElement | null>(null);
  const audioDing = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioType.current = new Audio('/sounds/type.mp3');
    audioDing.current = new Audio('/sounds/ding.mp3');
    if(audioType.current) audioType.current.volume = 0.5;
    if(audioDing.current) audioDing.current.volume = 0.6;

    const fetchPoem = async () => {
      const { data } = await supabase
        .from('poems')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) setPoem(data);
    };
    if (params.id) fetchPoem();
  }, [params.id]);

  useEffect(() => {
    if (poem && poem.content) {
      let i = 0;
      setDisplayedContent('');
      const interval = setInterval(() => {
        if (i < poem.content.length) {
          const char = poem.content.charAt(i);
          setDisplayedContent(prev => prev + char);
          if (char === '\n') {
            if (audioDing.current) {
              audioDing.current.currentTime = 0;
              audioDing.current.play().catch(() => {});
            }
          } else {
            if (audioType.current) {
              audioType.current.currentTime = 0;
              audioType.current.play().catch(() => {});
            }
          }
          i++;
        } else {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [poem]);

  if (!poem) return <div className="p-20 text-center font-serif italic text-stone-500">Finding the poem...</div>;

  const theme = poem.style_data || {
    bgClass: 'bg-stone-50',
    paperClass: 'bg-white border border-stone-200 rounded-2xl shadow-xl',
    fontClass: 'font-serif italic',
    inkColor: 'text-stone-800'
  };

  return (
    <main className={`min-h-screen p-6 flex items-center justify-center ${theme.bgClass}`}>
      <div className={`max-w-xl w-full p-12 text-center ${theme.paperClass}`}>
        <p className={`text-2xl leading-relaxed mb-8 ${theme.fontClass} ${theme.inkColor} whitespace-pre-wrap`}>
          "{displayedContent}"
        </p>
        <div className={`pt-6 border-t border-stone-100 ${theme.fontClass} ${theme.inkColor} opacity-70`}>
          — {poem.author_name}
        </div>
      </div>
    </main>
  );
}