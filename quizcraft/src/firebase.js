import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REPLACE THIS with the config object Firebase gave you in Step 1!
const firebaseConfig = {
  apiKey: "AIzaSyC0eLagwB5reOdWTGyRf0rLgB0i22u0ARM",
  authDomain: "quizcraft-7298f.firebaseapp.com",
  projectId: "quizcraft-7298f",
  storageBucket: "quizcraft-7298f.firebasestorage.app",
  messagingSenderId: "550072812815",
  appId: "1:550072812815:web:0e9e0cc614e603e3fbaa7a",
  measurementId: "G-PWXWS29MK4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth, Database, and Provider for use in our components
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Helper functions
export const logInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);