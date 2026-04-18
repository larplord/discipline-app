'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useAuth } from '@/components/AuthProvider';
import { useUserData } from '@/components/UserDataProvider';
import { friendshipPairId, sendFriendInvite, respondToInvite, cancelInvite } from '@/lib/friendships';
import type { Friendship } from '@/lib/types';
import type { SharedSummary } from '@/lib/types';

export default function FriendsPage() {
  const { user } = useAuth();
  const { uid } = useUserData();
  const [friendUidInput, setFriendUidInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; data: Friendship }[]>([]);
  const [shareProgress, setShareProgress] = useState(false);
  const [viewFriendUid, setViewFriendUid] = useState('');
  const [friendSummary, setFriendSummary] = useState<SharedSummary | null>(null);
  const [friendName, setFriendName] = useState('');

  useEffect(() => {
    const db = getFirestoreDb();
    const q = query(
      collection(db, 'friendships'),
      where('memberIds', 'array-contains', uid)
    );
    return onSnapshot(q, (snap) => {
      const list: { id: string; data: Friendship }[] = [];
      snap.forEach((d) => list.push({ id: d.id, data: d.data() as Friendship }));
      setItems(list);
    });
  }, [uid]);

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(doc(db, 'users', uid, 'settings', 'privacy'), (snap) => {
      setShareProgress(!!snap.data()?.shareProgressWithFriends);
    });
  }, [uid]);

  const incoming = useMemo(
    () =>
      items.filter(
        (x) => x.data.status === 'pending' && x.data.invitedBy !== uid
      ),
    [items, uid]
  );
  const outgoing = useMemo(
    () =>
      items.filter(
        (x) => x.data.status === 'pending' && x.data.invitedBy === uid
      ),
    [items, uid]
  );
  const active = useMemo(() => items.filter((x) => x.data.status === 'active'), [items]);

  async function toggleShare(v: boolean) {
    const db = getFirestoreDb();
    await setDoc(
      doc(db, 'users', uid, 'settings', 'privacy'),
      { shareProgressWithFriends: v },
      { merge: true }
    );
    await setDoc(
      doc(db, 'users', uid, 'shared', 'summary'),
      { shareEnabled: v },
      { merge: true }
    );
  }

  async function invite() {
    setError(null);
    const to = friendUidInput.trim();
    if (!to) return;
    setBusy(true);
    try {
      const db = getFirestoreDb();
      await sendFriendInvite(db, uid, to, user?.displayName ?? user?.email ?? 'Friend');
      setFriendUidInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send invite');
    } finally {
      setBusy(false);
    }
  }

  async function accept(pairId: string) {
    setBusy(true);
    setError(null);
    try {
      await respondToInvite(getFirestoreDb(), pairId, uid, 'accept');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function decline(pairId: string) {
    setBusy(true);
    setError(null);
    try {
      await respondToInvite(getFirestoreDb(), pairId, uid, 'decline');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function cancel(pairId: string) {
    setBusy(true);
    setError(null);
    try {
      await cancelInvite(getFirestoreDb(), pairId, uid);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function loadFriendProgress() {
    setError(null);
    setFriendSummary(null);
    const fid = viewFriendUid.trim();
    if (!fid) return;
    const db = getFirestoreDb();
    const pair = friendshipPairId(uid, fid);
    const fs = await getDoc(doc(db, 'friendships', pair));
    if (!fs.exists() || (fs.data() as Friendship).status !== 'active') {
      setError('Not an active friend (check the User ID).');
      return;
    }
    const prof = await getDoc(doc(db, 'users', fid, 'publicProfile', 'me'));
    setFriendName((prof.data()?.displayName as string) ?? fid.slice(0, 8));
    const sum = await getDoc(doc(db, 'users', fid, 'shared', 'summary'));
    if (!sum.exists()) {
      setError('No shared summary yet (your friend can open the app to sync).');
      return;
    }
    const d = sum.data() as SharedSummary;
    if (!d.shareEnabled) {
      setError('This friend has not enabled shared progress.');
      return;
    }
    setFriendSummary(d);
  }

  function otherMember(f: Friendship) {
    return f.memberIds.find((m) => m !== uid) ?? '';
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Friends</h1>
        <p className="page-subtitle">
          Invite by User ID (Firebase UID). Accept invites to connect. Share progress only when you opt in.
        </p>
      </div>

      <div className="page-body flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card">
          <div className="section-label mb-2">Your User ID (share with friends)</div>
          <code className="text-sm font-mono" style={{ wordBreak: 'break-all' }}>
            {uid}
          </code>
        </div>

        <div className="card">
          <div className="section-label mb-2">Share progress with friends</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shareProgress}
              onChange={(e) => toggleShare(e.target.checked)}
            />
            Allow friends with an active friendship to see my shared summary (habit %, focus, journal flag).
          </label>
        </div>

        <div className="card">
          <div className="section-label mb-2">Invite friend</div>
          <p className="text-xs text-muted mb-2">
            Paste their User ID from their Friends page. A deterministic request is stored under{' '}
            <code>friendships/&lt;pairId&gt;</code> for scalable rules.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              className="input"
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Friend User ID"
              value={friendUidInput}
              onChange={(e) => setFriendUidInput(e.target.value)}
            />
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => invite()}>
              Send invite
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="card">
          <div className="section-label mb-2">Incoming</div>
          {incoming.length === 0 ? (
            <p className="text-muted text-sm">No pending invites.</p>
          ) : (
            incoming.map(({ id, data }) => (
              <div key={id} className="flex justify-between items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm">
                  From <span className="font-mono">{data.invitedByName ?? data.invitedBy.slice(0, 8)}</span>
                </span>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => accept(id)}>
                    Accept
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decline(id)}>
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-label mb-2">Outgoing</div>
          {outgoing.length === 0 ? (
            <p className="text-muted text-sm">No pending outgoing invites.</p>
          ) : (
            outgoing.map(({ id, data }) => (
              <div key={id} className="flex justify-between items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-mono">→ {otherMember(data).slice(0, 12)}…</span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => cancel(id)}>
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-label mb-2">Friends</div>
          {active.length === 0 ? (
            <p className="text-muted text-sm">No friends yet.</p>
          ) : (
            active.map(({ id, data }) => (
              <div key={id} className="text-sm mb-1">
                <span className="font-mono">{otherMember(data)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-label mb-2">View friend&apos;s shared progress</div>
          <p className="text-xs text-muted mb-2">Requires active friendship and their sharing toggle.</p>
          <div className="flex gap-2 flex-wrap">
            <input
              className="input"
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Friend User ID"
              value={viewFriendUid}
              onChange={(e) => setViewFriendUid(e.target.value)}
            />
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => loadFriendProgress()}>
              Load
            </button>
          </div>
          {friendSummary && (
            <div className="mt-3 text-sm">
              <p className="font-bold mb-2">{friendName}</p>
              <ul className="text-muted flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Today habits: {friendSummary.habitTodayPct}%</li>
                <li>Week habits: {friendSummary.weekHabitPct}%</li>
                <li>Focus sessions today: {friendSummary.focusToday}</li>
                <li>Journal today: {friendSummary.journalToday ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
