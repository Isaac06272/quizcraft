import Library from './pages/Library';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logInWithGoogle, logOut } from './firebase';

// Extract the Navbar into a sub-component so it can use the Auth hook
function NavBar() {
  const { currentUser } = useAuth();

  return (
    <nav className="relative w-full px-8 py-4 flex justify-between items-center bg-[#0f0a1c]/70 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-all">
      
      {/* Left Area: Logo */}
      <div className="flex-1 flex justify-start">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all duration-300">
            Q
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            QuizCraft
          </span>
        </Link>
      </div>
      
      {/* PERFECT CENTER: Nav Links */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-10 text-sm font-bold text-gray-400">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        {currentUser && (
          <Link to="/library" className="hover:text-white transition-colors">My Library</Link>
        )}
      </div>

      {/* Right Area: Auth */}
      <div className="flex-1 flex justify-end">
        {currentUser ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-bold text-white leading-tight">{currentUser.displayName}</p>
              <p className="text-xs text-gray-400">Student</p>
            </div>
            <img 
              src={currentUser.photoURL} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-violet-500 p-0.5 shadow-lg"
            />
            <button 
              onClick={logOut}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-all text-sm font-bold"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button 
            onClick={logInWithGoogle}
            className="px-6 py-2.5 rounded-full bg-white text-[#0f0a1c] font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* The blanket has been removed and replaced with the gradient here! */}
        <div className="min-h-screen bg-gradient-to-br from-[#0a0710] via-[#221645] to-[#0a0710] overflow-x-hidden text-white font-sans selection:bg-primary/30">
          <NavBar />
          <main className="container mx-auto px-4 py-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/library" element={<Library />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}