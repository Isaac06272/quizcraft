import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileQuestion, Trophy, ArrowRight, Trash2, AlertTriangle, Search, Folder, ChevronLeft } from 'lucide-react';

export default function Library() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // States for data
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for UI navigation & modals
  const [activeFolder, setActiveFolder] = useState(null); // null = viewing folders, object = viewing materials
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, materialId: null });

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch all folders for this user
        const foldersQuery = query(collection(db, 'folders'), where("userId", "==", currentUser.uid));
        const foldersSnapshot = await getDocs(foldersQuery);
        const fetchedFolders = [];
        foldersSnapshot.forEach((doc) => fetchedFolders.push({ id: doc.id, ...doc.data() }));
        fetchedFolders.sort((a, b) => a.name.localeCompare(b.name));

        // 2. Fetch all materials for this user
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

  const triggerDelete = (e, materialId) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, materialId: materialId });
  };

  const confirmDelete = async () => {
    const idToDelete = deleteModal.materialId;
    if (!idToDelete) return;

    try {
      await deleteDoc(doc(db, 'materials', idToDelete));
      setMaterials((prevMaterials) => prevMaterials.filter((item) => item.id !== idToDelete));
      setDeleteModal({ isOpen: false, materialId: null });
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Failed to delete the material. Please try again.");
    }
  };

  // --- FILTERING LOGIC ---
  const uncategorizedMaterials = materials.filter(m => !m.folderId);
  
  // If viewing root (folders), filter folders. If viewing a specific folder, filter materials.
  const filteredFolders = folders.filter((folder) => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayedMaterials = activeFolder 
    ? materials.filter(m => 
        (activeFolder.id === 'uncategorized' ? !m.folderId : m.folderId === activeFolder.id) && 
        (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return <div className="text-center mt-32 text-gray-400">Loading your library...</div>;
  }

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
            <div className="animate-fade-in-up">
              <h2 className="text-4xl font-extrabold text-white">My Library</h2>
              <p className="text-gray-400 mt-2">Organize and review your generated study sets.</p>
            </div>
          )}
        </div>
        
        {/* Search Input UI */}
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
              
              {/* Map through mapped folders */}
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

              {/* Legacy "Uncategorized" Folder (Only shows if older materials exist) */}
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
                  <button
                    onClick={(e) => triggerDelete(e, item.id)}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors z-10"
                    title="Delete Material"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center gap-3 mb-4 text-primary pr-8">
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

      {/* CUSTOM DELETE MODAL OVERLAY */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1525] border border-purple-900/50 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(217,70,239,0.15)] transform transition-all">
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