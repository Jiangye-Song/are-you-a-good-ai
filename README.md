# Are You a Good AI?

A fun interactive game where you roleplay as an AI assistant! Three different AI models generate word suggestions for the same question - but only one question is real, and the other two are distractors. Can you build a coherent response by choosing the right words?

## 🎮 How to Play

1. You'll see a question that needs an AI-style response
2. Three AI models (answering different questions) suggest words to continue your response
3. Select words one by one to build your response (up to 12 words)
4. Watch the loading skeleton while the next word suggestions are generated
5. Click submit when ready, or let the game end at the word limit
6. Get scored on how coherent and relevant your response is!
7. See your "best steps" score showing how often you picked optimal words

## 🚀 Features

- **Chat-style UI** - Modern interface similar to ChatGPT/Claude
- **Hybrid AI approach** - GPT-4o-mini with logprobs for word suggestions, Llama 8B for question generation and scoring
- **Two-step word generation** - First token from GPT-4o-mini, continuation from Llama for natural words
- **Probability tracking** - Each word choice shows its probability, tracks optimal vs suboptimal selections
- **Best steps metric** - See how many optimal word choices you made (best steps / total steps)
- **Real-time streaming** - Watch your response build word by word
- **Loading states** - Skeleton UI shows while generating next word options
- **AI scoring** - Get feedback on coherence and relevance (boosted by +20 for better experience)
- **Punctuation enhancement** - Final answer gets natural punctuation added by AI
- **Distractor reveal** - See all three questions at the end
- **Word tracking** - View all unique words generated during the game

## 🛠️ Tech Stack

- **Next.js 16** - App Router with Turbopack (default bundler)
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern styling
- **shadcn/ui** - Beautiful UI components
- **OpenAI GPT-4o-mini** - Fast LLM with logprobs for word probability tracking
- **Groq Llama 3.1 8B Instant** - Question generation, word completion, punctuation, and scoring
- **Vercel AI SDK** - AI integration utilities for Groq
- **Native OpenAI SDK** - Direct API access for logprobs feature

## 📦 Getting Started

### Prerequisites

