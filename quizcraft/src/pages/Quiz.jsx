import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Trophy, ArrowRight, CheckCircle2, XCircle, RotateCcw, Home as HomeIcon, RotateCw, ArrowLeft } from 'lucide-react';

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const { questions, materialId, title, savedScore, isShuffled } = location.state || { questions: [] };

  const [displayQuestions, setDisplayQuestions] = useState(() => {
    if (isShuffled && questions) {
      return shuffleArray(questions).map(q => ({
        ...q,
        options: shuffleArray(q.options)
      }));
    }
    return questions;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!displayQuestions || displayQuestions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card-paper max-w-md mx-auto p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-saffron/10 text-saffron-dim rounded-tool flex items-center justify-center">
            <RotateCw size={28} />
          </div>
          <h3 className="font-display text-display-sm text-ink mb-3">No Quiz Forged</h3>
          <p className="font-body text-body-base text-ink-soft mb-8">Forge a quiz from your documents on the workbench, or select one from your rack.</p>
          <Link to="/" className="btn-forge inline-flex items-center justify-center gap-2 w-full">
            <HomeIcon size={18} /> Return to Workbench
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = displayQuestions[currentQuestionIndex];

  useEffect(() => {
    if (isFinished && materialId) {
      const saveScoreToDb = async () => {
        try {
          const materialRef = doc(db, 'materials', materialId);
          if (savedScore === undefined || savedScore === null || score > savedScore) {
            await updateDoc(materialRef, { score: score });
          }
        } catch (error) {
          console.error("Error saving score to Firestore:", error);
        }
      };
      saveScoreToDb();
    }
  }, [isFinished, materialId, score, savedScore]);

  const handleOptionClick = (option) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    if (currentQuestionIndex + 1 < displayQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const percentage = Math.round((score / displayQuestions.length) * 100);

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card-paper max-w-2xl w-full p-10 relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-saffron via-verdigris to-saffron" />

          <div className="w-20 h-20 mx-auto mb-6 bg-saffron/10 text-saffron-dim rounded-tool flex items-center justify-center border border-saffron/20 shadow-[0_0_30px_-4px_rgba(232,168,56,0.3)]">
            <Trophy size={40} />
          </div>

          <h2 className="font-display text-display-md text-ink mb-2 text-center">Quiz Complete</h2>
          <p className="font-body text-body-base text-ink-soft text-center mb-8 truncate max-w-md mx-auto">{title || "Untitled Assessment"}</p>

          <div className="bg-charcoal-wash/50 border border-parchment-dim rounded-surface p-8 max-w-md mx-auto mb-10">
            <div className="font-display text-5xl text-ink mb-2 text-center">
              <span className="text-saffron">{score}</span> <span className="text-ink-soft">/ {displayQuestions.length}</span>
            </div>
            <p className="font-label text-center text-ink-soft">
              Score: <span className="text-ink">{percentage}%</span>
            </p>
            {savedScore !== undefined && score > savedScore && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tool font-mono text-xs font-medium bg-saffron/15 text-saffron-dim border border-saffron/30">
                  <span className="relative">
                    <span className="absolute inset-0 bg-saffron/20 rounded-full animate-pulse"></span>
                    <span className="relative">New Best Score!</span>
                  </span>
                  <span>(Previous: {savedScore})</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="btn-ghost flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Retake
            </button>

            <button
              onClick={() => navigate('/library')}
              className="btn-verdigris flex items-center justify-center gap-2"
            >
              Back to Rack <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="animate-slide-in-left">
          <span className="font-label text-verdigris mb-1 block">
            {isShuffled ? "Active Quiz (Shuffled)" : "Active Quiz"}
          </span>
          <h1 className="font-display text-display-sm text-ink truncate max-w-xs md:max-w-md" title={title}>
            {title || "Study Assessment"}
          </h1>
        </div>
        <div className="bg-charcoal-wash/50 border border-parchment-dim rounded-tool px-4 py-2 font-body text-sm font-bold text-ink-soft">
          Question <span className="text-ink">{currentQuestionIndex + 1}</span> / {displayQuestions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-charcoal-wash/30 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-verdigris to-saffron transition-all duration-500 ease-craft"
          style={{ width: `${((currentQuestionIndex + 1) / displayQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="card-paper p-6 md:p-8 animate-slide-up relative overflow-hidden">
        {/* Question */}
        <h3 className="font-display text-display-sm text-ink mb-8 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const isWrongAndSelected = isSelected && !isCorrect;

            let optionStyles = `
              border-parchment-dim bg-vellum text-ink-soft
              hover:border-verdigris/50 hover:bg-verdigris/5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdigris focus-visible:ring-offset-2 focus-visible:ring-offset-white
            `;

            if (isAnswerSubmitted) {
              if (isCorrect) {
                optionStyles = `
                  border-verdigris bg-verdigris/10 text-verdigris font-bold
                  shadow-[0_0_20px_-4px_rgba(74,124,124,0.2)]
                `;
              } else if (isWrongAndSelected) {
                optionStyles = `
                  border-rose-500 bg-rose-500/10 text-rose-600 font-bold
                `;
              } else {
                optionStyles = `
                  border-parchment-dim/50 bg-transparent text-ink-soft/50 cursor-not-allowed
                `;
              }
            } else if (isSelected) {
              optionStyles = `
                border-saffron bg-saffron/15 text-ink font-bold
                shadow-[0_0_20px_-4px_rgba(232,168,56,0.2)]
              `;
            }

            return (
              <button
                key={index}
                disabled={isAnswerSubmitted}
                onClick={() => handleOptionClick(option)}
                className={`
                  cursor-pointer w-full text-left p-4 md:p-5 rounded-tool border-2 transition-all duration-base ease-craft
                  flex items-center justify-between group ${optionStyles}
                `}
              >
                <span className="pr-4 text-base md:text-lg font-body">{option}</span>
                {isAnswerSubmitted && isCorrect && (
                  <CheckCircle2 className="text-verdigris shrink-0" size={24} aria-label="Correct answer" />
                )}
                {isAnswerSubmitted && isWrongAndSelected && (
                  <XCircle className="text-rose-500 shrink-0" size={24} aria-label="Incorrect answer" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-parchment-dim flex justify-end">
          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`
                cursor-pointer px-8 py-3 md:py-4 rounded-tool font-bold text-lg transition-all duration-base ease-craft
                ${selectedAnswer
                  ? 'btn-forge'
                  : 'bg-vellum text-ink-soft cursor-not-allowed'
                }
              `}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="btn-verdigris flex items-center gap-2"
            >
              {currentQuestionIndex + 1 === displayQuestions.length ? "Finish Quiz" : "Next Question"}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}