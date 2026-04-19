import Link from 'next/link';

export default function MobileListeningGuide() {
  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)]">
      <nav className="border-b border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[var(--c-primary)]">study</span>pod<span className="text-[var(--c-accent)]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[var(--c-muted)] hover:text-white transition-pixel">Home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-press-start)] text-xl mb-2">LISTEN ON YOUR PHONE</h1>
        <p className="text-[var(--c-muted)] mb-10">Three easy ways to listen to your audio flashcards on mobile.</p>

        {/* Option 1: Podcast App */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--c-primary)] pixel-border-sm flex items-center justify-center text-white font-bold">1</div>
            <div>
              <h2 className="text-xl font-bold">Subscribe as a podcast</h2>
              <span className="text-xs bg-[var(--c-accent)]/20 text-[var(--c-accent)] px-2 py-0.5 pixel-border-sm font-medium">Recommended</span>
            </div>
          </div>
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] pixel-border p-6 space-y-4">
            <p className="text-[var(--c-muted)]">
              Get your flashcards delivered automatically to your podcast app. New decks appear as episodes — just press play while commuting or working out.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[var(--c-primary)]/20 text-[var(--c-primary)] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</span>
                <div><p className="font-medium">Create a free account</p><p className="text-sm text-[var(--c-muted)]">Sign up at studypod.ai — takes 10 seconds.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[var(--c-primary)]/20 text-[var(--c-primary)] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</span>
                <div><p className="font-medium">Copy your personal feed URL</p><p className="text-sm text-[var(--c-muted)]">Find it on your dashboard under &quot;Your podcast feed&quot;.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[var(--c-primary)]/20 text-[var(--c-primary)] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</span>
                <div><p className="font-medium">Add to your podcast app</p><p className="text-sm text-[var(--c-muted)]">Open Apple Podcasts, Pocket Casts, or Overcast and look for &quot;Add by URL&quot;.</p></div>
              </div>
            </div>
            <div className="bg-[var(--c-bg)] pixel-border-sm p-4 mt-4">
              <p className="text-xs text-[var(--c-muted)]"><strong className="text-[#F59E0B]">Note:</strong> Spotify does not support custom RSS feeds. We recommend Apple Podcasts (iPhone) or Pocket Casts (Android).</p>
            </div>
          </div>
        </section>

        {/* Option 2: Download */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--c-border)] pixel-border-sm flex items-center justify-center text-white font-bold">2</div>
            <h2 className="text-xl font-bold">Download MP3 files</h2>
          </div>
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] pixel-border p-6 space-y-4">
            <p className="text-[var(--c-muted)]">Download individual cards or the entire deck as a ZIP file. No account needed.</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[var(--c-border)] text-[var(--c-muted)] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</span>
                <div><p className="font-medium">Click the download button</p><p className="text-sm text-[var(--c-muted)]">Each card has a download icon. Or use &quot;Download all MP3s&quot; for the whole deck.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[var(--c-border)] text-[var(--c-muted)] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</span>
                <div><p className="font-medium">Transfer to your phone</p><p className="text-sm text-[var(--c-muted)]">Use AirDrop (iPhone), email the files to yourself, or save to iCloud/Google Drive.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[var(--c-border)] text-[var(--c-muted)] rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</span>
                <div><p className="font-medium">Play in Files or Music app</p><p className="text-sm text-[var(--c-muted)]">Open the MP3 from your Files app (iOS) or file manager (Android).</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* Option 3: Browser */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--c-border)] pixel-border-sm flex items-center justify-center text-white font-bold">3</div>
            <h2 className="text-xl font-bold">Listen in your browser</h2>
          </div>
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] pixel-border p-6">
            <p className="text-[var(--c-muted)] mb-3">studypod.ai works on mobile browsers. Just open the site on your phone and press play — no app needed.</p>
            <p className="text-sm text-[var(--c-muted)]"><strong className="text-white">Tip:</strong> On iPhone, tap the share button and &quot;Add to Home Screen&quot; for quick access.</p>
          </div>
        </section>

        <div className="text-center py-8 border-t border-[var(--c-border)]">
          <Link href="/" className="bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel">Start creating flashcards</Link>
        </div>
      </div>
    </main>
  );
}
