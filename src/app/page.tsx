'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { ChatMessage } from '@/components/chat-message';
import { FakeInput } from '@/components/fake-input';
import { GameResults } from '@/components/game-results';
import { Button } from '@/components/ui/button';
import { ChatSkeleton, WordChoicesSkeleton } from '@/components/loading-skeletons';
import { ErrorSnackbar } from '@/components/error-snackbar';
import {
  startNewGame,
  selectWord,
  undoLastWord,
  calculateFinalScore,
} from './actions/game-actions';
import { generateUserReaction } from './actions/generate-reaction';

type GamePhase = 'loading' | 'playing' | 'scoring' | 'results';

interface GameScore {
  aiCoherenceScore: number;
  totalScore: number;
  analysis: string;
  userPath: string[];
  userAnswer: string;
  realQuestion: string;
  fakeQuestionA: string;
  fakeQuestionB: string;
  bestSteps: number;
  totalSteps: number;
  allGeneratedWords?: string[];
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [sessionId, setSessionId] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [userPath, setUserPath] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState<GameScore | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [userReaction, setUserReaction] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  const initGame = useCallback(async () => {
    setPhase('loading');
    const result = await startNewGame();
    setSessionId(result.sessionId);
    setQuestion(result.question);
    setChoices(result.initialChoices);
    setUserPath([]);
    setScore(null);
    setUserReaction('');
    setPhase('playing');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  async function handleWordSelect(word: string) {
    try {
      setIsSelecting(true);
      const result = await selectWord(sessionId, word);

      if (!result.success) {
        setError(result.error || 'An error occurred');
        setIsSelecting(false);
        return;
      }

      setUserPath(result.userPath || []);

      if (result.isComplete) {
        // Word limit reached - clear choices and stop loading
        setChoices([]);
        setIsSelecting(false);
      } else {
        setChoices(result.nextChoices || []);
        setIsSelecting(false);
      }
    } catch (err) {
      console.error('Error selecting word:', err);
      setError('Failed to process selection. Please try again.');
      setIsSelecting(false);
    }
  }

  async function handleUndo() {
    if (!userPath.length) return;

    try {
      setIsSelecting(true);
      const result = await undoLastWord(sessionId);

      if (result.success) {
        setUserPath(result.userPath || []);
        setChoices(result.nextChoices || []);
      } else {
        setError(result.error || 'Failed to undo');
      }
    } catch (err) {
      console.error('Error undoing:', err);
      setError('Failed to undo. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  }

  async function handleSubmit() {
    if (!userPath.length) return;

    // Check if already at limit (isComplete)
    // In this case, we can directly finish the game
    if (choices.length === 0 && userPath.length >= parseInt(process.env.NEXT_PUBLIC_MAX_PATH_LENGTH || '12', 10)) {
      await finishGame(userPath);
      return;
    }

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

    if (scoreResult.success && scoreResult.score) {
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
            <ChatMessage role="assistant" content={score.userAnswer} />

            {/* User reaction to their own response */}
            {userReaction && (
              <ChatMessage role="user" content={userReaction} />
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
          <button
            onClick={() => setShowHelp(true)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Help
          </button>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">How to Play</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm">
              <div>
                <h1 className="font-bold mb-2 text-base text-lg">Are you a good AI?</h1>
                <p className="text-gray-600">
                  <i>🧪 A tiny game developed by <a href='https://jy-s.com'><u>Jiangye Song</u></a>.</i>
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-base">🎮 Objective</h3>
                <p className="text-gray-600">Roleplay as an AI assistant! Build a coherent response to a question by selecting words one at a time.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-base">📝 How It Works</h3>
                <ol className="text-gray-600 space-y-2 list-decimal list-inside">
                  <li>You'll see a question that needs an AI-style response</li>
                  <li>Select words from the choices to build your answer (up to 12 words)</li>
                  <li>Each word shows its probability score - higher is better!</li>
                  <li>Use the <strong>undo button (↶)</strong> to remove the last word</li>
                  <li>Click <strong>send (↑)</strong> when ready to submit</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-base">🎯 The Twist</h3>
                <p className="text-gray-600">Three AI models suggest words, but they're answering <em>different questions</em>! Only one question is real - the others are distractors trying to lead you astray.</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

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
          onUndo={handleUndo}
          disabled={phase !== 'playing'}
          currentWordCount={userPath.length}
          isSelecting={isSelecting}
        />
      </Suspense>

      {/* Error snackbar */}
      {error && <ErrorSnackbar message={error} onClose={() => setError('')} />}
    </div>
  );
}

