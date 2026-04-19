export interface KeyConcept {
  term: string;
  definition: string;
  explanation: string;
  example: string;
}

export interface ResearchResult {
  topic: string;
  language: string;
  summary: string;
  keyConcepts: KeyConcept[];
  sources: string[];
  generatedAt: string;
}

export interface ResearchJob {
  id: string;
  topic: string;
  language: string;
  status: 'pending' | 'researching' | 'generating' | 'rendering' | 'completed' | 'failed';
  progress: number;
  result: ResearchResult | null;
  error: string | null;
  createdAt: string;
}
