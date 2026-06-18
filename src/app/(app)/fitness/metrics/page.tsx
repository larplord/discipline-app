import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Bodyweight', value: '179.6 lb', note: '-1.6 lb versus last week' },
  { label: 'Body fat', value: '13.2%', note: 'Estimated trend, not a single-day verdict' },
  { label: 'Lean mass', value: '155.8 lb', note: '+0.8 lb across the current trend window' },
];

const items = [
  { title: 'Morning weigh-in', meta: 'Primary metric', detail: 'Use consistent timing: wake, bathroom, before food.', tone: 'good' as const },
  { title: 'Waist check', meta: '32.1 in', detail: 'Weekly measurement gives context when scale noise spikes.', tone: 'cyan' as const },
  { title: 'Progress photo', meta: 'Optional', detail: 'Same light, same posture, same distance. No drama.', tone: 'cyan' as const },
  { title: 'Trend note', meta: '-1.6 lb', detail: 'If energy drops, raise calories before training quality suffers.', tone: 'warn' as const },
];

const sideItems = [
  'Measure bodyweight daily, interpret weekly.',
  'Take waist once per week under the same conditions.',
  'Use photos as context, not punishment.',
  'Adjust food only after the trend is clear.',
];

export default function MetricsDetailPage() {
  return (
    <LifeDetailPage
      eyebrow="Health"
      title="Body Metrics"
      subtitle="Manual body metrics, trend notes, and progress snapshots while device sync waits."
      icon="♙"
      backHref="/fitness"
      backLabel="Health"
      primaryAction="Add body check-in"
      stats={stats}
      items={items}
      sideTitle="Measurement protocol"
      sideItems={sideItems}
    />
  );
}
