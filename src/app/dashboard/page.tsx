import Link from 'next/link';
import StreakCalendar from '@/components/StreakCalendar';

// Mock data — will be replaced with Supabase queries
const MOCK_PROFILE = {
  xpPoints: 340,
  currentStreak: 5,
  longestStreak: 12,
  studyDays: {
    '2026-04-14': 8,
    '2026-04-15': 12,
    '2026-04-16': 5,
    '2026-04-17': 20,
    '2026-04-18': 15,
    '2026-04-19': 3,
  } as Record<string, number>,
};

const MOCK_RECENT_DECKS = [
  { id: 'demo-deck', topic: 'Photosynthesis', cardCount: 15, lastStudied: '2 hours ago' },
  { id: 'deck-2', topic: 'World War II', cardCount: 22, lastStudied: 'Yesterday' },
];

export default function DashboardPage() {
  const profile = MOCK_PROFILE;
  const level = Math.floor(profile.xpPoints / 100) + 1;
  const xpInLevel = profile.xpPoints % 100;

  return (
    <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8]">
      <nav className="border-b-2 border-[#2A3352]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
            <span className="text-[#7B5CFF]">study</span><span className="text-[#E8F0E8]">pod</span><span className="text-[#00E896]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[#6B7A99] hover:text-white transition-pixel">
            New Quest
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-press-start)] text-2xl mb-8">Quest Log</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="pixel-border bg-[#151A2B] border-2 border-[#2A3352] p-5 text-center">
            <div className="font-[family-name:var(--font-press-start)] text-xs text-[#6B7A99] mb-2">LEVEL</div>
            <div className="font-[family-name:var(--font-press-start)] text-3xl text-[#7B5CFF] mb-2">{level}</div>
            <div className="mt-2">
              <div className="h-3 bg-[#2A3352] pixel-border-sm overflow-hidden">
                <div className="h-full bg-[#7B5CFF]" style={{ width: `${xpInLevel}%` }} />
              </div>
              <p className="text-xs text-[#6B7A99] mt-1">{xpInLevel}/100 XP</p>
            </div>
          </div>
          <div className="pixel-border bg-[#151A2B] border-2 border-[#2A3352] p-5 text-center">
            <div className="font-[family-name:var(--font-press-start)] text-xs text-[#6B7A99] mb-2">STREAK</div>
            <div className="font-[family-name:var(--font-press-start)] text-3xl text-[#00E896]">{profile.currentStreak}</div>
            <p className="text-sm text-[#6B7A99] mt-1">day combo</p>
          </div>
          <div className="pixel-border bg-[#151A2B] border-2 border-[#2A3352] p-5 text-center">
            <div className="font-[family-name:var(--font-press-start)] text-xs text-[#6B7A99] mb-2">TOTAL XP</div>
            <div className="font-[family-name:var(--font-press-start)] text-3xl text-[#FFD93D]">{profile.xpPoints}</div>
            <p className="text-sm text-[#6B7A99] mt-1">earned</p>
          </div>
        </div>

        {/* Streak Calendar */}
        <div className="mb-8">
          <StreakCalendar
            studyDays={profile.studyDays}
            currentStreak={profile.currentStreak}
            longestStreak={profile.longestStreak}
          />
        </div>

        {/* Recent Decks */}
        <h2 className="font-[family-name:var(--font-press-start)] text-sm mb-4">Active Quests</h2>
        <div className="grid gap-3">
          {MOCK_RECENT_DECKS.map((deck) => (
            <Link
              key={deck.id}
              href={`/deck/${deck.id}`}
              className="pixel-border bg-[#151A2B] border-2 border-[#2A3352] p-5 hover:border-[#7B5CFF]/30 transition-pixel flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{deck.topic}</p>
                <p className="text-sm text-[#6B7A99]">{deck.cardCount} cards · {deck.lastStudied}</p>
              </div>
              <span className="pixel-border-sm bg-[#7B5CFF] hover:bg-[#9B7FFF] text-white px-4 py-2 text-sm font-semibold transition-pixel">
                Resume
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
