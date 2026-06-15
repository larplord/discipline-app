import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepAnalysisPage() {
  return <LifeDetailPage eyebrow="Sleep" title="Detailed Sleep Analysis" subtitle="A cleaner breakdown of the existing sleep cards. Live Watch sync remains unchanged." icon="✣" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Review tonight" stats={[]} items={[]} sideTitle="Sleep coach notes" sideItems={[]} />;
}
