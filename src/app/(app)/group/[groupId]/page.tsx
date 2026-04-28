'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { useUserData } from '@/components/UserDataProvider';
import { getFirestoreDb } from '@/lib/firebase/client';
import {
  GROUP_CHALLENGES,
  GROUP_NUDGES,
  groupCheckInId,
  initials,
  safeMemberName,
  timestampMillis,
  todayGroupCheckInId,
  weekDateKeys,
  weeklyConsistencyScore,
} from '@/lib/groupAccountability';
import { calcDailyScore, isJournalCompleteForDailyScore, todayProgress, weekProgress } from '@/lib/scoring';
import type { AccountabilityGroup, GroupCheckIn, GroupNudge, GroupPromise, SharedSummary } from '@/lib/types';
import '@/styles/pages/Group.css';

type MemberProfile = {
  name: string;
  summary: SharedSummary | null;
  summaryState: 'loading' | 'available' | 'locked' | 'missing';
};

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const groupId = params.groupId;
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
  } = useUserData();
  const db = getFirestoreDb();
  const [group, setGroup] = useState<AccountabilityGroup | null>(null);
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});
  const [checkIns, setCheckIns] = useState<Record<string, GroupCheckIn>>({});
  const [nudges, setNudges] = useState<Array<{ id: string; data: GroupNudge }>>([]);
  const [promises, setPromises] = useState<Record<string, GroupPromise>>({});
  const [promiseText, setPromiseText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dailyScore = calcDailyScore({
    habits,
    dayLog,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    logsByDate,
  });
  const mySummary: SharedSummary = {
    shareEnabled: true,
    habitTodayPct: todayProgress(habits, dayLog),
    weekHabitPct: weekProgress(habits, logsByDate),
    focusToday,
    journalToday: isJournalCompleteForDailyScore(journal),
    dailyScore,
    habitsCompletedToday: habits.filter((h) => dayLog[h.id]).length,
  };
  const weekKeys = useMemo(() => weekDateKeys(), []);

  useEffect(() => {
    return onSnapshot(
      doc(db, 'groups', groupId),
      (snap) => {
        if (!snap.exists()) {
          setGroup(null);
          return;
        }
        const data = snap.data() as AccountabilityGroup;
        setGroup(data.status === 'deleted' ? null : data);
      },
      () => setGroup(null)
    );
  }, [db, groupId]);

  useEffect(() => {
    return onSnapshot(collection(db, 'groups', groupId, 'checkIns'), (snap) => {
      const entries: Record<string, GroupCheckIn> = {};
      snap.forEach((d) => {
        entries[d.id] = d.data() as GroupCheckIn;
      });
      setCheckIns(entries);
    });
  }, [db, groupId]);

  useEffect(() => {
    return onSnapshot(collection(db, 'groups', groupId, 'nudges'), (snap) => {
      const list: Array<{ id: string; data: GroupNudge }> = [];
      snap.forEach((d) => list.push({ id: d.id, data: d.data() as GroupNudge }));
      list.sort((a, b) => timestampMillis(b.data.createdAt) - timestampMillis(a.data.createdAt));
      setNudges(list.slice(0, 12));
    });
  }, [db, groupId]);

  useEffect(() => {
    return onSnapshot(collection(db, 'groups', groupId, 'promises'), (snap) => {
      const entries: Record<string, GroupPromise> = {};
      snap.forEach((d) => {
        entries[d.id] = d.data() as GroupPromise;
      });
      setPromises(entries);
      setPromiseText(entries[uid]?.text ?? '');
    });
  }, [db, groupId, uid]);

  const memberIds = group?.memberIds ?? [];

  useEffect(() => {
    if (!group) return;
    const unsubs: Array<() => void> = [];
    setProfiles((prev) => ({
      ...prev,
      [uid]: {
        name: user?.displayName?.trim() || user?.email?.split('@')[0] || 'You',
        summary: mySummary,
        summaryState: 'available',
      },
    }));

    for (const memberId of group.memberIds.filter((id) => id !== uid)) {
      const profileUnsub = onSnapshot(doc(db, 'users', memberId, 'publicProfile', 'me'), (snap) => {
        const name = (snap.data()?.displayName as string | undefined)?.trim();
        setProfiles((prev) => ({
          ...prev,
          [memberId]: {
            name: safeMemberName(memberId, name || prev[memberId]?.name),
            summary: prev[memberId]?.summary ?? null,
            summaryState: prev[memberId]?.summaryState ?? 'loading',
          },
        }));
      });
      const summaryUnsub = onSnapshot(
        doc(db, 'users', memberId, 'shared', 'summary'),
        (snap) => {
          if (!snap.exists()) {
            setProfiles((prev) => ({
              ...prev,
              [memberId]: {
                name: safeMemberName(memberId, prev[memberId]?.name),
                summary: null,
                summaryState: 'missing',
              },
            }));
            return;
          }
          const summary = snap.data() as SharedSummary;
          setProfiles((prev) => ({
            ...prev,
            [memberId]: {
              name: safeMemberName(memberId, prev[memberId]?.name),
              summary: summary.shareEnabled ? summary : null,
              summaryState: summary.shareEnabled ? 'available' : 'locked',
            },
          }));
        },
        () => {
          setProfiles((prev) => ({
            ...prev,
            [memberId]: {
              name: safeMemberName(memberId, prev[memberId]?.name),
              summary: null,
              summaryState: 'locked',
            },
          }));
        }
      );
      unsubs.push(profileUnsub, summaryUnsub);
    }
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, groupId, group?.memberIds.join(','), uid, user?.displayName, user?.email, dailyScore, mySummary.habitTodayPct, mySummary.weekHabitPct, mySummary.focusToday]);

  const checkedInToday = !!checkIns[todayGroupCheckInId(uid)];
  const weeklyCheckIns = countWeeklyCheckIns(checkIns, memberIds, weekKeys);
  const possibleWeeklyCheckIns = memberIds.length * 7;
  const groupScores = memberIds.map((memberId) =>
    weeklyConsistencyScore(countMemberWeeklyCheckIns(checkIns, memberId, weekKeys), profiles[memberId]?.summary)
  );
  const averageScore = groupScores.length
    ? Math.round(groupScores.reduce((sum, score) => sum + score, 0) / groupScores.length)
    : 0;

  async function checkIn() {
    if (!group || dailyScore < 1 || checkedInToday) return;
    setBusy(true);
    setError(null);
    try {
      await setDoc(doc(db, 'groups', groupId, 'checkIns', todayGroupCheckInId(uid)), {
        uid,
        date: weekKeys[0],
        dailyScoreAtCheckIn: dailyScore,
        createdAt: serverTimestamp(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not check in.');
    } finally {
      setBusy(false);
    }
  }

  async function savePromise() {
    if (!group) return;
    setBusy(true);
    setError(null);
    try {
      await setDoc(
        doc(db, 'groups', groupId, 'promises', uid),
        { uid, text: promiseText.trim(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save promise.');
    } finally {
      setBusy(false);
    }
  }

  async function sendNudge(message: string) {
    if (!group) return;
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(db, 'groups', groupId, 'nudges'), {
        fromUid: uid,
        message,
        createdAt: serverTimestamp(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send nudge.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleChallenge(challengeId: string) {
    if (!group) return;
    const active = new Set(group.activeChallengeIds ?? []);
    if (active.has(challengeId)) active.delete(challengeId);
    else active.add(challengeId);
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        activeChallengeIds: [...active],
        updatedAt: serverTimestamp(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not update challenge.');
    } finally {
      setBusy(false);
    }
  }

  async function leaveGroup() {
    if (!group || group.createdBy === uid) return;
    if (!confirm('Leave this group? You can only rejoin if someone creates a new group with you.')) return;
    const nextMembers = group.memberIds.filter((memberId) => memberId !== uid);
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: nextMembers,
        updatedAt: serverTimestamp(),
      });
      router.replace('/group');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not leave group.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup() {
    if (!group || group.createdBy !== uid) return;
    if (!confirm('Delete this group for everyone? This removes it from the Group tab.')) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
      router.replace('/group');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not delete group.');
    } finally {
      setBusy(false);
    }
  }

  if (!group) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Group</h1>
          <p className="page-subtitle">Loading group accountability room...</p>
        </div>
        <div className="page-body">
          <div className="card empty-state">
            <p>If this keeps loading, you may not have access to this group.</p>
            <Link href="/group" className="btn btn-ghost">Back to Group</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="group-detail-head">
          <div>
            <Link href="/group" className="group-back-link">← Group overview</Link>
            <h1 className="page-title">{group.name}</h1>
            <p className="page-subtitle">{memberIds.length} people keeping the week honest.</p>
          </div>
          <div className="group-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void checkIn()}
              disabled={busy || dailyScore < 1 || checkedInToday}
            >
              {checkedInToday ? 'Checked in today' : dailyScore < 1 ? 'Earn 1 score point first' : 'Check in today'}
            </button>
            {group.createdBy === uid ? (
              <button type="button" className="btn btn-danger" onClick={() => void deleteGroup()} disabled={busy}>
                Delete Group
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => void leaveGroup()} disabled={busy}>
                Leave Group
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-body group-page">
        {error && <div className="group-alert">{error}</div>}

        <section className="group-room-stats">
          <MetricCard label="Together" value={`${weeklyCheckIns}/${possibleWeeklyCheckIns}`} sub="days showed up this week" tone="accent" />
          <MetricCard label="Group Avg." value={`${averageScore}/10`} sub="weekly consistency score" tone="gold" />
          <MetricCard label="Your Score" value={`${weeklyConsistencyScore(countMemberWeeklyCheckIns(checkIns, uid, weekKeys), mySummary)}/10`} sub="check-ins + weekly habits" tone="green" />
        </section>

        <section className="group-card card">
          <div className="group-section-title">Members</div>
          <div className="group-member-strip">
            {memberIds.map((memberId) => {
              const profile = profiles[memberId];
              const name = safeMemberName(memberId, profile?.name);
              const summary = profile?.summary;
              const memberWeeklyCheckIns = countMemberWeeklyCheckIns(checkIns, memberId, weekKeys);
              const score = weeklyConsistencyScore(memberWeeklyCheckIns, summary);
              const checkedToday = !!checkIns[groupCheckInId(weekKeys[0], memberId)];
              return (
                <div key={memberId} className="group-member-tile">
                  <div className="group-avatar large">{initials(name)}</div>
                  <strong>{name}</strong>
                  <span className={`group-status-dot ${checkedToday ? 'on' : ''}`}>{checkedToday ? 'Checked in' : 'Not yet'}</span>
                  <div className="group-tile-stats">
                    <span>{summary?.habitsCompletedToday ?? '—'} habits</span>
                    <span>{summary?.focusToday ?? '—'} focus</span>
                    <span>{summary?.weekHabitPct ?? 0}% week</span>
                    <span>{score}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="group-room-grid">
          <div className="group-main-stack">
            <div className="group-card card">
              <div className="group-section-title">Small Weekly Challenges</div>
              <div className="group-challenge-grid">
                {GROUP_CHALLENGES.map((challenge) => {
                  const active = group.activeChallengeIds?.includes(challenge.id);
                  return (
                    <button
                      key={challenge.id}
                      type="button"
                      className={`group-challenge ${active ? 'active' : ''}`}
                      onClick={() => void toggleChallenge(challenge.id)}
                      disabled={busy}
                    >
                      <span>{active ? 'Active' : 'Add'}</span>
                      {challenge.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="group-card card">
              <div className="group-section-title">Accountability promises</div>
              <div className="group-promise-list">
                {memberIds.map((memberId) => {
                  const name = safeMemberName(memberId, profiles[memberId]?.name);
                  const text = promises[memberId]?.text?.trim();
                  return (
                    <div key={memberId} className="group-promise-row">
                      <div className="group-avatar">{initials(name)}</div>
                      <div>
                        <strong>{name}</strong>
                        <p>{text || 'No promise written yet.'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="group-side-stack">
            <div className="group-card card">
              <div className="group-section-title">This week I promise</div>
              <textarea
                className="textarea group-promise-input"
                value={promiseText}
                onChange={(e) => setPromiseText(e.target.value)}
                placeholder="Write the promise your group can hold you to."
              />
              <button type="button" className="btn btn-primary w-full mt-2" onClick={() => void savePromise()} disabled={busy}>
                Save Promise
              </button>
            </div>

            <div className="group-card card">
              <div className="group-section-title">Nudges</div>
              <div className="group-nudge-grid">
                {GROUP_NUDGES.map((message) => (
                  <button key={message} type="button" className="btn btn-ghost btn-sm" onClick={() => void sendNudge(message)} disabled={busy}>
                    {message}
                  </button>
                ))}
              </div>
              <div className="group-mini-feed">
                {nudges.length === 0 ? (
                  <p className="text-sm text-muted">No nudges yet.</p>
                ) : (
                  nudges.map((nudge) => (
                    <div key={nudge.id} className="group-feed-item">
                      <span>{profiles[nudge.data.fromUid]?.name ?? 'Someone'}</span>
                      {nudge.data.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'accent' | 'gold' | 'green' }) {
  return (
    <div className="group-metric card">
      <div className={`group-metric-val ${tone}`}>{value}</div>
      <div className="group-metric-label">{label}</div>
      <p>{sub}</p>
    </div>
  );
}

function countMemberWeeklyCheckIns(checkIns: Record<string, GroupCheckIn>, memberId: string, weekKeys: string[]) {
  return weekKeys.filter((date) => !!checkIns[groupCheckInId(date, memberId)]).length;
}

function countWeeklyCheckIns(checkIns: Record<string, GroupCheckIn>, memberIds: string[], weekKeys: string[]) {
  return memberIds.reduce((sum, memberId) => sum + countMemberWeeklyCheckIns(checkIns, memberId, weekKeys), 0);
}
