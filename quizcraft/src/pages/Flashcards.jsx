import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCw, Home as HomeIcon, Shuffle } from 'lucide-react';

export default function Flashcards() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { cards, title } = location.state || { cards: [] };
  
  // --- NEW: Local state for the deck so we can shuffle it ---
  const [displayCards, setDisplayCards] = useState(cards);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!displayCards || displayCards.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[100px] -z-10" />
        <div className="text-center max-w-md mx-auto p-10 bg-[#1a1333]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-3">No Flashcards Found</h3>
          <p className="text-gray-400 mb-8">Please upload a document to generate a study deck.</p>
          <Link to="/" className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-[#0f0a1c] font-bold hover:bg-gray-200 transition-all">
            <HomeIcon size={18} /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < displayCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  // --- NEW: Shuffle Function ---
  const handleShuffle = () => {
    // We use sort with Math.random() to scramble the array locally
    const shuffledDeck = [...displayCards].sort(() => Math.random() - 0.5);
    setDisplayCards(shuffledDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = displayCards[currentIndex];

  return (
    <div className="relative max-w-4xl mx-auto mt-8 p-4">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <button 
          onClick={() => navigate('/library')} 
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1333]/80 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold w-fit"
        >
          <ArrowLeft size={18} /> Back to Library
        </button>
        <div className="text-left md:text-right">
          <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-1">Interactive Deck</p>
          <h2 className="text-xl font-bold text-white truncate max-w-xs md:max-w-md">{title || "Study Set"}</h2>
        </div>
      </div>

      {/* Flashcard Area */}
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        {/* 3D Container */}
        <div 
          className="w-full max-w-3xl h-[22rem] md:h-96 cursor-pointer group [perspective:1000px]"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Inner Card handling the rotation */}
          <div 
            className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] shadow-[0_0_50px_rgba(0,0,0,0.4)] rounded-3xl ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            
            {/* Front Face (Question) */}
            <div className="absolute inset-0 bg-[#1a1333]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center [backface-visibility:hidden] hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-violet-500" />
              <span className="absolute top-8 left-8 text-xs font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20">
                Question
              </span>
              <p className="text-2xl md:text-4xl font-extrabold text-center text-white leading-snug">
                {currentCard.question}
              </p>
              <div className="absolute bottom-8 text-gray-500 flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-full backdrop-blur-md">
                <RotateCw size={16} /> Tap to flip card
              </div>
            </div>

            {/* Back Face (Answer) */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-[#1a1333] border border-violet-500/30 rounded-3xl p-10 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-fuchsia-500" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
              <span className="absolute top-8 left-8 text-xs font-black uppercase tracking-widest text-fuchsia-300 bg-fuchsia-500/20 px-4 py-1.5 rounded-full border border-fuchsia-500/20">
                Answer
              </span>
              <div className="w-full h-full flex items-center justify-center pt-8">
                <p className="text-xl md:text-3xl text-center text-fuchsia-50 font-semibold leading-relaxed overflow-y-auto max-h-full scrollbar-hide">
                  {currentCard.answer}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-12 w-full max-w-lg justify-between bg-[#1a1333]/50 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`cursor-pointer p-4 rounded-xl flex items-center justify-center transition-all ${
              currentIndex === 0 
                ? 'bg-transparent text-gray-600 cursor-not-allowed' 
                : 'bg-white/10 text-white hover:bg-white hover:text-[#0f0a1c] shadow-lg'
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex flex-col items-center">
            <div className="text-center font-black text-gray-300 tracking-widest mb-1">
              {currentIndex + 1} <span className="text-gray-600 mx-2">/</span> {displayCards.length}
            </div>
            
            {/* NEW: Shuffle Button integrated into controls */}
            <button
              onClick={handleShuffle}
              className="cursor-pointer flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-fuchsia-400 transition-colors bg-white/5 px-3 py-1 rounded-full"
            >
              <Shuffle size={12} /> Shuffle Deck
            </button>
          </div>

          <button 
            onClick={handleNext}
            disabled={currentIndex === displayCards.length - 1}
            className={`cursor-pointer p-4 rounded-xl flex items-center justify-center transition-all ${
              currentIndex === displayCards.length - 1 
                ? 'bg-transparent text-gray-600 cursor-not-allowed' 
                : 'bg-white/10 text-white hover:bg-white hover:text-[#0f0a1c] shadow-lg'
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}