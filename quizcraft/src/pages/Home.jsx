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

      // Save to Firestore if logged in
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
          materialId = docRef.id; 
        } catch (dbError) {
          console.error("FIREBASE ERROR - Failed to save:", dbError);
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
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center mt-12 space-y-8 bg-[#1a1333]/50 backdrop-blur-xl p-16 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white mb-2">Analyzing Material...</h2>
            <p className="text-violet-300">The AI is crafting your personalized study set.</p>
          </div>
        </div>
      ) : (
        <div className="w-full animate-fade-in-up">
          <div className="text-center max-w-4xl mx-auto mb-16 pt-8">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
              Master Any Subject with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-300% animate-gradient">
                AI-Powered Learning
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Upload your lecture slides, notes, or reading materials. We automatically extract the core concepts and generate interactive study sets.
            </p>
          </div>
          <UploadSection onStart={handleStartGeneration} />
        </div>
      )}
    </div>
  );
}