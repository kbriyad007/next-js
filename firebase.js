// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBj6QysY8iakOIolvgxdVIQFISrkWKLSls",
  authDomain: "user-data-ff2ef.firebaseapp.com",
  projectId: "user-data-ff2ef",
  storageBucket: "user-data-ff2ef.firebasestorage.app",
  messagingSenderId: "256585563027",
  appId: "1:256585563027:web:002cbebe818faf9ebec666",
  measurementId: "G-V3BQPCTJGG",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
