import { useState } from 'react';
import UploadSection from '../components/UploadSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Check if user is logged in
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartGeneration = async (userSettings) => {
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', userSettings.file);
      formData.append('studyMode', userSettings.studyMode);
      formData.append('itemCount', userSettings.itemCount);

      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const generatedData = await response.json();
      let materialId = null;

      // --- NEW: Save to Firestore if logged in ---
      if (currentUser) {
        try {
          const docRef = await addDoc(collection(db, 'materials'), {
            userId: currentUser.uid,
            title: userSettings.file.name,
            type: userSettings.studyMode,
            data: generatedData,
            createdAt: serverTimestamp(),
            score: 0, // Default score
            totalItems: userSettings.itemCount
          });
          materialId = docRef.id; // Save the database ID so we can update the score later
        } catch (dbError) {
          console.error("Error saving to database:", dbError);
        }
      }

      // Navigate and pass the data PLUS the new database ID
      if (userSettings.studyMode === 'quiz') {
        navigate('/quiz', { state: { questions: generatedData, materialId, title: userSettings.file.name } });
      } else {
        navigate('/flashcards', { state: { cards: generatedData, materialId, title: userSettings.file.name } });
      }
      
    } catch (error) {
      console.error("Generation Error:", error);
      alert("Something went wrong generating your material. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center mt-32 space-y-6">
          <div className="w-16 h-16 border-4 border-card border-t-primary rounded-full animate-spin"></div>
          <h2 className="text-2xl font-bold text-white animate-pulse">Analyzing your document...</h2>
          <p className="text-gray-400">Crafting personalized questions using AI.</p>
        </div>
      ) : (
        <>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Master Any Subject with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI-Powered</span> Learning
            </h1>
            <p className="text-lg text-gray-400">
              Upload your notes, PDFs, or lecture slides. We'll automatically generate custom quizzes and flashcards to help you retain information faster.
            </p>
          </div>
          <UploadSection onStart={handleStartGeneration} />
        </>
      )}
    </>
  );
}