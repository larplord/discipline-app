'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { app } from '../../lib/firebase';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (app) console.log('Firebase connected');
  }, []);

  useEffect(() => {
    if (loading) {
      console.log('[DisciplineOS][Home] wait auth', { loading });
      return;
    }
    const dest = user ? '/dashboard' : '/login';
    console.log('[DisciplineOS][Home] redirect →', dest);
    router.replace(dest);
  }, [user, loading, router]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', flexDirection: 'column', gap: '0.75rem' }}
    >
      <p className="text-muted">Loading…</p>
      <p style={{ color: 'var(--green-light)', fontWeight: 600 }}>Firebase is working</p>
    </div>
  );
}
