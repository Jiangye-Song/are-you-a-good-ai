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
    ? `question: "${question} answer within ${maxWords} words", response: "`
    : `question: "${question} answer within ${maxWords} words", response: "${currentText}`;
  
  console.log('\n🤖 PROMPT SENT TO OPENAI (with logprobs):');
  console.log('━'.repeat(80));
  console.log(contextPrompt);
  console.log('━'.repeat(80));
  
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: contextPrompt }
      ],
      max_tokens: 3, // Allow up to 3 tokens to get fuller words
      temperature: 0.9,
      logprobs: true,
      top_logprobs: 5,
    });

    const choice = completion.choices[0];
    const generatedToken = choice.message.content?.trim() || '';
    
    console.log('✅ Generated token:', generatedToken);
    
    // Extract top words from logprobs with their probabilities
    const wordsWithProbs: { word: string; probability: number }[] = [];
    
    if (choice.logprobs?.content && choice.logprobs.content.length > 0) {
      const tokenLogprobs = choice.logprobs.content[0];
      if (tokenLogprobs.top_logprobs) {
        console.log('📈 Top logprobs:');
        // Get top 5 alternative tokens from first token position
        for (const logprob of tokenLogprobs.top_logprobs) {
          const token = logprob.token.trim();
          // Remove punctuation from the token to get clean words
          const word = token.replace(/[.,!?;:'"()]/g, '').trim();
          const probability = Math.exp(logprob.logprob);
          console.log(`  - "${token}" -> "${word}" (logprob: ${logprob.logprob.toFixed(2)}, prob: ${probability.toFixed(4)})`);
          if (word.length > 0 && word !== '[end]' && !word.startsWith('<')) {
            wordsWithProbs.push({ word, probability });
          }
        }
      }
    }
    
    // Fallback: use the generated token if no logprobs
    if (wordsWithProbs.length === 0 && generatedToken.length > 0) {
      wordsWithProbs.push({ word: generatedToken, probability: 1.0 });
    }
    
    // Ensure we have at least 1 option (use common words if needed)
    const fallbacks = ['and', 'the', 'to', 'a', 'in', 'for', 'with', 'on', 'of'];
    let fallbackIndex = 0;
    while (wordsWithProbs.length < 1) {
      wordsWithProbs.push({ word: fallbacks[fallbackIndex % fallbacks.length], probability: 0.01 });
      fallbackIndex++;
    }
    
    console.log(`  → ${wordsWithProbs.length} options from logprobs: [${wordsWithProbs.map(w => `${w.word}(${w.probability.toFixed(3)})`).join(', ')}]`);
    console.log('');
    
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

Keep in mind that word limit limits the upper bound of respond, so do not be too strict on detail & depth!

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
  return JSON.parse(cleanText);
}
