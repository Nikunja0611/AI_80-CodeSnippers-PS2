// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config here
  apiKey: "AIzaSyCiumXdiRkVUdtuo1e3CDaXThL6FuNlwoQ",
  authDomain: "asknova-df5f9.firebaseapp.com",
  projectId: "asknova-df5f9",
  storageBucket: "asknova-df5f9.firebasestorage.app",
  messagingSenderId: "148564752224",
  appId: "1:148564752224:web:511ddce0606b33204ad005",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export both the auth object and the individual auth methods
export { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
};