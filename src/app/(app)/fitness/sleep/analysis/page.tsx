import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Score', value: '84', note: 'Good recovery signal' },
  { label: 'Average', value: '7h 31m', note: 'On target across the week' },
  { label: 'Consistency', value: '86%', note: 'Schedule is stabilising' }
];

const items = [
  { title: 'What worked', meta: 'Consistent bedtime', detail: 'Keep this boring and repeatable', tone: 'good' as const },
  { title: 'Main risk', meta: 'Evening screen time', detail: 'Reduce the last 45 minutes', tone: 'warn' as const },
  { title: 'Recovery', meta: 'Good', detail: 'Training can proceed if energy matches', tone: 'good' as const },
  { title: 'Tonight', meta: 'Earlier shutdown', detail: 'Small adjustment, not a full reset', tone: 'cyan' as const }
];

const sideItems = [
  'The trend matters more than the single score.',
  'Keep caffeine timing stable.',
  'Lower screen intensity before bed.',
  'If sleep slips, protect wake time first.'
];

export default function SleepAnalysisPage() {
  return (
    <LifeDetailPage
      eyebrow='Sleep'
      title='Detailed Sleep Analysis'
      subtitle='A cleaner breakdown of the existing sleep cards. Live Watch sync remains unchanged.'
      icon='✣'
      backHref='/fitness/sleep'
      backLabel='Sleep'
      primaryAction='Review tonight'
      stats={stats}
      items={items}
      sideTitle='Sleep coach notes'
      sideItems={sideItems}
    />
  );
}
