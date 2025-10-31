export interface GameState {
  sessionId: string;
  realQuestion: string;
  fakeQuestionA: string;
  fakeQuestionB: string;
  userPath: string[];
  allGeneratedWords: Set<string>;
  currentTurn: number;
  isComplete: boolean;
  score?: GameScore;
  createdAt: Date;
  // Track word choices with their scores and sources
  wordChoicesHistory: WordChoiceWithScore[][];
  bestSteps: number;
  totalSteps: number;
}

export interface GameScore {
  pathMatchScore: number;
  aiCoherenceScore: number;
  totalScore: number;
  analysis: string;
  bestSteps: number;
  totalSteps: number;
}

export interface WordChoice {
  word: string;
  source: 'real' | 'fakeA' | 'fakeB';
}

export interface WordChoiceWithScore {
  word: string;
  source: 'real' | 'fakeA' | 'fakeB';
  probability: number; // The logprob probability from the model
}
