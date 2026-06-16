import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

export default function Flashcards() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the real flashcards we passed from Home.jsx
  const { cards } = location.state || { cards: [] };
  
  // If no cards exist (e.g., they reloaded the page manually), send them home
  if (!cards || cards.length === 0) {
    navigate('/');
    return null;
  }
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false); // Reset flip state before changing card
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150); // slight delay for smoother transition
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-white">Review Mode</h2>
          <p className="text-primary font-medium mt-1">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
      </div>

      {/* Flashcard Area */}
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        {/* 3D Container */}
        <div 
          className="w-full max-w-2xl h-80 cursor-pointer group [perspective:1000px]"
          onClick={handleFlip}
        >
          {/* Inner Card handling the rotation */}
          <div 
            className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] shadow-2xl rounded-2xl ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            
            {/* Front Face (Question) */}
            <div className="absolute inset-0 bg-card border-2 border-purple-900/50 rounded-2xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] hover:border-primary/50 transition-colors">
              <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">Question</span>
              <p className="text-2xl md:text-3xl font-medium text-center leading-relaxed">
                {currentCard.question}
              </p>
              <div className="absolute bottom-6 text-gray-500 flex items-center gap-2 text-sm animate-pulse">
                <RotateCw size={16} /> Tap to flip
              </div>
            </div>

            {/* Back Face (Answer) */}
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background border-2 border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Answer</span>
              <p className="text-xl md:text-2xl text-center text-gray-200 leading-relaxed overflow-y-auto max-h-full scrollbar-hide">
                {currentCard.answer}
              </p>
            </div>

          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mt-12">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-4 rounded-full flex items-center justify-center transition-all ${
              currentIndex === 0 
                ? 'bg-card text-gray-600 cursor-not-allowed border border-purple-900/30' 
                : 'bg-card text-white hover:bg-primary hover:scale-110 shadow-[0_0_15px_rgba(217,70,239,0.1)] hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] border border-purple-900/50'
            }`}
          >
            <ChevronLeft size={28} />
          </button>

          <div className="w-32 h-2 bg-card rounded-full overflow-hidden border border-purple-900/30">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            ></div>
          </div>

          <button 
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className={`p-4 rounded-full flex items-center justify-center transition-all ${
              currentIndex === cards.length - 1 
                ? 'bg-card text-gray-600 cursor-not-allowed border border-purple-900/30' 
                : 'bg-card text-white hover:bg-primary hover:scale-110 shadow-[0_0_15px_rgba(217,70,239,0.1)] hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] border border-purple-900/50'
            }`}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}