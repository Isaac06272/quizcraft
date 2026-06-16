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
    <nav className="w-full p-6 flex justify-between items-center border-b border-purple-900/30 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-105">
          Q
        </div>
        <span className="text-2xl font-bold tracking-wide">QuizCraft</span>
      </Link>
      
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        {currentUser && (
          <Link to="/library" className="hover:text-primary transition-colors">My Library</Link>
        )}
      </div>

      <div>
        {currentUser ? (
          <div className="flex items-center gap-4">
            <img 
              src={currentUser.photoURL} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-primary p-0.5"
            />
            <button 
              onClick={logOut}
              className="px-4 py-2 rounded-lg bg-card border border-purple-700 hover:bg-red-500/20 hover:border-red-500 transition-colors text-sm font-medium"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button 
            onClick={logInWithGoogle}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-[0_0_10px_rgba(217,70,239,0.3)] hover:opacity-90 transition-opacity"
          >
            Login with Google
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
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
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