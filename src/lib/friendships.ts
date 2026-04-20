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

export async function sendFriendInvite(
  db: Firestore,
  fromUid: string,
  toUid: string,
  invitedByName: string
) {
  if (fromUid === toUid) throw new Error('You cannot invite yourself.');
  const pid = friendshipPairId(fromUid, toUid);
  const ref = doc(db, 'friendships', pid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data() as Friendship;
    if (d.status === 'active') throw new Error('You are already friends.');
    if (d.status === 'pending') throw new Error('An invite already exists for this pair.');
  }
  const memberIds = sortedMemberIds(fromUid, toUid);
  await setDoc(ref, {
    memberIds,
    invitedBy: fromUid,
    invitedByName,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
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
