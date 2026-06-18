import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Training', value: '2 / 3', note: 'One session behind the weekly goal' },
  { label: 'Consistency', value: '87%', note: 'Strong week overall' },
  { label: 'Recovery', value: 'Good', note: 'Sleep and readiness are cooperating' }
];

const items = [
  { title: 'Training volume', meta: 'Below previous week', detail: 'Add one quality session if recovery holds', tone: 'warn' as const },
  { title: 'Sleep', meta: '6 of 7 nights', detail: 'Keep the schedule boring and repeatable', tone: 'good' as const },
  { title: 'Nutrition', meta: 'Mostly aligned', detail: 'Protein floor is the highest leverage target', tone: 'cyan' as const },
  { title: 'Movement', meta: 'Stable', detail: 'Daily steps are close enough to maintain', tone: 'good' as const }
];

const sideItems = [
  'Add one training session if readiness stays green.',
  'Keep bedtime within the same 45-minute window.',
  'Do one meal-prep simplification, not a full overhaul.',
  'Review the week before changing goals.'
];

export default function WeeklyHealthPage() {
  return (
    <LifeDetailPage
      eyebrow='Health'
      title='Weekly Breakdown'
      subtitle='A compact weekly review for training, hydration, nutrition, and consistency.'
      icon='◎'
      backHref='/fitness'
      backLabel='Health'
      primaryAction='Mark review complete'
      stats={stats}
      items={items}
      sideTitle='Weekly next moves'
      sideItems={sideItems}
    />
  );
}
