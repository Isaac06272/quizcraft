import { useState, useRef } from 'react';
import { UploadCloud, FileText, BookOpen, LayoutList } from 'lucide-react';

export default function UploadSection({ onStart }) {
  const [studyMode, setStudyMode] = useState('quiz');
  const [itemCount, setItemCount] = useState(10);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleStart = () => {
    if (file) onStart({ file, studyMode, itemCount });
    else alert("Please upload a learning material first!");
  };

  return (
    // Changed max-w-3xl to max-w-5xl, and p-8 to p-12 for a bigger box
    <div className="w-full max-w-5xl mx-auto bg-[#1a1333]/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden">
      
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600"></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        
        {/* Left Side: Upload Area */}
        <div className="md:col-span-3">
          <h3 className="text-2xl font-bold text-white mb-6">Source Material</h3>
          <div 
            onClick={() => fileInputRef.current.click()} 
            // Changed h-64 to h-80 to make the dropzone taller
            className={`h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer group ${
              file ? 'border-violet-500 bg-violet-500/5' : 'border-white/10 hover:border-violet-500/50 hover:bg-white/5'
            }`}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.txt,.docx" />
            
            {file ? (
              <div className="text-center p-6 animate-fade-in">
                <div className="w-20 h-20 bg-violet-500/20 text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FileText size={40} />
                </div>
                <p className="font-bold text-white text-xl truncate max-w-[250px]">{file.name}</p>
                <p className="text-emerald-400 text-base font-medium mt-3 flex items-center justify-center gap-1">
                  Ready to process
                </p>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-white/5 text-gray-400 group-hover:text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-colors">
                  <UploadCloud size={40} />
                </div>
                <p className="text-xl font-bold text-white mb-2">Click to browse</p>
                <p className="text-base text-gray-500">Supports PDF, TXT, DOCX</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Settings Area */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Configuration</h3>
            
            {/* Sleek Segmented Control for Study Mode */}
            <div className="bg-[#0f0a1c] p-2 rounded-2xl flex mb-8 border border-white/5">
              <button 
                onClick={() => setStudyMode('quiz')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-bold transition-all ${studyMode === 'quiz' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutList size={20}/> Quiz
              </button>
              <button 
                onClick={() => setStudyMode('flashcard')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-bold transition-all ${studyMode === 'flashcard' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <BookOpen size={20}/> Cards
              </button>
            </div>

            {/* Custom Range Slider */}
            <div className="bg-[#0f0a1c] p-6 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-5">
                <label className="text-base font-bold text-gray-300">Item Count</label>
                <span className="text-2xl font-black text-violet-400">{itemCount}</span>
              </div>
              <input 
                type="range" min="5" max="50" step="5" value={itemCount}
                onChange={(e) => setItemCount(e.target.value)}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-4 font-bold">
                <span>Short (5)</span>
                <span>Deep Dive (50)</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="w-full py-5 rounded-2xl bg-white text-[#0f0a1c] font-black text-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 mt-4"
          >
            Generate Material
          </button>
        </div>

      </div>
    </div>
  );
}