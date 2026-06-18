import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Bed goal', value: '10:30 PM', note: 'Target wind-down by 9:45 PM' },
  { label: 'Wake goal', value: '6:30 AM', note: 'Stable anchor for the day' },
  { label: 'Drift', value: '+18m', note: 'Within the acceptable window' }
];

const items = [
  { title: 'Wind-down', meta: '9:45 PM', detail: 'Lights lower, phone quieter, tasks closed', tone: 'good' as const },
  { title: 'Bedtime', meta: '10:30 PM', detail: 'Protect this like an appointment', tone: 'cyan' as const },
  { title: 'Wake time', meta: '6:30 AM', detail: 'Same anchor even after imperfect sleep', tone: 'cyan' as const },
  { title: 'Weekend risk', meta: 'Watch', detail: 'Do not let the schedule slide two hours', tone: 'warn' as const }
];

const sideItems = [
  'Set tomorrow’s first task before bed.',
  'Dim lights 45 minutes before target.',
  'Keep phone charging away from the pillow.',
  'If late, still wake near the anchor.'
];

export default function SleepSchedulePage() {
  return (
    <LifeDetailPage
      eyebrow='Sleep'
      title='Bed / Wake Schedule'
      subtitle='Adjust bedtime and wake goals without touching Apple Watch or Health data syncing.'
      icon='◷'
      backHref='/fitness/sleep'
      backLabel='Sleep'
      primaryAction='Save schedule'
      stats={stats}
      items={items}
      sideTitle='Tonight’s protocol'
      sideItems={sideItems}
    />
  );
}
