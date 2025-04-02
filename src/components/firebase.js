// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0Gafp2TLChDUCnglV6fK_hMRcLkQOUYU",
  authDomain: "healthsnap-in.firebaseapp.com",
  projectId: "healthsnap-in",
  storageBucket: "healthsnap-in.firebasestorage.app",
  messagingSenderId: "288980078463",
  appId: "1:288980078463:web:5dd4763f7cbb1d18ded44a",
  measurementId: "G-4TP68S20GD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth();
export const db=getFirestore(app);
export default app;