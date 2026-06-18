import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Steps', value: '8,642', note: '86% of daily target' },
  { label: 'Distance', value: '4.2 mi', note: 'Good baseline movement' },
  { label: 'Active cal', value: '412 kcal', note: 'Training-compatible output' }
];

const items = [
  { title: 'Walk block', meta: '10 min', detail: 'Use this to close the step gap without friction', tone: 'good' as const },
  { title: 'Mobility', meta: '5 min', detail: 'Hips, hamstrings, upper back, then stop', tone: 'cyan' as const },
  { title: 'Stairs', meta: '12 flights', detail: 'Incidental movement is already helping', tone: 'good' as const },
  { title: 'Evening drift', meta: 'Watch point', detail: 'Avoid couch lock after dinner', tone: 'warn' as const }
];

const sideItems = [
  'Finish with a short walk if steps are low.',
  'Keep mobility brief enough to repeat.',
  'Do not punish missed steps with exhaustion.',
  'Movement supports the mission; it is not the mission.'
];

export default function DailyActivityPage() {
  return (
    <LifeDetailPage
      eyebrow='Daily'
      title='Activity'
      subtitle='Manual movement snapshot for now. Apple Watch syncing can be added later when ready.'
      icon='⌁'
      backHref='/fitness/daily'
      backLabel='Daily'
      primaryAction='Add activity note'
      stats={stats}
      items={items}
      sideTitle='Movement plan'
      sideItems={sideItems}
    />
  );
}
