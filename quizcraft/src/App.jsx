import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import Library from './pages/Library';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logInWithGoogle, logOut } from './firebase';
import { FolderOpen, BookOpen, LayoutGrid, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';

function Navbar() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Workbench', icon: LayoutGrid },
    { path: '/library', label: 'Rack', icon: FolderOpen },
  ];

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-parchment/90 backdrop-blur-md border-b border-parchment-dim/30">
        <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-parchment-dim/50 rounded animate-pulse" />
            <div className="h-6 w-32 bg-parchment-dim/50 rounded animate-pulse" />
          </div>
          <div className="h-10 w-48 bg-parchment-dim/30 rounded-tool animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-parchment/90 backdrop-blur-md border-b border-parchment-dim/30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0" aria-label="QuizCraft Home">
          <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="brand-grad-sm" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A7C7C" />
                <stop offset="100%" stopColor="#E8A838" />
              </linearGradient>
            </defs>
            <circle cx="248" cy="240" r="130" fill="none" stroke="url(#brand-grad-sm)" strokeWidth="36" />
            <path d="M 335 325 L 400 390" fill="none" stroke="url(#brand-grad-sm)" strokeWidth="36" strokeLinecap="round" />
            <g stroke="url(#brand-grad-sm)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 210 180 L 280 170 L 320 230 L 260 290 L 170 240 Z" fill="none" />
              <path d="M 210 180 L 250 230 L 320 230" fill="none" />
              <path d="M 170 240 L 250 230 L 260 290" fill="none" />
              <path d="M 280 170 L 250 230" fill="none" />
              <circle cx="210" cy="180" r="10" fill="url(#brand-grad-sm)" stroke="none" />
              <circle cx="280" cy="170" r="12" fill="url(#brand-grad-sm)" stroke="none" />
              <circle cx="320" cy="230" r="10" fill="url(#brand-grad-sm)" stroke="none" />
              <circle cx="260" cy="290" r="14" fill="url(#brand-grad-sm)" stroke="none" />
              <circle cx="170" cy="240" r="10" fill="url(#brand-grad-sm)" stroke="none" />
              <circle cx="250" cy="230" r="16" fill="url(#brand-grad-sm)" stroke="none" />
            </g>
          </svg>
          <span className="font-display text-display-sm text-ink tracking-tight hidden sm:block">QuizCraft</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive: active }) => `
                  flex items-center gap-2 px-4 py-2 rounded-tool font-body text-sm font-medium transition-all duration-fast ease-craft
                  ${active
                    ? 'bg-verdigris/20 text-saffron border-b-2 border-saffron'
                    : 'text-ink-soft hover:text-ink hover:bg-parchment-dim/30'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Side: User Menu / Sign In */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-tool text-ink-soft hover:text-ink hover:bg-parchment-dim transition-colors"
                aria-label="User menu"
                aria-expanded={mobileMenuOpen}
              >
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-verdigris/50"
                  aria-hidden="true"
                />
                <span className="hidden sm:block font-body text-sm font-medium text-ink truncate max-w-[120px]">{currentUser.displayName}</span>
                <ChevronDown size={16} className={mobileMenuOpen ? 'rotate-180' : ''} aria-hidden="true" />
              </button>

              {/* Dropdown Menu */}
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-surface shadow-paper-hover border border-parchment-dim py-2 z-50 animate-slide-in-left">
                    <div className="px-4 py-3 border-b border-parchment-dim">
                      <p className="font-body text-sm font-medium text-ink truncate">{currentUser.displayName}</p>
                      <p className="font-mono text-xs text-ink-soft mt-0.5">Student</p>
                    </div>
                    <button
                      onClick={() => { logOut(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-ink-soft hover:text-saffron hover:bg-saffron/10 font-body text-sm font-medium transition-colors"
                    >
                      <LogOut size={18} aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/"
              onClick={logInWithGoogle}
              className="btn-forge px-6 py-2.5 text-sm hidden sm:flex"
            >
              <User size={16} aria-hidden="true" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-tool text-ink-soft hover:text-ink hover:bg-parchment-dim transition-colors"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-parchment/95 backdrop-blur-sm border-b border-parchment-dim/30 animate-slide-up">
          <nav className="px-4 py-4 space-y-2" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive: active }) => `
                    flex items-center gap-3 px-4 py-3 rounded-tool font-body text-base font-medium transition-all duration-fast ease-craft
                    ${active
                      ? 'bg-verdigris/20 text-saffron border-l-2 border-saffron'
                      : 'text-ink-soft hover:text-ink hover:bg-parchment-dim/30'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          {currentUser && (
            <div className="px-4 pb-4 border-t border-parchment-dim/20">
              <button
                onClick={() => { logOut(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-ink-soft hover:text-saffron hover:bg-saffron/10 font-body text-sm font-medium rounded-tool transition-colors"
              >
                <LogOut size={20} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="page-shell font-body min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
          <Navbar />
          <main className="pt-16 pb-8">
            <div className="page-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/library" element={<Library />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}