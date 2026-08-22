import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileQuestion, Trophy, ArrowRight, Trash2, AlertTriangle, Search, Folder, ChevronLeft, FolderPlus, FolderOutput, LayoutGrid, Shuffle } from 'lucide-react';

export default function Library() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeFolder, setActiveFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [shuffleToggles, setShuffleToggles] = useState({});

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, materialId: null });
  const [createFolderModal, setCreateFolderModal] = useState({ isOpen: false, name: '' });
  const [moveModal, setMoveModal] = useState({ isOpen: false, materialId: null, currentFolderId: null });

  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize

    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const foldersQuery = query(collection(db, 'folders'), where("userId", "==", currentUser.uid));
        const foldersSnapshot = await getDocs(foldersQuery);
        const fetchedFolders = [];
        foldersSnapshot.forEach((doc) => fetchedFolders.push({ id: doc.id, ...doc.data() }));
        fetchedFolders.sort((a, b) => a.name.localeCompare(b.name));

        const materialsQuery = query(collection(db, 'materials'), where("userId", "==", currentUser.uid));
        const materialsSnapshot = await getDocs(materialsQuery);
        const fetchedMaterials = [];
        materialsSnapshot.forEach((doc) => fetchedMaterials.push({ id: doc.id, ...doc.data() }));
        fetchedMaterials.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

        setFolders(fetchedFolders);
        setMaterials(fetchedMaterials);
      } catch (error) {
        console.error("Error fetching library data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, authLoading]);

  const handleOpenMaterial = (material, isShuffled = false) => {
    if (material.type === 'quiz') {
      navigate('/quiz', { state: { questions: material.data, materialId: material.id, title: material.title, savedScore: material.score, isShuffled } });
    } else {
      navigate('/flashcards', { state: { cards: material.data, materialId: material.id, title: material.title, isShuffled } });
    }
  };

  const toggleShuffle = (e, materialId) => {
    e.stopPropagation();
    setShuffleToggles(prev => ({
      ...prev,
      [materialId]: !prev[materialId]
    }));
  };

  const triggerDelete = (e, materialId) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, materialId: materialId });
  };

  const confirmDelete = async () => {
    if (!deleteModal.materialId) return;
    try {
      await deleteDoc(doc(db, 'materials', deleteModal.materialId));
      setMaterials((prev) => prev.filter((item) => item.id !== deleteModal.materialId));
      setDeleteModal({ isOpen: false, materialId: null });
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!createFolderModal.name.trim()) return;
    try {
      const newFolderName = createFolderModal.name.trim();
      const folderRef = await addDoc(collection(db, 'folders'), {
        name: newFolderName,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      const newFolders = [...folders, { id: folderRef.id, name: newFolderName }];
      newFolders.sort((a, b) => a.name.localeCompare(b.name));
      setFolders(newFolders);
      setCreateFolderModal({ isOpen: false, name: '' });
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder.");
    }
  };

  const triggerMove = (e, material) => {
    e.stopPropagation();
    setMoveModal({ isOpen: true, materialId: material.id, currentFolderId: material.folderId || 'uncategorized' });
  };

  const confirmMove = async (targetFolderId, targetFolderName) => {
    try {
      const isUncategorized = targetFolderId === 'uncategorized';
      await updateDoc(doc(db, 'materials', moveModal.materialId), {
        folderId: isUncategorized ? null : targetFolderId,
        folderName: isUncategorized ? "Uncategorized" : targetFolderName
      });
      setMaterials((prev) => prev.map((m) =>
        m.id === moveModal.materialId
          ? { ...m, folderId: isUncategorized ? null : targetFolderId, folderName: isUncategorized ? "Uncategorized" : targetFolderName }
          : m
      ));
      setMoveModal({ isOpen: false, materialId: null, currentFolderId: null });
    } catch (error) {
      console.error("Error moving material:", error);
      alert("Failed to move material.");
    }
  };

  const uncategorizedMaterials = materials.filter(m => !m.folderId);
  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const displayedMaterials = activeFolder
    ? materials.filter(m => {
        const matchesFolder = activeFolder.id === 'uncategorized' ? !m.folderId : m.folderId === activeFolder.id;
        const matchesSearch = (m.title || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' ? true : activeTab === 'quiz' ? m.type === 'quiz' : m.type !== 'quiz';
        return matchesFolder && matchesSearch && matchesTab;
      })
    : [];

  if (authLoading || loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-saffron/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saffron animate-spin"></div>
        </div>
        <p className="font-body text-body-base text-ink-soft">Loading your rack...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 min-h-[60vh]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-parchment-dim pb-3 mb-4 gap-4 transition-all">
        <div className="flex-1">
          {activeFolder ? (
            <div className="animate-slide-up">
              <button
                onClick={() => { setActiveFolder(null); setSearchQuery(''); setActiveTab('all'); }}
                className="flex items-center gap-2 text-verdigris hover:text-saffron-dim font-body font-medium mb-3 transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} /> Back to Folders
              </button>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Folder className="text-verdigris" size={28} />
                  <h2 className="font-display text-display-md text-ink">{activeFolder.name}</h2>
                </div>

                <div className="flex items-center bg-charcoal-wash/50 p-1 rounded-tool border border-parchment-dim w-fit">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-[3px] text-sm font-bold transition-all duration-base ease-craft ${
                      activeTab === 'all' ? 'bg-verdigris text-parchment shadow-[0_2px_8px_-2px_rgba(74,124,124,0.3)]' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    <LayoutGrid size={14} /> All
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`cursor-pointer flex items-center gap-2 px-5 py-2 rounded-[3px] text-sm font-bold transition-all duration-base ease-craft ${
                      activeTab === 'quiz' ? 'bg-verdigris text-parchment shadow-[0_2_8px_-2px_rgba(74,124,124,0.3)]' : 'text-ink-soft hover:text-verdigris'
                    }`}
                  >
                    <FileQuestion size={16} /> Quizzes
                  </button>
                  <button
                    onClick={() => setActiveTab('flashcards')}
                    className={`cursor-pointer flex items-center gap-2 px-5 py-2 rounded-[3px] text-sm font-bold transition-all duration-base ease-craft ${
                      activeTab === 'flashcards' ? 'bg-saffron text-ink shadow-[0_2px_8px_-2px_rgba(232,168,56,0.3)]' : 'text-ink-soft hover:text-saffron-dim'
                    }`}
                  >
                    <BookOpen size={16} /> Cards
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-slide-up flex items-center gap-4">
              <div>
                <p className="font-mono text-label text-verdigris mb-1">Your Collection</p>
                <h2 className="font-display text-display-md text-ink">Material Rack</h2>
              </div>
              <button
                onClick={() => setCreateFolderModal({ isOpen: true, name: '' })}
                className="cursor-pointer p-3 bg-verdigris/10 hover:bg-verdigris/20 text-verdigris border border-verdigris/30 hover:border-verdigris/50 rounded-tool transition-all duration-base ease-craft hover:shadow-[0_0_15px_-4px_rgba(74,124,124,0.3)]"
                title="Create New Subject Folder"
              >
                <FolderPlus size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        {activeFolder && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder={`     Search in ${activeFolder?.name || 'subjects'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        )}
      </div>

      {/* --- VIEW 1: FOLDER GRID --- */}
      {!activeFolder && (
        <>
          {folders.length === 0 && uncategorizedMaterials.length === 0 ? (
            <div className="card-paper border-dashed border-parchment-dim/50 empty-state">
              <div className="empty-state-icon">
                <FolderOpen />
              </div>
              <h3 className="empty-state-title">Rack is empty</h3>
              <p className="empty-state-text">No materials forged yet. Head to the workbench to craft your first study set.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map((folder) => {
                const itemCount = materials.filter(m => m.folderId === folder.id).length;
                return (
                  <div
                    key={folder.id}
                    onClick={() => { setActiveFolder(folder); setSearchQuery(''); setActiveTab('all'); }}
                    className="card-paper p-6 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-verdigris to-saffron transform scale-x-0 group-hover:scale-x-100 transition-transform duration-base ease-craft origin-left" />

                    <div className="w-12 h-12 bg-verdigris/10 rounded-tool flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-base ease-craft">
                      <Folder className="text-verdigris" size={24} />
                    </div>
                    <h3 className="font-display text-display-sm text-ink mb-1 truncate">{folder.name}</h3>
                    <p className="font-body text-body-sm text-ink-soft">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                  </div>
                );
              })}

              {uncategorizedMaterials.length > 0 && (
                <div
                  onClick={() => { setActiveFolder({ id: 'uncategorized', name: 'Uncategorized' }); setSearchQuery(''); setActiveTab('all'); }}
                  className="card-paper border-dashed border-parchment-dim/50 p-6 cursor-pointer group hover:shadow-paper-hover transition-all duration-base ease-craft"
                >
                  <div className="w-12 h-12 bg-ink-soft/10 rounded-tool flex items-center justify-center mb-4">
                    <Folder className="text-ink-soft/60" size={24} />
                  </div>
                  <h3 className="font-display text-display-sm text-ink-soft mb-1">Uncategorized</h3>
                  <p className="font-body text-body-sm text-ink-soft/60">{uncategorizedMaterials.length} {uncategorizedMaterials.length === 1 ? 'item' : 'items'}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* --- VIEW 2: MATERIALS GRID --- */}
      {activeFolder && (
        <div className="animate-slide-up">
          {displayedMaterials.length === 0 ? (
            <div className="card-paper border-dashed border-parchment-dim/50 empty-state">
              <div className="empty-state-icon">
                <FileQuestion />
              </div>
              <h3 className="empty-state-title">Nothing here yet</h3>
              <p className="empty-state-text">
                {activeTab !== 'all' ? `No ${activeTab === 'quiz' ? 'quizzes' : 'flashcards'} forged in this folder.` : "No materials in this folder yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {displayedMaterials.map((item) => {
                const isShuffled = !!shuffleToggles[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenMaterial(item, isShuffled)}
                    className="card-paper p-6 cursor-pointer group relative overflow-hidden animate-slide-up"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-verdigris to-saffron transform scale-x-0 group-hover:scale-x-100 transition-transform duration-base ease-craft origin-left" />

                    {/* Card Actions */}
                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                      <button
                        onClick={(e) => toggleShuffle(e, item.id)}
                        className={`cursor-pointer p-2 rounded-full transition-all duration-base ease-craft ${
                          isShuffled
                            ? 'text-saffron bg-saffron/15 hover:bg-saffron/25 shadow-[0_0_10px_-2px_rgba(232,168,56,0.3)]'
                            : 'text-ink-soft/50 hover:text-saffron hover:bg-saffron/10'
                        }`}
                        title={isShuffled ? "Shuffle Mode: ON" : "Turn Shuffle Mode ON"}
                        aria-label={isShuffled ? "Shuffle mode on" : "Turn shuffle mode on"}
                      >
                        <Shuffle size={18} />
                      </button>
                      <button
                        onClick={(e) => triggerMove(e, item)}
                        className="cursor-pointer p-2 text-ink-soft/50 hover:text-verdigris hover:bg-verdigris/10 rounded-full transition-all duration-base ease-craft"
                        title="Move Material"
                        aria-label="Move material"
                      >
                        <FolderOutput size={18} />
                      </button>
                      <button
                        onClick={(e) => triggerDelete(e, item.id)}
                        className="cursor-pointer p-2 text-ink-soft/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all duration-base ease-craft"
                        title="Delete Material"
                        aria-label="Delete material"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-verdigris pr-16">
                      {item.type === 'quiz' ? <FileQuestion size={20} /> : <BookOpen size={20} />}
                    </div>

                    <h3 className="font-display text-display-sm text-ink mb-2 truncate" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="font-body text-body-sm text-ink-soft mb-6">{item.totalItems} items forged</p>

                    <div className="flex items-center justify-between border-t border-parchment-dim pt-4">
                      {item.type === 'quiz' ? (
                        <div className="flex items-center gap-2 text-saffron-dim font-body text-sm font-medium">
                          <Trophy size={16} />
                          {item.score ? `Best: ${item.score}/${item.totalItems}` : 'Not taken'}
                        </div>
                      ) : (
                        <div className="font-body text-body-sm text-ink-soft">Interactive Deck</div>
                      )}
                      <ArrowRight size={18} className="text-ink-soft/50 group-hover:text-verdigris transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {createFolderModal.isOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCreateFolderModal({ isOpen: false, name: '' })}>
          <div className="modal-surface">
            <div className="p-6">
              <h3 className="font-display text-display-sm text-ink mb-4">New Subject Folder</h3>
              <input
                type="text"
                autoFocus
                value={createFolderModal.name}
                onChange={(e) => setCreateFolderModal({ ...createFolderModal, name: e.target.value })}
                placeholder="e.g., Biology 101"
                className="input-field mb-6"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreateFolderModal({ isOpen: false, name: '' })} className="btn-ghost">Cancel</button>
                <button onClick={handleCreateFolder} className="btn-verdigris">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOVE MODAL */}
      {moveModal.isOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setMoveModal({ isOpen: false, materialId: null, currentFolderId: null })}>
          <div className="modal-surface">
            <div className="p-6">
              <h3 className="font-display text-display-sm text-ink mb-2">Move Material</h3>
              <p className="font-body text-body-sm text-ink-soft mb-4">Select a destination folder.</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-6">
                {moveModal.currentFolderId !== 'uncategorized' && (
                  <button onClick={() => confirmMove('uncategorized', 'Uncategorized')} className="cursor-pointer w-full text-left flex items-center gap-3 p-3 rounded-tool border border-parchment-dim hover:bg-vellum hover:border-verdigris/50 transition-all duration-base ease-craft font-body text-ink-soft">
                    <Folder size={18} className="text-ink-soft/60" /> Uncategorized
                  </button>
                )}
                {folders.filter(f => f.id !== moveModal.currentFolderId).map((folder) => (
                  <button key={folder.id} onClick={() => confirmMove(folder.id, folder.name)} className="cursor-pointer w-full text-left flex items-center gap-3 p-3 rounded-tool border border-parchment-dim hover:bg-verdigris/10 hover:border-verdigris/50 transition-all duration-base ease-craft font-body text-ink">
                    <Folder size={18} className="text-verdigris" /> {folder.name}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setMoveModal({ isOpen: false, materialId: null, currentFolderId: null })} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteModal({ isOpen: false, materialId: null })}>
          <div className="modal-surface border-t-4 border-t-rose-500">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-rose-500/10 rounded-tool text-rose-500"><AlertTriangle size={24} /></div>
                <h3 className="font-display text-display-sm text-ink">Delete Material</h3>
              </div>
              <p className="font-body text-body-base text-ink-soft mb-8 ml-2">This will permanently remove the study material from your rack. This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, materialId: null })} className="btn-ghost">Cancel</button>
                <button onClick={confirmDelete} className="btn-verdigris bg-rose-600 hover:bg-rose-700 text-white" style={{ backgroundColor: '#dc2626' }}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Local import to avoid re-import at top
import { FolderOpen } from 'lucide-react';