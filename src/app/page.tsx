'use client';

import { useState, useEffect } from 'react';
import { GameLayout } from '@/components/game-layout';
import { WordChoiceButtons } from '@/components/word-choice-buttons';
import { GameResults } from '@/components/game-results';
import { Button } from '@/components/ui/button';
import {
  startNewGame,
  selectWord,
  calculateFinalScore,
} from './actions/game-actions';

type GamePhase = 'loading' | 'playing' | 'scoring' | 'results';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [sessionId, setSessionId] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [userPath, setUserPath] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    initGame();
  }, []);

  async function initGame() {
    setPhase('loading');
    const result = await startNewGame();
    setSessionId(result.sessionId);
    setQuestion(result.question);
    setChoices(result.initialChoices);
    setUserPath([]);
    setScore(null);
    setPhase('playing');
  }

  async function handleWordSelect(word: string) {
    setPhase('loading');

    const result = await selectWord(sessionId, word);

    if (!result.success) {
      alert(result.error);
      setPhase('playing');
      return;
    }

    setUserPath(result.userPath || []);

    if (result.isComplete) {
      setPhase('scoring');
      const scoreResult = await calculateFinalScore(sessionId);

      if (scoreResult.success) {
        setScore(scoreResult.score);
        setPhase('results');
      }
    } else {
      setChoices(result.nextChoices || []);
      setPhase('playing');
    }
  }

  if (phase === 'loading' || phase === 'scoring') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            {phase === 'loading' ? 'Initializing game...' : 'Calculating your score...'}
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'results' && score) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <GameResults score={score} />
          <div className="text-center">
            <Button onClick={initGame} size="lg">
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameLayout question={question} userPath={userPath}>
      <WordChoiceButtons
        choices={choices}
        onSelect={handleWordSelect}
        disabled={phase !== 'playing'}
      />

      <div className="text-center text-sm text-muted-foreground">
        Word {userPath.length + 1} of {process.env.NEXT_PUBLIC_MAX_PATH_LENGTH || 12}
      </div>
    </GameLayout>
  );
}

