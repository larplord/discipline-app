import { getApps, initializeApp, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the full Firebase service account JSON as one environment variable.');
  }
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = getFirebaseProjectId();
  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id ?? projectId });
  }

  if (!projectId) {
    throw new Error('Firebase Admin is missing FIREBASE_PROJECT_ID/NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
