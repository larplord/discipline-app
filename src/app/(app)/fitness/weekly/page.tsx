import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function WeeklyHealthPage() {
  return <LifeDetailPage eyebrow="Health" title="Weekly Breakdown" subtitle="A compact weekly review for training, hydration, nutrition, and consistency." icon="◎" backHref="/fitness" backLabel="Health" primaryAction="Mark review complete" stats={[]} items={[]} sideTitle="Weekly next moves" sideItems={[]} />;
}
