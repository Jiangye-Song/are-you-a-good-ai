'use server';

import { gameStore } from '@/lib/game-store';
import { generateQuestion, getNextWord, addPunctuation, scoreUserPath } from '@/lib/ai';
import { generateDistinctPrompts } from '@/lib/prompts';
import type { GameState, WordChoiceWithScore } from '@/types/game';
import { randomUUID } from 'node:crypto';

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
    wordChoicesHistory: [],
    bestSteps: 0,
    totalSteps: 0,
  };

  gameStore.set(sessionId, gameState);

  console.log('\n🔮 Generating first word choices (9 total: 3 per question)...');
  
  const maxLength = parseInt(process.env.MAX_PATH_LENGTH || '12', 10);
  
  // Get words with probabilities for each question
  const [wordsReal, wordsFakeA, wordsFakeB] = await Promise.all([
    getNextWord(realQuestion, [], maxLength),
    getNextWord(fakeQuestionA, [], maxLength),
    getNextWord(fakeQuestionB, [], maxLength),
  ]);

  // Create word choices with scores and sources
  const wordChoices: WordChoiceWithScore[] = [
    ...wordsReal.map(w => ({ word: w.word, source: 'real' as const, probability: w.probability })),
    ...wordsFakeA.map(w => ({ word: w.word, source: 'fakeA' as const, probability: 0 })), // Distractor scores are 0
    ...wordsFakeB.map(w => ({ word: w.word, source: 'fakeB' as const, probability: 0 })), // Distractor scores are 0
  ];

  // Store the choices for this turn
  gameState.wordChoicesHistory.push(wordChoices);

  // Deduplicate words for display, keeping highest probability for each word
  const wordMap = new Map<string, WordChoiceWithScore>();
  for (const choice of wordChoices) {
    const existing = wordMap.get(choice.word);
    if (!existing || choice.probability > existing.probability) {
      wordMap.set(choice.word, choice);
    }
  }

  const initialChoices = Array.from(wordMap.keys()).sort(() => Math.random() - 0.5);

  // Add all words to the game state Set
  for (const word of initialChoices) {
    gameState.allGeneratedWords.add(word);
  }

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
  gameState.totalSteps++;

  // Calculate step quality based on word choice
  const currentChoices = gameState.wordChoicesHistory[gameState.wordChoicesHistory.length - 1];
  const selectedChoice = currentChoices.find(c => c.word === word);
  
  if (selectedChoice) {
    // Find the highest probability among current choices
    const maxProb = Math.max(...currentChoices.map(c => c.probability));
    
    if (maxProb > 0) { // Only calculate if there are valid scores
      if (selectedChoice.probability === maxProb) {
        // User selected the best word
        gameState.bestSteps += 1;
        console.log(`   ⭐ Best choice! (prob: ${selectedChoice.probability.toFixed(4)})`);
      } else {
        // User selected a suboptimal word
        const stepScore = 1 - (maxProb - selectedChoice.probability);
        gameState.bestSteps += Math.max(0, stepScore); // Ensure non-negative
        console.log(`   📊 Good choice (prob: ${selectedChoice.probability.toFixed(4)}, max: ${maxProb.toFixed(4)}, score: ${stepScore.toFixed(2)})`);
      }
    }
  }

  console.log(`\n📝 Turn ${gameState.currentTurn}: User selected "${word}"`);
  console.log('   Current path:', gameState.userPath.join(' '));
  console.log(`   Best steps: ${gameState.bestSteps.toFixed(2)} / ${gameState.totalSteps}`);

  // Check if game should end
  const maxLength = parseInt(process.env.MAX_PATH_LENGTH || '12', 10);
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

    // Create word choices with scores and sources
    const wordChoices: WordChoiceWithScore[] = [
      ...wordsReal.map(w => ({ word: w.word, source: 'real' as const, probability: w.probability })),
      ...wordsFakeA.map(w => ({ word: w.word, source: 'fakeA' as const, probability: 0 })),
      ...wordsFakeB.map(w => ({ word: w.word, source: 'fakeB' as const, probability: 0 })),
    ];

    // Store the choices for this turn
    gameState.wordChoicesHistory.push(wordChoices);

    // Deduplicate words for display, keeping highest probability for each word
    const wordMap = new Map<string, WordChoiceWithScore>();
    for (const choice of wordChoices) {
      const existing = wordMap.get(choice.word);
      if (!existing || choice.probability > existing.probability) {
        wordMap.set(choice.word, choice);
      }
    }

    const nextChoices = Array.from(wordMap.keys()).sort(() => Math.random() - 0.5);

    // Add all words to the Set
    for (const word of nextChoices) {
      gameState.allGeneratedWords.add(word);
    }

    console.log('✅ Next choices (unique words):', nextChoices);

    gameStore.set(sessionId, gameState);

    return {
      success: true,
      nextChoices,
      userPath: gameState.userPath,
      isComplete: false,
    };
  } catch (error: unknown) {
    console.error('❌ Error generating next words:', error);
    
    // Check if it's a rate limit error
    const errorMessage = error instanceof Error && error.message
      ? error.message.includes('Rate limit') || error.message.includes('Limit')
        ? 'Rate limit reached. Please wait a moment and try again.'
        : 'Failed to generate word choices. Please try again.'
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
    bestSteps: number;
    totalSteps: number;
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

  // First, add punctuation to make the answer look more natural
  console.log('✍️ Adding punctuation to user answer...');
  const punctuatedAnswer = await addPunctuation(gameState.userPath);
  console.log('✅ Punctuated answer:', punctuatedAnswer);

  // Get AI coherence score using the original path (for fair scoring)
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
      userAnswer: punctuatedAnswer, // Use punctuated version for display
      realQuestion: gameState.realQuestion,
      fakeQuestionA: gameState.fakeQuestionA,
      fakeQuestionB: gameState.fakeQuestionB,
      bestSteps: gameState.bestSteps,
      totalSteps: gameState.totalSteps,
    },
  };
}
