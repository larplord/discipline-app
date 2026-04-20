'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useAuth } from '@/components/AuthProvider';
import { useUserData } from '@/components/UserDataProvider';
import {
  sendFriendInvite,
  respondToInvite,
  cancelInvite,
  endFriendship,
  logEmailFriendInvite,
} from '@/lib/friendships';
import type { Friendship, FriendEmailInviteOutbox, SharedSummary } from '@/lib/types';
import { syncSharedSummary } from '@/lib/syncSharedSummary';
import { todayKey } from '@/lib/dates';
import '@/styles/pages/Friends.css';

type FriendRowModel = {
  pairId: string;
  friendUid: string;
  displayName: string;
  summary: SharedSummary | null;
  summaryLocked: boolean;
};

function fmtUpdatedAt(u: unknown): string {
  if (u && typeof u === 'object' && 'toDate' in u) {
    const fn = (u as { toDate?: () => Date }).toDate;
    if (typeof fn === 'function') {
      try {
        return fn.call(u).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        /* ignore */
      }
    }
  }
  return '';
}

function otherMember(f: Friendship, selfUid: string) {
  return f.memberIds.find((m) => m !== selfUid) ?? '';
}

export default function FriendsPage() {
  const { user } = useAuth();
  const {
    uid,
    habits,
    dayLog,
    logsByDate,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    shareProgressWithFriends,
    identityProfile,
  } = useUserData();

  const [friendUidInput, setFriendUidInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; data: Friendship }[]>([]);
  const [outbox, setOutbox] = useState<{ id: string; data: FriendEmailInviteOutbox }[]>([]);
  const [friendRows, setFriendRows] = useState<Record<string, FriendRowModel>>({});

  const invitedByName = user?.displayName ?? user?.email ?? 'Friend';
  const habitsDoneToday = habits.filter((h) => dayLog[h.id]).length;

  useEffect(() => {
    const db = getFirestoreDb();
    const q = query(collection(db, 'friendships'), where('memberIds', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
      const list: { id: string; data: Friendship }[] = [];
      snap.forEach((d) => list.push({ id: d.id, data: d.data() as Friendship }));
      setItems(list);
    });
  }, [uid]);

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'users', uid, 'friendInviteOutbox'), (snap) => {
      const list: { id: string; data: FriendEmailInviteOutbox }[] = [];
      snap.forEach((d) => list.push({ id: d.id, data: d.data() as FriendEmailInviteOutbox }));
      list.sort((a, b) => {
        const ta = (a.data as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0;
        const tb = (b.data as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setOutbox(list.slice(0, 25));
    });
  }, [uid]);

  const incoming = useMemo(
    () => items.filter((x) => x.data.status === 'pending' && x.data.invitedBy !== uid),
    [items, uid]
  );
  const outgoing = useMemo(
    () => items.filter((x) => x.data.status === 'pending' && x.data.invitedBy === uid),
    [items, uid]
  );
  const active = useMemo(() => items.filter((x) => x.data.status === 'active'), [items]);

  useEffect(() => {
    const db = getFirestoreDb();
    const activeList = items.filter((x) => x.data.status === 'active');
    const byFid: Record<string, string> = {};
    for (const { id, data } of activeList) {
      const fid = otherMember(data, uid);
      if (fid) byFid[fid] = id;
    }
    const fids = Object.keys(byFid);
    const unsubs: Array<() => void> = [];

    if (fids.length === 0) {
      setFriendRows({});
      return;
    }

    setFriendRows((prev) => {
      const next: Record<string, FriendRowModel> = {};
      for (const fid of fids) {
        next[fid] = {
          pairId: byFid[fid],
          friendUid: fid,
          displayName: prev[fid]?.displayName ?? `${fid.slice(0, 8)}…`,
          summary: prev[fid]?.summary ?? null,
          summaryLocked: prev[fid]?.summaryLocked ?? false,
        };
      }
      return next;
    });

    for (const fid of fids) {
      const pairId = byFid[fid];
      const uProf = onSnapshot(
        doc(db, 'users', fid, 'publicProfile', 'me'),
        (snap) => {
          const name = (snap.data()?.displayName as string)?.trim();
          setFriendRows((p) => ({
            ...p,
            [fid]: {
              ...p[fid],
              pairId,
              friendUid: fid,
              displayName: name || p[fid]?.displayName || `${fid.slice(0, 8)}…`,
            },
          }));
        },
        () => {}
      );
      const uSum = onSnapshot(
        doc(db, 'users', fid, 'shared', 'summary'),
        (snap) => {
          if (!snap.exists()) {
            setFriendRows((p) => ({
              ...p,
              [fid]: { ...p[fid], pairId, friendUid: fid, summary: null, summaryLocked: false },
            }));
            return;
          }
          const s = snap.data() as SharedSummary;
          if (!s.shareEnabled) {
            setFriendRows((p) => ({
              ...p,
              [fid]: { ...p[fid], pairId, friendUid: fid, summary: null, summaryLocked: true },
            }));
            return;
          }
          setFriendRows((p) => ({
            ...p,
            [fid]: { ...p[fid], pairId, friendUid: fid, summary: s, summaryLocked: false },
          }));
        },
        () => {
          setFriendRows((p) => ({
            ...p,
            [fid]: { ...p[fid], pairId, friendUid: fid, summary: null, summaryLocked: true },
          }));
        }
      );
      unsubs.push(() => {
        uProf();
        uSum();
      });
    }

    return () => unsubs.forEach((u) => u());
  }, [items, uid]);

  const pendingInviteCount = incoming.length + outgoing.length;

  async function pushSharedSummary(shareEnabled: boolean) {
    const db = getFirestoreDb();
    await syncSharedSummary(db, uid, {
      habits,
      dayLog,
      logsByDate,
      focusToday,
      journal,
      shareEnabled,
      goals,
      nutritionTargets,
      nutritionIntake,
      identityTotalScore: identityProfile.totalScore,
      identityBestStreak: identityProfile.bestStreak ?? 0,
    });
  }

  async function toggleShare(v: boolean) {
    const db = getFirestoreDb();
    setError(null);
    setBusy(true);
    try {
      await setDoc(doc(db, 'users', uid, 'settings', 'privacy'), { shareProgressWithFriends: v }, { merge: true });
      await setDoc(doc(db, 'users', uid, 'shared', 'summary'), { shareEnabled: v }, { merge: true });
      await pushSharedSummary(v);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not update sharing');
    } finally {
      setBusy(false);
    }
  }

  async function inviteByUid() {
    setError(null);
    const to = friendUidInput.trim();
    if (!to) return;
    setBusy(true);
    try {
      const db = getFirestoreDb();
      await sendFriendInvite(db, uid, to, invitedByName);
      setFriendUidInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send invite');
    } finally {
      setBusy(false);
    }
  }

  async function inviteByEmail() {
    setError(null);
    const raw = emailInput.trim();
    if (!raw) return;
    setBusy(true);
    try {
      await logEmailFriendInvite(getFirestoreDb(), uid, raw, invitedByName);
      setEmailInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not log email invite');
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

  async function removeFriend(pairId: string) {
    if (!confirm('Remove this friend? You can invite them again later.')) return;
    setBusy(true);
    setError(null);
    try {
      await endFriendship(getFirestoreDb(), pairId, uid);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Friends</h1>
        <p className="page-subtitle">
          Connect with people you trust for accountability. Your habits, journal, and goals stay private unless you opt in
          to a small shared snapshot.
        </p>
      </div>

      <div className="page-body flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section className="friends-hero" aria-label="Friends overview">
          <div className="friends-hero-card card">
            <div className="friends-hero-val" style={{ color: 'var(--accent-light)' }}>
              {active.length}
            </div>
            <div className="friends-hero-label">Active friends</div>
            <p className="friends-hero-sub">People you&apos;re connected with right now.</p>
          </div>
          <div className="friends-hero-card card">
            <div className="friends-hero-val" style={{ color: 'var(--gold-light)' }}>
              {pendingInviteCount}
            </div>
            <div className="friends-hero-label">Pending invites</div>
            <p className="friends-hero-sub">Sent and received requests awaiting a response.</p>
          </div>
          <div className="friends-hero-card card">
            <div className="friends-hero-val" style={{ color: 'var(--green-light)' }}>
              {habitsDoneToday}/{Math.max(habits.length, 1)}
            </div>
            <div className="friends-hero-label">Your check-ins today</div>
            <p className="friends-hero-sub">Habits completed today — your side of accountability.</p>
          </div>
        </section>

        {error && (
          <p className="text-red text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="card">
          <div className="friends-section-title">Your User ID</div>
          <p className="text-xs text-muted mb-2">Share this with someone so they can send you a friend invite.</p>
          <code className="text-sm font-mono" style={{ wordBreak: 'break-all' }}>
            {uid}
          </code>
        </div>

        <div className="card">
          <div className="friends-section-title">Share progress (privacy)</div>
          <p className="text-xs text-muted mb-2">
            When enabled, only friends with an <strong>active</strong> friendship can read your limited summary at{' '}
            <code className="font-mono">users/{'{you}'}/shared/summary</code>. Nothing else under your account is
            exposed.
          </p>
          <label className="flex items-center gap-2 text-sm flex-wrap">
            <input
              type="checkbox"
              checked={shareProgressWithFriends}
              disabled={busy}
              onChange={(e) => void toggleShare(e.target.checked)}
            />
            <span>Allow the friend-visible summary (score snapshot, habits %, streak, rank title, focus count, journal flag).</span>
          </label>
          <p className="text-xs text-muted mt-2">
            <span className={`friends-pill ${shareProgressWithFriends ? 'on' : ''}`}>
              {shareProgressWithFriends ? 'Sharing on' : 'Sharing off'}
            </span>{' '}
            · Update identity display name on the Identity tab so friends see a friendly label in their list.
          </p>
        </div>

        <div className="friends-invite-grid">
          <div className="card">
            <div className="friends-section-title">Invite by User ID</div>
            <p className="text-xs text-muted mb-2">
              Paste their Firebase UID from their Friends page. This creates <code className="font-mono">friendships/&lt;pairId&gt;</code>.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Friend User ID"
                value={friendUidInput}
                onChange={(e) => setFriendUidInput(e.target.value)}
              />
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void inviteByUid()}>
                Send invite
              </button>
            </div>
          </div>

          <div className="card">
            <div className="friends-section-title">Invite by email (MVP)</div>
            <p className="text-xs text-muted mb-2">
              There is no server-side email lookup yet. We log the address on <strong>your</strong> account so you have a
              record, then you both still connect with User IDs when ready.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                className="input"
                type="email"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="friend@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void inviteByEmail()}>
                Log invite
              </button>
            </div>
            {outbox.length === 0 ? (
              <p className="text-muted text-sm mt-2">No email invites logged yet.</p>
            ) : (
              <div className="mt-3">
                <div className="section-label mb-1">Your email invite log</div>
                {outbox.map(({ id, data }) => (
                  <div key={id} className="friends-outbox-row">
                    <span>{data.recipientEmail}</span>
                    <span className="text-muted text-xs">{fmtUpdatedAt(data.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="friends-section-title">Incoming invites</div>
          {incoming.length === 0 ? (
            <p className="text-muted text-sm">No pending invites. You&apos;re all caught up.</p>
          ) : (
            incoming.map(({ id, data }) => (
              <div key={id} className="flex justify-between items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm">
                  From <strong>{data.invitedByName ?? `${data.invitedBy.slice(0, 8)}…`}</strong>
                </span>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void accept(id)}>
                    Accept
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void decline(id)}>
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="friends-section-title">Outgoing invites</div>
          {outgoing.length === 0 ? (
            <p className="text-muted text-sm">No pending invites you&apos;ve sent.</p>
          ) : (
            outgoing.map(({ id, data }) => (
              <div key={id} className="flex justify-between items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-mono">→ {otherMember(data, uid).slice(0, 14)}…</span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void cancel(id)}>
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="friends-section-title">Friends</div>
          {active.length === 0 ? (
            <div className="friends-empty">
              <div className="friends-empty-icon" aria-hidden>
                🤝
              </div>
              <p className="font-bold mb-1">No friends yet</p>
              <p className="text-muted text-sm mb-3" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                Invite someone you trust with their User ID. When they accept, they appear here with an optional progress
                snapshot if they choose to share.
              </p>
              <p className="text-xs text-muted">Today&apos;s key: {todayKey()}</p>
            </div>
          ) : (
            <div className="flex-col gap-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {active.map(({ id, data }) => {
                const fid = otherMember(data, uid);
                const row = friendRows[fid];
                const snap = row?.summary;
                return (
                  <div key={id} className="friends-friend-row">
                    <div className="friends-friend-head">
                      <div>
                        <div className="friends-friend-name">{row?.displayName ?? 'Friend'}</div>
                        <div className="friends-friend-meta">{fid}</div>
                        <div className="mt-2">
                          <span className="badge badge-accent">Active</span>
                          {row?.summaryLocked && (
                            <span className="badge badge-muted ml-2">Snapshot private</span>
                          )}
                          {!row?.summaryLocked && snap && (
                            <span className="badge badge-green ml-2">Sharing summary</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() => void removeFriend(id)}
                      >
                        Remove
                      </button>
                    </div>

                    {snap && !row?.summaryLocked ? (
                      <div>
                        <div className="section-label mb-2">Shared snapshot</div>
                        <div className="friends-snapshot">
                          <div className="friends-snap-cell">
                            <div className="friends-snap-val">{snap.dailyScore ?? '—'}</div>
                            <div className="friends-snap-label">Daily score</div>
                          </div>
                          <div className="friends-snap-cell">
                            <div className="friends-snap-val">{snap.habitsCompletedToday ?? '—'}</div>
                            <div className="friends-snap-label">Habits today</div>
                          </div>
                          <div className="friends-snap-cell">
                            <div className="friends-snap-val">{snap.bestStreak ?? '—'}d</div>
                            <div className="friends-snap-label">Streak</div>
                          </div>
                          <div className="friends-snap-cell">
                            <div className="friends-snap-val" style={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                              {snap.rankTitle ?? '—'}
                            </div>
                            <div className="friends-snap-label">Rank</div>
                          </div>
                          <div className="friends-snap-cell">
                            <div className="friends-snap-val">{snap.habitTodayPct ?? 0}%</div>
                            <div className="friends-snap-label">Habits %</div>
                          </div>
                          <div className="friends-snap-cell">
                            <div className="friends-snap-val">{snap.focusToday ?? 0}</div>
                            <div className="friends-snap-label">Focus</div>
                          </div>
                        </div>
                        {fmtUpdatedAt(snap.updatedAt) ? (
                          <p className="text-xs text-muted mt-2">Updated {fmtUpdatedAt(snap.updatedAt)}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">
                        {row?.summaryLocked
                          ? 'This friend has not turned on sharing, or the summary is not visible yet.'
                          : 'No shared summary yet — when they enable sharing and use the app, a small snapshot appears here.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
