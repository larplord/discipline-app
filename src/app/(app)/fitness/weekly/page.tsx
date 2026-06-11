import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function WeeklyHealthPage() {
  return <LifeDetailPage eyebrow="Health" title="Weekly Breakdown" subtitle="A compact weekly review for training, hydration, nutrition, and consistency." icon="◎" backHref="/fitness" backLabel="Health" primaryAction="Mark review complete" stats={[{ label: 'Consistency', value: '87%', note: 'great week' }, { label: 'Workouts', value: '2 / 3', note: 'one session left' }, { label: 'Recovery', value: '82', note: 'ready' }]} items={[{ title: 'Training', meta: 'Active again', detail: '2 sessions logged this week', tone: 'good' }, { title: 'Hydration', meta: '75%', detail: 'Needs evening finish', tone: 'warn' }, { title: 'Nutrition', meta: 'On track', detail: 'Protein is the strongest metric', tone: 'good' }]} sideTitle="Weekly next moves" sideItems={["Add one more training session if recovery holds", "Keep bedtime consistent", "Review nutrition before Sunday reset"]} />;
}
