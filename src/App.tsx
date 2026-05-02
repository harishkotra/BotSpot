import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { RefreshCw, Book, Smile, BrainCircuit, User, Share2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CardData {
  id: string;
  content: string;
  is_human: boolean;
  style_note: string;
}

interface GameState {
  category: string;
  cards: CardData[];
  hook_fact: string;
  currentIndex: number;
}

export default function App() {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [feedback, setFeedback] = useState<{correct: boolean, note: string} | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Sound Utility
  const playSfx = (type: 'swipe' | 'correct' | 'wrong' | 'complete') => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'swipe') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      osc.type = 'sine';
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.3);
      });
    }
  };

  const [showResult, setShowResult] = useState(false);

  const startGame = async (category: string) => {
    setLoading(true);
    setFeedback(null);
    setIsGameOver(false);
    setCorrectGuesses(0);
    setLastSwipeDirection(null);
    setShowResult(false);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are a creative content engine for a "Turing Test" swipe game.
generate a pair of content (1 Human, 1 AI) for the category: ${category}.
Difficulty Level: ${difficulty}.

Strategy for Difficulty:
- Easy: AI content should be somewhat generic or use detectable patterns. Human content should be very distinctive or classic.
- Medium: Balanced challenge.
- Hard: AI content MUST mimic human flaws like subtle typos, irregular rhythm, slang, or niche references. Avoid typical AI tropes ("tapestry", "delve", "wholesome"). Human content should be abstract or rare enough to seem algorithmic.

Create content that challenges the user's ego. Make sure to generate one that is definitively is_human: true and one that is is_human: false.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING },
                    is_human: { type: Type.BOOLEAN },
                    style_note: { type: Type.STRING },
                  },
                  required: ["content", "is_human", "style_note"]
                }
              },
              hook_fact: { type: Type.STRING }
            },
            required: ["category", "cards", "hook_fact"]
          }
        }
      });
      
      const data = JSON.parse(response.text || '{}');
      const rawCards = data.cards || [];
      const shuffled = rawCards
        .map((c: any) => ({ ...c, id: Math.random().toString(36).substring(7) }))
        .sort(() => Math.random() - 0.5);

      setGameState({
        category: category,
        cards: shuffled,
        hook_fact: data.hook_fact || '',
        currentIndex: 0
      });
      
    } catch (e) {
      console.error(e);
      alert("Error generating content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!gameState || showResult) return;
    
    playSfx('swipe');
    setLastSwipeDirection(direction);
    
    const currentCard = gameState.cards[gameState.currentIndex];
    const guessedHuman = direction === 'right';
    const isCorrect = guessedHuman === currentCard.is_human;

    if (isCorrect) {
      setStreak((s: number) => s + 1);
      setCorrectGuesses((c: number) => c + 1);
      playSfx('correct');
    } else {
      setStreak(0);
      playSfx('wrong');
    }

    setFeedback({
      correct: isCorrect,
      note: currentCard.style_note
    });

    setShowResult(true);
  };

  const nextCard = () => {
    if (!gameState) return;
    setShowResult(false);
    setFeedback(null);
    setLastSwipeDirection(null);
    
    const nextIndex = gameState.currentIndex + 1;
    if (nextIndex >= gameState.cards.length) {
      setIsGameOver(true);
      playSfx('complete');
    } else {
      setGameState({ ...gameState, currentIndex: nextIndex });
    }
  };

  const resetGame = () => {
    setGameState(null);
    setIsGameOver(false);
    setFeedback(null);
    setCorrectGuesses(0);
  };

  const appUrl = (typeof process !== 'undefined' && process.env && process.env.APP_URL) || window.location.origin;
  const shareText = `I survived the Turing Test. I spotted ${correctGuesses}/${gameState?.cards.length || 0} bots. Can you?\n\nPlay here: ${appUrl}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spot the Bot',
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        // Gracefully handle cancellation errors which are common in mobile browsers
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
          return;
        }
        console.error('Share error:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      } catch (err) {
        console.error('Clipboard error:', err);
      }
    }
  };

  return (
    <div className="bg-[#2D1B69] text-white w-full min-h-screen flex flex-col items-center p-4 sm:p-8 overflow-hidden font-sans selection:bg-[#00FFC2] selection:text-[#2D1B69]">
      {/* Header Section */}
      <div className="w-full max-w-lg flex justify-between items-center mb-8 z-10 relative">
        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-[#00FFC2]">BOTSPOT</h1>
        </div>
        
        <div className="flex gap-4 sm:gap-6">
          <div className="bg-[#FF0080] px-4 py-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-[4px_4px_0px_0px_#000] flex flex-col items-center min-w-[80px] sm:min-w-[120px]">
             <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Streak</span>
             <span className="text-xl sm:text-3xl font-black leading-none">{streak.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center space-y-12">
          {/* Main Visual */}
          <div className="relative">
            <motion.div 
               animate={{ 
                 scale: [1, 1.1, 1],
                 rotate: [0, 90, 180, 270, 360],
                 borderColor: ["#00FFC2", "#FF0080", "#00FFC2"]
               }}
               transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
               className="w-32 h-32 border-8 rounded-3xl flex items-center justify-center shadow-[0_0_50px_-10px_rgba(0,255,194,0.3)]"
            >
              <BrainCircuit className="w-16 h-16 text-[#00FFC2]" />
            </motion.div>
            
            {/* Pulsing rings */}
            <motion.div 
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 border-4 border-[#00FFC2] rounded-3xl"
            />
          </div>

          {/* Loading Stats */}
          <div className="w-full space-y-4">
            <div className="flex justify-between font-mono text-[10px] text-[#00FFC2] uppercase mb-1">
              <span>Establishing Neural Link</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                [WAITING]
              </motion.span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="h-6 w-full bg-[#1A0E3D] border-2 border-black rounded-full overflow-hidden relative shadow-[inset_4px_4px_0px_#000]">
               <motion.div 
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="h-full bg-gradient-to-r from-[#FF0080] to-[#00FFC2]"
               />
            </div>

            {/* Cycling Terminal Text */}
            <div className="text-center">
              <motion.p 
                key={(difficulty)} // Cycle on state potentially, but let's just use a key to ensure animation
                className="text-xs font-mono text-white/60 italic"
              >
                <LoadingPhrases />
              </motion.p>
            </div>
          </div>
        </div>
      ) : !gameState ? (
        <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center gap-6">
          <div className="text-center space-y-4 mb-4">
            <h2 className="text-2xl font-bold">CHOOSE YOUR TEST</h2>
            <p className="opacity-70 max-w-md mx-auto">Identify the human. Swipe LEFT if you think it's an AI Bot, Swipe RIGHT if you think it's a Human.</p>
          </div>

          <div className="w-full flex bg-[#1A0E3D] p-1 rounded-2xl border-4 border-black mb-4">
            {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-black transition-all",
                  difficulty === lvl 
                    ? "bg-[#00FFC2] text-[#1A0E3D] shadow-[4px_4px_0px_0px_#000]" 
                    : "text-[#00FFC2] hover:bg-white/10"
                )}
              >
                {lvl}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => startGame('Poems')}
            className="w-full py-6 sm:py-8 bg-[#00FFC2] text-[#2D1B69] border-4 border-black rounded-3xl font-black text-xl sm:text-2xl hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000] transition-all shadow-[4px_4px_0px_0px_#000] uppercase flex items-center justify-center gap-4 group"
          >
            <Book className="w-8 h-8 group-hover:scale-110 transition-transform" />
            Poetry
          </button>

          <button 
            onClick={() => startGame('Jokes')}
            className="w-full py-6 sm:py-8 bg-[#FF0080] text-white border-4 border-black rounded-3xl font-black text-xl sm:text-2xl hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000] transition-all shadow-[4px_4px_0px_0px_#000] uppercase flex items-center justify-center gap-4 group"
          >
            <Smile className="w-8 h-8 group-hover:scale-110 transition-transform" />
            Jokes
          </button>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-sm flex flex-col relative z-0">
          
          <div className="flex justify-between items-center mb-6">
             <span className="bg-yellow-400 text-black font-black px-3 py-1 rounded-full text-xs italic uppercase">
               {gameState.category}
             </span>
             <span className="text-[#00FFC2] font-mono text-sm font-bold">
               {gameState.currentIndex + 1} / {gameState.cards.length}
             </span>
          </div>

          <div className="relative flex-1 w-full flex items-center justify-center perspective-[1000px] mt-4">
            {isGameOver ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-[#F5F5F0] text-black p-8 rounded-[32px] border-4 border-black text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] z-20"
              >
                 <h2 className="text-3xl font-black mb-4 uppercase">Round Complete</h2>
                 <div className="bg-[#FF0080] text-white p-6 rounded-2xl border-4 border-black mb-6 w-full transform -rotate-2 shadow-[8px_8px_0px_0px_#000]">
                   <p className="text-sm font-bold uppercase tracking-widest mb-1 text-white/80">Final Score</p>
                   <p className="text-4xl font-black mb-3">{correctGuesses} / {gameState.cards.length}</p>
                   <p className="text-lg font-serif italic">"I survived the Turing Test. I spotted {correctGuesses}/{gameState.cards.length} bots. Can you?"</p>
                 </div>

                 <div className="bg-[#1A0E3D] text-[#00FFC2] p-4 rounded-xl text-sm font-mono mb-8 border-2 border-black text-left w-full">
                   <p className="text-[10px] text-white/50 mb-1">SYSTEM NOTE:</p>
                   {gameState.hook_fact}
                 </div>
                 
                 <div className="flex gap-4 w-full">
                   <button 
                    onClick={handleShare}
                    className="flex-1 py-4 bg-yellow-400 text-black border-4 border-black rounded-xl font-black text-xl hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_#000] uppercase flex justify-center items-center gap-2"
                   >
                    <Share2 className="w-6 h-6" />
                    Share
                   </button>
                   <button 
                    onClick={resetGame}
                    className="flex-1 py-4 bg-[#00FFC2] text-black border-4 border-black rounded-xl font-black text-xl hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_#000] uppercase flex justify-center items-center gap-2"
                   >
                    <RefreshCw className="w-6 h-6" />
                    Play Again
                   </button>
                 </div>
              </motion.div>
            ) : (
              <div className="relative w-full aspect-[3/4] h-full max-h-[60vh]">
                <AnimatePresence mode="popLayout">
                  {gameState.cards.map((card, index) => {
                    if (index < gameState.currentIndex || index > gameState.currentIndex + 1) return null;
                    const isCurrent = index === gameState.currentIndex;
                    
                    return (
                      <SwipeableCard
                        key={card.id}
                        card={card}
                        isCurrent={isCurrent}
                        onSwipe={handleSwipe}
                        lastSwipeDirection={lastSwipeDirection}
                        showResult={showResult && isCurrent}
                        feedback={feedback}
                        onNext={nextCard}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {!isGameOver && !showResult && (
             <div className="flex gap-4 justify-center mt-12 pb-8">
               <button 
                 onClick={() => handleSwipe('left')}
                 className="flex-1 py-5 bg-[#1A0E3D] text-[#FF0080] border-4 border-[#FF0080] rounded-2xl font-black text-lg hover:bg-[#FF0080] hover:text-white transition-colors uppercase flex justify-center items-center gap-2"
               >
                 <BrainCircuit className="w-6 h-6" />
                 Bot
               </button>
               <button 
                 onClick={() => handleSwipe('right')}
                 className="flex-1 py-5 bg-[#1A0E3D] text-[#00FFC2] border-4 border-[#00FFC2] rounded-2xl font-black text-lg hover:bg-[#00FFC2] hover:text-black transition-colors uppercase flex justify-center items-center gap-2"
               >
                 <User className="w-6 h-6" />
                 Human
               </button>
             </div>
          )}
        </div>
      )}

      {/* Footer Credits */}
      <footer className="mt-auto py-8 text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs sm:text-sm font-medium">
          Built By <a href="https://harishkotra.me" target="_blank" rel="noopener noreferrer" className="text-[#00FFC2] hover:underline font-bold">Harish Kotra</a>
        </p>
        <p className="text-[10px] sm:text-xs">
          <a href="https://dailybuild.xyz" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 hover:text-[#FF0080] transition-colors">Checkout my other builds →</a>
        </p>
      </footer>
    </div>
  );
}

function LoadingPhrases() {
  const phrases = [
    "Synthesizing human-like errors...",
    "Calibrating neural synapses...",
    "Injecting existential dread...",
    "Optimizing sarcasm levels...",
    "Scanning for Turing violations...",
    "Applying organic unpredictability...",
    "Downloading simulated memories...",
    "Masking algorithmic patterns..."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <motion.span
      key={index}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
    >
      {phrases[index]}
    </motion.span>
  );
}

function SwipeableCard({ 
  card, 
  isCurrent, 
  onSwipe, 
  lastSwipeDirection,
  showResult,
  feedback,
  onNext
}: { 
  card: CardData, 
  isCurrent: boolean, 
  onSwipe: (dir: 'left' | 'right') => void, 
  lastSwipeDirection: 'left' | 'right' | null,
  showResult?: boolean,
  feedback?: {correct: boolean, note: string} | null,
  onNext?: () => void
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const aiOpacity = useTransform(x, [0, -60], [0, 1]);
  const humanOpacity = useTransform(x, [0, 60], [0, 1]);
  const overlayScale = useTransform(x, [-100, 0, 100], [1.2, 1, 1.2]);

  const handleDragEnd = (_e: any, info: any) => {
    if (showResult) return;
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const exitX = lastSwipeDirection === 'right' ? 300 : lastSwipeDirection === 'left' ? -300 : 0;

  return (
    <motion.div
      style={{
        x: isCurrent ? x : 0,
        rotate: isCurrent ? (showResult ? 0 : rotate) : (Math.random() * 4 - 2),
        zIndex: isCurrent ? 10 : 0,
        pointerEvents: isCurrent ? 'auto' : 'none'
      }}
      drag={isCurrent && !showResult ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ 
        scale: isCurrent ? 1 : 0.95, 
        y: isCurrent ? 0 : 20, 
        opacity: 1,
      }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.3 } }}
      className={cn(
        "absolute inset-0 w-full h-full p-8 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_#000] flex flex-col justify-center overflow-hidden transition-colors duration-500",
        showResult 
          ? (feedback?.correct ? "bg-green-50" : "bg-red-50") 
          : "bg-[#F5F5F0] text-black cursor-grab active:cursor-grabbing"
      )}
    >
      {isCurrent && !showResult && (
        <>
          <motion.div 
            style={{ opacity: aiOpacity, scale: overlayScale }} 
            className="absolute top-8 left-8 z-20 pointer-events-none"
          >
            <div className="border-4 border-[#FF0080] text-[#FF0080] font-black text-4xl px-4 py-1 rounded-xl bg-white/90 -rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] uppercase">
              Bot
            </div>
          </motion.div>
          <motion.div 
            style={{ opacity: humanOpacity, scale: overlayScale }} 
            className="absolute top-8 right-8 z-20 pointer-events-none"
          >
            <div className="border-4 border-[#00FFC2] text-[#00FFC2] font-black text-4xl px-4 py-1 rounded-xl bg-white/90 rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] uppercase">
              Human
            </div>
          </motion.div>
        </>
      )}

      {showResult ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center border-4 border-black mb-4",
            feedback?.correct ? "bg-[#00FFC2]" : "bg-[#FF0080]"
          )}>
            {feedback?.correct ? (
              <User className="w-10 h-10 text-black" />
            ) : (
              <BrainCircuit className="w-10 h-10 text-white" />
            )}
          </div>
          
          <h3 className={cn(
            "text-3xl font-black uppercase tracking-tight",
            feedback?.correct ? "text-green-700" : "text-red-700"
          )}>
            {feedback?.correct ? "Success!" : "Fooled!"}
          </h3>

          <div className="bg-white p-4 rounded-2xl border-4 border-black/10 w-full shadow-sm">
            <p className="text-[10px] font-black uppercase text-black/40 mb-1 tracking-[0.2em]">Bot Reason</p>
            <p className="text-xl font-bold leading-tight text-black">
              {feedback?.note}
            </p>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full py-4 bg-black text-white rounded-2xl font-black text-xl hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_#00FFC2] active:scale-95"
          >
            NEXT CARD
          </button>
        </motion.div>
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 block text-center">
            Tap buttons or swipe
          </span>
          <div className="flex-1 flex items-center justify-center my-auto w-full">
            <p className="text-xl sm:text-2xl font-serif leading-relaxed italic text-center whitespace-pre-wrap text-black">
              {JSON.stringify(card.content) !== '"{}"' && card.content.startsWith('"') && card.content.endsWith('"') ? card.content.slice(1, -1) : card.content}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
