import { useState, useRef } from 'react';
import { UploadCloud, FileText, BookOpen, LayoutList, Wand2 } from 'lucide-react';

export default function UploadSection({ onStart }) {
  const [studyMode, setStudyMode] = useState('quiz');
  const [itemCount, setItemCount] = useState(10);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleStart = () => {
    if (file) onStart({ file, studyMode, itemCount });
    else alert("Please provide source material first!");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="card-paper p-6 sm:p-8 md:p-10 relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-verdigris via-saffron to-verdigris" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Left Side: Upload Area */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-display-sm text-ink">Source Material</h3>
            <span className="badge badge-quiz">
              <Wand2 size={12} /> AI Forging
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current.click()}
            className={`
              relative h-56 sm:h-64 border-2 border-dashed rounded-surface
              flex flex-col items-center justify-center transition-all duration-base ease-craft cursor-pointer group
              ${file
                ? 'border-verdigris bg-verdigris/5'
                : 'border-parchment-dim/50 hover:border-verdigris/50 hover:bg-vellum'
              }
            `}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.txt,.docx"
              aria-label="Upload document"
            />

            {file ? (
              <div className="w-full p-6 animate-slide-up">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-verdigris/10 text-verdigris rounded-tool flex items-center justify-center flex-shrink-0">
                    <FileText size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-base font-medium text-ink truncate">{file.name}</p>
                    <p className="font-mono text-data text-verdigris mt-1">
                      {formatFileSize(file.size)} • {file.type || 'Document'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-verdigris font-body text-sm font-medium">
                    <span className="relative">
                      <span className="absolute inset-0 bg-saffron/20 rounded-full animate-pulse"></span>
                      <span className="relative">Ready to forge</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-vellum text-ink-soft group-hover:text-verdigris group-hover:bg-verdigris/10 rounded-tool flex items-center justify-center transition-all duration-base ease-craft">
                  <UploadCloud size={32} />
                </div>
                <p className="font-body text-lg font-medium text-ink mb-1">Click to select document</p>
                <p className="font-body text-body-sm text-ink-soft">PDF, TXT, or DOCX • Up to 10MB</p>
              </div>
            )}

            {/* Drag overlay */}
            <div className="absolute inset-0 rounded-surface pointer-events-none" />
          </div>
        </div>

        {/* Right Side: Settings Area */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-display text-display-sm text-ink mb-6">Configuration</h3>

            {/* Study Mode Selector */}
            <div className="mb-8">
              <label className="font-label text-ink-soft mb-3 block">Study Mode</label>
              <div className="bg-charcoal-wash/50 p-1.5 rounded-tool flex">
                <button
                  onClick={() => setStudyMode('quiz')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-tool text-sm font-bold transition-all duration-base ease-craft ${
                    studyMode === 'quiz'
                      ? 'bg-verdigris text-parchment shadow-[0_2px_8px_-2px_rgba(74,124,124,0.3)]'
                      : 'text-ink-soft hover:text-ink hover:bg-parchment/10'
                  }`}
                >
                  <LayoutList size={18} /> Quiz
                </button>
                <button
                  onClick={() => setStudyMode('flashcard')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-tool text-sm font-bold transition-all duration-base ease-craft ${
                    studyMode === 'flashcard'
                      ? 'bg-saffron text-ink shadow-[0_2px_8px_-2px_rgba(232,168,56,0.3)]'
                      : 'text-ink-soft hover:text-ink hover:bg-parchment/10'
                  }`}
                >
                  <BookOpen size={18} /> Cards
                </button>
              </div>
            </div>

            {/* Item Count Slider */}
            <div className="bg-charcoal-wash/50 p-6 rounded-tool">
              <div className="flex justify-between items-center mb-5">
                <label className="font-body text-base font-bold text-ink">Item Count</label>
                <span className="font-display text-display-sm text-saffron font-bold">{itemCount}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={itemCount}
                onChange={(e) => setItemCount(e.target.value)}
                className="w-full h-2 bg-parchment-dim rounded-full appearance-none cursor-pointer accent-saffron"
                aria-label="Number of items to generate"
              />
              <div className="flex justify-between text-sm text-ink-soft mt-4 font-body">
                <span>Brief (5)</span>
                <span>Deep (50)</span>
              </div>
            </div>
          </div>

          {/* Forge Button */}
          <button
            onClick={handleStart}
            disabled={!file}
            className="btn-forge w-full justify-center gap-2"
          >
            <span className="flex items-center gap-2">
              <Wand2 size={20} aria-hidden="true" />
              Forge Material
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}