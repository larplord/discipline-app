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
  validateFriendUidTarget,
} from '@/lib/friendships';
import type { Friendship, FriendEmailInviteOutbox, SharedSummary } from '@/lib/types';
import { syncSharedSummary, computeGoalsShareFields } from '@/lib/syncSharedSummary';
import { calcDailyScore, isJournalCompleteForDailyScore, weekProgress } from '@/lib/scoring';
import { calcStreak } from '@/lib/streaks';
import { getLevel } from '@/lib/levels';
import { todayKey } from '@/lib/dates';
import '@/styles/pages/Friends.css';

type FriendRowModel = {
  pairId: string;
  friendUid: string;
  displayName: string;
  summary: SharedSummary | null;
  summaryLocked: boolean;
  summaryState:
    | 'loading'
    | 'available'
    | 'no_summary'
    | 'sharing_disabled'
    | 'permission_denied'
    | 'read_error';
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

type CmpWin = 'you' | 'them' | 'tie' | 'none';

function cmpHigh(my: number, their: number | undefined, theirOk: boolean): CmpWin {
  if (!theirOk || their === undefined || Number.isNaN(their)) return 'none';
  if (my === their) return 'tie';
  return my > their ? 'you' : 'them';
}

function compareCellClass(col: 'you' | 'them', win: CmpWin): string {
  const base = 'friends-compare-cell';
  if (win === 'none') return base;
  if (win === 'tie') return `${base} tie`;
  if (win === 'you') return `${base} ${col === 'you' ? 'win' : 'lose'}`;
  return `${base} ${col === 'them' ? 'win' : 'lose'}`;
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
  const [compareFriendUid, setCompareFriendUid] = useState('');
  const [uidCheck, setUidCheck] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

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

  const activeFidsKey = useMemo(
    () =>
      [...active]
        .map(({ data }) => otherMember(data, uid))
        .filter(Boolean)
        .sort()
        .join(','),
    [active, uid]
  );

  useEffect(() => {
    if (!activeFidsKey) {
      setCompareFriendUid('');
      return;
    }
    const ids = activeFidsKey.split(',');
    setCompareFriendUid((prev) => (prev && ids.includes(prev) ? prev : ids[0] ?? ''));
  }, [activeFidsKey]);

  const myLabel = user?.displayName?.trim() || user?.email?.split('@')[0] || 'You';
  const myStats = useMemo(() => {
    const scoreInput = {
      habits,
      dayLog,
      focusToday,
      journal,
      goals,
      nutritionTargets,
      nutritionIntake,
      logsByDate,
    };
    const maxH = habits.length ? Math.max(0, ...habits.map((h) => calcStreak(h.id, logsByDate))) : 0;
    const bestStreak = Math.max(maxH, identityProfile.bestStreak ?? 0, 0);
    const { goalsAvgPct, goalsTrackedCount } = computeGoalsShareFields(goals);
    return {
      dailyScore: calcDailyScore(scoreInput),
      bestStreak,
      habitsDone: habits.filter((h) => dayLog[h.id]).length,
      weekPct: weekProgress(habits, logsByDate),
      rankTitle: getLevel(identityProfile.totalScore ?? 0).title,
      journalDone: isJournalCompleteForDailyScore(journal),
      goalsAvgPct,
      goalsTrackedCount,
    };
  }, [
    habits,
    dayLog,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    logsByDate,
    identityProfile.totalScore,
    identityProfile.bestStreak,
  ]);

  const compareRow = friendRows[compareFriendUid];
  const theirSnap = compareRow?.summary ?? undefined;
  const theirOk = !!compareFriendUid && !!theirSnap && !compareRow?.summaryLocked;
  const compareFriendName = compareRow?.displayName ?? 'Friend';

  const theirGoalsOk = theirOk && (theirSnap?.goalsTrackedCount ?? 0) > 0;
  const myGoalsOk = myStats.goalsTrackedCount > 0;

  const wins = useMemo(
    () => ({
      score: cmpHigh(myStats.dailyScore, theirSnap?.dailyScore, theirOk),
      streak: cmpHigh(myStats.bestStreak, theirSnap?.bestStreak, theirOk),
      habits: cmpHigh(myStats.habitsDone, theirSnap?.habitsCompletedToday, theirOk),
      week: cmpHigh(myStats.weekPct, theirSnap?.weekHabitPct, theirOk),
      goals: theirGoalsOk && myGoalsOk ? cmpHigh(myStats.goalsAvgPct, theirSnap?.goalsAvgPct, true) : ('none' as CmpWin),
      journal: cmpHigh(myStats.journalDone ? 1 : 0, theirSnap?.journalToday ? 1 : 0, theirOk),
    }),
    [myStats, theirSnap, theirOk, theirGoalsOk, myGoalsOk]
  );

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
          summaryState: prev[fid]?.summaryState ?? 'loading',
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
              [fid]: {
                ...p[fid],
                pairId,
                friendUid: fid,
                summary: null,
                summaryLocked: false,
                summaryState: 'no_summary',
              },
            }));
            return;
          }
          const s = snap.data() as SharedSummary;
          if (!s.shareEnabled) {
            setFriendRows((p) => ({
              ...p,
              [fid]: {
                ...p[fid],
                pairId,
                friendUid: fid,
                summary: null,
                summaryLocked: true,
                summaryState: 'sharing_disabled',
              },
            }));
            return;
          }
          setFriendRows((p) => ({
            ...p,
            [fid]: {
              ...p[fid],
              pairId,
              friendUid: fid,
              summary: s,
              summaryLocked: false,
              summaryState: 'available',
            },
          }));
        },
        (e: unknown) => {
          const code = (e as { code?: string })?.code;
          setFriendRows((p) => ({
            ...p,
            [fid]: {
              ...p[fid],
              pairId,
              friendUid: fid,
              summary: null,
              summaryLocked: true,
              summaryState: code === 'permission-denied' ? 'permission_denied' : 'read_error',
            },
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
      console.info('[friends][inviteByUid] Send Invite clicked', {
        authUid: user?.uid ?? null,
        stateUid: uid,
        toUid: to,
      });
      setUidCheck({ status: 'checking', message: 'Checking User ID…' });
      const check = await validateFriendUidTarget(db, to);
      if (!check.ok) {
        setUidCheck({
          status: 'invalid',
          message: 'User ID not found. Ask your friend to copy their User ID from Friends after login.',
        });
        return;
      }
      setUidCheck({
        status: 'valid',
        message: check.displayName
          ? `User found: ${check.displayName}`
          : 'User found. You can send invite.',
      });
      await sendFriendInvite(db, uid, to, invitedByName);
      setFriendUidInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send invite');
    } finally {
      setBusy(false);
    }
  }

  async function validateUidInput() {
    const candidate = friendUidInput.trim();
    if (!candidate) {
      setUidCheck({ status: 'invalid', message: 'Enter a User ID to validate.' });
      return;
    }
    setUidCheck({ status: 'checking', message: 'Checking User ID…' });
    try {
      const check = await validateFriendUidTarget(getFirestoreDb(), candidate);
      if (!check.ok) {
        setUidCheck({
          status: 'invalid',
          message: 'User ID not found. Ask your friend to open Friends and copy their ID.',
        });
        return;
      }
      setUidCheck({
        status: 'valid',
        message: check.displayName
          ? `User found: ${check.displayName}`
          : 'User found. You can send invite.',
      });
    } catch {
      setUidCheck({
        status: 'invalid',
        message: 'Could not validate now. Check your connection and try again.',
      });
    }
  }

  function summaryStateMessage(row?: FriendRowModel) {
    const st = row?.summaryState;
    if (st === 'sharing_disabled') return 'Sharing is disabled by this friend.';
    if (st === 'no_summary') return 'No shared summary document yet.';
    if (st === 'permission_denied') return 'Permission denied for shared summary.';
    if (st === 'read_error') return 'Temporary read failure while loading shared summary.';
    if (st === 'loading') return 'Loading shared summary…';
    return 'No shared summary available yet.';
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
      setError(e instanceof Error ? e.message : 'Could not accept invite.');
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
      setError(e instanceof Error ? e.message : 'Could not decline invite.');
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
      setError(e instanceof Error ? e.message : 'Could not cancel invite.');
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
      setError(e instanceof Error ? e.message : 'Could not remove friend.');
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

        <section className="friends-compare card" aria-label="Compare progress with a friend">
          <div className="friends-compare-top">
            <div>
              <div className="friends-compare-title">Compare progress</div>
              <p className="friends-compare-sub">
                Side-by-side snapshot: same safe fields friends can share. Nothing here reveals habit names, journal text,
                or nutrition details. Enable sharing so your friend can see your column in their app too.
              </p>
            </div>
            {active.length > 0 && (
              <label className="flex flex-col gap-1 text-xs text-muted" style={{ alignItems: 'flex-end' }}>
                <span>Compare with</span>
                <select
                  className="input friends-compare-select"
                  value={compareFriendUid}
                  onChange={(e) => setCompareFriendUid(e.target.value)}
                  aria-label="Choose friend to compare"
                >
                  {active.map(({ id, data }) => {
                    const fid = otherMember(data, uid);
                    const label = friendRows[fid]?.displayName ?? `${fid.slice(0, 8)}…`;
                    return (
                      <option key={id} value={fid}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
          </div>

          {active.length === 0 ? (
            <div className="friends-compare-empty">
              Add an active friend to unlock head-to-head motivation — your stats are warming up on the left already.
            </div>
          ) : (
            <>
              {!theirOk && (
                <p className="text-xs text-muted px-3 pb-2" style={{ marginTop: '-0.25rem' }}>
                  {compareRow
                    ? `${compareFriendName}: ${summaryStateMessage(compareRow)}`
                    : 'Pick a friend to compare.'}
                </p>
              )}
              <div className="friends-compare-grid" role="table">
                <div className="friends-compare-head">Metric</div>
                <div className="friends-compare-head you">{myLabel}</div>
                <div className="friends-compare-head them">{compareFriendName}</div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Daily score</div>
                  <div className={compareCellClass('you', wins.score)}>
                    <span className="friends-compare-val">{myStats.dailyScore}</span>
                    <div className="friends-compare-bar" aria-hidden>
                      <span style={{ width: `${Math.min(100, myStats.dailyScore)}%` }} />
                    </div>
                    {wins.score === 'you' && <span className="friends-compare-badge">Ahead</span>}
                  </div>
                  <div className={compareCellClass('them', wins.score)}>
                    <span className="friends-compare-val">{theirOk ? (theirSnap?.dailyScore ?? 0) : '—'}</span>
                    {theirOk && (
                      <div className="friends-compare-bar" aria-hidden>
                        <span style={{ width: `${Math.min(100, theirSnap?.dailyScore ?? 0)}%` }} />
                      </div>
                    )}
                    {wins.score === 'them' && <span className="friends-compare-badge">Ahead</span>}
                    {wins.score === 'tie' && theirOk && (
                      <span className="friends-compare-badge" style={{ color: 'var(--accent-light)' }}>
                        Tied
                      </span>
                    )}
                  </div>
                </div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Best streak</div>
                  <div className={compareCellClass('you', wins.streak)}>
                    <span className="friends-compare-val">{myStats.bestStreak}d</span>
                    {wins.streak === 'you' && <span className="friends-compare-badge">Ahead</span>}
                  </div>
                  <div className={compareCellClass('them', wins.streak)}>
                    <span className="friends-compare-val">{theirOk ? `${theirSnap?.bestStreak ?? 0}d` : '—'}</span>
                    {wins.streak === 'them' && <span className="friends-compare-badge">Ahead</span>}
                    {wins.streak === 'tie' && theirOk && (
                      <span className="friends-compare-badge" style={{ color: 'var(--accent-light)' }}>
                        Tied
                      </span>
                    )}
                  </div>
                </div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Habits done today</div>
                  <div className={compareCellClass('you', wins.habits)}>
                    <span className="friends-compare-val">{myStats.habitsDone}</span>
                    <small>Your habits today</small>
                    {wins.habits === 'you' && <span className="friends-compare-badge">Ahead</span>}
                  </div>
                  <div className={compareCellClass('them', wins.habits)}>
                    <span className="friends-compare-val">
                      {theirOk ? (theirSnap?.habitsCompletedToday ?? 0) : '—'}
                    </span>
                    {theirOk && <small>Their habits today</small>}
                    {wins.habits === 'them' && <span className="friends-compare-badge">Ahead</span>}
                    {wins.habits === 'tie' && theirOk && (
                      <span className="friends-compare-badge" style={{ color: 'var(--accent-light)' }}>
                        Tied
                      </span>
                    )}
                  </div>
                </div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Week habits %</div>
                  <div className={compareCellClass('you', wins.week)}>
                    <span className="friends-compare-val">{myStats.weekPct}%</span>
                    {wins.week === 'you' && <span className="friends-compare-badge">Ahead</span>}
                  </div>
                  <div className={compareCellClass('them', wins.week)}>
                    <span className="friends-compare-val">{theirOk ? `${theirSnap?.weekHabitPct ?? 0}%` : '—'}</span>
                    {wins.week === 'them' && <span className="friends-compare-badge">Ahead</span>}
                    {wins.week === 'tie' && theirOk && (
                      <span className="friends-compare-badge" style={{ color: 'var(--accent-light)' }}>
                        Tied
                      </span>
                    )}
                  </div>
                </div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Rank</div>
                  <div className="friends-compare-cell">
                    <span className="friends-compare-val" style={{ fontSize: '0.88rem' }}>
                      {myStats.rankTitle}
                    </span>
                    <small>Lifetime level title</small>
                  </div>
                  <div className="friends-compare-cell">
                    <span className="friends-compare-val" style={{ fontSize: '0.88rem' }}>
                      {theirOk ? (theirSnap?.rankTitle ?? '—') : '—'}
                    </span>
                    {theirOk && <small>Their shared title</small>}
                  </div>
                </div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Journal check-in</div>
                  <div className={compareCellClass('you', wins.journal)}>
                    <span className="friends-compare-val">{myStats.journalDone ? 'Yes' : 'No'}</span>
                    <small>Logged today (you)</small>
                    {wins.journal === 'you' && <span className="friends-compare-badge">Ahead</span>}
                  </div>
                  <div className={compareCellClass('them', wins.journal)}>
                    <span className="friends-compare-val">
                      {!theirOk ? '—' : theirSnap?.journalToday ? 'Yes' : 'No'}
                    </span>
                    {theirOk && <small>Flag only — no entries</small>}
                    {wins.journal === 'them' && <span className="friends-compare-badge">Ahead</span>}
                    {wins.journal === 'tie' && theirOk && (
                      <span className="friends-compare-badge" style={{ color: 'var(--accent-light)' }}>
                        Tied
                      </span>
                    )}
                  </div>
                </div>

                <div className="friends-compare-row" role="row">
                  <div className="friends-compare-cell label">Goal progress (avg.)</div>
                  <div className={compareCellClass('you', wins.goals)}>
                    <span className="friends-compare-val">
                      {myGoalsOk ? `${myStats.goalsAvgPct}%` : '—'}
                    </span>
                    <small>
                      {myGoalsOk
                        ? `${myStats.goalsTrackedCount} goal${myStats.goalsTrackedCount === 1 ? '' : 's'} · titles hidden`
                        : 'No milestones to average'}
                    </small>
                    {wins.goals === 'you' && <span className="friends-compare-badge">Ahead</span>}
                  </div>
                  <div className={compareCellClass('them', wins.goals)}>
                    <span className="friends-compare-val">
                      {theirGoalsOk ? `${theirSnap?.goalsAvgPct ?? 0}%` : '—'}
                    </span>
                    <small>
                      {theirGoalsOk
                        ? `${theirSnap?.goalsTrackedCount ?? 0} goal${(theirSnap?.goalsTrackedCount ?? 0) === 1 ? '' : 's'} · titles hidden`
                        : theirOk
                          ? 'Not sharing or no milestone goals'
                          : '—'}
                    </small>
                    {wins.goals === 'them' && <span className="friends-compare-badge">Ahead</span>}
                    {wins.goals === 'tie' && theirGoalsOk && myGoalsOk && (
                      <span className="friends-compare-badge" style={{ color: 'var(--accent-light)' }}>
                        Tied
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
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
            <span>
              Allow the friend-visible summary (score, streak, habits %, rank title, focus count, journal flag, optional
              goal average % — never goal titles or journal text).
            </span>
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
              Paste their Firebase UID from their Friends page. We validate the ID before sending invite to avoid dead
              requests. This creates <code className="font-mono">friendships/&lt;pairId&gt;</code>.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Friend User ID"
                value={friendUidInput}
                onChange={(e) => {
                  setFriendUidInput(e.target.value);
                  if (uidCheck.status !== 'idle') setUidCheck({ status: 'idle', message: '' });
                }}
              />
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void validateUidInput()}>
                Check ID
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void inviteByUid()}>
                Send invite
              </button>
            </div>
            {uidCheck.status !== 'idle' && (
              <p
                className={`text-xs mt-2 ${
                  uidCheck.status === 'valid'
                    ? 'text-green'
                    : uidCheck.status === 'checking'
                      ? 'text-muted'
                      : 'text-red'
                }`}
              >
                {uidCheck.message}
              </p>
            )}
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
                        {summaryStateMessage(row)}
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
