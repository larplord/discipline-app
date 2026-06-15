import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyActivityPage() {
  return <LifeDetailPage eyebrow="Daily" title="Activity" subtitle="Manual movement snapshot for now. Apple Watch syncing can be added later when ready." icon="⌁" backHref="/fitness/daily" backLabel="Daily" primaryAction="Add activity note" stats={[]} items={[]} sideTitle="Movement plan" sideItems={[]} />;
}
