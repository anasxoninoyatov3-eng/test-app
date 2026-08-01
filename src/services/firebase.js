

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";



const firebaseConfig = {
  apiKey: "AIzaSyAKgIrLWkGZyauuEcubM3Wd5X1YjS--9co",
  authDomain: "testapp-77fa4.firebaseapp.com",
  projectId: "testapp-77fa4",
  storageBucket: "testapp-77fa4.firebasestorage.app",
  messagingSenderId: "923466114800",
  appId: "1:923466114800:web:f5380672805c342ec58435",
  measurementId: "G-KRXPRL5GJF"
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId
) {
  console.error(
    "Firebase config xato yoki to'liq emas. Iltimos, .env fayldagi VITE_FIREBASE_* qiymatlarni tekshiring."
  );

  console.log("Firebase config tekshiruv:", {
    apiKey: firebaseConfig.apiKey
      ? `${firebaseConfig.apiKey.slice(0, 6)}...`
      : undefined,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
  });
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();