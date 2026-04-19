import Link from 'next/link';

export default function MobileListeningGuide() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      <nav className="border-b border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#6C3AED]">study</span>pod<span className="text-[#10B981]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[#94A3B8] hover:text-white transition-colors">Home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Listen on your phone</h1>
        <p className="text-[#94A3B8] mb-10">Three easy ways to listen to your audio flashcards on mobile.</p>

        {/* Option 1: Podcast App */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#6C3AED] rounded-xl flex items-center justify-center text-white font-bold">1</div>
            <div>
              <h2 className="text-xl font-bold">Subscribe as a podcast</h2>
              <span className="text-xs bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full font-medium">Recommended</span>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 space-y-4">
            <p className="text-[#94A3B8]">
              Get your flashcards delivered automatically to your podcast app. New decks appear as episodes — just press play while commuting or working out.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#6C3AED]/20 text-[#6C3AED] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</span>
                <div><p className="font-medium">Create a free account</p><p className="text-sm text-[#94A3B8]">Sign up at studypod.ai — takes 10 seconds.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#6C3AED]/20 text-[#6C3AED] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</span>
                <div><p className="font-medium">Copy your personal feed URL</p><p className="text-sm text-[#94A3B8]">Find it on your dashboard under &quot;Your podcast feed&quot;.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#6C3AED]/20 text-[#6C3AED] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</span>
                <div><p className="font-medium">Add to your podcast app</p><p className="text-sm text-[#94A3B8]">Open Apple Podcasts, Pocket Casts, or Overcast and look for &quot;Add by URL&quot;.</p></div>
              </div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-4 mt-4">
              <p className="text-xs text-[#94A3B8]"><strong className="text-[#F59E0B]">Note:</strong> Spotify does not support custom RSS feeds. We recommend Apple Podcasts (iPhone) or Pocket Casts (Android).</p>
            </div>
          </div>
        </section>

        {/* Option 2: Download */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#334155] rounded-xl flex items-center justify-center text-white font-bold">2</div>
            <h2 className="text-xl font-bold">Download MP3 files</h2>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 space-y-4">
            <p className="text-[#94A3B8]">Download individual cards or the entire deck as a ZIP file. No account needed.</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#334155] text-[#94A3B8] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</span>
                <div><p className="font-medium">Click the download button</p><p className="text-sm text-[#94A3B8]">Each card has a download icon. Or use &quot;Download all MP3s&quot; for the whole deck.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#334155] text-[#94A3B8] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</span>
                <div><p className="font-medium">Transfer to your phone</p><p className="text-sm text-[#94A3B8]">Use AirDrop (iPhone), email the files to yourself, or save to iCloud/Google Drive.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#334155] text-[#94A3B8] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</span>
                <div><p className="font-medium">Play in Files or Music app</p><p className="text-sm text-[#94A3B8]">Open the MP3 from your Files app (iOS) or file manager (Android).</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* Option 3: Browser */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#334155] rounded-xl flex items-center justify-center text-white font-bold">3</div>
            <h2 className="text-xl font-bold">Listen in your browser</h2>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6">
            <p className="text-[#94A3B8] mb-3">studypod.ai works on mobile browsers. Just open the site on your phone and press play — no app needed.</p>
            <p className="text-sm text-[#94A3B8]"><strong className="text-white">Tip:</strong> On iPhone, tap the share button and &quot;Add to Home Screen&quot; for quick access.</p>
          </div>
        </section>

        <div className="text-center py-8 border-t border-[#334155]">
          <Link href="/" className="bg-[#6C3AED] hover:bg-[#5B21B6] text-white rounded-xl px-6 py-3 font-semibold transition-colors">Start creating flashcards</Link>
        </div>
      </div>
    </main>
  );
}
