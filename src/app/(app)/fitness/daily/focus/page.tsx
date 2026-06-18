import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Deep work', value: '2 blocks', note: 'Good enough to compound' },
  { label: 'Current block', value: '25 min', note: 'Default sprint length' },
  { label: 'Recovery', value: '5 min', note: 'Reset before switching tasks' }
];

const items = [
  { title: 'Dashboard block', meta: 'Active', detail: 'Polish, verify, ship — one loop', tone: 'good' as const },
  { title: 'Admin block', meta: 'Queued', detail: 'Small tasks after the main build', tone: 'cyan' as const },
  { title: 'Recovery block', meta: 'Required', detail: 'Walk, water, breathe, then resume', tone: 'cyan' as const },
  { title: 'Distraction risk', meta: 'Medium', detail: 'Phone nearby: use it for approval only', tone: 'warn' as const }
];

const sideItems = [
  'Pick one output before the timer starts.',
  'No tab wandering during the block.',
  'Write the next action before stopping.',
  'Recover briefly before context switching.'
];

export default function DailyFocusPage() {
  return (
    <LifeDetailPage
      eyebrow='Daily'
      title='Focus History'
      subtitle='Review today’s focus sessions and keep the work blocks visible.'
      icon='◷'
      backHref='/fitness/daily'
      backLabel='Daily'
      primaryAction='Start focus block'
      stats={stats}
      items={items}
      sideTitle='Focus protocol'
      sideItems={sideItems}
    />
  );
}
