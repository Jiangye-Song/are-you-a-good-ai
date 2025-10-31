import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import OpenAI from 'openai';

// Use Groq/Llama 8B for question generation and scoring
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const model = groq('llama-3.1-8b-instant');
const scoringModel = model;

// Native OpenAI client for logprobs (word suggestions only)
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQuestion(prompt: string): Promise<string> {
  const maxWords = parseInt(process.env.NEXT_PUBLIC_MAX_PATH_LENGTH || '12', 10);
  const fullPrompt = `Generate a simple natural user request that an AI assistant might receive **NO CODING OR COMPOSING EMAIL**, that can be answered within ${maxWords} words. 

Topic: "${prompt}"

Generate ONLY the user question (not the answer). Make it sound natural, like a real person asking.

Examples:
- "Who was the first person to walk on the moon?"
- "Why does a balloon filled with helium rise?"
- "How do I improve my time management skills?"

Your question:`;

  console.log('\n🎲 GENERATING QUESTION:');
  console.log('━'.repeat(80));
  console.log(fullPrompt);
  console.log('━'.repeat(80));

  const { text } = await generateText({
    model,
    prompt: fullPrompt,
    temperature: 0.9,
  });

  const question = text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  
  console.log('✅ LLM RESPONSE:', question);
  console.log('');

  return question;
}

