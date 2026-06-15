import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function MetricsDetailPage() {
  return <LifeDetailPage eyebrow="Health" title="Body Metrics" subtitle="Manual body metrics, trend notes, and progress snapshots while device sync waits." icon="♙" backHref="/fitness" backLabel="Health" primaryAction="Add body check-in" stats={[]} items={[]} sideTitle="Measurement protocol" sideItems={[]} />;
}
