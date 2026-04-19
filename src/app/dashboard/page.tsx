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
    <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      <nav className="border-b border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#6C3AED]">study</span>pod<span className="text-[#10B981]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
            New deck
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-[#6C3AED]">Level {level}</div>
            <div className="mt-2">
              <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
                <div className="h-full bg-[#6C3AED] rounded-full" style={{ width: `${xpInLevel}%` }} />
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">{xpInLevel}/100 XP</p>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-[#10B981]">{profile.currentStreak}</div>
            <p className="text-sm text-[#94A3B8] mt-1">Day streak</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-[#F8FAFC]">{profile.xpPoints}</div>
            <p className="text-sm text-[#94A3B8] mt-1">Total XP</p>
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
        <h2 className="text-xl font-semibold mb-4">Recent decks</h2>
        <div className="grid gap-3">
          {MOCK_RECENT_DECKS.map((deck) => (
            <Link
              key={deck.id}
              href={`/deck/${deck.id}`}
              className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 hover:border-[#6C3AED]/30 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{deck.topic}</p>
                <p className="text-sm text-[#94A3B8]">{deck.cardCount} cards · {deck.lastStudied}</p>
              </div>
              <span className="bg-[#6C3AED] hover:bg-[#5B21B6] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
                Resume
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
