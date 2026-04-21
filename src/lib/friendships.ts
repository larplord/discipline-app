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

function firestoreErrorCode(e: unknown) {
  return typeof e === 'object' && e != null && 'code' in e
    ? String((e as { code?: unknown }).code ?? 'unknown')
    : 'unknown';
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

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
  let profileSnap;
  try {
    profileSnap = await getDoc(doc(db, 'users', uid, 'publicProfile', 'me'));
  } catch (e: unknown) {
    const code = firestoreErrorCode(e);
    throw new Error(`Target profile read failed (${code}): ${errorMessage(e)}`);
  }
  if (!profileSnap.exists()) return { ok: false as const, reason: 'not_found' as const };
  const displayName = (profileSnap.data()?.displayName as string | undefined)?.trim() ?? '';
  return { ok: true as const, displayName };
}

export async function sendFriendInvite(
  db: Firestore,
  fromUid: string,
  toUid: string,
  invitedByName: string,
  options?: { targetAlreadyValidated?: boolean }
) {
  const cleanedFromUid = fromUid.trim();
  const cleanedToUid = toUid.trim();
  if (!cleanedFromUid) throw new Error('You must be signed in to send an invite.');
  if (!cleanedToUid) throw new Error('Enter a User ID.');
  if (cleanedFromUid === cleanedToUid) throw new Error('You cannot invite yourself.');

  if (!options?.targetAlreadyValidated) {
    console.info('[friends][sendInvite] target-profile-read:start', {
      fromUid: cleanedFromUid,
      toUid: cleanedToUid,
    });
    const targetCheck = await validateFriendUidTarget(db, cleanedToUid);
    if (!targetCheck.ok) {
      console.warn('[friends][sendInvite] target-profile-read:not-found', {
        fromUid: cleanedFromUid,
        toUid: cleanedToUid,
        reason: targetCheck.reason,
      });
      throw new Error(
        'User ID not found. Ask your friend to copy their User ID from Friends after they log in.'
      );
    }
  }

  const pid = friendshipPairId(cleanedFromUid, cleanedToUid);
  const ref = doc(db, 'friendships', pid);
  const memberIds = sortedMemberIds(cleanedFromUid, cleanedToUid);
  const payload = {
    memberIds,
    invitedBy: cleanedFromUid,
    invitedByName,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  console.info('[friends][sendInvite] friendship-write:start', {
    fromUid: cleanedFromUid,
    toUid: cleanedToUid,
    pairId: pid,
    memberIds,
    invitedBy: payload.invitedBy,
    status: payload.status,
  });

  try {
    await setDoc(ref, payload);
    console.info('[friends][sendInvite] friendship-write:success', { pairId: pid });
  } catch (e: unknown) {
    const code = firestoreErrorCode(e);
    const message = errorMessage(e);
    console.error('[friends][sendInvite] friendship-write:failed', {
      fromUid: cleanedFromUid,
      toUid: cleanedToUid,
      pairId: pid,
      code,
      message,
    });

    throw new Error(
      `Could not send invite. Firestore operation failed: friendship-write (${code}). ${message}`
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
