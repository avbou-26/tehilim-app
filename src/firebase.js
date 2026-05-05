import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMC79sVGrhzLT77tJ_MQc0FdXw7tWkrKY",
  authDomain: "tehilim-app-d00c2.firebaseapp.com",
  projectId: "tehilim-app-d00c2",
  storageBucket: "tehilim-app-d00c2.firebasestorage.app",
  messagingSenderId: "1012029966380",
  appId: "1:1012029966380:web:24b7db8f21a0d960122989"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);