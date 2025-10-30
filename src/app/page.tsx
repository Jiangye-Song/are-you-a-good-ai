'use client';

import { useState, useEffect, Suspense } from 'react';
import { ChatMessage } from '@/components/chat-message';
import { FakeInput } from '@/components/fake-input';
import { GameResults } from '@/components/game-results';
import { Button } from '@/components/ui/button';
import { ChatSkeleton, WordChoicesSkeleton } from '@/components/loading-skeletons';
import { ErrorSnackbar } from '@/components/error-snackbar';
import {
  startNewGame,
  selectWord,
  calculateFinalScore,
} from './actions/game-actions';
import { generateUserReaction } from './actions/generate-reaction';

type GamePhase = 'loading' | 'playing' | 'scoring' | 'results';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [sessionId, setSessionId] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [userPath, setUserPath] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState<any>(null);
  const [userReaction, setUserReaction] = useState<string>('');
  const [error, setError] = useState<string>('');

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
    setUserReaction('');
    setPhase('playing');
  }

  async function handleWordSelect(word: string) {
    try {
      const result = await selectWord(sessionId, word);

      if (!result.success) {
        setError(result.error || 'An error occurred');
        return;
      }

      setUserPath(result.userPath || []);

      if (result.isComplete) {
        await finishGame(result.userPath || []);
      } else {
        setChoices(result.nextChoices || []);
      }
    } catch (err) {
      console.error('Error selecting word:', err);
      setError('Failed to process selection. Please try again.');
    }
  }

  async function handleSubmit() {
    if (!userPath.length) return;
    
    // Mark game as complete without selecting another word
    const result = await selectWord(sessionId, '[SUBMIT]');
    
    if (result.success) {
      await finishGame(result.userPath || []);
    }
  }

  async function finishGame(finalPath: string[]) {
    setPhase('scoring');
    
    // Generate user reaction and calculate score in parallel
    const [reaction, scoreResult] = await Promise.all([
      generateUserReaction(finalPath.join(' '), true),
      calculateFinalScore(sessionId),
    ]);

    if (scoreResult.success) {
      // Map reaction type to message
      const reactionMessages = {
        appreciation: ['Thanks!', 'Great!', 'Perfect!', 'Awesome!', 'Nice!'],
        dislike: ['Hmm...', 'Not sure about that...', 'Really?', 'Ugh...', 'Meh...'],
        confused: ['Wait, what?', 'Huh?', 'Confused...', 'What??', 'Umm...'],
      };
      const messages = reactionMessages[reaction];
      setUserReaction(messages[Math.floor(Math.random() * messages.length)]);
      setScore(scoreResult.score);
      setPhase('results');
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b px-4 py-3 bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-lg font-semibold">Are You a Good AI?</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <ChatSkeleton />
          </div>
        </div>
        <WordChoicesSkeleton />
      </div>
    );
  }

  if (phase === 'scoring') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Calculating your score...</p>
        </div>
      </div>
    );
  }

  if (phase === 'results' && score) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="border-b px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-lg font-semibold">Are You a Good AI?</h1>
            <Button onClick={initGame} variant="outline" size="sm">
              Play Again
            </Button>
          </div>
        </header>

        {/* Chat area with results */}
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
            {/* User question */}
            <ChatMessage role="user" content={question} />

            {/* User's response */}
            <ChatMessage role="assistant" content={userPath.join(' ')} />

            {/* User reaction to their own response */}
            {userReaction && (
              <div className="flex justify-end mb-4">
                <div className="bg-gray-200 text-gray-700 rounded-2xl rounded-tr-sm px-4 py-2 text-sm max-w-[60%]">
                  {userReaction}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="py-6">
              <div className="border-t border-gray-200" />
            </div>

            {/* Results */}
            <GameResults score={score} />
          </div>
        </div>
      </div>
    );
  }

  const currentText = userPath.join(' ');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Are You a Good AI?</h1>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
          {/* User question */}
          <ChatMessage role="user" content={question} />

          {/* Assistant response (being built) */}
          {currentText && (
            <ChatMessage
              role="assistant"
              content={currentText}
              isStreaming={phase === 'playing'}
            />
          )}
        </div>
      </div>

      {/* Fake input with word choices */}
      <Suspense fallback={<WordChoicesSkeleton />}>
        <FakeInput
          currentText={currentText}
          choices={choices}
          onSelectWord={handleWordSelect}
          onSubmit={handleSubmit}
          disabled={phase !== 'playing'}
          currentWordCount={userPath.length}
        />
      </Suspense>

      {/* Error snackbar */}
      {error && <ErrorSnackbar message={error} onClose={() => setError('')} />}
    </div>
  );
}

