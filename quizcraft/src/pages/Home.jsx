import { useState, useEffect } from 'react';
import UploadSection from '../components/UploadSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, logInWithGoogle } from '../firebase'; // IMPORTED logInWithGoogle HERE
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { FolderPlus, Save, Folder, Plus, Lock } from 'lucide-react'; // ADDED Lock ICON

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [folders, setFolders] = useState([]);
  const [saveModalData, setSaveModalData] = useState(null); 
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
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
    }
  }, [currentUser]);

  const handleStartGeneration = async (userSettings) => {
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', userSettings.file);
      formData.append('studyMode', userSettings.studyMode);
      formData.append('itemCount', userSettings.itemCount);

      const response = await fetch('https://quizcraft-backend-yoca.onrender.com/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const generatedData = await response.json();

      if (currentUser) {
        setSaveModalData({ generatedData, userSettings });
        setIsGenerating(false); 
      } else {
        navigate(
          userSettings.studyMode === 'quiz' ? '/quiz' : '/flashcards', 
          { state: { questions: generatedData, cards: generatedData, title: userSettings.file.name } }
        );
      }
      
    } catch (error) {
      console.error("Generation Error:", error);
      alert("Something went wrong generating your material. Please try again.");
      setIsGenerating(false);
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

  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center -mt-10 md:-mt-4">
      <div className="absolute top-0 left-[-5%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-[-5%] w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

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
        <div className="w-full animate-fade-in-up flex flex-col items-center">
          
          <div className="text-center max-w-4xl mx-auto mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              Master Any Subject with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-300% animate-gradient">
                AI-Powered Learning
              </span>
            </h1>
          </div>
          
          <div className="w-full">
            {/* --- NEW: CONDITIONAL RENDERING BASED ON LOGIN STATUS --- */}
            {currentUser ? (
              <UploadSection onStart={handleStartGeneration} />
            ) : (
              <div className="max-w-3xl mx-auto mt-4 p-10 bg-[#1a1333]/80 backdrop-blur-xl border border-white/10 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                <div className="w-20 h-20 bg-violet-500/10 text-violet-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-500/20">
                  <Lock size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-3">Unlock AI Generation</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                  Sign in to upload your documents, generate custom study sets, and save them permanently to your personal library.
                </p>
                <button
                  onClick={logInWithGoogle}
                  className="cursor-pointer px-8 py-4 rounded-xl bg-white text-[#0f0a1c] font-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-1"
                >
                  Sign In to Continue
                </button>
              </div>
            )}
            {/* -------------------------------------------------------- */}
          </div>

          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto text-center mt-6 leading-relaxed">
            Upload your lecture slides, notes, or reading materials. We automatically extract the core concepts and generate interactive study sets.
          </p>

        </div>
      )}

      {saveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a1333] border border-purple-900/50 rounded-3xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(139,92,246,0.15)] transform transition-all">
            
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
              <div className="p-3 bg-violet-500/10 rounded-full text-violet-400">
                <FolderPlus size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Save Material</h3>
                <p className="text-gray-400 text-sm mt-1">Organize your newly generated study set.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                  Select Subject Folder
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {folders.map((folder) => (
                    <div 
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedFolderId === folder.id 
                          ? 'bg-violet-500/20 border-violet-500 shadow-inner' 
                          : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <Folder size={18} className={selectedFolderId === folder.id ? 'text-violet-400' : 'text-gray-500'} />
                      <span className={selectedFolderId === folder.id ? 'text-white font-bold' : 'text-gray-300'}>
                        {folder.name}
                      </span>
                    </div>
                  ))}

                  <div 
                    onClick={() => setSelectedFolderId('new')}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                      selectedFolderId === 'new' 
                        ? 'bg-fuchsia-500/20 border-fuchsia-500 shadow-inner' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <Plus size={18} className={selectedFolderId === 'new' ? 'text-fuchsia-400' : 'text-gray-500'} />
                    <span className={selectedFolderId === 'new' ? 'text-white font-bold' : 'text-gray-300'}>
                      Create New Subject
                    </span>
                  </div>
                </div>
              </div>

              {selectedFolderId === 'new' && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-bold text-gray-300 mb-2">Subject Name</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Computer Architecture"
                    className="w-full bg-[#0b0914] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all placeholder-gray-600"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => setSaveModalData(null)}
                disabled={isSaving}
                className="cursor-pointer px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-white text-[#0f0a1c] hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0f0a1c] border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={18} /> Save & Start
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}