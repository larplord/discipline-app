'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { app } from '../../lib/firebase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (app) console.log('Firebase connected');
    console.log('[DisciplineOS][Home] single-operator redirect → /dashboard');
    router.replace('/dashboard');
  }, [router]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', flexDirection: 'column', gap: '0.75rem' }}
    >
      <p className="text-muted">Opening dashboard…</p>
    </div>
  );
}
