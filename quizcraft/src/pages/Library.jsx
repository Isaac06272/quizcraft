import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileQuestion, Trophy, ArrowRight, Trash2, AlertTriangle, Search, Folder, ChevronLeft, FolderPlus, FolderOutput } from 'lucide-react';

export default function Library() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // States for data
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for UI navigation & modals
  const [activeFolder, setActiveFolder] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, materialId: null });
  
  // --- NEW STATES FOR FOLDERS AND MOVING ---
  const [createFolderModal, setCreateFolderModal] = useState({ isOpen: false, name: '' });
  const [moveModal, setMoveModal] = useState({ isOpen: false, materialId: null, currentFolderId: null });

  useEffect(() => {
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
  }, [currentUser, navigate]);

  const handleOpenMaterial = (material) => {
    if (material.type === 'quiz') {
      navigate('/quiz', { state: { questions: material.data, materialId: material.id, title: material.title, savedScore: material.score } });
    } else {
      navigate('/flashcards', { state: { cards: material.data, materialId: material.id, title: material.title } });
    }
  };

  // --- DELETE LOGIC ---
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

  // --- NEW: CREATE FOLDER LOGIC ---
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

  // --- NEW: MOVE MATERIAL LOGIC ---
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

      // Update local state so it immediately disappears from current folder
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

  // --- FILTERING LOGIC ---
  const uncategorizedMaterials = materials.filter(m => !m.folderId);
  
  const filteredFolders = folders.filter((folder) => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayedMaterials = activeFolder 
    ? materials.filter(m => 
        (activeFolder.id === 'uncategorized' ? !m.folderId : m.folderId === activeFolder.id) && 
        (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) return <div className="text-center mt-32 text-gray-400">Loading your library...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-8 p-6 relative min-h-[60vh]">
      
      {/* HEADER WITH DYNAMIC SEARCH BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-purple-900/30 pb-6 mb-8 gap-4 transition-all">
        <div>
          {activeFolder ? (
            <div className="animate-fade-in-up">
              <button 
                onClick={() => { setActiveFolder(null); setSearchQuery(''); }}
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 font-bold mb-4 transition-colors"
              >
                <ChevronLeft size={20} /> Back to Folders
              </button>
              <div className="flex items-center gap-3">
                <Folder className="text-violet-500" size={32} />
                <h2 className="text-4xl font-extrabold text-white">{activeFolder.name}</h2>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up flex items-center gap-4">
              <div>
                <h2 className="text-4xl font-extrabold text-white">My Library</h2>
                <p className="text-gray-400 mt-2">Organize and review your generated study sets.</p>
              </div>
              
              {/* --- NEW: CREATE FOLDER ICON BUTTON --- */}
              <button 
                onClick={() => setCreateFolderModal({ isOpen: true, name: '' })}
                className="p-3 bg-violet-500/10 hover:bg-violet-500/30 text-violet-400 border border-violet-500/20 hover:border-violet-500/50 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                title="Create New Subject Folder"
              >
                <FolderPlus size={24} />
              </button>
            </div>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder={activeFolder ? `Search in ${activeFolder.name}...` : "Search subjects..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1333] border border-purple-900/50 text-white placeholder-gray-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
          />
        </div>
      </div>

      {/* --- VIEW 1: FOLDER GRID --- */}
      {!activeFolder && (
        <>
          {folders.length === 0 && uncategorizedMaterials.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-purple-900/50">
              <p className="text-gray-400 text-lg">Your library is empty. Go generate some study materials!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map((folder) => {
                const itemCount = materials.filter(m => m.folderId === folder.id).length;
                return (
                  <div 
                    key={folder.id} 
                    onClick={() => { setActiveFolder(folder); setSearchQuery(''); }}
                    className="bg-[#1a1333]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-violet-500 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Folder className="text-violet-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 truncate">{folder.name}</h3>
                    <p className="text-gray-400 text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                  </div>
                );
              })}

              {uncategorizedMaterials.length > 0 && (
                <div 
                  onClick={() => { setActiveFolder({ id: 'uncategorized', name: 'Uncategorized' }); setSearchQuery(''); }}
                  className="bg-[#1a1333]/50 backdrop-blur-md border border-dashed border-gray-600 rounded-2xl p-6 hover:border-gray-400 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Folder className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-300 mb-1">Uncategorized</h3>
                  <p className="text-gray-500 text-sm">{uncategorizedMaterials.length} {uncategorizedMaterials.length === 1 ? 'item' : 'items'}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}


      {/* --- VIEW 2: MATERIALS GRID (Inside a Folder) --- */}
      {activeFolder && (
        <div className="animate-fade-in-up">
          {displayedMaterials.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-purple-900/50">
              <p className="text-gray-400 text-lg">No materials found here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedMaterials.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleOpenMaterial(item)}
                  className="relative bg-card border border-purple-900/50 rounded-2xl p-6 hover:border-primary transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]"
                >
                  {/* --- CARD ACTIONS (Top Right) --- */}
                  <div className="absolute top-4 right-4 flex gap-1 z-10">
                    <button
                      onClick={(e) => triggerMove(e, item)}
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                      title="Move Material"
                    >
                      <FolderOutput size={18} />
                    </button>
                    <button
                      onClick={(e) => triggerDelete(e, item.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Material"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4 text-primary pr-16">
                    {item.type === 'quiz' ? <FileQuestion size={24} /> : <BookOpen size={24} />}
                    <span className="font-bold uppercase tracking-wider text-xs bg-primary/10 px-3 py-1 rounded-full">
                      {item.type}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">{item.totalItems} items generated</p>
                  
                  <div className="flex items-center justify-between border-t border-purple-900/30 pt-4">
                    {item.type === 'quiz' ? (
                      <div className="flex items-center gap-2 text-yellow-500 font-medium text-sm">
                        <Trophy size={16} /> 
                        {item.score ? `Best Score: ${item.score}/${item.totalItems}` : 'Not taken yet'}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Interactive Deck</div>
                    )}
                    <ArrowRight size={18} className="text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Create Folder Modal */}
      {createFolderModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1333] border border-purple-900/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(139,92,246,0.15)] animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-4">Create New Subject</h3>
            <input
              type="text"
              autoFocus
              value={createFolderModal.name}
              onChange={(e) => setCreateFolderModal({ ...createFolderModal, name: e.target.value })}
              placeholder="e.g., Biology 101"
              className="w-full bg-[#0b0914] border border-white/10 text-white rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-violet-500 transition-all"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCreateFolderModal({ isOpen: false, name: '' })}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Move Material Modal */}
      {moveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1333] border border-purple-900/50 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Move Material</h3>
            <p className="text-gray-400 text-sm mb-4">Select a destination folder.</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar mb-6">
              {/* Option to move to Uncategorized */}
              {moveModal.currentFolderId !== 'uncategorized' && (
                <button
                  onClick={() => confirmMove('uncategorized', 'Uncategorized')}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-gray-500 transition-all text-gray-300"
                >
                  <Folder size={18} className="text-gray-500" /> Uncategorized
                </button>
              )}

              {/* Mapped Folders */}
              {folders.filter(f => f.id !== moveModal.currentFolderId).map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => confirmMove(folder.id, folder.name)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all text-gray-200"
                >
                  <Folder size={18} className="text-violet-400" /> {folder.name}
                </button>
              ))}
              
              {folders.length <= 1 && moveModal.currentFolderId !== 'uncategorized' && (
                <p className="text-gray-500 text-sm text-center py-4">No other folders available.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setMoveModal({ isOpen: false, materialId: null, currentFolderId: null })}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1525] border border-red-900/50 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(239,68,68,0.15)] transform transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Material</h3>
            </div>
            <p className="text-gray-400 mb-8 ml-2">
              Are you sure you want to permanently delete this study material? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, materialId: null })}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg shadow-red-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}