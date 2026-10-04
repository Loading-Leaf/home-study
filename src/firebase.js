import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// User's provided Firebase Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1HP90bi5xdhc3v-qnXsFlGcpAv5DmmJc",
  authDomain: "home-study-bda24.firebaseapp.com",
  projectId: "home-study-bda24",
  storageBucket: "home-study-bda24.firebasestorage.app",
  messagingSenderId: "272039779395",
  appId: "1:272039779395:web:551469813f59e5c8ae88f6",
  measurementId: "G-5L1SNHC3G6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Sign up with Email & Password
 */
export async function signUpUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with Email & Password
 */
export async function signInUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  await firebaseSignOut(auth);
}

/**
 * Sign in / Sign up with Google Popup
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

/**
 * Send Password Reset Email
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export { app, auth, db, onAuthStateChanged };
