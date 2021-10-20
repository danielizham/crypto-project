// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import "firebase/auth"
import { GoogleAuthProvider, getAuth, setPersistence, inMemoryPersistence, signInWithRedirect } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvNNLEanVDCjZiHj3Kf4YldR9FYY6lZq4",
    authDomain: "crypt-messenger.firebaseapp.com",
    projectId: "crypt-messenger",
    storageBucket: "crypt-messenger.appspot.com",
    messagingSenderId: "445925757930",
    appId: "1:445925757930:web:37d904c2e6eacabe601893"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app }