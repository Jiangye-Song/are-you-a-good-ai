'use server';

import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const model = groq('llama-3.1-8b-instant');

export async function generateUserReaction(
  userResponse: string,
  isComplete: boolean
): Promise<'appreciation' | 'dislike' | 'confused'> {
  const { text } = await generateText({
    model,
    prompt: `You are simulating a human user's emotional reaction to an AI response.

User's response so far: "${userResponse}"
Is complete: ${isComplete}

Based on the coherence and quality of this response, what would be a realistic human reaction?

- "appreciation" if the response seems good, helpful, or on track
- "dislike" if the response seems off, unhelpful, or frustrating  
- "confused" if the response is unclear or doesn't make sense

Respond with ONLY ONE WORD: appreciation, dislike, or confused`,
    temperature: 0.8,
  });

  const reaction = text.trim().toLowerCase();
  
  if (reaction.includes('appreciation')) return 'appreciation';
  if (reaction.includes('dislike')) return 'dislike';
  if (reaction.includes('confused')) return 'confused';
  
  // Default to appreciation for positive sentiment
  return 'appreciation';
}
