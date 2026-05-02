# BotSpot 🤖

**BotSpot** is an interactive, "Turing Test" swipe game where users must distinguish between human-written and AI-generated content. Inspired by the addictive mechanics of Tinder, BotSpot challenges your perception of "the human touch" in the age of generative models.

Built by [Harish Kotra](https://harishkotra.me) as part of a [DailyBuild](https://dailybuild.xyz) challenge.

### Screenshots

<img width="608" height="1080" alt="botspot" src="https://github.com/user-attachments/assets/ea2c2a44-40e0-4cf0-b00d-570360a44ce8" />
<img width="1089" height="1088" alt="botspot-1" src="https://github.com/user-attachments/assets/f5c7bfc0-ebaa-4b0e-9023-f10c6900cdfd" />
<img width="1078" height="1091" alt="botspot-2" src="https://github.com/user-attachments/assets/ad321a33-2881-41c4-be9c-699f31cf3910" />
<img width="1046" height="1089" alt="botspot-3" src="https://github.com/user-attachments/assets/f5dc1514-277a-4894-a628-b4f60cfaf6da" />
<img width="1046" height="1096" alt="botspot-4" src="https://github.com/user-attachments/assets/8126c25c-a1ed-4962-874d-a4f25a36cc22" />
<img width="1069" height="1096" alt="botspot-5" src="https://github.com/user-attachments/assets/84aeaf88-7751-4e86-b96e-c20505c2823e" />
<img width="1063" height="1095" alt="botspot-6" src="https://github.com/user-attachments/assets/d1b1f322-dc6a-47fc-bd06-45b52d92db92" />
<img width="1100" height="1095" alt="botspot-7" src="https://github.com/user-attachments/assets/54714b82-d52b-4917-bba6-9b66dfa202fd" />
<img width="1042" height="1091" alt="botspot-8" src="https://github.com/user-attachments/assets/32a271ac-1347-49cc-b57d-f4992d3d8b51" />

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
