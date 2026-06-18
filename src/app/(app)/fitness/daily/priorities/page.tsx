import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Priority slots', value: '3', note: 'Enough to be clear' },
  { label: 'Status', value: 'In motion', note: 'One next action at a time' },
  { label: 'Friction', value: 'Low', note: 'Keep tasks small and executable' }
];

const items = [
  { title: 'Main move', meta: 'Dashboard polish', detail: 'Improve the command centre while momentum is warm', tone: 'good' as const },
  { title: 'Body move', meta: 'Dinner + water', detail: 'Eat, hydrate, then avoid drifting', tone: 'cyan' as const },
  { title: 'Mind move', meta: 'Short review', detail: 'Capture what improved and what broke', tone: 'cyan' as const },
  { title: 'Avoid', meta: 'Overplanning', detail: 'Do not replace execution with redesigning the system', tone: 'warn' as const }
];

const sideItems = [
  'Three priorities maximum.',
  'Each priority needs a visible next action.',
  'If it takes under two minutes, clear it.',
  'Close the day by choosing tomorrow’s first move.'
];

export default function DailyPrioritiesPage() {
  return (
    <LifeDetailPage
      eyebrow='Daily'
      title='Top Priorities'
      subtitle='A simple priority board for today’s most important moves.'
      icon='☑'
      backHref='/fitness/daily'
      backLabel='Daily'
      primaryAction='Add priority'
      stats={stats}
      items={items}
      sideTitle='Priority rules'
      sideItems={sideItems}
    />
  );
}
