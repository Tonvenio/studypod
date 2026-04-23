// SM-2 Spaced Repetition Algorithm
// https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = Again (complete blackout)
// 1 = Again (wrong, remembered after seeing answer)
// 2 = Again (wrong, but felt familiar)
// 3 = Hard (correct, with serious difficulty)
// 4 = Good (correct, with some hesitation)
// 5 = Easy (perfect, instant recall)

// Simplified 4-button grades that map to SM-2
export type SimpleGrade = 'again' | 'hard' | 'good' | 'easy';

export function simpleGradeToSM2(grade: SimpleGrade): Grade {
  switch (grade) {
    case 'again': return 0;
    case 'hard': return 3;
    case 'good': return 4;
    case 'easy': return 5;
  }
}

export function isCorrect(grade: SimpleGrade): boolean {
  return grade !== 'again';
}

export interface CardState {
  easeFactor: number;    // >= 1.3
  intervalDays: number;  // days until next review
  repetitions: number;   // successful reps in a row
  nextReviewAt: Date;
  correctStreak: number;
  totalReviews: number;
  totalCorrect: number;
}

export interface ReviewResult {
  newState: CardState;
  wasCorrect: boolean;
  masteryChanged: boolean;
  oldMasteryTier: number;
  newMasteryTier: number;
}

const MIN_EASE = 1.3;

export function processReview(
  current: CardState,
  grade: SimpleGrade,
  now: Date = new Date(),
): ReviewResult {
  const q = simpleGradeToSM2(grade);
  const correct = isCorrect(grade);

  let { easeFactor, intervalDays, repetitions, correctStreak, totalReviews, totalCorrect } = current;

  totalReviews += 1;
  if (correct) totalCorrect += 1;

  // Import mastery calc
  const calcMastery = (streak: number, reps: number) => {
    if (streak >= 8 && reps >= 10) return 4;
    if (streak >= 5 && reps >= 6) return 3;
    if (streak >= 3 && reps >= 3) return 2;
    if (streak >= 1) return 1;
    return 0;
  };

  const oldMastery = calcMastery(correctStreak, totalReviews - 1);

  if (q < 3) {
    // Failed: reset
    repetitions = 0;
    intervalDays = 1;
    correctStreak = 0;
  } else {
    // Passed
    correctStreak += 1;
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    // Adjust ease factor based on grade
    if (grade === 'hard') {
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
    } else if (grade === 'easy') {
      easeFactor = easeFactor + 0.15;
      intervalDays = Math.round(intervalDays * 1.3); // bonus interval for easy
    }
    // 'good' doesn't change ease factor
  }

  // Cap interval at 365 days
  intervalDays = Math.min(intervalDays, 365);

  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  const newMastery = calcMastery(correctStreak, totalReviews);

  return {
    newState: {
      easeFactor,
      intervalDays,
      repetitions,
      nextReviewAt,
      correctStreak,
      totalReviews,
      totalCorrect,
    },
    wasCorrect: correct,
    masteryChanged: newMastery !== oldMastery,
    oldMasteryTier: oldMastery,
    newMasteryTier: newMastery,
  };
}

// Check if a card is overdue
export function isOverdue(nextReviewAt: Date, now: Date = new Date()): boolean {
  return nextReviewAt <= now;
}

// How many days overdue (0 if not overdue)
export function daysOverdue(nextReviewAt: Date, now: Date = new Date()): number {
  const diff = now.getTime() - nextReviewAt.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
