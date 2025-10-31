# Are You a Good AI?

A fun interactive game where you roleplay as an AI assistant! Three different AI models generate word suggestions for the same question - but only one question is real, and the other two are distractors. Can you build a coherent response by choosing the right words?

## 🎮 How to Play

1. You'll see a question that needs an AI-style response
2. Three AI models (answering different questions) suggest 1-5 words each
3. Duplicate words are automatically collapsed into unique choices
4. Select words one by one to build your response (up to 12 words)
5. Click submit when ready, or let the game end at the word limit
6. Get scored on how coherent and relevant your response is!

## 🚀 Features

- **Chat-style UI** - Modern interface similar to ChatGPT/Claude
- **Dynamic word generation** - AI models suggest contextual next words
- **Smart deduplication** - Duplicate suggestions collapse into unique choices
- **Real-time streaming** - Watch your response build word by word
- **AI scoring** - Get feedback on coherence and relevance
- **Distractor reveal** - See all three questions at the end
- **Word tracking** - View all unique words generated during the game

## 🛠️ Tech Stack

- **Next.js 16** - App Router with Turbopack (default bundler)
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern styling
- **shadcn/ui** - Beautiful UI components
- **OpenAI GPT-4o-mini** - Fast LLM with logprobs for word suggestions
- **Vercel AI SDK** - AI integration utilities

## 📦 Getting Started

### Prerequisites

- Node.js 20.9+ (Node.js 18 is no longer supported in Next.js 16)
- pnpm, npm, or yarn
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

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
# Required: OpenAI API Key
OPENAI_API_KEY=your_api_key_here

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

### Word Generation
- Uses OpenAI's logprobs feature to get token probabilities
- Requests max_tokens=1 with top_logprobs=5 for each turn
- Returns the top 5 most likely next tokens based on probability
- Words are generated based on the current conversation context
- More deterministic and contextually accurate than prompt-based generation

### Scoring System
- **Coherence Score** (100 points max): How well-formed and logical your response is
- **Analysis**: AI-generated feedback explaining your score
- **Performance tiers**:
  - 0-49: "🔻 You may be deprecated"
  - 50-80: "📚 You will be trained more"
  - 81-100: "✨ You are a good AI model"

### Deduplication
When multiple AI models suggest the same word, it appears only once in your choices. This means you'll see anywhere from 1 to 15 unique options per turn (typically 3-10).

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

- **Generation**: gpt-4o-mini with logprobs (fast, accurate, cost-effective)
- **Scoring**: gpt-4o-mini (consistent quality)
- **Logprobs**: top_logprobs=5 returns the 5 most probable next tokens
- Can be upgraded to gpt-4o for higher quality in `src/lib/ai.ts`

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
- OpenAI free tier has request limits
- Error snackbar will appear with retry message
- Wait a few seconds and try again
- Consider upgrading your OpenAI plan for higher limits

### Logprobs Not Working
- Ensure you're using a model that supports logprobs (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
- Check that your API key has proper permissions
- Logprobs feature requires max_tokens >= 1

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
- AI powered by [OpenAI](https://openai.com/) GPT-4o-mini with logprobs
- Logprobs technique inspired by [OpenAI Cookbook](https://cookbook.openai.com/examples/using_logprobs)
- Inspired by the Turing Test concept

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Logprobs Guide](https://cookbook.openai.com/examples/using_logprobs)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Have fun roleplaying as an AI! 🤖✨**

