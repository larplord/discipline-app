import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyPrioritiesPage() {
  return <LifeDetailPage eyebrow="Daily" title="Top Priorities" subtitle="A simple priority board for today’s most important moves." icon="☑" backHref="/fitness/daily" backLabel="Daily" primaryAction="Add priority" stats={[]} items={[]} sideTitle="Priority rules" sideItems={[]} />;
}
