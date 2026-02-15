
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAi-xWkFeWlaAs3-laQ2EnsTfvwogeDmxk",
  authDomain: "chat-web-83cc5.firebaseapp.com",
  projectId: "chat-web-83cc5",
  storageBucket: "chat-web-83cc5.firebasestorage.app",
  messagingSenderId: "440624308931",
  appId: "1:440624308931:web:baa5777367bcc60609f876",
  measurementId: "G-V78HHRGM5K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
