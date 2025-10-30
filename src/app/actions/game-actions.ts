'use server';

import { gameStore } from '@/lib/game-store';
import { generateQuestion, getNextWord, scoreUserPath } from '@/lib/ai';
import { generateDistinctPrompts } from '@/lib/prompts';
import type { GameState } from '@/types/game';
import { randomUUID } from 'crypto';

export async function startNewGame(): Promise<{
  sessionId: string;
  question: string;
  initialChoices: string[];
}> {
  // Generate three distinct prompts
  const [promptReal, promptFakeA, promptFakeB] = generateDistinctPrompts();

  console.log('\n🎮 Starting new game...');
  console.log('📋 Prompts:');
  console.log('  Real:', promptReal);
  console.log('  Fake A:', promptFakeA);
  console.log('  Fake B:', promptFakeB);

  // Generate questions in parallel
  const [realQuestion, fakeQuestionA, fakeQuestionB] = await Promise.all([
    generateQuestion(promptReal),
    generateQuestion(promptFakeA),
    generateQuestion(promptFakeB),
  ]);

  // Create game state
  const sessionId = randomUUID();
  const gameState: GameState = {
    sessionId,
    realQuestion,
    fakeQuestionA,
    fakeQuestionB,
    userPath: [],
    allGeneratedWords: new Set<string>(),
    currentTurn: 0,
    isComplete: false,
    createdAt: new Date(),
  };

  gameStore.set(sessionId, gameState);

  console.log('\n🔮 Generating first word choices (9 total: 3 per question)...');
  
  const maxLength = parseInt(process.env.MAX_PATH_LENGTH || '12');
  
  // Get 3 words for each question (empty path = starting)
  const [wordsReal, wordsFakeA, wordsFakeB] = await Promise.all([
    getNextWord(realQuestion, [], maxLength),
    getNextWord(fakeQuestionA, [], maxLength),
    getNextWord(fakeQuestionB, [], maxLength),
  ]);

  // Use Set to combine and deduplicate words
  const uniqueWordsSet = new Set([...wordsReal, ...wordsFakeA, ...wordsFakeB]);
  const initialChoices = Array.from(uniqueWordsSet).sort(() => Math.random() - 0.5);

  // Add all words to the game state Set
  initialChoices.forEach(word => gameState.allGeneratedWords.add(word));

  console.log('✅ Initial choices (unique words):', initialChoices);

  return {
    sessionId,
    question: realQuestion,
    initialChoices,
  };
}

export async function selectWord(
  sessionId: string,
  word: string
): Promise<{
  success: boolean;
  nextChoices?: string[];
  userPath?: string[];
  isComplete?: boolean;
  error?: string;
}> {
  const gameState = gameStore.get(sessionId);

  if (!gameState) {
    return { success: false, error: 'Game session not found' };
  }

  if (gameState.isComplete) {
    return { success: false, error: 'Game already complete' };
  }

  // Check if user submitted manually
  if (word === '[SUBMIT]') {
    gameState.isComplete = true;
    gameStore.set(sessionId, gameState);

    console.log('📝 User submitted manually!');
    console.log('   Final path:', gameState.userPath.join(' '));

    return {
      success: true,
      userPath: gameState.userPath,
      isComplete: true,
    };
  }

  // Add word to user's path
  gameState.userPath.push(word);
  gameState.currentTurn++;

  console.log(`\n📝 Turn ${gameState.currentTurn}: User selected "${word}"`);
  console.log('   Current path:', gameState.userPath.join(' '));

  // Check if game should end
  const maxLength = parseInt(process.env.MAX_PATH_LENGTH || '12');
  if (gameState.userPath.length >= maxLength) {
    gameState.isComplete = true;
    gameStore.set(sessionId, gameState);

    console.log('🏁 Game complete (max length reached)!');

    return {
      success: true,
      userPath: gameState.userPath,
      isComplete: true,
    };
  }

  // Generate next word options based on current user path (9 total: 3 per question)
  console.log('🔮 Generating next word choices for current path...');
  
  try {
    const [wordsReal, wordsFakeA, wordsFakeB] = await Promise.all([
      getNextWord(gameState.realQuestion, gameState.userPath, maxLength),
      getNextWord(gameState.fakeQuestionA, gameState.userPath, maxLength),
      getNextWord(gameState.fakeQuestionB, gameState.userPath, maxLength),
    ]);

    // Use Set to combine and deduplicate words
    const uniqueWordsSet = new Set([...wordsReal, ...wordsFakeA, ...wordsFakeB]);
    const nextChoices = Array.from(uniqueWordsSet).sort(() => Math.random() - 0.5);

    // Add all words to the Set
    nextChoices.forEach(word => gameState.allGeneratedWords.add(word));

    console.log('✅ Next choices (unique words):', nextChoices);

    gameStore.set(sessionId, gameState);

    return {
      success: true,
      nextChoices,
      userPath: gameState.userPath,
      isComplete: false,
    };
  } catch (error: any) {
    console.error('❌ Error generating next words:', error);
    
    // Check if it's a rate limit error
    const isRateLimit = error?.message?.includes('Rate limit') || error?.message?.includes('Limit');
    const errorMessage = isRateLimit 
      ? 'Rate limit reached. Please wait a moment and try again.'
      : 'Failed to generate word choices. Please try again.';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function calculateFinalScore(sessionId: string): Promise<{
  success: boolean;
  score?: {
    aiCoherenceScore: number;
    totalScore: number;
    analysis: string;
    userPath: string[];
    userAnswer: string;
    realQuestion: string;
    fakeQuestionA: string;
    fakeQuestionB: string;
  };
  error?: string;
}> {
  const gameState = gameStore.get(sessionId);

  if (!gameState) {
    return { success: false, error: 'Game session not found' };
  }

  if (!gameState.isComplete) {
    return { success: false, error: 'Game not complete' };
  }

  console.log('\n📊 Calculating final score...');
  console.log('User answer:', gameState.userPath.join(' '));

  // Get AI coherence score
  const { score, analysis } = await scoreUserPath(
    gameState.realQuestion,
    gameState.userPath
  );

  console.log('🎯 Score:', score);
  console.log('📝 Analysis:', analysis);

  return {
    success: true,
    score: {
      aiCoherenceScore: score,
      totalScore: score, // Using score now
      analysis,
      userPath: gameState.userPath,
      userAnswer: gameState.userPath.join(' '),
      realQuestion: gameState.realQuestion,
      fakeQuestionA: gameState.fakeQuestionA,
      fakeQuestionB: gameState.fakeQuestionB,
    },
  };
}
