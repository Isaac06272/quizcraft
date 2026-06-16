import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileQuestion, Trophy, ArrowRight } from 'lucide-react';

export default function Library() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not logged in, send them home
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

        // Sort by newest first
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

  if (loading) {
    return <div className="text-center mt-32 text-gray-400">Loading your library...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 p-6">
      <div className="border-b border-purple-900/30 pb-6 mb-8">
        <h2 className="text-4xl font-extrabold text-white">My Library</h2>
        <p className="text-gray-400 mt-2">All your generated quizzes and flashcards saved in one place.</p>
      </div>

      {materials.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-purple-900/50">
          <p className="text-gray-400 text-lg">Your library is empty. Go generate some study materials!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleOpenMaterial(item)}
              className="bg-card border border-purple-900/50 rounded-2xl p-6 hover:border-primary transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]"
            >
              <div className="flex items-center gap-3 mb-4 text-primary">
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
  );
}