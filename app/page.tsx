import Editor from '@/components/Editor';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-serif font-bold mb-2">Poetry Snaps 🫰</h1>
        <p className="text-stone-500 italic">Write a poem using today's words.</p>
      </div>
      
      <Editor />
    </main>
  );
}