import Link from 'next/link';

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
    <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8]">
      {/* Nav */}
      <nav className="border-b-2 border-[#2A3352]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
            <span className="text-[#7B5CFF]">study</span>
            <span className="text-[#E8F0E8]">pod</span>
            <span className="text-[#00E896]">.ai</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-[#6B7A99] hover:text-[#E8F0E8] transition-pixel">
              Dashboard
            </Link>
            <Link href="/guide/mobile-listening" className="text-xs text-[#6B7A99] hover:text-[#E8F0E8] transition-pixel">
              Mobile
            </Link>
            <Link
              href="/auth/register"
              className="pixel-border-sm bg-[#7B5CFF] text-[#E8F0E8] text-xs font-bold px-4 py-2 hover:bg-[#9B7FFF] transition-pixel"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — CRT style */}
      <section className="scanlines relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center relative z-10">
          {/* XP bar decoration */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-[#FFD93D] font-[family-name:var(--font-press-start)] text-[10px]">NEW QUEST AVAILABLE</span>
          </div>

          <h1 className="font-[family-name:var(--font-press-start)] text-2xl md:text-3xl leading-relaxed mb-6 pixel-shadow">
            STUDY SMARTER<br />
            <span className="text-[#7B5CFF]">WITH AI AUDIO</span><br />
            <span className="text-[#00E896]">FLASHCARDS</span>
          </h1>

          <p className="text-[#6B7A99] max-w-lg mx-auto mb-10 text-sm leading-relaxed">
            Enter any topic. Our AI researches, creates flashcards,
            generates podcast-style audio, and exports to Anki.
          </p>

          {/* Search — pixel styled */}
          <div className="max-w-xl mx-auto mb-4">
            <form action="/deck/new" className="relative">
              <div className="pixel-border bg-[#151A2B] p-1">
                <input
                  type="text"
                  name="topic"
                  placeholder="Enter your study topic..."
                  className="w-full bg-transparent px-5 py-4 text-[#E8F0E8] placeholder:text-[#6B7A99] focus:outline-none text-lg"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 pixel-border-sm bg-[#00E896] text-[#0B0E17] font-bold px-5 py-2.5 text-sm hover:bg-[#33FFAA] transition-pixel"
              >
                GENERATE
              </button>
            </form>
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99] mt-3">
              FREE &bull; NO ACCOUNT REQUIRED &bull; PRESS ENTER TO START
            </p>
          </div>
        </div>
      </section>

      {/* Quest Board */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-[family-name:var(--font-press-start)] text-sm text-[#FFD93D] mb-8 pixel-shadow">
          &#9654; POPULAR QUESTS
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          {QUESTS.map((quest) => (
            <Link
              key={quest.topic}
              href={`/deck/new?topic=${encodeURIComponent(quest.topic)}`}
              className="pixel-border bg-[#151A2B] p-4 hover:bg-[#1E2540] transition-pixel group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-press-start)] text-[10px] text-[#FFD93D] bg-[#FFD93D]/10 px-2 py-1">
                    LV.{quest.level}
                  </span>
                  <span className="text-sm font-medium group-hover:text-[#7B5CFF]">{quest.topic}</span>
                </div>
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#00E896]">
                  +{quest.xp}XP
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features — game menu style, NOT 3-column grid */}
      <section className="border-t-2 border-b-2 border-[#2A3352] py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-press-start)] text-sm text-[#7B5CFF] mb-8 pixel-shadow">
            &#9654; ABILITIES UNLOCKED
          </h2>

          <div className="space-y-3">
            {[
              { key: 'A', label: 'AI Research', desc: 'Deep-dive any topic with Gemini AI', color: '#7B5CFF' },
              { key: 'B', label: 'Audio Generation', desc: 'Two-host podcast-style MP3s via hybrid TTS', color: '#00E896' },
              { key: 'X', label: 'Anki Export', desc: 'Download .apkg decks for spaced repetition', color: '#FFD93D' },
              { key: 'Y', label: 'Podcast Feed', desc: 'Subscribe in Apple Podcasts or Pocket Casts', color: '#FF6B8A' },
            ].map((ability) => (
              <div key={ability.key} className="pixel-border bg-[#151A2B] p-4 flex items-center gap-4">
                <span
                  className="font-[family-name:var(--font-press-start)] text-xs w-8 h-8 flex items-center justify-center pixel-border-sm"
                  style={{ backgroundColor: ability.color, color: '#0B0E17' }}
                >
                  {ability.key}
                </span>
                <div>
                  <p className="font-semibold text-sm">{ability.label}</p>
                  <p className="text-xs text-[#6B7A99]">{ability.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#2A3352] py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs text-[#6B7A99]">
          <span className="font-[family-name:var(--font-press-start)] text-[8px]">STUDYPOD.AI</span>
          <div className="flex items-center gap-4">
            <Link href="/guide/mobile-listening" className="hover:text-[#E8F0E8] transition-pixel">Listen on mobile</Link>
            <span>Built with AI</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
