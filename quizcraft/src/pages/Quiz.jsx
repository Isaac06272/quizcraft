import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Trophy, ArrowRight, CheckCircle2, XCircle, RotateCcw, Home as HomeIcon, Shuffle } from 'lucide-react';

// --- NEW: Helper function to scramble arrays ---
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const { questions, materialId, title, savedScore } = location.state || { questions: [] };

  // --- NEW: Display state so we can shuffle without permanently mutating the database data ---
  const [displayQuestions, setDisplayQuestions] = useState(questions);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!displayQuestions || displayQuestions.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] -z-10" />
        <div className="text-center max-w-md mx-auto p-10 bg-[#1a1333]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-3">No Quiz Found</h3>
          <p className="text-gray-400 mb-8">Please upload a document on the home page or select a quiz from your library.</p>
          <Link to="/" className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-[#0f0a1c] font-bold hover:bg-gray-200 transition-all">
            <HomeIcon size={18} /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = displayQuestions[currentQuestionIndex];

  // Auto-save the best score to Firestore
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

  // --- NEW: Advanced Restart Handler ---
  const handleRestart = (shouldShuffle = false) => {
    if (shouldShuffle) {
      // 1. Scramble the order of the questions
      // 2. Map through each question and scramble the 4 multiple-choice options!
      const scrambledQuiz = shuffleArray(questions).map(q => ({
        ...q,
        options: shuffleArray(q.options)
      }));
      setDisplayQuestions(scrambledQuiz);
    } else {
      // Reset to default original order
      setDisplayQuestions(questions);
    }
    
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  // --- SUMMARY SCREEN ---
  if (isFinished) {
    const percentage = Math.round((score / displayQuestions.length) * 100);
    
    return (
      <div className="relative max-w-2xl mx-auto mt-12 p-10 bg-[#1a1333]/80 backdrop-blur-xl rounded-3xl border border-white/10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-violet-500/20 rounded-full blur-[80px] -z-10" />

        <div className="w-24 h-24 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <Trophy size={48} />
        </div>

        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Quiz Completed!</h2>
        <p className="text-violet-300 font-medium mb-8 truncate max-w-md mx-auto">{title || "Untitled Assessment"}</p>

        <div className="bg-[#0f0a1c] border border-white/5 rounded-2xl p-8 max-w-sm mx-auto mb-10 shadow-inner">
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
            {score} <span className="text-3xl text-gray-600">/ {displayQuestions.length}</span>
          </div>
          <p className="text-base font-bold text-gray-400 uppercase tracking-widest">
            Score: <span className="text-white">{percentage}%</span>
          </p>
          {savedScore !== undefined && score > savedScore && (
            <div className="mt-4 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-4 rounded-full inline-block">
              🎉 New Best Score! (Previous: {savedScore})
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Default Retake */}
          <button 
            onClick={() => handleRestart(false)} 
            className="cursor-pointer flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all"
          >
            <RotateCcw size={18} /> Retake
          </button>

          {/* NEW: Shuffle Retake */}
          <button 
            onClick={() => handleRestart(true)} 
            className="cursor-pointer flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/50 text-violet-300 font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.1)]"
          >
            <Shuffle size={18} /> Shuffle & Retake
          </button>
          
          <button 
            onClick={() => navigate('/library')} 
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#0f0a1c] font-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            Back to Library <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ INTERFACE ---
  return (
    <div className="relative max-w-3xl mx-auto mt-8">
      {/* Ambient background glows */}
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-fuchsia-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-end mb-6 px-2">
        <div>
          <span className="text-xs uppercase tracking-widest font-black text-violet-400">Active Quiz</span>
          <h1 className="text-xl font-bold text-white mt-1 truncate max-w-xs md:max-w-md" title={title}>
            {title || "Study Assessment"}
          </h1>
        </div>
        <div className="text-sm font-bold text-gray-400 bg-[#1a1333]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
          Question <span className="text-white">{currentQuestionIndex + 1}</span> / {displayQuestions.length}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-[#1a1333] border border-white/5 rounded-full mb-8 overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentQuestionIndex + 1) / displayQuestions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-[#1a1333]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-10 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options Stack */}
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const isWrongAndSelected = isSelected && !isCorrect;

            let optionStyles = "border-white/10 bg-white/5 text-gray-300 hover:border-violet-500/50 hover:bg-violet-500/10";
            
            if (isAnswerSubmitted) {
              if (isCorrect) {
                optionStyles = "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold shadow-[0_0_20px_rgba(16,185,129,0.1)]";
              } else if (isWrongAndSelected) {
                optionStyles = "border-rose-500 bg-rose-500/10 text-rose-300 font-bold";
              } else {
                optionStyles = "border-white/5 bg-transparent text-gray-500 opacity-50 cursor-not-allowed";
              }
            } else if (isSelected) {
              optionStyles = "border-violet-500 bg-violet-500/20 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.2)]";
            }

            return (
              <button
                key={index}
                disabled={isAnswerSubmitted}
                onClick={() => handleOptionClick(option)}
                className={`cursor-pointer w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${optionStyles}`}
              >
                <span className="pr-4 text-lg">{option}</span>
                {isAnswerSubmitted && isCorrect && <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />}
                {isAnswerSubmitted && isWrongAndSelected && <XCircle className="text-rose-400 shrink-0" size={24} />}
              </button>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-8 border-t border-white/10 flex justify-end">
          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`cursor-pointer px-8 py-4 rounded-xl font-black text-lg transition-all ${
                selectedAnswer 
                  ? "bg-white text-[#0f0a1c] hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-1" 
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="cursor-pointer flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-lg hover:shadow-[0_0_25px_rgba(217,70,239,0.4)] hover:-translate-y-1 transition-all"
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