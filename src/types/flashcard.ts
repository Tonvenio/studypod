export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  explanation: string;
  audioUrl: string | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  orderIndex: number;
}

export interface Deck {
  id: string;
  userId: string | null;
  topic: string;
  description: string;
  language: string;
  cardCount: number;
  isPublic: boolean;
  status: 'generating' | 'ready' | 'failed';
  createdAt: string;
  cards?: Flashcard[];
}

export interface StudySession {
  id: string;
  userId: string;
  deckId: string;
  cardsStudied: number;
  correctCount: number;
  durationSeconds: number;
  createdAt: string;
}

export interface CardProgress {
  id: string;
  userId: string;
  flashcardId: string;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string;
  repetitions: number;
}

export type StudyRating = 'again' | 'hard' | 'good' | 'easy';
