'use client';

interface StreakCalendarProps {
  studyDays: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
}

export default function StreakCalendar({ studyDays, currentStreak, longestStreak }: StreakCalendarProps) {
  const weeks: string[][] = [];
  const today = new Date();
  for (let w = 11; w >= 0; w--) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      week.push(date.toISOString().split('T')[0]);
    }
    weeks.push(week);
  }

  const getIntensity = (date: string): string => {
    const count = studyDays[date] || 0;
    if (count === 0) return 'bg-[#334155]';
    if (count < 5) return 'bg-[#6C3AED]/30';
    if (count < 15) return 'bg-[#6C3AED]/60';
    return 'bg-[#6C3AED]';
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Study streak</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#94A3B8]">
            Current: <span className="text-[#10B981] font-bold">{currentStreak} days</span>
          </span>
          <span className="text-[#94A3B8]">
            Best: <span className="text-[#6C3AED] font-bold">{longestStreak} days</span>
          </span>
        </div>
      </div>

      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date) => (
              <div
                key={date}
                className={`w-3 h-3 rounded-sm ${getIntensity(date)} transition-colors`}
                title={`${date}: ${studyDays[date] || 0} cards`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-[#94A3B8]">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-[#334155]" />
        <div className="w-3 h-3 rounded-sm bg-[#6C3AED]/30" />
        <div className="w-3 h-3 rounded-sm bg-[#6C3AED]/60" />
        <div className="w-3 h-3 rounded-sm bg-[#6C3AED]" />
        <span>More</span>
      </div>
    </div>
  );
}
