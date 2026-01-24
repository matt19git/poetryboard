"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SinglePoem() {
  const params = useParams();
  const [poem, setPoem] = useState<any>(null);

  useEffect(() => {
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

  if (!poem) return <div className="p-20 text-center font-serif italic text-stone-500">Finding the poem...</div>;

  return (
    <main className="min-h-screen bg-stone-50 p-6 flex items-center justify-center">
      <div className="max-w-xl w-full p-12 bg-white border border-stone-200 rounded-2xl shadow-xl text-center">
        <p className="font-serif text-2xl leading-relaxed text-stone-800 italic mb-8">
          "{poem.content}"
        </p>
        <div className="pt-6 border-t border-stone-100 italic text-stone-500">
          — {poem.author_name}
        </div>
      </div>
    </main>
  );
}