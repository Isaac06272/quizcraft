import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Trophy, ArrowRight, CheckCircle2, XCircle, RotateCcw, Home as HomeIcon } from 'lucide-react';

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the passed state from React Router
  const { questions, materialId, title, savedScore } = location.state || { questions: [] };

  // State Management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Fallback if someone navigates directly to /quiz without any state
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center mt-32 max-w-md mx-auto p-6 bg-card rounded-2xl border border-purple-900/30">
        <h3 className="text-xl font-bold text-white mb-2">No Quiz Found</h3>
        <p className="text-gray-400 mb-6">Please upload a document on the home page or select a quiz from your library.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity">
          <HomeIcon size={18} /> Go Home
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Auto-save the best score to Firestore when the quiz finishes
  useEffect(() => {
    if (isFinished && materialId) {
      const saveScoreToDb = async () => {
        try {
          const materialRef = doc(db, 'materials', materialId);
          // Only overwrite if there is no previous score, or if the current score is higher
          if (savedScore === undefined || savedScore === null || score > savedScore) {
            await updateDoc(materialRef, { score: score });
            console.log("New high score saved successfully!");
          }
        } catch (error) {
          console.error("Error saving score to Firestore:", error);
        }
      };
      saveScoreToDb();
    }
  }, [isFinished, materialId, score, savedScore]);

  const handleOptionClick = (option) => {
    if (isAnswerSubmitted) return; // Lock inputs after submitting
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

    if (currentQuestionIndex + 1 < questions.length) {
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

  // --- 1. SUMMARY SCREEN ---
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="max-w-2xl mx-auto mt-8 p-8 bg-card rounded-2xl border border-purple-900/30 text-center shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
          <Trophy size={40} />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">Quiz Completed!</h2>
        <p className="text-gray-400 mb-6 truncate max-w-md mx-auto">{title || "Untitled Assessment"}</p>

        <div className="bg-background/50 border border-purple-900/20 rounded-xl p-6 max-w-sm mx-auto mb-8">
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            {score} / {questions.length}
          </div>
          <p className="text-sm font-medium text-gray-300">
            You scored <span className="text-primary font-bold">{percentage}%</span>
          </p>
          {savedScore !== undefined && score > savedScore && (
            <div className="mt-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1 px-3 rounded-full inline-block">
              🎉 New Best Score! (Previous Best: {savedScore})
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-card border border-purple-700 hover:bg-purple-900/20 text-white font-semibold transition-colors"
          >
            <RotateCcw size={18} /> Retake Quiz
          </button>
          
          <button
            onClick={() => navigate('/library')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(217,70,239,0.2)]"
          >
            Back to Library <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- 2. ACTIVE QUIZ INTERFACE ---
  return (
    <div className="max-w-3xl mx-auto mt-4">
      {/* Top Progress Meter */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-primary">Active Quiz</span>
          <h1 className="text-lg font-bold text-gray-300 truncate max-w-xs md:max-w-md" title={title}>
            {title || "Study Assessment"}
          </h1>
        </div>
        <div className="text-sm font-semibold text-gray-400 bg-card border border-purple-900/30 px-3 py-1 rounded-full">
          Question <span className="text-white font-bold">{currentQuestionIndex + 1}</span> of {questions.length}
        </div>
      </div>

      {/* Progress Bar track */}
      <div className="w-full h-2 bg-purple-950/40 border border-purple-900/20 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-card border border-purple-900/30 rounded-2xl p-6 md:p-8 shadow-xl">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options Stack */}
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const isWrongAndSelected = isSelected && !isCorrect;

            // Compute structural styles depending on whether the answer has been submitted
            let optionStyles = "border-purple-900/40 bg-background/30 text-gray-200 hover:border-primary/50 hover:bg-primary/5";
            
            if (isAnswerSubmitted) {
              if (isCorrect) {
                optionStyles = "border-emerald-500 bg-emerald-500/10 text-emerald-200 font-medium";
              } else if (isWrongAndSelected) {
                optionStyles = "border-red-500 bg-red-500/10 text-red-200";
              } else {
                optionStyles = "border-purple-900/20 bg-background/10 text-gray-500 cursor-not-allowed";
              }
            } else if (isSelected) {
              optionStyles = "border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(217,70,239,0.1)]";
            }

            return (
              <button
                key={index}
                disabled={isAnswerSubmitted}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left p-5 rounded-xl border text-base transition-all duration-200 flex items-center justify-between group ${optionStyles}`}
              >
                <span className="pr-4">{option}</span>
                
                {/* Visual Status Icons */}
                {isAnswerSubmitted && isCorrect && <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />}
                {isAnswerSubmitted && isWrongAndSelected && <XCircle className="text-red-400 shrink-0" size={20} />}
              </button>
            );
          })}
        </div>

        {/* Footer Navigation Panel */}
        <div className="mt-8 pt-6 border-t border-purple-900/20 flex justify-end">
          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                selectedAnswer 
                  ? "bg-primary text-white hover:opacity-95 shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer" 
                  : "bg-purple-950/40 border border-purple-900/40 text-purple-400 cursor-not-allowed"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-95 shadow-[0_0_15px_rgba(217,70,239,0.2)] transition-all"
            >
              {currentQuestionIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"} 
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}