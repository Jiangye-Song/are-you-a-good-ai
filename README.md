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
- **Groq AI** - Fast LLM inference with Llama 3.1
- **Vercel AI SDK** - AI integration utilities

## 📦 Getting Started

### Prerequisites

- Node.js 20.9+ (Node.js 18 is no longer supported in Next.js 16)
- pnpm, npm, or yarn
- Groq API key (get one free at [console.groq.com](https://console.groq.com))

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
# Required: Groq API Key
GROQ_API_KEY=your_api_key_here

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
- Each AI model suggests 1-5 words per turn
- Words are generated based on the current conversation context
- The AI knows how many words are remaining
- Filler phrases are explicitly discouraged

### Scoring System
- **Coherence Score** (100 points max): How well-formed and logical your response is
- **Analysis**: AI-generated feedback explaining your score
- **Performance tiers**:
  - 0-49: "🔻 You may be deprecated"
  - 50-80: "📚 You will be trained more"
  - 81-100: "✨ You are a good AI model"

### Deduplication
When multiple AI models suggest the same word, it appears only once in your choices. This means you'll see anywhere from 1 to 15 unique options per turn (typically 3-10).

## 📁 Project Structure

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

- **Generation**: llama-3.1-8b-instant (~500+ tokens/sec, cost-effective)
- **Scoring**: llama-3.1-8b-instant (fast scoring)
- Easily swap to llama-3.3-70b-versatile for higher quality in `src/lib/ai.ts`

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
- Groq free tier: 6000 tokens/minute
- Error snackbar will appear with retry message
- Wait a few seconds and try again
- Consider upgrading to Dev Tier for higher limits

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
- AI powered by [Groq](https://groq.com/) and Llama models
- Inspired by the Turing Test concept

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Groq Documentation](https://console.groq.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Have fun roleplaying as an AI! 🤖✨**

