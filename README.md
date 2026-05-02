# BotSpot 🤖

**BotSpot** is an interactive, "Turing Test" swipe game where users must distinguish between human-written and AI-generated content. Inspired by the addictive mechanics of Tinder, BotSpot challenges your perception of "the human touch" in the age of generative models.

Built by [Harish Kotra](https://harishkotra.me) as part of a [DailyBuild](https://dailybuild.xyz) challenge.

---

## Experience the Game

- **Swipe Right**: If you think it's human.
- **Swipe Left**: If you think it's a Bot.
- **Categories**: Poetry, Jokes, and more.
- **Difficulty Levels**: 
  - **Easy**: Distinctive human patterns vs. generic AI.
  - **Medium**: Balanced challenge.
  - **Hard**: AI mimics human flaws (typos, slang, irregular rhythm) while humans act "robotic."

---

## Technology Stack

- **Frontend**: React 18+, Vite, TypeScript
- **Styling**: Tailwind CSS (Brutalist Aesthetic)
- **Animations**: Framer Motion (`motion/react`)
- **AI Core**: Google Gemini 2.0 Flash (via `@google/genai`)
- **Icons**: Lucide React
- **Audio**: Web Audio API (Procedural SFX)

---

## Architecture

The app follows a **Serverless-First** approach utilizing the Gemini API directly for content generation.

### High-Level Flow
1. **User Selection**: User chooses a category and difficulty level.
2. **Dynamic Generation**: The app calls Gemini with a specific system prompt that adjusts based on the chosen difficulty.
3. **Bot Strategy**: 
   - On **Hard**, the AI is instructed to avoid tropes like "delve" or "tapestry" and instead include subtle human-like imperfections.
4. **Game Loop**: A deck of cards is generated. Each card is validated against the user's swipe.
5. **Feedback System**: Post-swipe, the app reveals the "Bot Reason"—a style note explaining the logic behind the classification.

### Code Snippet: Difficulty-Aware Prompting
```typescript
const prompt = `
Difficulty Level: ${difficulty}.
Strategy for Difficulty:
- Easy: AI content generic patterns. 
- Hard: AI MUST mimic human flaws like typos, slang, or niche references. 
Avoid typical AI tropes ("tapestry", "delve").
`;
```

---

## Fork & Contribute

Want to build your own version of BotSpot? 

### Prerequisites
- Node.js 18+
- A Google Gemini API Key

### Getting Started
1. Clone the repo.
2. Install dependencies: `npm install`
3. Set up environment: Create `.env` and add `VITE_GEMINI_API_KEY=your_key_here`.
4. Run dev: `npm run dev`

### Ideas for New Features
- [ ] **Multiplayer Mode**: Play against a friend in real-time.
- [ ] **Global Leaderboard**: Track the world's best Bot-Spotters.
- [ ] **Image Mode**: Spot AI-generated images vs. real photography.
- [ ] **User Submissions**: Allow users to submit their own content to "train" the crowd.
- [ ] **Custom Categories**: Let users input any topic to generate a test deck.