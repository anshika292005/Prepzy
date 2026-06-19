import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requiredFirebaseEnv = [
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
];

const firebaseConfigured = requiredFirebaseEnv.every(
  (value) => typeof value === "string" && value.trim().length > 0
);

const firebaseConfig = {
  // A local fallback keeps public pages renderable before Firebase credentials
  // are supplied. Authentication remains disabled in the login UI.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "prepzy-local-development",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prepzy-local.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prepzy-local",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prepzy-local.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:000000000000:web:0000000000000000000000",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SB1KWC6EVE",
};

// Initialize Firebase
const firebaseAppName = "prepzy-client";
const existingApp = getApps().find((candidate) => candidate.name === firebaseAppName);
const app = existingApp || initializeApp(firebaseConfig, firebaseAppName);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfigured };
