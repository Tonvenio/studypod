import Link from 'next/link';
import Nav from '@/components/Nav';
import PixelStudyAnimation from '@/components/PixelStudyAnimation';
import HeroUploadLink from '@/components/HeroUploadLink';

const QUESTS = [
  { topic: 'Photosynthesis', level: 3 },
  { topic: 'World War II', level: 5 },
  { topic: 'Python Programming', level: 4 },
  { topic: 'Organic Chemistry', level: 6 },
  { topic: 'Macroeconomics', level: 2 },
  { topic: 'Constitutional Law', level: 4 },
  { topic: 'Machine Learning', level: 7 },
  { topic: 'Cell Biology', level: 3 },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav rightContent={<>
        <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">
          Dashboard
        </Link>
        <Link href="/guide/mobile-listening" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2 hidden sm:block">
          Mobile
        </Link>
      </>} />

      {/* Hero — CRT style */}
      <section className="scanlines relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pt-10 sm:pt-16 pb-12 sm:pb-20 text-center relative z-10">
          {/* XP bar decoration */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-8">
            <span className="text-[var(--c-xp)] font-[family-name:var(--font-press-start)] text-[8px] sm:text-[10px]">NEW QUEST AVAILABLE</span>
          </div>

          <h1 className="font-[family-name:var(--font-press-start)] text-lg sm:text-2xl md:text-3xl leading-relaxed mb-4 sm:mb-6 pixel-shadow">
            STUDY SMARTER<br />
            <span className="text-[var(--c-primary)]">WITH AI AUDIO</span><br />
            <span className="text-[var(--c-accent)]">FLASHCARDS</span>
          </h1>

          <p className="text-[var(--c-muted)] max-w-lg mx-auto mb-6 sm:mb-10 text-xs sm:text-sm leading-relaxed px-2">
            Enter any topic. Our AI researches, creates flashcards,
            generates podcast-style audio, and exports to Anki.
          </p>

          {/* Animation — inside hero, smaller on mobile */}
          <div className="mb-6 sm:mb-10 [&>div]:w-32 [&>div]:h-32 sm:[&>div]:w-48 sm:[&>div]:h-48">
            <PixelStudyAnimation />
          </div>

          {/* Search — pixel styled */}
          <div className="max-w-xl mx-auto mb-4 px-1">
            <form action="/deck/new">
              <div className="pixel-border bg-[var(--c-surface)] p-1 relative">
                <input
                  type="text"
                  name="topic"
                  placeholder="Enter your study topic..."
                  className="w-full bg-transparent px-4 sm:px-5 py-3.5 sm:py-4 sm:pr-32 text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none text-base sm:text-lg"
                />
                <button
                  type="submit"
                  className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 pixel-border-sm bg-[var(--c-accent)] text-[var(--c-bg)] font-bold px-5 py-2.5 text-sm hover:bg-[var(--c-accent-hover)] transition-pixel"
                >
                  GENERATE
                </button>
              </div>
              <button
                type="submit"
                className="sm:hidden w-full mt-2 pixel-border-sm bg-[var(--c-accent)] text-[var(--c-bg)] font-bold px-5 py-3 text-sm hover:bg-[var(--c-accent-hover)] transition-pixel"
              >
                GENERATE
              </button>
            </form>

            {/* Upload document link */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-3">
              <p className="font-[family-name:var(--font-press-start)] text-[7px] sm:text-[8px] text-[var(--c-muted)]">
                FREE &bull; NO ACCOUNT REQUIRED
              </p>
              <HeroUploadLink />
            </div>
          </div>
        </div>
      </section>

      {/* Quest Board */}
      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <h2 className="font-[family-name:var(--font-press-start)] text-xs sm:text-sm text-[var(--c-xp)] mb-4 sm:mb-8 pixel-shadow">
          &#9654; POPULAR QUESTS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {QUESTS.map((quest) => (
            <Link
              key={quest.topic}
              href={`/deck/new?topic=${encodeURIComponent(quest.topic)}`}
              className="pixel-border bg-[var(--c-surface)] p-3 sm:p-4 hover:bg-[var(--c-surface-hover)] transition-pixel group active:bg-[var(--c-surface-hover)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-[family-name:var(--font-press-start)] text-[8px] sm:text-[10px] text-[var(--c-xp)] bg-[var(--c-xp)]/10 px-2 py-1">
                    LV.{quest.level}
                  </span>
                  <span className="text-sm font-medium group-hover:text-[var(--c-primary)]">{quest.topic}</span>
                </div>
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-accent)]">
                  &#9654;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features — game menu style, NOT 3-column grid */}
      <section className="border-t-2 border-b-2 border-[var(--c-border)] py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-press-start)] text-xs sm:text-sm text-[var(--c-primary)] mb-4 sm:mb-8 pixel-shadow">
            &#9654; ABILITIES UNLOCKED
          </h2>

          <div className="space-y-3">
            {[
              { key: 'A', label: 'AI Research', desc: 'Deep-dive any topic with Gemini AI', color: '#7B5CFF' },
              { key: 'B', label: 'Audio Generation', desc: 'Two-host podcast-style MP3s via hybrid TTS', color: '#00E896' },
              { key: 'X', label: 'Anki Export', desc: 'Download .apkg decks for spaced repetition', color: '#FFD93D' },
              { key: 'Y', label: 'Podcast Feed', desc: 'Subscribe in Apple Podcasts or Pocket Casts', color: '#FF6B8A' },
            ].map((ability) => (
              <div key={ability.key} className="pixel-border bg-[var(--c-surface)] p-4 flex items-center gap-4">
                <span
                  className="font-[family-name:var(--font-press-start)] text-xs w-8 h-8 flex items-center justify-center pixel-border-sm"
                  style={{ backgroundColor: ability.color, color: '#0B0E17' }}
                >
                  {ability.key}
                </span>
                <div>
                  <p className="font-semibold text-sm">{ability.label}</p>
                  <p className="text-xs text-[var(--c-muted)]">{ability.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[var(--c-border)] py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--c-muted)]">
          <span className="font-[family-name:var(--font-press-start)] text-[8px]">STUDYPOD.AI</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/pricing" className="hover:text-[var(--c-fg)] transition-pixel py-2">Pricing</Link>
            <Link href="/guide/mobile-listening" className="hover:text-[var(--c-fg)] transition-pixel py-2">Mobile</Link>
            <Link href="/legal/impressum" className="hover:text-[var(--c-fg)] transition-pixel py-2">Impressum</Link>
            <Link href="/legal/datenschutz" className="hover:text-[var(--c-fg)] transition-pixel py-2">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
