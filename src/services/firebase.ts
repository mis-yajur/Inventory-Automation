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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    // Remove any undefined properties before writing to firestore to prevent crashes
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, sanitizedData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Save settings (no id, singleton doc)
export async function saveSettingsToFirebase(data: any): Promise<void> {
  const path = `${COLLECTIONS.settings}/company_profile`;
  try {
    const docRef = doc(db, COLLECTIONS.settings, 'company_profile');
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, sanitizedData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Generic helper to delete a document
export async function deleteFromFirebase(collectionName: string, docId: string): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Check if a collection is empty
export async function isCollectionEmpty(collectionName: string): Promise<boolean> {
  try {
    const q = query(collection(db, collectionName), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
    return true; // Should not reach here due to throw
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
    handleFirestoreError(err, OperationType.LIST, collectionName);
    return []; // Should not reach here
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
    handleFirestoreError(err, OperationType.WRITE, collectionName);
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
      handleFirestoreError(err, OperationType.LIST, collectionName);
    }
  );
}
