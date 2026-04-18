'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useAuth } from '@/components/AuthProvider';
import { UserDataProvider, useUserData } from '@/components/UserDataProvider';
import { Sidebar } from '@/components/Sidebar';

function ShellInner({ children }: { children: ReactNode }) {
  const data = useUserData();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function logout() {
    await signOut(getFirebaseAuth());
    router.replace('/login');
  }

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