- Node.js 20.9+ (Node.js 18 is no longer supported in Next.js 16)
- pnpm, npm, or yarn
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))
- Groq API key (get one at [console.groq.com](https://console.groq.com))

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd are-you-a-good-ai
```

2. Install dependencies
```bash
pnpm install
# or
npm install
```

3. Create environment file
```bash
# Create .env.local in the root directory
```

4. Add your configuration to `.env.local`:
```env
# Required: OpenAI API Key (for word suggestions with logprobs)
OPENAI_API_KEY=your_openai_api_key_here

# Required: Groq API Key (for question generation, word completion, and scoring)
GROQ_API_KEY=your_groq_api_key_here

# Optional: Game configuration
NEXT_PUBLIC_MAX_PATH_LENGTH=12
```

5. Run the development server
```bash
pnpm dev
# or
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Game Mechanics

### Word Generation (Hybrid Two-Step Approach)

**Step 1: Get First Token Probabilities (OpenAI GPT-4o-mini)**
- Uses OpenAI's logprobs feature with `max_tokens=1, top_logprobs=5`
- Returns 5 most probable first tokens with their probability scores
- Each token gets a probability value (e.g., 0.7491 for "The", 0.1671 for "A")

**Step 2: Complete Words Naturally (Groq Llama 3.1 8B)**
- For each first token, Llama generates a natural continuation
- Batch processing: all 5 tokens sent in one request to reduce API calls
- Extracts first complete word from each continuation
- Probability from Step 1 is preserved for tracking

**Word Filtering:**
- Removes single letters (except "I" and "A")
- Filters out pure numbers and punctuation tokens
- Validates minimum word length and common word patterns
- Ensures at least 1 valid option per turn

**Why This Approach?**
- GPT-4o-mini logprobs provide accurate probability distributions
- Llama completes tokens into natural, well-formed words
- Avoids concatenation issues (like "Dolphinsolphins" from naive approaches)
- Reduces API calls while maintaining quality

### Probability Tracking & Best Steps

Each word choice has a probability from 0 to 1 (displayed as percentage). The game tracks:

- **Total Steps**: Number of words you selected
- **Best Steps Score**: Cumulative quality of your choices
  - Perfect choice (highest probability): +1.0 to score
  - Suboptimal choice: +1.0 - (max_prob - your_prob) to score
  - Example: If best word has 0.80 prob and you pick 0.60 prob word, you get +0.80 points

**Display**: "Best Steps: 8.75 / 10" means you made 10 choices with 87.5% optimality

### Scoring System

- **Coherence Score** (0-100): How well-formed and logical your response is
- **Score Boost**: +20 points added automatically (capped at 100) for better user experience
- **Punctuation Enhancement**: AI adds natural punctuation before scoring
- **Analysis**: AI-generated feedback explaining your score
- **Performance tiers**:
  - 0-49: "🔻 You may be deprecated"
  - 50-80: "📚 You will be trained more"
  - 81-100: "✨ You are a good AI model"

### Questions & Distractors

- Three questions are generated per game:
  1. **Real Question**: The actual question you're answering
  2. **Fake Question A**: First distractor
  3. **Fake Question B**: Second distractor
- Each question generates its own word suggestions
- Word choices are mixed together (with source tracking for probability)
- Distractor words get probability = 0 (always suboptimal choices)

## � Storage

Game state is stored **in-memory** using a JavaScript Map with automatic cleanup (30-minute TTL). This means:
- ⚡ Fast and free (no database required)
- 🔒 Private (no data persistence)
- ⚠️ Sessions lost on server restart
- ⚠️ Not suitable for multi-instance deployments without sticky sessions

For production at scale, consider Redis, Upstash, or Vercel KV for persistent storage.

## �📁 Project Structure

```
src/
├── app/
│   ├── actions/
│   │   ├── game-actions.ts      # Server actions for game logic
│   │   └── generate-reaction.ts # AI-generated user reactions
│   └── page.tsx                 # Main game page
├── components/
│   ├── chat-message.tsx         # Chat bubble component
│   ├── fake-input.tsx           # Input UI with word choices
│   ├── game-results.tsx         # Results display
│   ├── error-snackbar.tsx       # Error notifications
│   └── loading-skeletons.tsx    # Loading states
├── lib/
│   ├── ai.ts                    # Groq AI integration
│   ├── game-store.ts            # In-memory game state
│   └── prompts.ts               # Prompt templates
└── types/
    └── game.ts                  # TypeScript interfaces
```

## 🔧 Configuration

### Environment Variables

- `GROQ_API_KEY` (required): Your Groq API key
- `NEXT_PUBLIC_MAX_PATH_LENGTH` (optional, default: 12): Maximum words per response

### AI Models

- **Question Generation**: Llama 3.1 8B Instant via Groq
- **Word Suggestions (Step 1)**: GPT-4o-mini with logprobs (probability tracking)
- **Word Completion (Step 2)**: Llama 3.1 8B Instant via Groq
- **Punctuation**: Llama 3.1 8B Instant via Groq
- **Scoring**: Llama 3.1 8B Instant via Groq (with +20 boost applied)
- **Logprobs**: top_logprobs=5 returns the 5 most probable next tokens
- Models can be configured in `src/lib/ai.ts`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in project settings
4. Deploy!

### Other Platforms

The app works on any platform supporting Next.js 16:
- Netlify
- Railway
- Fly.io
- Docker containers

## 🎨 Customization

### Change Word Limit
Edit `NEXT_PUBLIC_MAX_PATH_LENGTH` in `.env.local`

### Modify Topics
Edit `TOPIC_CATEGORIES` in `src/lib/prompts.ts`

### Adjust Scoring
Modify the scoring prompt in `src/lib/ai.ts` → `scoreUserPath()`

### Update UI Theme
Modify Tailwind colors in `src/app/globals.css`

## 🐛 Troubleshooting

### Rate Limit Errors

**OpenAI:**
- Free tier has request limits
- Consider upgrading your OpenAI plan for higher limits

**Groq:**
- Free tier: 6000 tokens/minute for Llama 3.1 8B
- Batch word completion reduces API calls (1 call per turn instead of 5)
- Wait 1 second if rate limited, then retry
- Upgrade to Dev Tier at [console.groq.com/settings/billing](https://console.groq.com/settings/billing)

### Word Quality Issues

If you see incomplete or malformed words:
- Check that Llama is returning proper continuations
- Verify the batch prompt format in `getNextWord()` function
- First word extraction logic is in place (splits on spaces, takes first word)

### Logprobs Not Working
- Ensure you're using a model that supports logprobs (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
- Check that your OpenAI API key has proper permissions
- Logprobs feature requires max_tokens >= 1

### Best Steps Not Showing
- Verify GameState includes `bestSteps` and `totalSteps` fields
- Check WordChoiceWithScore interface has probability field
- Ensure probability calculation happens in selectWord action

### TypeScript Errors
Run type checking:
```bash
pnpm run check
# or
npm run check
```

### Build Issues
Clear cache and rebuild:
```bash
rm -rf .next node_modules
pnpm install
pnpm run build
```

## 📝 License

MIT License - feel free to use this project for learning or building your own games!

## 🙏 Credits

- Built with [Next.js](https://nextjs.org) and [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by:
  - [OpenAI](https://openai.com/) GPT-4o-mini with logprobs for probability tracking
  - [Groq](https://groq.com/) Llama 3.1 8B Instant for fast question generation and scoring
- Logprobs technique inspired by [OpenAI Cookbook](https://cookbook.openai.com/examples/using_logprobs)
- Hybrid AI approach combines strengths of both providers
- Inspired by the Turing Test concept

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Logprobs Guide](https://cookbook.openai.com/examples/using_logprobs)
- [Groq Documentation](https://console.groq.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Have fun roleplaying as an AI! 🤖✨**

