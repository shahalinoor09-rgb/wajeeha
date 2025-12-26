
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, Difficulty, GameStatus, Card, GameStats } from './types';
import { EMOJIS, GRID_CONFIGS, PREVIEW_TIME } from './constants';
import CardItem from './components/CardItem';
import { Trophy, Timer, Move, RotateCcw, Play, Brain, Grid2X2 } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MATCHING);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [stats, setStats] = useState<GameStats>({ moves: 0, time: 0, matches: 0 });
  const [previewTimer, setPreviewTimer] = useState<number>(PREVIEW_TIME);
  
  // Fix: Use number for timer references in browser environment instead of NodeJS.Timeout
  const timerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const initializeGame = useCallback(() => {
    const config = GRID_CONFIGS[difficulty];
    const selectedEmojis = shuffleArray(EMOJIS).slice(0, config.pairs);
    const gameEmojiPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffledGameEmojis = shuffleArray(gameEmojiPairs);

    const initialCards: Card[] = shuffledGameEmojis.map((emoji, index) => ({
      id: index,
      content: emoji,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(initialCards);
    setStats({ moves: 0, time: 0, matches: 0 });
    setSelectedIndices([]);
    
    // Fix: Explicitly use window.clearInterval for clarity in browser environment
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (previewTimerRef.current) window.clearInterval(previewTimerRef.current);

    if (mode === GameMode.REMEMBER) {
      setStatus(GameStatus.PREVIEW);
      setPreviewTimer(PREVIEW_TIME);
      // Flip all cards for preview
      setCards(prev => prev.map(c => ({ ...c, isFlipped: true })));
    } else {
      setStatus(GameStatus.PLAYING);
      startMainTimer();
    }
  }, [difficulty, mode]);

  const startMainTimer = () => {
    // Fix: Cast setInterval return to number for web compatibility
    timerRef.current = window.setInterval(() => {
      setStats(prev => ({ ...prev, time: prev.time + 1 }));
    }, 1000) as unknown as number;
  };

  useEffect(() => {
    if (status === GameStatus.PREVIEW) {
      // Fix: Cast setInterval return to number for web compatibility
      previewTimerRef.current = window.setInterval(() => {
        setPreviewTimer(prev => {
          if (prev <= 1) {
            if (previewTimerRef.current) window.clearInterval(previewTimerRef.current);
            setCards(prevCards => prevCards.map(c => ({ ...c, isFlipped: false })));
            setStatus(GameStatus.PLAYING);
            startMainTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    }
    return () => {
      if (previewTimerRef.current) window.clearInterval(previewTimerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (stats.matches === GRID_CONFIGS[difficulty].pairs && status === GameStatus.PLAYING) {
      setStatus(GameStatus.FINISHED);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }, [stats.matches, difficulty, status]);

  const handleCardClick = (id: number) => {
    if (status !== GameStatus.PLAYING) return;
    if (selectedIndices.length === 2) return;
    
    const clickedCard = cards[id];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    const newIndices = [...selectedIndices, id];
    setSelectedIndices(newIndices);

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    if (newIndices.length === 2) {
      setStats(prev => ({ ...prev, moves: prev.moves + 1 }));
      const [firstIdx, secondIdx] = newIndices;
      
      if (cards[firstIdx].content === cards[secondIdx].content) {
        // Match found
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setStats(prev => ({ ...prev, matches: prev.matches + 1 }));
          setSelectedIndices([]);
        }, 500);
      } else {
        // Not a match
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setSelectedIndices([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-4xl w-full text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
          <Brain className="text-indigo-600 w-10 h-10" />
          ZenMatch <span className="text-indigo-600">Pro</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Sharpen your mind, one pair at a time.</p>
      </header>

      {/* Settings & Controls */}
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {Object.values(GameMode).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                disabled={status !== GameStatus.IDLE && status !== GameStatus.FINISHED}
              >
                {m} Mode
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {Object.values(Difficulty).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${difficulty === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                disabled={status !== GameStatus.IDLE && status !== GameStatus.FINISHED}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === GameStatus.IDLE || status === GameStatus.FINISHED ? (
            <button
              onClick={initializeGame}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
            >
              <Play size={20} /> Start Game
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to restart?')) {
                  initializeGame();
                }
              }}
              className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all"
            >
              <RotateCcw size={20} /> Restart
            </button>
          )}
        </div>
      </div>

      {/* Stats Board */}
      {status !== GameStatus.IDLE && (
        <div className="max-w-4xl w-full grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="bg-blue-50 p-2 rounded-full mb-1">
              <Move className="text-blue-600 w-5 h-5" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Moves</span>
            <span className="text-xl font-extrabold text-slate-800">{stats.moves}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="bg-orange-50 p-2 rounded-full mb-1">
              <Timer className="text-orange-600 w-5 h-5" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Time</span>
            <span className="text-xl font-extrabold text-slate-800">{formatTime(stats.time)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="bg-green-50 p-2 rounded-full mb-1">
              <Grid2X2 className="text-green-600 w-5 h-5" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pairs</span>
            <span className="text-xl font-extrabold text-slate-800">{stats.matches} / {GRID_CONFIGS[difficulty].pairs}</span>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="w-full max-w-4xl flex-grow flex items-center justify-center relative">
        {status === GameStatus.IDLE ? (
          <div className="text-center py-20 px-8 bg-white rounded-3xl border-2 border-dashed border-slate-300 w-full max-w-lg">
            <Brain className="mx-auto w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-600">Ready to play?</h3>
            <p className="text-slate-400 mt-2 mb-8">Select your difficulty and mode above to start your memory journey.</p>
            <button 
              onClick={initializeGame}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Initialize Game
            </button>
          </div>
        ) : (
          <div 
            className="grid gap-4 w-full"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_CONFIGS[difficulty].cols}, minmax(0, 1fr))` 
            }}
          >
            {cards.map(card => (
              <CardItem 
                key={card.id} 
                card={card} 
                onClick={handleCardClick}
                disabled={status !== GameStatus.PLAYING}
              />
            ))}
          </div>
        )}

        {/* Overlays */}
        {status === GameStatus.PREVIEW && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-3xl pointer-events-none">
            <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">Remember them!</span>
              <span className="text-5xl font-black">{previewTimer}</span>
            </div>
          </div>
        )}

        {status === GameStatus.FINISHED && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-3xl animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-sm w-full mx-4 transform scale-100">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-yellow-200">
                <Trophy size={48} fill="currentColor" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Excellent Work!</h2>
              <p className="text-slate-500 mb-6">You've mastered this board with incredible focus.</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-8 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moves</p>
                  <p className="text-2xl font-black text-slate-800">{stats.moves}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</p>
                  <p className="text-2xl font-black text-slate-800">{formatTime(stats.time)}</p>
                </div>
              </div>

              <button 
                onClick={initializeGame}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <Play size={20} /> Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-12 text-slate-400 text-sm font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Smooth Animations</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div> Responsive Design</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Multi-Mode</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
