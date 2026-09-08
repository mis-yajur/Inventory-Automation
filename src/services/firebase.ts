import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId using getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

export const COLLECTIONS = {
  items: 'items',
  categories: 'categories',
  units: 'units',
  departments: 'departments',
  stores: 'stores',
  suppliers: 'suppliers',
  ledger: 'ledger',
  stockInReceipts: 'stockInReceipts',
  materialIssues: 'materialIssues',
  materialReturns: 'materialReturns',
  stockTransfers: 'stockTransfers',
  stockAdjustments: 'stockAdjustments',
  monthlyClosings: 'monthlyClosings',
  alerts: 'alerts',
  auditLogs: 'auditLogs',
  users: 'users',
  settings: 'settings'
};

// Generic helper to save a document
export async function saveToFirebase<T extends { id: string }>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    // Remove any undefined properties before writing to firestore to prevent crashes
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, sanitizedData);
  } catch (err) {
    console.error(`Firebase Write Error [${collectionName}/${docId}]:`, err);
  }
}

// Save settings (no id, singleton doc)
export async function saveSettingsToFirebase(data: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.settings, 'company_profile');
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, sanitizedData);
  } catch (err) {
    console.error('Firebase Settings Write Error:', err);
  }
}

// Generic helper to delete a document
export async function deleteFromFirebase(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Firebase Delete Error [${collectionName}/${docId}]:`, err);
  }
}

// Check if a collection is empty
export async function isCollectionEmpty(collectionName: string): Promise<boolean> {
  try {
    const q = query(collection(db, collectionName), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (err) {
    console.error(`Firebase Empty Check Error [${collectionName}]:`, err);
    return true;
  }
}

// Fetch all documents in a collection
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
    });
    return items;
  } catch (err) {
    console.error(`Firebase Fetch Error [${collectionName}]:`, err);
    return [];
  }
}

// Seeding helper to upload initial arrays in chunks/batches
export async function seedCollection<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      const sanitized = JSON.parse(JSON.stringify(item));
      batch.set(docRef, sanitized);
    });
    await batch.commit();
    console.log(`Successfully seeded ${items.length} items to Firebase collection [${collectionName}].`);
  } catch (err) {
    console.error(`Firebase Seeding Error [${collectionName}]:`, err);
  }
}

// Listen to a collection real-time
export function listenCollection<T>(collectionName: string, callback: (items: T[]) => void) {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      callback(items);
    },
    (err) => {
      console.error(`Firebase Listen Error [${collectionName}]:`, err);
    }
  );
}
