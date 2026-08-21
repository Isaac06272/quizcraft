import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCw, Home as HomeIcon } from 'lucide-react';

export default function Flashcards() {
  const location = useLocation();
  const navigate = useNavigate();

  const { cards, title, isShuffled } = location.state || { cards: [] };

  const [displayCards, setDisplayCards] = useState(() => {
    if (isShuffled && cards) {
      return [...cards].sort(() => Math.random() - 0.5);
    }
    return cards;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!displayCards || displayCards.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card-paper max-w-md mx-auto p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-saffron/10 text-saffron-dim rounded-tool flex items-center justify-center">
            <RotateCw size={28} />
          </div>
          <h3 className="font-display text-display-sm text-ink mb-3">No Cards Forged</h3>
          <p className="font-body text-body-base text-ink-soft mb-8">Forge a flashcard deck from your documents on the workbench, or select one from your rack.</p>
          <Link to="/" className="btn-forge inline-flex items-center justify-center gap-2 w-full">
            <HomeIcon size={18} /> Return to Workbench
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

  const currentCard = displayCards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-slide-in-left">
        <button
          onClick={() => navigate('/library')}
          className="btn-ghost flex items-center gap-2 w-fit"
        >
          <ArrowLeft size={18} /> Back to Rack
        </button>
        <div className="text-left md:text-right flex-1">
          <p className="font-label text-verdigris mb-1">
            {isShuffled ? "Interactive Deck (Shuffled)" : "Interactive Deck"}
          </p>
          <h2 className="font-display text-display-sm text-ink truncate max-w-xs md:max-w-md">{title || "Study Set"}</h2>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[450px]">
        {/* The Card */}
        <div
          className="w-full max-w-3xl h-[22rem] md:h-96 cursor-pointer group [perspective:1000px]"
          onClick={() => setIsFlipped(!isFlipped)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFlipped(!isFlipped); } }}
          aria-label={isFlipped ? "Show question" : "Show answer"}
        >
          <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] shadow-paper rounded-surface ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

            {/* Front Face - Question */}
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm border border-parchment-dim rounded-surface p-8 flex flex-col items-center justify-center [backface-visibility:hidden] hover:border-verdigris/50 hover:shadow-paper-hover transition-all duration-base ease-craft">
              <div className="absolute top-0 left-0 right-0 h-1 bg-verdigris" />

              <span className="absolute top-6 left-6 font-label text-verdigris bg-verdigris/10 px-3 py-1 rounded-tool border border-verdigris/20">
                Question
              </span>

              <p className="font-display text-display-sm md:text-display-md font-bold text-center text-ink leading-snug my-auto">
                {currentCard.question}
              </p>

              <div className="absolute bottom-6 text-ink-soft/50 flex items-center gap-2 text-sm font-body bg-vellum px-4 py-2 rounded-tool backdrop-blur-sm border border-parchment-dim">
                <RotateCw size={16} /> Tap or press Space to flip
              </div>
            </div>

            {/* Back Face - Answer */}
            <div className="absolute inset-0 bg-charcoal-wash border border-verdigris/30 rounded-surface [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-saffron z-20" />
              <div className="absolute inset-0 bg-verdigris-texture pointer-events-none opacity-10 z-0" />

              <div className="relative z-10 absolute top-4 left-4">
                <span className="font-label text-saffron-dim bg-saffron/15 px-3 py-1 rounded-tool border border-saffron/20">
                  Answer
                </span>
              </div>

              <div className="relative z-10 flex-1 w-full flex items-center justify-center overflow-hidden">
                <div className="w-full max-h-full overflow-y-auto scrollbar-hide px-6 py-4 pt-12">
                  <p className="font-body text-body-lg md:text-display-sm text-center text-vellum leading-relaxed whitespace-pre-wrap break-words">
                    {currentCard.answer}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-6 mt-10 w-full max-w-sm justify-between bg-charcoal-wash/50 p-3 rounded-tool border border-parchment-dim backdrop-blur-sm">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`
              cursor-pointer p-3 rounded-tool flex items-center justify-center transition-all duration-base ease-craft
              ${currentIndex === 0
                ? 'bg-transparent text-ink-soft/30 cursor-not-allowed'
                : 'bg-vellum text-ink hover:bg-white hover:shadow-paper'
              }
            `}
            aria-label="Previous card"
            aria-disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex-1 text-center font-body text-lg font-medium text-ink-soft tracking-widest">
            <span className="text-ink">{currentIndex + 1}</span> <span className="mx-2">/</span> {displayCards.length}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === displayCards.length - 1}
            className={`
              cursor-pointer p-3 rounded-tool flex items-center justify-center transition-all duration-base ease-craft
              ${currentIndex === displayCards.length - 1
                ? 'bg-transparent text-ink-soft/30 cursor-not-allowed'
                : 'bg-vellum text-ink hover:bg-white hover:shadow-paper'
              }
            `}
            aria-label="Next card"
            aria-disabled={currentIndex === displayCards.length - 1}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}