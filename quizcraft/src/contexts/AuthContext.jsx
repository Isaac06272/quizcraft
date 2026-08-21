import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to prevent infinite loading if auth listener fails
    const timeoutId = setTimeout(() => {
      console.warn('Auth listener timeout - proceeding without auth');
      setLoading(false);
    }, 1000); // Reduced for faster testing

    // This listener fires whenever a user logs in or logs out
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe(); // Cleanup listener on unmount
    };
  }, []);

  // Always render children, pass loading state for conditional UI
  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);