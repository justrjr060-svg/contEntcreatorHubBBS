import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCXTbYv0L1xRB0xIsET_j8jGPeIp3Ducqg",
  authDomain: "gen-lang-client-0099012653.firebaseapp.com",
  projectId: "gen-lang-client-0099012653",
  storageBucket: "gen-lang-client-0099012653.firebasestorage.app",
  messagingSenderId: "404685677044",
  appId: "1:404685677044:web:42bff08d203926672ad9a1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-creatorhub-a3040f33-5db8-4c26-8d77-12ac5a465ce0");
export const storage = getStorage(app);
