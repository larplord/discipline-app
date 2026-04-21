'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase/client';
import { useAuth } from '@/components/AuthProvider';
import { UserDataProvider, useUserData } from '@/components/UserDataProvider';
import { Sidebar } from '@/components/Sidebar';
import { syncSharedSummary } from '@/lib/syncSharedSummary';

function ShellInner({ children }: { children: ReactNode }) {
  const data = useUserData();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncFingerprintRef = useRef('');

  async function logout() {
    await signOut(getFirebaseAuth());
    router.replace('/login');
  }

  useEffect(() => {
    if (!data.shareProgressWithFriends) return;

    const fingerprint = JSON.stringify({
      uid: data.uid,
      habits: data.habits,
      dayLog: data.dayLog,
      logsByDate: data.logsByDate,
      focusToday: data.focusToday,
      journal: data.journal,
      goals: data.goals,
      nutritionTargets: data.nutritionTargets,
      nutritionIntake: data.nutritionIntake,
      identityProfile: data.identityProfile,
    });

    if (fingerprint === lastSyncFingerprintRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void syncSharedSummary(getFirestoreDb(), data.uid, {
        habits: data.habits,
        dayLog: data.dayLog,
        logsByDate: data.logsByDate,
        focusToday: data.focusToday,
        journal: data.journal,
        shareEnabled: data.shareProgressWithFriends,
        goals: data.goals,
        nutritionTargets: data.nutritionTargets,
        nutritionIntake: data.nutritionIntake,
        identityTotalScore: data.identityProfile.totalScore,
        identityBestStreak: data.identityProfile.bestStreak ?? 0,
      })
        .then(() => {
          lastSyncFingerprintRef.current = fingerprint;
        })
        .catch((e) => {
          console.warn('[DisciplineOS][SharedSummary][sync-error]', e);
        });
    }, 1200);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [
    data.uid,
    data.habits,
    data.dayLog,
    data.logsByDate,
    data.focusToday,
    data.journal,
    data.goals,
    data.nutritionTargets,
    data.nutritionIntake,
    data.identityProfile,
    data.shareProgressWithFriends,
  ]);

  return (
    <div className="app-layout">
      <div
        className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <Sidebar
        open={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        scoreData={{
          habits: data.habits,
          dayLog: data.dayLog,
          focusToday: data.focusToday,
          journal: data.journal,
          goals: data.goals,
          nutritionTargets: data.nutritionTargets,
          nutritionIntake: data.nutritionIntake,
          logsByDate: data.logsByDate,
        }}
        onSignOut={logout}
      />

      <div className="main-content">
        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
            Discipline<span style={{ color: 'var(--accent)' }}>OS</span>
          </span>
          <div style={{ width: 32 }} />
        </div>

        {children}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[DisciplineOS][AppShell] state', { loading, hasUser: !!user, uid: user?.uid ?? null });
    if (!loading && !user) {
      console.log('[DisciplineOS][AppShell] redirect → /login');
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p className="text-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <UserDataProvider uid={user.uid}>
      <ShellInner>{children}</ShellInner>
    </UserDataProvider>
  );
}
