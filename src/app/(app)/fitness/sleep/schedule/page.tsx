import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepSchedulePage() {
  return <LifeDetailPage eyebrow="Sleep" title="Bed / Wake Schedule" subtitle="Adjust bedtime and wake goals without touching Apple Watch or Health data syncing." icon="◷" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Save schedule" stats={[]} items={[]} sideTitle="Tonight’s protocol" sideItems={[]} />;
}
