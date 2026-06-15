import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function HydrationDetailPage() {
  return <LifeDetailPage eyebrow="Health" title="Hydration Log" subtitle="Quick-add water, review the day, and keep the hydration card feeling live without any watch sync." icon="♢" backHref="/fitness" backLabel="Health" primaryAction="Add custom amount" stats={[]} items={[]} sideTitle="Today’s routine" sideItems={[]} />;
}
