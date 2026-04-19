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
    if (count === 0) return 'bg-[var(--c-border)]';
    if (count < 5) return 'bg-[var(--c-primary)]/30';
    if (count < 15) return 'bg-[var(--c-primary)]/60';
    return 'bg-[var(--c-primary)]';
  };

  return (
    <div className="pixel-border bg-[var(--c-surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[family-name:var(--font-press-start)] text-[10px] text-[var(--c-xp)]">STUDY STREAK</h3>
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)]">
            NOW: <span className="text-[var(--c-accent)]">{currentStreak}D</span>
          </span>
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)]">
            BEST: <span className="text-[var(--c-primary)]">{longestStreak}D</span>
          </span>
        </div>
      </div>

      <div className="flex gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((date) => (
              <div
                key={date}
                className={`w-3 h-3 ${getIntensity(date)}`}
                title={`${date}: ${studyDays[date] || 0} cards`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-[2px] mt-3">
        <span className="font-[family-name:var(--font-press-start)] text-[6px] text-[var(--c-muted)] mr-1">LESS</span>
        <div className="w-3 h-3 bg-[var(--c-border)]" />
        <div className="w-3 h-3 bg-[var(--c-primary)]/30" />
        <div className="w-3 h-3 bg-[var(--c-primary)]/60" />
        <div className="w-3 h-3 bg-[var(--c-primary)]" />
        <span className="font-[family-name:var(--font-press-start)] text-[6px] text-[var(--c-muted)] ml-1">MORE</span>
      </div>
    </div>
  );
}
