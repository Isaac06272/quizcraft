import { useState, useEffect } from 'react';
import UploadSection from '../components/UploadSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logInWithGoogle } from '../firebase';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { FolderPlus, Save, Folder, Plus, Lock, ScrollText, Wand2, User } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [forgeStatus, setForgeStatus] = useState('');
  const [folders, setFolders] = useState([]);
  const [saveModalData, setSaveModalData] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (loading || !currentUser) return;

    const fetchFolders = async () => {
      try {
        const q = query(collection(db, 'folders'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const folderList = [];
        snapshot.forEach((doc) => folderList.push({ id: doc.id, ...doc.data() }));
        folderList.sort((a, b) => a.name.localeCompare(b.name));

        setFolders(folderList);
        if (folderList.length > 0) {
          setSelectedFolderId(folderList[0].id);
        } else {
          setSelectedFolderId('new');
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };
    fetchFolders();
  }, [currentUser, loading]);

  const handleStartGeneration = async (userSettings) => {
    setIsGenerating(true);
    setForgeStatus("Analyzing material...");

    try {
      const formData = new FormData();
      formData.append('file', userSettings.file);
      formData.append('studyMode', userSettings.studyMode);
      formData.append('itemCount', userSettings.itemCount);

      const statusTimer = setTimeout(() => setForgeStatus("Extracting concepts..."), 800);
      const statusTimer2 = setTimeout(() => setForgeStatus("Structuring questions..."), 1600);
      const statusTimer3 = setTimeout(() => setForgeStatus("Polishing answers..."), 2400);

      const response = await fetch('https://quizcraft-backend-yoca.onrender.com/api/generate', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(statusTimer);
      clearTimeout(statusTimer2);
      clearTimeout(statusTimer3);

      if (!response.ok) throw new Error("Failed to generate content");

      const generatedData = await response.json();

      if (currentUser) {
        setSaveModalData({ generatedData, userSettings });
        setIsGenerating(false);
        setForgeStatus('');
      } else {
        navigate(
          userSettings.studyMode === 'quiz' ? '/quiz' : '/flashcards',
          { state: { questions: generatedData, cards: generatedData, title: userSettings.file.name } }
        );
      }

    } catch (error) {
      console.error("Generation Error:", error);
      setIsGenerating(false);
      setForgeStatus('');
      alert("The forge failed. Check your file and try again.");
    }
  };

  const handleConfirmSave = async () => {
    if (selectedFolderId === 'new' && !newFolderName.trim()) {
      alert("Please enter a name for your new subject folder.");
      return;
    }

    setIsSaving(true);
    try {
      let finalFolderId = selectedFolderId;
      let finalFolderName = "";

      if (selectedFolderId === 'new') {
        const folderRef = await addDoc(collection(db, 'folders'), {
          name: newFolderName.trim(),
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        finalFolderId = folderRef.id;
        finalFolderName = newFolderName.trim();
        setFolders([...folders, { id: finalFolderId, name: finalFolderName }]);
      } else {
        const existingFolder = folders.find(f => f.id === selectedFolderId);
        finalFolderName = existingFolder ? existingFolder.name : "Uncategorized";
      }

      const docRef = await addDoc(collection(db, 'materials'), {
        userId: currentUser.uid,
        folderId: finalFolderId,
        folderName: finalFolderName,
        title: saveModalData.userSettings.file.name,
        type: saveModalData.userSettings.studyMode,
        data: saveModalData.generatedData,
        createdAt: serverTimestamp(),
        score: 0,
        totalItems: saveModalData.userSettings.itemCount
      });

      const isQuiz = saveModalData.userSettings.studyMode === 'quiz';
      navigate(isQuiz ? '/quiz' : '/flashcards', {
        state: {
          questions: isQuiz ? saveModalData.generatedData : undefined,
          cards: !isQuiz ? saveModalData.generatedData : undefined,
          materialId: docRef.id,
          title: saveModalData.userSettings.file.name
        }
      });

    } catch (error) {
      console.error("FIREBASE ERROR - Failed to save material:", error);
      alert("Failed to save to database. Proceeding without saving.");
    } finally {
      setIsSaving(false);
      setSaveModalData(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-saffron/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saffron border-r-saffron animate-spin"></div>
          </div>
          <p className="font-body text-body-base text-ink-soft">Loading workshop...</p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center w-full max-w-2xl mx-auto animate-slide-up">
        <div className="card-paper p-8 sm:p-10 text-center relative overflow-hidden w-full">
          <div className="absolute inset-0 pointer-events-none">
            <span className="ember text-2xl top-[15%] left-[10%] animate-ember-rise" style={{ animationDelay: '0s' }}>✦</span>
            <span className="ember text-xl top-[25%] right-[15%] animate-ember-rise" style={{ animationDelay: '0.3s' }}>❓</span>
            <span className="ember text-lg top-[35%] left-[20%] animate-ember-rise" style={{ animationDelay: '0.6s' }}>✎</span>
            <span className="ember text-xl top-[20%] right-[25%] animate-ember-rise" style={{ animationDelay: '0.9s' }}>✦</span>
            <span className="ember text-sm top-[45%] left-[30%] animate-ember-rise" style={{ animationDelay: '1.2s' }}>📖</span>
            <span className="ember text-lg top-[30%] right-[10%] animate-ember-rise" style={{ animationDelay: '1.5s' }}>✦</span>
          </div>

          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-saffron/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saffron border-r-saffron animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Wand2 size={28} className="text-saffron animate-status-pulse" />
            </div>
          </div>

          <h2 className="font-display text-display-sm text-ink mb-2">Forging Your Material</h2>
          <p className="font-body text-body-sm text-ink-soft mb-6 animate-status-pulse" aria-live="polite">{forgeStatus}</p>

          <div className="forge-progress mx-auto max-w-md" role="progressbar" aria-label="Generation progress">
            <div className="forge-progress-fill animate-forge-heat" style={{ width: '40%', transformOrigin: 'left center' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col items-center justify-center gap-4 px-4 animate-slide-up">

      {/* Hero - compact */}
      <div className="text-center max-w-2xl mx-auto flex-shrink-0">
        <p className="font-mono text-label text-verdigris mb-1">Workshop</p>
        <h1 className="font-display text-display-lg text-ink mb-2 leading-tight">
          Forge Knowledge from<br />
          <span className="text-verdigris">Raw Documents</span>
        </h1>
        <p className="font-body text-body-base text-ink-soft max-w-lg mx-auto leading-snug">
          Drop your lecture notes, slides, or readings. QuizCraft extracts the core concepts and crafts them into interactive study tools.
        </p>
      </div>

      {/* Main Work Surface - Tile Minimized with max-w-2xl */}
      <div className="w-full max-w-2xl flex-shrink-0">
        {currentUser ? (
          <UploadSection onStart={handleStartGeneration} />
        ) : (
          <div className="card-paper w-full p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-saffron/10 text-saffron rounded-tool flex items-center justify-center border border-saffron/20">
              <Lock size={24} />
            </div>
            <h2 className="font-display text-display-sm text-ink mb-2">Unlock the Forge</h2>
            <p className="font-body text-body-base text-ink-soft max-w-md mx-auto mb-6">
              Sign in to upload documents, forge custom study sets, and keep them on your rack permanently.
            </p>
            <button
              onClick={logInWithGoogle}
              className="btn-forge"
            >
              <span className="flex items-center gap-2">
                <User size={18} aria-hidden="true" />
                Sign In to Begin
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}