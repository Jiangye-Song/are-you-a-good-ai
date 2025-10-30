import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use Llama 3.1 8B for fast, cost-effective generation
const model = groq('llama-3.1-8b-instant');

// Use Llama 3.3 70B for higher quality scoring
const scoringModel = groq('llama-3.3-70b-versatile');

export async function generateQuestionAndPath(prompt: string): Promise<{
  question: string;
  path: string[];
}> {
  const fullPrompt = `You are simulating a typical user request to an AI assistant.

Generate a natural user request based on this prompt: "${prompt}"

Then provide a helpful, concise response (2-3 sentences, around 15-20 words total).

Format your response as JSON:
{
  "question": "the user request here (make it sound natural, like a real person asking)",
  "answer": "the helpful response here"
}`;

  console.log('\n🎲 GENERATING QUESTION:');
  console.log('━'.repeat(80));
  console.log(fullPrompt);
  console.log('━'.repeat(80));

  const { text } = await generateText({
    model,
    prompt: fullPrompt,
    temperature: 0.9,
  });

  console.log('✅ LLM RESPONSE:', text);

  // Clean markdown code blocks if present
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanText);
  const words = parsed.answer.split(' ').filter((w: string) => w.length > 0);

  // Log to console for debugging
  console.log('\n🎯 Generated Request:', parsed.question);
  console.log('📝 AI Response:', parsed.answer);
  console.log('🔢 Word count:', words.length);

  return {
    question: parsed.question,
    path: words,
  };
}

export async function getNextWord(
  question: string,
  currentPath: string[],
  maxWords: number = 12
): Promise<string[]> {
  const currentText = currentPath.join(' ');
  const wordsRemaining = maxWords - currentPath.length;
  
  // Build context based on whether we have a current path
  const contextPrompt = currentPath.length === 0 
    ? `You are starting a new response. What are the 3 most likely FIRST WORDS to begin answering this request?`
    : `The response has already started with: "${currentText}"\n\nWhat are the 3 most likely NEXT WORDS that should come after "${currentText}"?`;
  
  const fullPrompt = `A human is role playing an AI and picking up the next word for THIS user request: "${question}"

${contextPrompt}

Words remaining in response: ${wordsRemaining}

IMPORTANT RULES:
- If the response feels complete or nearly complete, include "[end]" as one option
- There are other models doing the same thing with fake question! Try lead the human to select your keywords to make it related to your question!
- Provide 3 DIFFERENT words that would naturally continue from where the response currently is

Respond with EXACTLY 3 words separated by commas.
Format: word1, word2, word3
Example: "the, a, some" or "help, assist, [end]"`;

  console.log('\n🤖 PROMPT SENT TO LLM:');
  console.log('━'.repeat(80));
  console.log(fullPrompt);
  console.log('━'.repeat(80));
  
  const { text } = await generateText({
    model,
    prompt: fullPrompt,
    temperature: 0.9,
  });

  console.log('✅ LLM RESPONSE:', text);
  
  // Parse the response to get 3 words
  const words = text
    .trim()
    .split(',')
    .map(w => w.trim().split(/\s+/)[0].replace(/[.,!?;:"]$/g, ''))
    .filter(w => w.length > 0)
    .slice(0, 3);
  
  // Ensure we have exactly 3 options
  while (words.length < 3) {
    words.push('[end]');
  }
  
  console.log(`  → 3 options for "${question.substring(0, 40)}...": [${words.join(', ')}]`);
  console.log('');
  
  return words;
}

export async function scoreUserPath(
  question: string,
  userPath: string[],
  optimalPath: string[]
): Promise<{
  coherenceScore: number;
  analysis: string;
}> {
  const userAnswer = userPath.join(' ');
  const optimalAnswer = optimalPath.join(' ');

  const fullPrompt = `Evaluate this answer to the question.

Question: "${question}"
User's Answer: "${userAnswer}"
Optimal Answer: "${optimalAnswer}"

Rate the user's answer on:
1. Coherence (0-100): How well-formed and logical is it?
2. Relevance (0-100): How well does it answer the question?
3. Semantic similarity to optimal answer (0-100)

Provide your response as JSON:
{
  "coherenceScore": number (0-100),
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
