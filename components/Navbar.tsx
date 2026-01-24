import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-serif font-bold text-xl text-stone-800">
          Poetry Snaps 🫰
        </Link>
        <div className="space-x-6 text-sm font-medium text-stone-600">
          <Link href="/" className="hover:text-stone-900 transition-colors">Write</Link>
          <Link href="/board" className="hover:text-stone-900 transition-colors">The Board</Link>
        </div>
      </div>
    </nav>
  );
}