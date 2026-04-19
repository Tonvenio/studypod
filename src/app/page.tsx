import Link from 'next/link';
import Nav from '@/components/Nav';

const QUESTS = [
  { topic: 'Photosynthesis', level: 3, xp: 150 },
  { topic: 'World War II', level: 5, xp: 280 },
  { topic: 'Python Programming', level: 4, xp: 220 },
  { topic: 'Organic Chemistry', level: 6, xp: 340 },
  { topic: 'Macroeconomics', level: 2, xp: 90 },
  { topic: 'Constitutional Law', level: 4, xp: 210 },
  { topic: 'Machine Learning', level: 7, xp: 420 },
  { topic: 'Cell Biology', level: 3, xp: 170 },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav showDashboard showMobile showSignUp />

      {/* Hero — CRT style */}
      <section className="scanlines relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center relative z-10">
          {/* XP bar decoration */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-[var(--c-xp)] font-[family-name:var(--font-press-start)] text-[10px]">NEW QUEST AVAILABLE</span>
          </div>

          <h1 className="font-[family-name:var(--font-press-start)] text-2xl md:text-3xl leading-relaxed mb-6 pixel-shadow">
            STUDY SMARTER<br />
            <span className="text-[var(--c-primary)]">WITH AI AUDIO</span><br />
            <span className="text-[var(--c-accent)]">FLASHCARDS</span>
          </h1>

          <p className="text-[var(--c-muted)] max-w-lg mx-auto mb-10 text-sm leading-relaxed">
            Enter any topic. Our AI researches, creates flashcards,
            generates podcast-style audio, and exports to Anki.
          </p>

          {/* Search — pixel styled */}
          <div className="max-w-xl mx-auto mb-4">
            <form action="/deck/new" className="relative">
              <div className="pixel-border bg-[var(--c-surface)] p-1">
                <input
                  type="text"
                  name="topic"
                  placeholder="Enter your study topic..."
                  className="w-full bg-transparent px-5 py-4 text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none text-lg"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 pixel-border-sm bg-[var(--c-accent)] text-[var(--c-bg)] font-bold px-5 py-2.5 text-sm hover:bg-[var(--c-accent-hover)] transition-pixel"
              >
                GENERATE
              </button>
            </form>
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mt-3">
              FREE &bull; NO ACCOUNT REQUIRED &bull; PRESS ENTER TO START
            </p>
          </div>
        </div>
      </section>

      {/* Quest Board */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)] mb-8 pixel-shadow">
          &#9654; POPULAR QUESTS
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          {QUESTS.map((quest) => (
            <Link
              key={quest.topic}
              href={`/deck/new?topic=${encodeURIComponent(quest.topic)}`}
              className="pixel-border bg-[var(--c-surface)] p-4 hover:bg-[var(--c-surface-hover)] transition-pixel group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-press-start)] text-[10px] text-[var(--c-xp)] bg-[var(--c-xp)]/10 px-2 py-1">
                    LV.{quest.level}
                  </span>
                  <span className="text-sm font-medium group-hover:text-[var(--c-primary)]">{quest.topic}</span>
                </div>
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-accent)]">
                  +{quest.xp}XP
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features — game menu style, NOT 3-column grid */}
      <section className="border-t-2 border-b-2 border-[var(--c-border)] py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-primary)] mb-8 pixel-shadow">
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
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs text-[var(--c-muted)]">
          <span className="font-[family-name:var(--font-press-start)] text-[8px]">STUDYPOD.AI</span>
          <div className="flex items-center gap-4">
            <Link href="/guide/mobile-listening" className="hover:text-[var(--c-fg)] transition-pixel">Listen on mobile</Link>
            <span>Built with AI</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
