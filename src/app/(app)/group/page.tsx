'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { useUserData } from '@/components/UserDataProvider';
import { getFirestoreDb } from '@/lib/firebase/client';
import {
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
import type { AccountabilityGroup, Friendship, GroupCheckIn, GroupNudge, GroupPromise, SharedSummary } from '@/lib/types';
import '@/styles/pages/Group.css';

type GroupDoc = { id: string; data: AccountabilityGroup };
type FriendDoc = { id: string; data: Friendship };
type MemberProfile = {
  name: string;
  summary: SharedSummary | null;
  summaryState: 'loading' | 'available' | 'locked' | 'missing';
};

function otherMember(f: Friendship, selfUid: string) {
  return f.memberIds.find((m) => m !== selfUid) ?? '';
}

export default function GroupPage() {
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
  const [friendships, setFriendships] = useState<FriendDoc[]>([]);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});
  const [checkInsByGroup, setCheckInsByGroup] = useState<Record<string, Record<string, GroupCheckIn>>>({});
  const [recentNudges, setRecentNudges] = useState<Record<string, Array<{ id: string; data: GroupNudge }>>>({});
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [promiseText, setPromiseText] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
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

  useEffect(() => {
    const q = query(collection(db, 'friendships'), where('memberIds', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
      const list: FriendDoc[] = [];
      snap.forEach((d) => list.push({ id: d.id, data: d.data() as Friendship }));
      setFriendships(list);
    });
  }, [db, uid]);

  useEffect(() => {
    const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
      const list: GroupDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as AccountabilityGroup;
        if (data.status !== 'deleted') list.push({ id: d.id, data });
      });
      list.sort((a, b) => timestampMillis(b.data.updatedAt) - timestampMillis(a.data.updatedAt));
      setGroups(list);
    });
  }, [db, uid]);

  useEffect(() => {
    setSelectedGroupId((prev) => (prev && groups.some((g) => g.id === prev) ? prev : groups[0]?.id ?? ''));
  }, [groups]);

  const activeFriends = useMemo(
    () =>
      friendships
        .filter((x) => x.data.status === 'active')
        .map((x) => ({ pairId: x.id, uid: otherMember(x.data, uid) }))
        .filter((x) => x.uid),
    [friendships, uid]
  );

  const memberIds = useMemo(() => {
    const ids = new Set<string>([uid]);
    activeFriends.forEach((f) => ids.add(f.uid));
    groups.forEach((g) => g.data.memberIds.forEach((id) => ids.add(id)));
    return [...ids];
  }, [activeFriends, groups, uid]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    setProfiles((prev) => ({
      ...prev,
      [uid]: {
        name: user?.displayName?.trim() || user?.email?.split('@')[0] || 'You',
        summary: mySummary,
        summaryState: 'available',
      },
    }));

    for (const memberId of memberIds.filter((id) => id !== uid)) {
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
          const currentName = profiles[memberId]?.name;
          if (!snap.exists()) {
            setProfiles((prev) => ({
              ...prev,
              [memberId]: {
                name: safeMemberName(memberId, currentName || prev[memberId]?.name),
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
              name: safeMemberName(memberId, currentName || prev[memberId]?.name),
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
  }, [db, memberIds.join(','), uid, user?.displayName, user?.email, dailyScore, mySummary.habitTodayPct, mySummary.weekHabitPct, mySummary.focusToday]);

  useEffect(() => {
    const unsubs = groups.map((group) =>
      onSnapshot(collection(db, 'groups', group.id, 'checkIns'), (snap) => {
        const entries: Record<string, GroupCheckIn> = {};
        snap.forEach((d) => {
          entries[d.id] = d.data() as GroupCheckIn;
        });
        setCheckInsByGroup((prev) => ({ ...prev, [group.id]: entries }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [db, groups]);

  useEffect(() => {
    const unsubs = groups.map((group) =>
      onSnapshot(collection(db, 'groups', group.id, 'nudges'), (snap) => {
        const list: Array<{ id: string; data: GroupNudge }> = [];
        snap.forEach((d) => list.push({ id: d.id, data: d.data() as GroupNudge }));
        list.sort((a, b) => timestampMillis(b.data.createdAt) - timestampMillis(a.data.createdAt));
        setRecentNudges((prev) => ({ ...prev, [group.id]: list.slice(0, 3) }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [db, groups]);

  useEffect(() => {
    if (!selectedGroupId) {
      setPromiseText('');
      return;
    }
    return onSnapshot(doc(db, 'groups', selectedGroupId, 'promises', uid), (snap) => {
      const data = snap.data() as GroupPromise | undefined;
      setPromiseText(data?.text ?? '');
    });
  }, [db, selectedGroupId, uid]);

  const weekKeys = useMemo(() => weekDateKeys(), []);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const selectedCheckIns = selectedGroupId ? (checkInsByGroup[selectedGroupId] ?? {}) : {};
  const checkedInToday = selectedGroupId ? !!selectedCheckIns[todayGroupCheckInId(uid)] : false;
  const totalPossibleCheckIns = groups.reduce((sum, group) => sum + group.data.memberIds.length * 7, 0);
  const totalWeeklyCheckIns = groups.reduce((sum, group) => sum + countWeeklyCheckIns(checkInsByGroup[group.id] ?? {}, group.data.memberIds, weekKeys), 0);
  const myWeeklyCheckIns = selectedGroup ? countMemberWeeklyCheckIns(selectedCheckIns, uid, weekKeys) : 0;
  const myWeeklyScore = weeklyConsistencyScore(myWeeklyCheckIns, mySummary);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanName = groupName.trim();
    const members = [uid, ...selectedFriendIds];
    if (!cleanName) {
      setError('Name your group first.');
      return;
    }
    if (members.length < 2 || members.length > 5) {
      setError('Pick 1-4 active friends so the group has 2-5 people.');
      return;
    }
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, 'groups'), {
        name: cleanName,
        memberIds: members,
        createdBy: uid,
        activeChallengeIds: [],
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setGroupName('');
      setSelectedFriendIds([]);
      setSelectedGroupId(ref.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create group.');
    } finally {
      setBusy(false);
    }
  }

  async function savePromise() {
    if (!selectedGroupId) return;
    setBusy(true);
    setError(null);
    try {
      await setDoc(
        doc(db, 'groups', selectedGroupId, 'promises', uid),
        { uid, text: promiseText.trim(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save promise.');
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    if (!selectedGroupId || dailyScore < 1 || checkedInToday) return;
    setBusy(true);
    setError(null);
    try {
      await setDoc(doc(db, 'groups', selectedGroupId, 'checkIns', todayGroupCheckInId(uid)), {
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

  async function sendNudge(message: string) {
    if (!selectedGroupId) return;
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(db, 'groups', selectedGroupId, 'nudges'), {
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

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Group</h1>
        <p className="page-subtitle">Hold your circle accountable without turning the whole app into a leaderboard.</p>
      </div>

      <div className="page-body group-page">
        {error && <div className="group-alert">{error}</div>}

        <section className="group-stats">
          <MetricCard label="Weekly Consistency Score" value={`${myWeeklyScore}/10`} sub="+5 check-ins, +5 weekly habits" tone="gold" />
          <MetricCard label="Circle Check-ins" value={`${totalWeeklyCheckIns}`} sub="Manual check-ins this week" tone="green" />
          <MetricCard
            label="Together This Week"
            value={totalPossibleCheckIns ? `${totalWeeklyCheckIns}/${totalPossibleCheckIns}` : '0/0'}
            sub="Total group days showed up"
            tone="accent"
          />
        </section>

        <section className="group-overview-grid">
          <div className="group-main-stack">
            <div className="group-card card">
              <div className="group-section-head">
                <div>
                  <div className="group-section-title">Accountability circles</div>
                  <p className="group-section-sub">Create a 2-5 person circle from active friends.</p>
                </div>
              </div>

              <form className="group-create" onSubmit={createGroup}>
                <input
                  className="input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name, e.g. Lock In Crew"
                />
                <div className="group-friend-picker">
                  {activeFriends.length === 0 ? (
                    <p className="text-sm text-muted">Add active friends first, then you can build a group here.</p>
                  ) : (
                    activeFriends.map((friend) => {
                      const name = profiles[friend.uid]?.name ?? safeMemberName(friend.uid);
                      const selected = selectedFriendIds.includes(friend.uid);
                      return (
                        <label key={friend.uid} className={`group-check-option ${selected ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!selected && selectedFriendIds.length >= 4}
                            onChange={(e) =>
                              setSelectedFriendIds((prev) =>
                                e.target.checked ? [...prev, friend.uid] : prev.filter((id) => id !== friend.uid)
                              )
                            }
                          />
                          <span>{initials(name)}</span>
                          {name}
                        </label>
                      );
                    })
                  )}
                </div>
                <button type="submit" className="btn btn-primary" disabled={busy || activeFriends.length === 0}>
                  Create Group
                </button>
              </form>
            </div>

            {groups.length === 0 ? (
              <div className="card empty-state">
                <p>No groups yet. Start with one small circle and keep it honest.</p>
              </div>
            ) : (
              <div className="group-list">
                {groups.map((group) => (
                  <GroupSummaryCard
                    key={group.id}
                    group={group}
                    profiles={profiles}
                    checkIns={checkInsByGroup[group.id] ?? {}}
                    weekKeys={weekKeys}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="group-side-stack">
            <div className="group-card card">
              <div className="group-section-title">Quick accountability</div>
              {groups.length > 0 ? (
                <>
                  <label className="group-field">
                    <span className="section-label">Group</span>
                    <select className="select" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.data.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="group-field">
                    <span className="section-label">This week I promise</span>
                    <textarea
                      className="textarea group-promise-input"
                      value={promiseText}
                      onChange={(e) => setPromiseText(e.target.value)}
                      placeholder="Write the promise your group can hold you to."
                    />
                  </label>
                  <button type="button" className="btn btn-primary w-full" onClick={() => void savePromise()} disabled={busy}>
                    Save Promise
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => void checkIn()}
                    disabled={busy || dailyScore < 1 || checkedInToday}
                  >
                    {checkedInToday ? 'Checked in today' : dailyScore < 1 ? 'Earn 1 daily score point first' : 'Check in today'}
                  </button>
                  <div className="group-nudge-grid">
                    {GROUP_NUDGES.map((message) => (
                      <button key={message} type="button" className="btn btn-ghost btn-sm" onClick={() => void sendNudge(message)} disabled={busy}>
                        {message}
                      </button>
                    ))}
                  </div>
                  <div className="group-mini-feed">
                    {(recentNudges[selectedGroupId] ?? []).map((nudge) => (
                      <div key={nudge.id} className="group-feed-item">
                        <span>{profiles[nudge.data.fromUid]?.name ?? 'Someone'}</span>
                        {nudge.data.message}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">Create a group to unlock promises, check-ins, and nudges.</p>
              )}
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

function GroupSummaryCard({
  group,
  profiles,
  checkIns,
  weekKeys,
}: {
  group: GroupDoc;
  profiles: Record<string, MemberProfile>;
  checkIns: Record<string, GroupCheckIn>;
  weekKeys: string[];
}) {
  const weeklyCheckIns = countWeeklyCheckIns(checkIns, group.data.memberIds, weekKeys);
  const possible = group.data.memberIds.length * 7;
  return (
    <Link href={`/group/${group.id}`} className="group-summary-card card">
      <div className="group-summary-top">
        <div>
          <h3>{group.data.name}</h3>
          <p>{group.data.memberIds.length} members</p>
        </div>
        <span className="badge badge-accent">{weeklyCheckIns}/{possible} together</span>
      </div>
      <div className="group-member-grid">
        {group.data.memberIds.map((memberId) => {
          const profile = profiles[memberId];
          const name = safeMemberName(memberId, profile?.name);
          const summary = profile?.summary;
          const memberWeeklyCheckIns = countMemberWeeklyCheckIns(checkIns, memberId, weekKeys);
          const checkedToday = !!checkIns[groupCheckInId(weekKeys[0], memberId)];
          return (
            <div key={memberId} className="group-member-row">
              <div className="group-avatar">{initials(name)}</div>
              <div className="group-member-copy">
                <strong>{name}</strong>
                <span>{checkedToday ? 'Checked in today' : 'Not checked in'}</span>
              </div>
              <div className="group-member-stats">
                <span>{summary?.habitsCompletedToday ?? '—'} habits</span>
                <span>{summary?.focusToday ?? '—'} focus</span>
                <span>{summary?.weekHabitPct ?? 0}% week</span>
                <span>{weeklyConsistencyScore(memberWeeklyCheckIns, summary)}/10</span>
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

function countMemberWeeklyCheckIns(checkIns: Record<string, GroupCheckIn>, memberId: string, weekKeys: string[]) {
  return weekKeys.filter((date) => !!checkIns[groupCheckInId(date, memberId)]).length;
}

function countWeeklyCheckIns(checkIns: Record<string, GroupCheckIn>, memberIds: string[], weekKeys: string[]) {
  return memberIds.reduce((sum, memberId) => sum + countMemberWeeklyCheckIns(checkIns, memberId, weekKeys), 0);
}
