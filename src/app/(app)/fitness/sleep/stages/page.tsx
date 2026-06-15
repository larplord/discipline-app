import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepStagesPage() {
  return <LifeDetailPage eyebrow="Sleep" title="Sleep Stages" subtitle="Readable stage explanations and tonight’s stage balance." icon="〽" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Close guide" stats={[]} items={[]} sideTitle="How to improve" sideItems={[]} />;
}
