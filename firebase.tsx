
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- IMPORTANT: FIRESTORE SECURITY RULES ---
// Go to Firebase Console -> Firestore Database -> Rules and paste this:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check auth
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper to check if user is accessing their own data
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Profiles/Users collection
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }

    // Sessions collection
    match /sessions/{sessionId} {
      // Allow create if auth is present and userId matches
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      // Allow read/update/delete if auth matches the doc's userId
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
*/

// MOCK IMPLEMENTATION
// The original imports were failing due to missing members in the installed modules.
// This mock allows the app to run in a demo mode without a real Firebase backend connection.

export const initializeApp = (config: any) => ({});
export const getAuth = (app: any) => ({ currentUser: null });
export const getFirestore = (app: any) => ({});

// Mock Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

// Configuration uses environment variables. 
// PLEASE PROVIDE YOUR FIREBASE CONFIGURATION.
const firebaseConfig = {
    apiKey: "AIzaSyCzxsyIFCgdR7hcPn6f_UShxvtby0MlXlk",
    authDomain: "jiam-bc04f.firebaseapp.com",
    databaseURL: "https://jiam-bc04f-default-rtdb.firebaseio.com",
    projectId: "jiam-bc04f",
    storageBucket: "jiam-bc04f.firebasestorage.app",
    messagingSenderId: "557804061062",
    appId: "1:557804061062:web:823c29ca66e23df4096c07",
    measurementId: "G-4Q640LKDV8"
};

// Initialize Firebase (Mocked)
// const app = initializeApp(firebaseConfig);

// Mock Auth State
const mockUser: User = {
  uid: "mock-user-123",
  email: "demo@timetraveler.com",
  displayName: "Time Traveler",
  photoURL: null
};

let currentUser: User | null = null;
let listeners: ((user: User | null) => void)[] = [];

const notify = () => listeners.forEach(l => l(currentUser));

// Export Auth Instance
export const auth = {
  get currentUser() { return currentUser; }
};

// Export Firestore Instance
export const db = {};

// Auth Functions
export const onAuthStateChanged = (authInstance: any, callback: (user: User | null) => void) => {
  listeners.push(callback);
  // Trigger initial state asynchronously
  setTimeout(() => callback(currentUser), 100);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const signOut = async (authInstance: any) => {
  currentUser = null;
  notify();
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  currentUser = { ...mockUser, email };
  notify();
  return { user: currentUser };
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  currentUser = { ...mockUser, email };
  notify();
  return { user: currentUser };
};

// Firestore Functions
export const collection = (dbInstance: any, path: string) => ({ path });
export const doc = (dbInstance: any, path: string, id?: string) => ({ path, id: id || 'mock-id' });
export const query = (ref: any, ...constraints: any[]) => ({ ref, constraints });
export const where = (field: string, op: string, val: any) => ({ field, op, val });
export const orderBy = (field: string, dir?: string) => ({ field, dir });

export const getDocs = async (q: any) => ({
  empty: true,
  size: 0,
  docs: [],
  forEach: (cb: (doc: any) => void) => { /* no-op for mock */ }
});

export const getDoc = async (ref: any) => ({
  exists: () => false,
  data: () => ({} as any)
});

export const addDoc = async (ref: any, data: any) => ({
  id: 'mock-doc-' + Date.now()
});

export const updateDoc = async (ref: any, data: any) => {};
export const setDoc = async (ref: any, data: any, options?: any) => {};
