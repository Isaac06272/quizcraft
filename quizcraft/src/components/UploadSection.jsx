import { useState, useRef } from 'react';
import { UploadCloud, FileText, Settings } from 'lucide-react';

export default function UploadSection({ onStart }) {
  const [studyMode, setStudyMode] = useState('quiz');
  const [itemCount, setItemCount] = useState(10);
  const [file, setFile] = useState(null);
  
  // Create a reference to the hidden file input
  const fileInputRef = useRef(null);

  const handleStart = () => {
    if (file) {
      onStart({ file, studyMode, itemCount });
    } else {
      alert("Please upload a learning material first!");
    }
  };

  // Function to trigger the hidden input when the div is clicked
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-16 p-8 bg-card rounded-2xl shadow-2xl border border-purple-900/50">
      <h2 className="text-3xl font-bold mb-6 text-center">Prepare Your Material</h2>
      
      {/* Upload Area */}
      <div 
        onClick={handleUploadClick} 
        className="border-2 border-dashed border-accent/50 rounded-xl p-10 flex flex-col items-center justify-center bg-background/50 hover:border-primary transition-colors cursor-pointer mb-8 group"
      >
        <UploadCloud className="w-16 h-16 text-primary mb-4 group-hover:scale-110 transition-transform" />
        <p className="text-lg font-medium">Click to upload or drag and drop</p>
        <p className="text-sm text-gray-400 mt-2">PDF, TXT, or DOCX</p>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files[0])} 
          accept=".pdf,.txt,.docx"
        />
        
        {file && (
          <div className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 font-semibold w-full justify-center">
            <FileText size={18}/> 
            <span className="truncate max-w-[200px]">{file.name}</span>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-background rounded-lg p-4 border border-purple-900/30">
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Settings size={16} /> Study Mode
          </label>
          <div className="flex rounded-md overflow-hidden">
            <button 
              className={`flex-1 py-2 text-sm font-medium transition-colors ${studyMode === 'quiz' ? 'bg-primary text-white' : 'bg-card text-gray-400 hover:text-white'}`}
              onClick={() => setStudyMode('quiz')}
            >
              Quiz
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium transition-colors ${studyMode === 'flashcard' ? 'bg-primary text-white' : 'bg-card text-gray-400 hover:text-white'}`}
              onClick={() => setStudyMode('flashcard')}
            >
              Flashcards
            </button>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-purple-900/30">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Items: {itemCount}
          </label>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={itemCount}
            onChange={(e) => setItemCount(e.target.value)}
            className="w-full accent-primary"
          />
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleStart}
        className="w-full py-4 bg-gradient-to-r from-primary to-accent rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(217,70,239,0.4)]"
      >
        Generate {studyMode === 'quiz' ? 'Quiz' : 'Flashcards'}
      </button>
    </div>
  );
}