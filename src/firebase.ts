import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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

// Check if we are running with placeholder configuration
export const isFirebaseLive = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes("placeholder_for_compiler") &&
  !firebaseConfig.apiKey.includes("mock_api_key_placeholder");

let app;
let dbInstance: any = null;
let authInstance: any = null;

if (isFirebaseLive) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    authInstance = getAuth(app);
    console.log("[INFO] Firebase fully active and initialized.");
  } catch (err) {
    console.error("[ERROR] Failed to compile or connect Firebase live components:", err);
  }
} else {
  console.log("[INFO] Running in client-side premium offline simulator state. Live Firebase not linked.");
}

export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();

// Error handler specified by the firebase-integration skill guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUserId = auth?.currentUser?.uid || null;
  const currentUserEmail = auth?.currentUser?.email || null;
  const currentEmailVerified = auth?.currentUser?.emailVerified || null;
  const currentIsAnonymous = auth?.currentUser?.isAnonymous || null;
  const currentTenantId = auth?.currentUser?.tenantId || null;
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUserId,
      email: currentUserEmail,
      emailVerified: currentEmailVerified,
      isAnonymous: currentIsAnonymous,
      tenantId: currentTenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Validation as explicitly required by Firebase Integration Skill: "test connection on boot"
export async function testConnection() {
  if (!isFirebaseLive || !db) {
    console.log("[CONNECTION] Skipping connection validation as Firebase resides in offline sandbox mode.");
    return;
  }
  try {
    // Attempt getDocFromServer on a non-existent document to test auth handshake and credentials
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[CONNECTION] Firebase Firestore connection validation successful!");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or local internet connectivity.");
    } else {
      console.log("[CONNECTION] Checked Firebase connection state. Diagnostics logged:", error.message);
    }
  }
}
testConnection();

// Authentication triggering functions
export async function signInWithGoogle() {
  if (!isFirebaseLive || !auth) {
    throw new Error("Unable to authenticate: Firebase configuration is not linked.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error("[AUTH_ERROR] Popup sign-in challenge failed:", err);
    throw err;
  }
}

export async function handleSignOut() {
  if (!isFirebaseLive || !auth) {
    return;
  }
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error("[AUTH_ERROR] Failed to terminate session:", err);
  }
}
