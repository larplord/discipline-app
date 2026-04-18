'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase/client';

type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log('[DisciplineOS][Auth] subscribing onAuthStateChanged');
    return onAuthStateChanged(auth, (u) => {
      console.log('[DisciplineOS][Auth] onAuthStateChanged', {
        uid: u?.uid ?? null,
        hasUser: !!u,
      });
      setUser(u);
      setLoading(false);
      if (u) {
        void (async () => {
          try {
            const db = getFirestoreDb();
            await setDoc(
              doc(db, 'users', u.uid),
              {
                email: u.email ?? '',
                displayName: u.displayName ?? '',
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            await setDoc(
              doc(db, 'users', u.uid, 'publicProfile', 'me'),
              {
                displayName: u.displayName ?? u.email?.split('@')[0] ?? 'User',
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            console.log('[DisciplineOS][Auth] profile sync done');
          } catch (e) {
            console.warn('[DisciplineOS][Auth] profile sync failed (non-fatal)', e);
          }
        })();
      }
    });
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
