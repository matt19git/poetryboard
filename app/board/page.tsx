"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoems = async () => {
      // Fetch poems, newest first
      const { data } = await supabase
        .from('poems')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setPoems(data);
      setLoading(false);
    };

    fetchPoems();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-800">Poem Board</h1>
        <Link href="/" className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold">
          Write a Poem +
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {poems.map((poem) => (
          <div key={poem.id} className="relative">
            {/* TODO: Use poem.style_data to style this card 
               Example: className={poem.style_data.paperClass}
            */}
            <div className="bg-white p-8 rounded shadow-md min-h-[300px] whitespace-pre-wrap">
              {poem.content}
              <div className="mt-4 text-sm opacity-50">— {poem.author_name}</div>
            </div>
            
            {/* Debugging: View the style data available */}
            {/* <pre className="text-xs mt-4">{JSON.stringify(poem.style_data, null, 2)}</pre> */}
          </div>
        ))}
      </div>
    </div>
  );
}