import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { Friendship } from './types';

/** Deterministic doc id for a pair of users (matches Firestore rules). */
export function friendshipPairId(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

function sortedMemberIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Client-safe target validation:
 * we can read publicProfile (signed-in users) but not private /users/{uid} docs.
 */
export async function validateFriendUidTarget(db: Firestore, targetUid: string) {
  const uid = targetUid.trim();
  if (!uid) return { ok: false as const, reason: 'empty' as const };
  const profileSnap = await getDoc(doc(db, 'users', uid, 'publicProfile', 'me'));
  if (!profileSnap.exists()) return { ok: false as const, reason: 'not_found' as const };
  const displayName = (profileSnap.data()?.displayName as string | undefined)?.trim() ?? '';
  return { ok: true as const, displayName };
}

export async function sendFriendInvite(
  db: Firestore,
  fromUid: string,
  toUid: string,
  invitedByName: string
) {
  const cleanedToUid = toUid.trim();
  if (!cleanedToUid) throw new Error('Enter a User ID.');
  if (fromUid === cleanedToUid) throw new Error('You cannot invite yourself.');
  console.info('[friends][sendInvite] STEP 1 validating target UID', {
    fromUid,
    toUid: cleanedToUid,
  });
  const targetCheck = await validateFriendUidTarget(db, cleanedToUid);
  if (!targetCheck.ok) {
    console.warn('[friends][sendInvite] STEP 1 validation failed', {
      fromUid,
      toUid: cleanedToUid,
      reason: targetCheck.reason,
    });
    throw new Error(
      'User ID not found. Ask your friend to copy their User ID from Friends after they log in.'
    );
  }
  const pid = friendshipPairId(fromUid, cleanedToUid);
  const ref = doc(db, 'friendships', pid);
  const memberIds = sortedMemberIds(fromUid, cleanedToUid);
  console.info('[friends][sendInvite] STEP 2 writing friendship invite', {
    fromUid,
    toUid: cleanedToUid,
    pairId: pid,
    memberIds,
    invitedBy: fromUid,
    status: 'pending',
  });
  try {
    await setDoc(ref, {
      memberIds,
      invitedBy: fromUid,
      invitedByName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    console.info('[friends][sendInvite] STEP 2 write success', { pairId: pid });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    const message = e instanceof Error ? e.message : String(e);
    const originalError = e instanceof Error ? e : new Error('Could not send invite.');
    console.error('[friends][sendInvite] STEP 3 write failed', {
      fromUid,
      toUid: cleanedToUid,
      pairId: pid,
      code,
      message,
    });

    // Optional state check for clearer UX; never let this mask the original write error.
    if (code === 'permission-denied') {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data() as Friendship;
          if (d.status === 'active') throw new Error('You are already friends.');
          if (d.status === 'pending') throw new Error('An invite already exists for this pair.');
        }
      } catch (readErr: unknown) {
        console.warn('[friends][sendInvite] STEP 3 follow-up read skipped/failed', {
          pairId: pid,
          code: (readErr as { code?: string })?.code,
          message: readErr instanceof Error ? readErr.message : String(readErr),
        });
      }
    }

    throw new Error(
      `Could not send invite (${code ?? 'unknown'}): ${originalError.message || 'unknown error'}`
    );
  }
}

export async function respondToInvite(
  db: Firestore,
  pairId: string,
  selfUid: string,
  action: 'accept' | 'decline'
) {
  const ref = doc(db, 'friendships', pairId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Invite not found.');
  const data = snap.data() as Friendship;
  if (data.status !== 'pending') throw new Error('This invite is no longer pending.');
  if (data.invitedBy === selfUid) throw new Error('You cannot respond to your own invite.');
  if (!data.memberIds.includes(selfUid)) throw new Error('Not a member of this invite.');
  await updateDoc(ref, {
    status: action === 'accept' ? 'active' : 'declined',
  });
}

export async function cancelInvite(db: Firestore, pairId: string, inviterUid: string) {
  const ref = doc(db, 'friendships', pairId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Friendship;
  if (data.invitedBy !== inviterUid) throw new Error('Only the inviter can cancel.');
  if (data.status !== 'pending') return;
  await updateDoc(ref, { status: 'declined' });
}

/** End an active friendship (either user). Pair doc stays for history; status becomes `ended`. */
export async function endFriendship(db: Firestore, pairId: string, selfUid: string) {
  const ref = doc(db, 'friendships', pairId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Friendship not found.');
  const data = snap.data() as Friendship;
  if (data.status !== 'active') throw new Error('Not an active friendship.');
  if (!data.memberIds.includes(selfUid)) throw new Error('Not a member of this friendship.');
  await updateDoc(ref, { status: 'ended' });
}

/** Log an email-based invite attempt on the sender’s account (MVP: companion to UID invites). */
export async function logEmailFriendInvite(
  db: Firestore,
  fromUid: string,
  recipientEmail: string,
  invitedByName: string
) {
  const email = recipientEmail.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('Enter a valid email.');
  await addDoc(collection(db, 'users', fromUid, 'friendInviteOutbox'), {
    recipientEmail: email,
    invitedByName,
    createdAt: serverTimestamp(),
  });
}
