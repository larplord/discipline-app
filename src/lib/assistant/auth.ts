import { getAdminAuth } from '@/lib/firebase/admin';

export type VerifiedAssistantUser = {
  uid: string;
  email?: string;
};

function getAllowedEmails() {
  return (process.env.ASSISTANT_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ASSISTANT_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyWithFirebaseRest(token: string): Promise<VerifiedAssistantUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Firebase API key is missing.');

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) throw new Error('Invalid Firebase auth token.');
  const data = await res.json();
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Invalid Firebase auth token.');
  return { uid: String(user.localId), email: user.email ? String(user.email) : undefined };
}

export async function verifyAssistantRequest(req: Request): Promise<VerifiedAssistantUser> {
  const singleOperatorMode = process.env.ASSISTANT_SINGLE_OPERATOR_MODE === 'true';
  const singleOperatorHeader = req.headers.get('x-single-operator') === 'true';

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    if (singleOperatorMode && singleOperatorHeader) {
      return { uid: 'local-operator', email: 'local-operator@discipline-os.local' };
    }
    throw new Error('Missing auth token.');
  }

  let verified: VerifiedAssistantUser;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    verified = { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    console.warn('[assistant/auth] Firebase Admin auth unavailable, using REST auth fallback.', e);
    verified = await verifyWithFirebaseRest(token);
  }

  const allowedEmails = getAllowedEmails();
  const email = String(verified.email ?? '').toLowerCase();
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    throw new Error('This assistant is private.');
  }

  return verified;
}

export function assistantErrorStatus(message: string) {
  return message.includes('private') || message.includes('auth') || message.includes('token') ? 401 : 500;
}
