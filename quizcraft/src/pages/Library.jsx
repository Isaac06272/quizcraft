import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileQuestion, Trophy, ArrowRight, Trash2, AlertTriangle, Search } from 'lucide-react';

export default function Library() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, materialId: null });
  
  // --- NEW: Search State ---
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchMaterials = async () => {
      try {
        const q = query(
          collection(db, 'materials'), 
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedMaterials = [];
        querySnapshot.forEach((doc) => {
          fetchedMaterials.push({ id: doc.id, ...doc.data() });
        });

        fetchedMaterials.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setMaterials(fetchedMaterials);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
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

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, materialId: null });
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

  // --- NEW: Filter materials based on search query ---
  const filteredMaterials = materials.filter((item) => 
    (item.title || "Untitled Material").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center mt-32 text-gray-400">Loading your library...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 p-6 relative">
      
      {/* HEADER WITH SEARCH BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-purple-900/30 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-white">My Library</h2>
          <p className="text-gray-400 mt-2">All your generated quizzes and flashcards saved in one place.</p>
        </div>
        
        {/* Search Input UI */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search materials..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1333] border border-purple-900/50 text-white placeholder-gray-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
          />
        </div>
      </div>

      {/* RENDER CONDITIONS */}
      {materials.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-purple-900/50">
          <p className="text-gray-400 text-lg">Your library is empty. Go generate some study materials!</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-purple-900/50">
          <p className="text-gray-400 text-lg">No materials found matching "<span className="text-white font-bold">{searchQuery}</span>"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((item) => (
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
                onClick={closeDeleteModal}
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