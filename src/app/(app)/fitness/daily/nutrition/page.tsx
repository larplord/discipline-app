import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyNutritionPage() {
  return <LifeDetailPage eyebrow="Daily" title="Nutrition Log" subtitle="A daily food and water log that matches the dashboard style." icon="♨" backHref="/fitness/daily" backLabel="Daily" primaryAction="Add meal" stats={[]} items={[]} sideTitle="Daily nutrition rules" sideItems={[]} />;
}
