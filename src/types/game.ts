export interface GameState {
  sessionId: string;
  realQuestion: string;
  fakeQuestionA: string;
  fakeQuestionB: string;
  userPath: string[];
  currentTurn: number;
  isComplete: boolean;
  score?: GameScore;
  createdAt: Date;
}

export interface GameScore {
  pathMatchScore: number;
  aiCoherenceScore: number;
  totalScore: number;
  analysis: string;
}

export interface WordChoice {
  word: string;
  source: 'real' | 'fakeA' | 'fakeB';
}
