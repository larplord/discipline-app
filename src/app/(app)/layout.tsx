import { AppShell } from '@/components/AppShell';
import '@/styles/mobile.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
