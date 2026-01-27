"use client";
import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 🛑 DYNAMIC IMPORT
const HTMLFlipBook = dynamic(
  () => import('react-pageflip').then((mod) => mod.default), 
  { 
    ssr: false,
    loading: () => <div className="text-white/50 mt-20 animate-pulse font-serif">Loading The Archive...</div> 
  }
);

// --- 1. HELPERS ---
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// --- 2. PAGE COMPONENT ---
const Page = forwardRef((props: any, ref: any) => {
  const { poem, type, pageNumber } = props;

  // -- COVER (Dark Leather) --
  if (type === 'cover') {
    return (
      <div ref={ref} className="h-full w-full bg-[#2b1b17] text-[#d7ccc8] border-r-4 border-[#1a0f0d] flex items-center justify-center p-8 shadow-2xl"
           style={{ backgroundColor: '#2b1b17' }}> {/* Inline style for safety */}
        <div className="border-4 border-double border-[#d7ccc8]/30 h-full w-full flex flex-col items-center justify-center text-center p-6">
           <h1 className="text-5xl font-serif tracking-widest drop-shadow-md mb-2 text-[#d7ccc8]">POEMS</h1>
           <div className="w-10 h-0.5 bg-[#d7ccc8]/50 mb-2"></div>
           <p className="text-xs tracking-[0.4em] uppercase opacity-70 text-[#d7ccc8]">Volume I</p>
        </div>
      </div>
    );
  }

  // -- TITLE PAGE (Paper) --
  if (type === 'title') {
    return (
      <div ref={ref} className="h-full w-full bg-[#f9f7f1] p-10 flex flex-col items-center justify-center text-center shadow-inner border-r border-gray-200 page-content"
           style={{ backgroundColor: '#f9f7f1' }}> 
         <h2 className="text-3xl font-serif italic text-gray-800 mb-2">The Collection</h2>
         <div className="w-8 h-px bg-gray-300 mb-4"></div>
         <p className="text-xs uppercase tracking-widest text-gray-400">Personal Archive</p>
      </div>
    );
  }

  // -- BACK COVER --
  if (type === 'back') {
    return <div ref={ref} className="h-full w-full bg-[#2b1b17] shadow-inner border-l-2 border-[#5d4037]" style={{ backgroundColor: '#2b1b17' }}></div>;
  }

  // -- CONTENT PAGES (Paper) --
  return (
    <div ref={ref} className="h-full w-full bg-[#f9f7f1] relative shadow-inner overflow-hidden border-r border-gray-100 page-content"
         style={{ backgroundColor: '#f9f7f1' }}> {/* Force Cream/White */}
      
      {/* Top Aligned Content Container */}
      <div className="h-full p-12 flex flex-col justify-start items-start">
        
        {/* Header - Strictly at the top */}
        {type === 'metadata' && (
          <div className="w-full border-b border-gray-300 pb-4 mb-6 mt-2">
            <h2 className="text-2xl font-serif font-bold text-gray-900 m-0 p-0">
              {formatDate(poem.created_at)}
            </h2>
            <div className="text-sm italic text-gray-600 mt-2 font-serif">
              Penned by {poem.author_name || "Anonymous"}
            </div>
          </div>
        )}

        {/* Content Body - Starts immediately after header */}
        <div className="w-full flex-1 text-left">
          {type === 'metadata' ? (
             <div className="flex flex-wrap gap-2 opacity-70 pt-2">
                {poem.word_bank?.map((w: string) => (
                  <span key={w} className="px-3 py-1 text-[10px] border border-gray-400 rounded-sm text-gray-600 uppercase tracking-widest font-sans">
                    {w}
                  </span>
                ))}
             </div>
          ) : (
            <div className="whitespace-pre-wrap text-lg leading-loose font-serif text-gray-900 pt-2 pl-1">
              {poem.content}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-full mt-auto pt-6 flex justify-between items-end text-gray-400 border-t border-transparent">
           <span className="text-[10px] font-mono uppercase tracking-widest">
             {type === 'metadata' ? `ID ${String(poem.id).slice(0,4)}` : '•'}
           </span>
           <span className="text-xs font-serif">{pageNumber}</span>
        </div>
      </div>
      
      {/* Spine Gradient Overlay */}
      <div className={`absolute top-0 bottom-0 w-12 pointer-events-none opacity-10 ${type === 'metadata' ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-black to-transparent`}></div>
    </div>
  );
});

Page.displayName = 'Page';


// --- 3. MAIN BOARD ---
export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const bookRef = useRef<any>(null);

  useEffect(() => {
    // Force clean the body to ensure no global CSS leakage
    document.body.style.backgroundColor = '#1c1917';
    
    const fetchPoems = async () => {
      const { data } = await supabase.from('poems').select('*').order('created_at', { ascending: false });
      if (data) setPoems(data);
      setLoading(false);
    };
    fetchPoems();

    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  return (
    // FLEX COLUMN: Forces Header to Top, Book to fill rest
    <div className="min-h-screen w-full flex flex-col bg-[#1c1917] font-sans relative overflow-hidden">
      
      {/* 1. FIXED BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Wood Texture */}
         <div className="absolute inset-0 bg-[#2c241b]" 
              style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")` }}>
         </div>
         {/* Vignette Shadow - Behind the book */}
         <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80"></div>
      </div>

      {/* 2. HEADER (Top Block) */}
      <header className="relative z-20 w-full px-8 py-6 flex justify-between items-center bg-black/30 backdrop-blur-md border-b border-white/5 shadow-md">
        <h1 className="text-[#eaddcf] font-serif italic text-2xl tracking-widest">The Archive</h1>
        <Link 
          href="/" 
          className="bg-[#f9f7f1] text-[#2c241b] px-6 py-2 rounded-sm shadow-lg border border-[#d7ccc8] font-serif font-bold text-xs tracking-widest hover:bg-white hover:scale-105 transition-all"
        >
          + NEW ENTRY
        </Link>
      </header>

      {/* 3. BOOK CONTAINER */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-8 overflow-hidden">
        {loading ? (
             <div className="text-[#d7ccc8] font-serif text-2xl animate-pulse">Retrieving volumes...</div>
        ) : (
          /* @ts-ignore */
          <HTMLFlipBook
            width={500}           
            height={700}          
            size="fixed"          
            minWidth={300}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1200}
            maxShadowOpacity={0.5} 
            showCover={true}
            mobileScrollSupport={true}
            className="shadow-[0_50px_100px_rgba(0,0,0,0.8)]" 
            ref={bookRef}
            flippingTime={1000}
            clickEventForward={true}
            useMouseEvents={true}
            showPageCorners={true}
          >
            {/* FRONT COVER */}
            <Page key="cover" type="cover" />

            {/* TITLE SPREAD */}
            <Page key="inner-left" type="back" /> 
            <Page key="title" type="title" />

            {/* CONTENT SPREADS */}
            {poems.flatMap((poem, index) => [
                <Page key={`meta-${poem.id}`} poem={poem} type="metadata" pageNumber={(index * 2) + 1} />,
                <Page key={`content-${poem.id}`} poem={poem} type="poem" pageNumber={(index * 2) + 2} />
            ])}

            {/* BACK COVER */}
            <Page key="back-inner" type="back" />
            <Page key="back-cover" type="cover" />

          </HTMLFlipBook>
        )}
      </main>

      {/* 🛑 NUCLEAR CSS OVERRIDES */}
      <style jsx global>{`
        /* 1. Force the flipbook internal pages to be white/cream */
        .stf__item {
            background-color: #f9f7f1 !important;
        }
        
        /* 2. Force the cover pages to be leather */
        .stf__item.--cover {
            background-color: #2b1b17 !important;
        }

        /* 3. Fix text color globally inside the book */
        .page-content {
            color: #1a1a1a !important;
        }

        .bg-radial-gradient { background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%); }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
}