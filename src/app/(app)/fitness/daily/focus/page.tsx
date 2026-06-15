import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyFocusPage() {
  return <LifeDetailPage eyebrow="Daily" title="Focus History" subtitle="Review today’s focus sessions and keep the work blocks visible." icon="◷" backHref="/fitness/daily" backLabel="Daily" primaryAction="Start focus block" stats={[]} items={[]} sideTitle="Focus protocol" sideItems={[]} />;
}
