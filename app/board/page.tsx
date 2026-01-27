"use client";
import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const HTMLFlipBook = dynamic(
  () => import('react-pageflip').then((mod) => mod.default), 
  { 
    ssr: false,
    loading: () => <div className="text-[#eaddcf] mt-20 animate-pulse font-serif text-xl tracking-widest">Loading The Archive...</div> 
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

// --- 2. CALENDAR COMPONENT ---
const CalendarDropdown = ({ 
    currentDate, 
    activeDates, 
    earliestDate,
    onSelect, 
    onClose 
}: { 
    currentDate: string, 
    activeDates: string[], 
    earliestDate: string,
    onSelect: (date: string) => void,
    onClose: () => void 
}) => {
    const [viewDate, setViewDate] = useState(() => {
        const [y, m, d] = currentDate.split('-').map(Number);
        return new Date(y, m - 1, d);
    });

    const today = new Date();
    today.setHours(0,0,0,0);
    const minDateObj = new Date(earliestDate + 'T12:00:00');
    minDateObj.setHours(0,0,0,0);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(viewDate);
    const monthYear = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    return (
        <div 
            className="absolute top-full mt-6 left-1/2 -translate-x-1/2 bg-[#1c1917] border border-[#eaddcf]/40 shadow-[0_20px_50px_rgba(0,0,0,1)] p-6 z-[100] w-80 rounded-sm" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#eaddcf]/10">
                <button onClick={() => changeMonth(-1)} className="text-[#eaddcf] hover:text-white p-2">◄</button>
                <span className="text-[#eaddcf] font-serif font-bold tracking-widest text-lg uppercase">{monthYear}</span>
                <button onClick={() => changeMonth(1)} className="text-[#eaddcf] hover:text-white p-2">►</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-[#eaddcf]/30 text-[10px] font-bold uppercase">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const dateStr = dateObj.toLocaleDateString('en-CA');
                    const isFuture = dateObj > today;
                    const isBeforeArchive = dateObj < minDateObj;
                    const isDisabled = isFuture || isBeforeArchive;
                    const hasPoems = activeDates.includes(dateStr);
                    const isSelected = dateStr === currentDate;
                    let buttonClass = "text-[#eaddcf]/60 hover:text-white cursor-pointer"; 
                    if (isDisabled) buttonClass = "text-[#eaddcf]/5 cursor-not-allowed"; 
                    if (isSelected) buttonClass = "bg-[#eaddcf] text-[#1c1917] font-bold shadow-lg rounded-full cursor-pointer"; 
                    return (
                        <button key={day} disabled={isDisabled} onClick={() => { if (!isDisabled) { onSelect(dateStr); onClose(); } }} className={`h-8 w-8 flex flex-col items-center justify-center text-xs rounded-full transition-all bg-transparent outline-none relative ${buttonClass}`}>
                            <span className={hasPoems && !isSelected ? "font-bold text-[#eaddcf]" : ""}>{day}</span>
                            {hasPoems && !isSelected && (
                                <span className="absolute bottom-1 w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-center gap-6 text-[9px] uppercase tracking-widest pt-3 border-t border-[#eaddcf]/10">
                <div className="flex items-center gap-2 text-[#eaddcf]/80">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span> 
                    Volume Found
                </div>
            </div>
        </div>
    );
};


// --- 3. PAGE COMPONENT ---
const Page = forwardRef((props: any, ref: any) => {
  const { poem, type, pageNumber, date, words } = props;
  const pageShadow = "shadow-[0_10px_30px_rgba(0,0,0,0.5)]";
  
  // 🛑 RIGID CONTAINER: STRICT 500x700
  const PAGE_CLASS = `w-[500px] h-[700px] relative overflow-hidden bg-[#f9f7f1]`;

  const displayDate = date 
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : "";

  // -- COVER --
  if (type === 'cover') {
    return (
      <div ref={ref} className={`${PAGE_CLASS} bg-[#2b1b17] border-r-4 border-[#1a0f0d] flex items-center justify-center p-8 cover-page ${pageShadow}`}>
        <div className="border-4 border-double border-[#d7ccc8]/30 h-full w-full flex flex-col items-center justify-center text-center p-6 relative">
           <h1 className="text-5xl font-serif tracking-widest drop-shadow-md mb-4 text-[#d7ccc8] mt-10">POEMS</h1>
           <div className="w-10 h-0.5 bg-[#d7ccc8]/50 mb-4"></div>
           <p className="text-xs tracking-[0.4em] uppercase opacity-70 text-[#d7ccc8]">Volume I</p>
           <p className="text-[10px] tracking-widest uppercase opacity-50 text-[#d7ccc8] mt-6 pt-2">
             {displayDate}
           </p>
           {words && words.length > 0 && (
             <div className="mt-16 w-3/4 pt-6 border-t border-[#d7ccc8]/20 flex flex-col items-center gap-3">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#eaddcf]/40 font-serif italic">Muse</span>
                <div className="flex flex-wrap justify-center gap-3">
                    {words.map((w: string, i: number) => (
                        <span key={i} className="text-xs font-serif italic text-[#d7ccc8]/80 tracking-wide">
                            {w}
                        </span>
                    ))}
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  // -- TITLE --
  if (type === 'title') {
    return (
      <div ref={ref} className={`${PAGE_CLASS} p-10 flex flex-col items-center justify-center text-center shadow-inner border-r border-gray-200 page-content ${pageShadow}`}> 
         <h2 className="text-3xl font-serif italic text-gray-800 mb-2">The Daily Collection</h2>
         <div className="w-8 h-px bg-gray-300 mb-4"></div>
         <p className="text-xs uppercase tracking-widest text-gray-400">Restricted to This Date</p>
      </div>
    );
  }

  // -- BACK --
  if (type === 'back') {
    return <div ref={ref} className={`${PAGE_CLASS} bg-[#3e2723] shadow-inner border-l-2 border-[#5d4037] page-content ${pageShadow}`}></div>;
  }

  // -- POEM --
  if (type === 'poem') {
      // 🛑 IGNORE EDITOR THEME: We enforce a standard "Book Style" here.
      // This ensures every page in the book looks uniform.
      const BOOK_STYLE = {
          paperClass: "bg-[#f9f7f1]", // Standard off-white paper
          fontClass: "font-serif text-lg leading-loose", // Standard serif font
          inkHex: "#1c1917" // Standard ink color
      };

      return (
        <div ref={ref} className={`${PAGE_CLASS} ${pageShadow}`}>
            {/* 🛑 INNER CONTENT: Clean Book Layout */}
            <div className={`w-full h-full border-r border-gray-100 page-content ${BOOK_STYLE.paperClass}`}
                 style={{ 
                     // No dynamic styles from DB here. Just pure CSS classes.
                     width: '100%', 
                     height: '100%', 
                     minHeight: '0', 
                     maxHeight: 'none', 
                     border: 'none', 
                     borderRadius: '0',
                     boxSizing: 'border-box'
                 }}>
              
              <textarea
                readOnly
                value={poem.content}
                className={`w-full h-full bg-transparent border-none outline-none resize-none p-12 pb-20 ${BOOK_STYLE.fontClass} overflow-hidden`}
                style={{ 
                    color: BOOK_STYLE.inkHex, 
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
              />

              <div className="absolute bottom-12 left-0 right-0 text-center z-10">
                 <span className={`text-sm italic opacity-60 ${BOOK_STYLE.fontClass}`} style={{ color: BOOK_STYLE.inkHex }}>
                   — {poem.author_name}
                 </span>
              </div>
              
              <div className="absolute bottom-4 right-6 text-xs text-gray-400 font-serif z-10">{pageNumber}</div>
              {/* Optional: Subtle inner shadow for book effect */}
              <div className={`absolute top-0 bottom-0 w-12 pointer-events-none opacity-10 left-0 bg-gradient-to-r from-black to-transparent z-0`}></div>
            </div>
        </div>
      );
  }

  // -- METADATA --
  return (
    <div ref={ref} className={`${PAGE_CLASS} relative shadow-inner border-r border-gray-100 page-content ${pageShadow}`}> 
      <div className="h-full p-12 flex flex-col justify-start items-start">
          <div className="w-full border-b border-gray-300 pb-4 mb-6 mt-2">
            <h2 className="text-2xl font-serif font-bold text-gray-900 m-0 p-0">
              {formatDate(poem.created_at)}
            </h2>
            <div className="text-sm italic text-gray-600 mt-2 font-serif">
              Penned by {poem.author_name || "Anonymous"}
            </div>
          </div>
        <div className="w-full flex-1 text-left">
             <div className="flex flex-col gap-4 opacity-10 mt-10">
                <div className="w-8 h-8 rounded-full border border-black"></div>
                <div className="h-px w-24 bg-black"></div>
             </div>
        </div>
        <div className="w-full mt-auto pt-6 flex justify-between items-end text-gray-400 border-t border-transparent">
           <span className="text-[10px] font-mono uppercase tracking-widest">
             ID {String(poem.id).slice(0,4)}
           </span>
           <span className="text-xs font-serif">{pageNumber}</span>
        </div>
      </div>
      <div className={`absolute top-0 bottom-0 w-12 pointer-events-none opacity-10 right-0 bg-gradient-to-l from-black to-transparent`}></div>
    </div>
  );
});
Page.displayName = 'Page';


// --- 4. MAIN BOARD ---
export default function Board() {
  const [poems, setPoems] = useState<any[]>([]);
  const [dailyWords, setDailyWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [availableDates, setAvailableDates] = useState<string[]>([]); 
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const bookRef = useRef<any>(null);

  useEffect(() => {
    document.body.style.backgroundColor = '#1c1917';
    
    const init = async () => {
        const { data: allPoems } = await supabase.from('poems').select('created_at').order('created_at', { ascending: false });
        if (allPoems) {
            const uniqueDates = Array.from(new Set(allPoems.map(p => new Date(p.created_at).toLocaleDateString('en-CA'))));
            const today = new Date().toLocaleDateString('en-CA');
            if (!uniqueDates.includes(today)) uniqueDates.unshift(today);
            uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            setAvailableDates(uniqueDates);
            if (!uniqueDates.includes(selectedDate)) setSelectedDate(uniqueDates[0]);
        }
    };
    init();
    const handleGlobalClick = () => setIsCalendarOpen(false);
    window.addEventListener('click', handleGlobalClick);
    return () => { 
        document.body.style.backgroundColor = ''; 
        window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0); 
      const end = new Date(year, month - 1, day, 23, 59, 59);
      const { data: poemsData } = await supabase.from('poems').select('*').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at', { ascending: false });
      setPoems(poemsData || []);
      const { data: wordsData } = await supabase.from('daily_challenges').select('words').eq('release_date', selectedDate).single();
      if (wordsData && wordsData.words && wordsData.words.length > 0) setDailyWords(wordsData.words);
      else setDailyWords(["Soul", "Echo", "Night", "Dance", "Light"]);
      setLoading(false);
    };
    if (selectedDate) fetchData();
  }, [selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
      const currentIndex = availableDates.indexOf(selectedDate);
      if (currentIndex === -1) { setSelectedDate(availableDates[0]); return; }
      let newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < availableDates.length) setSelectedDate(availableDates[newIndex]);
  };

  const currentIndex = availableDates.indexOf(selectedDate);
  const hasOlder = currentIndex !== -1 && currentIndex < availableDates.length - 1;
  const hasNewer = currentIndex !== -1 && currentIndex > 0;
  const displayDate = new Date(selectedDate + 'T12:00:00');
  const earliestDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : new Date().toLocaleDateString('en-CA');

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#1c1917] font-sans relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[#2c241b]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")` }}></div>
         <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80"></div>
      </div>

      <header className="relative z-20 w-full px-8 py-6 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/5 shadow-md">
        <div className="flex-1 flex items-center gap-6">
            <div className="flex items-center gap-4 relative">
                <button onClick={(e) => { e.stopPropagation(); navigateDate('prev'); }} disabled={!hasOlder} className={`flex items-center justify-center w-12 h-12 rounded-full border border-[#eaddcf]/30 transition-all duration-300 bg-transparent outline-none ${!hasOlder ? 'text-white/10 cursor-not-allowed border-transparent' : 'text-[#eaddcf] hover:bg-[#eaddcf] hover:text-[#1c1917] hover:scale-105 hover:border-transparent'}`} title="Previous Date"><span className="text-3xl pb-1.5">‹</span></button>
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setIsCalendarOpen(!isCalendarOpen); }} className="group flex flex-col items-center justify-center outline-none bg-transparent border-none p-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-[#eaddcf] font-serif italic text-3xl tracking-wide whitespace-nowrap group-hover:text-white transition-colors">{displayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h1>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#eaddcf]/40 group-hover:text-[#eaddcf] mt-1"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#eaddcf]/30 mt-1 group-hover:text-[#eaddcf]/80 transition-colors">Click to Browse The Archive</p>
                    </button>
                    {isCalendarOpen && (<CalendarDropdown currentDate={selectedDate} activeDates={availableDates} earliestDate={earliestDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />)}
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigateDate('next'); }} disabled={!hasNewer} className={`flex items-center justify-center w-12 h-12 rounded-full border border-[#eaddcf]/30 transition-all duration-300 bg-transparent outline-none ${!hasNewer ? 'text-white/10 cursor-not-allowed border-transparent' : 'text-[#eaddcf] hover:bg-[#eaddcf] hover:text-[#1c1917] hover:scale-105 hover:border-transparent'}`} title="Next Date"><span className="text-3xl pb-1.5">›</span></button>
            </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
             {dailyWords.length > 0 && (<><span className="text-[10px] text-[#eaddcf]/60 uppercase tracking-widest font-serif italic">Muse for this day:</span><div className="flex gap-2">{dailyWords.map(w => (<span key={w} className="text-[10px] text-[#eaddcf] border border-[#eaddcf]/30 px-3 py-1 rounded-full uppercase tracking-wider opacity-90 bg-black/30">{w}</span>))}</div></>)}
        </div>
        <div className="flex-1 flex justify-end items-center gap-8">
            <Link href="/" className="bg-[#f9f7f1] text-[#2c241b] px-8 py-3 rounded-sm shadow-lg border border-[#d7ccc8] font-serif font-bold text-xs tracking-widest hover:bg-white hover:scale-105 transition-all">+ WRITE POEM</Link>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center p-8 overflow-hidden">
        {loading ? (
             <div className="text-[#d7ccc8] font-serif text-2xl animate-pulse">Retrieving {displayDate.toLocaleDateString()}...</div>
        ) : (
          /* @ts-ignore */
          <HTMLFlipBook width={500} height={700} size="fixed" minWidth={300} maxWidth={1000} minHeight={400} maxHeight={1200} maxShadowOpacity={0.5} showCover={true} mobileScrollSupport={true} className="" ref={bookRef} flippingTime={1000} clickEventForward={true} useMouseEvents={true} showPageCorners={true}>
            <Page key="cover" type="cover" date={selectedDate} words={dailyWords} />
            <Page key="inner-left" type="back" /> 
            <Page key="title" type="title" />
            
            {poems.length > 0 ? (
                poems.flatMap((poem, index) => [
                    <Page key={`meta-${poem.id}`} poem={poem} type="metadata" pageNumber={(index * 2) + 1} />,
                    <Page key={`content-${poem.id}`} poem={poem} type="poem" pageNumber={(index * 2) + 2} />
                ])
            ) : ([
                   <Page key="empty-meta" type="title" poem={{}} pageNumber="" />, 
                   <div key="empty-content" className="bg-[#f9f7f1] h-full w-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden border-r border-gray-100 flex items-center justify-center p-10 text-center">
                       <p className="text-gray-400 font-serif italic">No verses recorded.</p>
                       <div className="absolute top-0 bottom-0 left-0 w-8 pointer-events-none opacity-5 bg-gradient-to-r from-black to-transparent"></div>
                   </div>
            ])}
            <Page key="back-inner" type="back" />
            <Page key="back-cover" type="cover" />
          </HTMLFlipBook>
        )}
      </main>
      <style jsx global>{` .page-content { background-color: #f9f7f1 !important; } .cover-page { background-color: #2b1b17 !important; } .react-pageflip { background-color: transparent !important; } .bg-radial-gradient { background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%); } ::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}