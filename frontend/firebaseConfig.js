// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7G5315O4eCTr_MAAHg0kZCNFJE8Q8jfA",
  authDomain: "fitflow-web.firebaseapp.com",
  projectId: "fitflow-web",
  storageBucket: "fitflow-web.firebasestorage.app",
  messagingSenderId: "493453497458",
  appId: "1:493453497458:web:363b0eafd2b04940721eeb",
  measurementId: "G-LYTKT66HQ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only if supported (client-side)
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, auth, googleProvider, analytics };