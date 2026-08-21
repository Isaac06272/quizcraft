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

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-saffron/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saffron animate-spin"></div>
          </div>
          <p className="font-body text-body-base text-ink-soft">Loading workshop...</p>
        </div>
      </div>
    );
  }

  const handleStartGeneration = async (userSettings) => {
    setIsGenerating(true);
    setForgeStatus("Analyzing material...");

    try {
      const formData = new FormData();
      formData.append('file', userSettings.file);
      formData.append('studyMode', userSettings.studyMode);
      formData.append('itemCount', userSettings.itemCount);

      // Simulate progressive forge status
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

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-8">
      {isGenerating ? (
        <div className="w-full max-w-2xl animate-slide-up">
          {/* Forging Animation */}
          <div className="card-paper p-10 sm:p-12 text-center relative overflow-hidden">
            {/* Ambient embers */}
            <div className="absolute inset-0 pointer-events-none">
              <span className="ember text-2xl top-[20%] left-[15%] animate-ember-rise" style={{ animationDelay: '0s' }}>✦</span>
              <span className="ember text-xl top-[30%] right-[20%] animate-ember-rise" style={{ animationDelay: '0.3s' }}>❓</span>
              <span className="ember text-lg top-[40%] left-[25%] animate-ember-rise" style={{ animationDelay: '0.6s' }}>✎</span>
              <span className="ember text-xl top-[25%] right-[30%] animate-ember-rise" style={{ animationDelay: '0.9s' }}>✦</span>
              <span className="ember text-sm top-[50%] left-[35%] animate-ember-rise" style={{ animationDelay: '1.2s' }}>📖</span>
              <span className="ember text-lg top-[35%] right-[15%] animate-ember-rise" style={{ animationDelay: '1.5s' }}>✦</span>
            </div>

            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-saffron/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saffron border-r-saffron animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wand2 size={32} className="text-saffron animate-status-pulse" />
              </div>
            </div>

            <h2 className="font-display text-display-sm text-ink mb-2">Forging Your Material</h2>
            <p className="font-body text-body-sm text-ink-soft mb-8 animate-status-pulse" aria-live="polite">{forgeStatus}</p>

            <div className="forge-progress mx-auto max-w-md" role="progressbar" aria-label="Generation progress">
              <div className="forge-progress-fill animate-forge-heat" style={{ width: '40%', transformOrigin: 'left center' }}></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full animate-slide-up flex flex-col items-center">
          {/* Hero */}
          <div className="text-center max-w-4xl mx-auto mb-6">
            <p className="font-mono text-label text-verdigris mb-2">Workshop</p>
            <h1 className="font-display text-display-lg text-ink mb-3">
              Forge Knowledge from<br />
              <span className="text-verdigris">Raw Documents</span>
            </h1>
            <p className="font-body text-body-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
              Drop your lecture notes, slides, or readings. QuizCraft extracts the core concepts and crafts them into interactive study tools — quizzes and flashcards built for recall.
            </p>
          </div>

          {/* Main Work Surface */}
          <div className="w-full">
            {currentUser ? (
              <UploadSection onStart={handleStartGeneration} />
            ) : (
              <div className="card-paper max-w-3xl mx-auto p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-saffron/10 text-saffron rounded-tool flex items-center justify-center border border-saffron/20">
                  <Lock size={28} />
                </div>
                <h2 className="font-display text-display-sm text-ink mb-3">Unlock the Forge</h2>
                <p className="font-body text-body-base text-ink-soft max-w-md mx-auto mb-8">
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

          {/* Features Strip */}
          {!currentUser && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto w-full">
              <div className="card-paper p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-verdigris/10 text-verdigris rounded-tool flex items-center justify-center">
                  <ScrollText size={24} />
                </div>
                <h3 className="font-display text-display-sm text-ink mb-2">Upload</h3>
                <p className="font-body text-body-sm text-ink-soft">PDF, TXT, or DOCX — we read the source.</p>
              </div>
              <div className="card-paper p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-saffron/10 text-saffron-dim rounded-tool flex items-center justify-center">
                  <Wand2 size={24} />
                </div>
                <h3 className="font-display text-display-sm text-ink mb-2">Forge</h3>
                <p className="font-body text-body-sm text-ink-soft">AI extracts concepts into precise questions.</p>
              </div>
              <div className="card-paper p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-verdigris/10 text-verdigris rounded-tool flex items-center justify-center">
                  <Folder size={24} />
                </div>
                <h3 className="font-display text-display-sm text-ink mb-2">Store</h3>
                <p className="font-body text-body-sm text-ink-soft">Keep every set on your personal rack.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVE MATERIAL MODAL */}
      {saveModalData && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSaveModalData(null)}>
          <div className="modal-surface">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-parchment-dim">
                <div className="p-3 bg-verdigris/10 rounded-tool text-verdigris">
                  <FolderPlus size={28} />
                </div>
                <div>
                  <h3 className="font-display text-display-sm text-ink">Store Material</h3>
                  <p className="font-body text-body-sm text-ink-soft mt-1">Organize your newly forged study set.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-label text-ink-soft mb-3">Select Subject Folder</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`flex items-center gap-3 p-4 rounded-tool cursor-pointer transition-all duration-fast ease-craft ${
                          selectedFolderId === folder.id
                            ? 'bg-verdigris/15 border border-verdigris text-ink'
                            : 'bg-vellum border border-transparent hover:bg-parchment-dim/30'
                        }`}
                        role="radio"
                        aria-checked={selectedFolderId === folder.id}
                      >
                        <Folder size={18} className={selectedFolderId === folder.id ? 'text-verdigris' : 'text-ink-soft'} />
                        <span className={selectedFolderId === folder.id ? 'font-bold' : ''}>
                          {folder.name}
                        </span>
                      </div>
                    ))}

                    <div
                      onClick={() => setSelectedFolderId('new')}
                      className={`flex items-center gap-3 p-4 rounded-tool cursor-pointer transition-all duration-fast ease-craft ${
                        selectedFolderId === 'new'
                          ? 'bg-saffron/15 border border-saffron text-ink'
                          : 'bg-vellum border border-transparent hover:bg-parchment-dim/30'
                      }`}
                      role="radio"
                      aria-checked={selectedFolderId === 'new'}
                    >
                      <Plus size={18} className={selectedFolderId === 'new' ? 'text-saffron-dim' : 'text-ink-soft'} />
                      <span className={selectedFolderId === 'new' ? 'font-bold' : ''}>
                        Create New Subject
                      </span>
                    </div>
                  </div>
                </div>

                {selectedFolderId === 'new' && (
                  <div className="animate-slide-up">
                    <label className="block font-label text-ink-soft mb-2">Subject Name</label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g., Computer Architecture"
                      className="input-field"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-parchment-dim">
                <button
                  onClick={() => setSaveModalData(null)}
                  disabled={isSaving}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="btn-forge"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin"></span>
                      Storing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save size={18} /> Store & Open
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}