export async function getNextWord(
  question: string,
  currentPath: string[],
  maxWords: number = 12
): Promise<{ word: string; probability: number }[]> {
  const currentText = currentPath.join(' ');
  
  // Build context based on whether we have a current path
  const contextPrompt = currentPath.length === 0 
    ? `question: "${question} answer within ${maxWords} words, NEVER respond with a single word, character, or partial sentence.", response: "`
    : `question: "${question} answer within ${maxWords} words, NEVER respond with a single word, character, or partial sentence.", response: "${currentText}`;
  
  console.log('\n🤖 STEP 1: Get top 5 first-token alternatives');
  console.log('━'.repeat(80));
  console.log(contextPrompt);
  console.log('━'.repeat(80));
  
  try {
    // Step 1: Get top 5 first-token alternatives with max_tokens=1
    const firstCompletion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: contextPrompt }],
      max_tokens: 1,
      temperature: 0.9,
      logprobs: true,
      top_logprobs: 5,
    });

    const firstChoice = firstCompletion.choices[0];
    console.log('✅ Generated first token:', firstChoice.message.content?.trim());
    
    const wordsWithProbs: { word: string; probability: number }[] = [];
    
    if (!firstChoice.logprobs?.content || firstChoice.logprobs.content.length === 0) {
      throw new Error('No logprobs returned');
    }

    const firstTokenLogprobs = firstChoice.logprobs.content[0].top_logprobs || [];
    console.log(`\n📊 Found ${firstTokenLogprobs.length} first-token alternatives\n`);
    
    // Step 2: Use Llama to generate continuations for all first tokens in one call
    const firstTokens = firstTokenLogprobs.slice(0, 5);
    const tokenList = firstTokens.map((logprob, i) => `${i + 1}. "${logprob.token}"`).join('\n');
    
    const batchPrompt = `question: ${question}
current response: "${currentText}"

I have these ${firstTokens.length} possible starting tokens from GPT-4o-mini:
${tokenList}

For each token, complete it into a single natural word that would continue the response. Return ONLY the completed words, one per line, in the same order. Each line should contain just ONE word.

Example format:
Word1
Word2
Word3`;

    const { text: batchContinuation } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      prompt: batchPrompt,
      maxRetries: 2,
      temperature: 0.3,
    });
    
    const completedWords = batchContinuation.trim().split('\n').map(w => w.trim()).filter(w => w.length > 0);
    console.log(`\n✅ Step 2 complete: ${completedWords.length} words generated\n`);
    
    const completions = firstTokens.map((logprob, i) => {
      const probability = Math.exp(logprob.logprob);
      const line = completedWords[i] || '';
      // Extract first word from the line (in case Llama returns a sentence)
      const cleaned = line.replace(/[.,!?;:'"()"""''`]/g, ' ').trim();
      const words = cleaned.split(/\s+/).filter(w => w.length > 0);
      const word = words[0] || '';
      console.log(`  Token: "${logprob.token}" (prob: ${probability.toFixed(4)}) → line: "${line.substring(0, 40)}..." → word: "${word}"`);
      return { word, probability };
    });
    
    // Step 3: Filter and validate words
    const commonWords = ['the', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as', 'is', 'are', 'was', 'be', 'it', 'that', 'this', 'but', 'not', 'can', 'will', 'if', 'so', 'has', 'have', 'had', 'do', 'does', 'did', 'I', 'A'];
    
    for (const { word, probability } of completions) {
      const wordLower = word.toLowerCase();
      
      // Filter out single letters (except I and A), punctuation tokens, numbers, and invalid words
      const isSingleLetter = word.length === 1 && word !== 'I' && word !== 'A';
      const isPunctuation = /^[^a-zA-Z0-9]+$/.test(word);
      const isNumber = /^\d+$/.test(word);
      
      if (
        !isSingleLetter &&
        !isPunctuation &&
        !isNumber &&
        word.length >= 1 &&
        word !== '[end]' &&
        !word.startsWith('<') &&
        (
          commonWords.includes(wordLower) ||
          /^[A-Z][a-z]+/.test(word) ||
          word.length >= 4
        )
      ) {
        wordsWithProbs.push({ word, probability });
        console.log(`  ✓ "${word}" (${probability.toFixed(4)})`);
      } else {
        console.log(`  ✗ "${word}" (single letter/punctuation/number/invalid)`);
      }
    }
    
    // Ensure we have at least 1 option
    if (wordsWithProbs.length === 0) {
      wordsWithProbs.push(
        { word: 'the', probability: 0.5 },
        { word: 'and', probability: 0.3 },
      );
    }
    
    console.log(`\n→ ${wordsWithProbs.length} valid words\n`);
    
    return wordsWithProbs.slice(0, 5); // Return up to 5 words with probabilities
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    // Return fallback words on error
    return [
      { word: 'the', probability: 0.75 },
      { word: 'a', probability: 0.75 },
      { word: 'to', probability: 0.75 },
    ];
  }
}

export async function addPunctuation(userPath: string[]): Promise<string> {
  const userAnswer = userPath.join(' ');
  const fullPrompt = `Add appropriate punctuation to this sentence to make it look more natural. DO NOT change any words, DO NOT add any words, DO NOT change word order. ONLY add punctuation marks (commas, periods, question marks, etc.).

Original: "${userAnswer}"

Return ONLY the sentence with punctuation added, nothing else.`;

  console.log('\n✍️ ADDING PUNCTUATION:');
  console.log('━'.repeat(80));
  console.log(fullPrompt);
  console.log('━'.repeat(80));

  const { text } = await generateText({
    model: scoringModel,
    prompt: fullPrompt,
    temperature: 0.3,
  });

  const punctuated = text.trim().replace(/^["']|["']$/g, '');
  console.log('✅ LLM RESPONSE:', punctuated);
  console.log('');

  return punctuated;
}

export async function scoreUserPath(
  question: string,
  userPath: string[]
): Promise<{
  score: number;
  analysis: string;
}> {
  const userAnswer = userPath.join(' ');
  const maxWords = parseInt(process.env.NEXT_PUBLIC_MAX_PATH_LENGTH || '12', 10);
  const fullPrompt = `Evaluate this answer to the question.

Question: "${question}"
Answer: "${userAnswer}"

The user mimicked a simple AI response to the question with a word limit of ${maxWords} words

Rate the user's answer on:
1. Is that related to the topic?
2. Did that answer the question briefly / in a high level?

Keep in mind that word limit limits the upper bound of respond, so detail / depth / explaination is not a requirement and should not be considered when scoring!

Provide your response as JSON:
{
  "score": number (0-100),
  "analysis": "Brief analysis explaining the score"
}`;

  console.log('\n📊 SCORING PROMPT:');
  console.log('━'.repeat(80));
  console.log(fullPrompt);
  console.log('━'.repeat(80));

  const { text } = await generateText({
    model: scoringModel,
    prompt: fullPrompt,
    temperature: 0.3,
  });

  console.log('✅ LLM RESPONSE:', text);
  console.log('');

  // Clean markdown code blocks if present
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const result = JSON.parse(cleanText);
  
  // Boost score by 20 but cap at 100
  result.score = Math.min(100, (result.score * 1.5));
  
  return result;
}
