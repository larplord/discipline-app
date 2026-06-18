import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Bench Press', value: '235 x 1', note: 'Top current press marker' },
  { label: 'Squat', value: '225 x 5', note: 'Strong recent lower-body set' },
  { label: 'RDL', value: '155 x 8', note: 'Posterior-chain baseline' }
];

const items = [
  { title: 'Bench Press', meta: '235 x 1', detail: 'Next target: cleaner rep, then 240 attempt', tone: 'good' as const },
  { title: 'Squat', meta: '225 x 5', detail: 'Next target: repeat with tighter depth and bracing', tone: 'cyan' as const },
  { title: 'Leg Extension', meta: 'Strong recent set', detail: 'Keep this as high-confidence quad volume', tone: 'good' as const },
  { title: 'Romanian Deadlift', meta: '155 x 8', detail: 'Build slowly before chasing load', tone: 'warn' as const }
];

const sideItems = [
  'Repeat the best set before increasing load.',
  'Track one cue per lift, not ten.',
  'Protect recovery before PR hunting.',
  'Let volume support strength, not bury it.'
];

export default function PrsDetailPage() {
  return (
    <LifeDetailPage
      eyebrow='Health'
      title='Personal Records'
      subtitle='A focused record board from the current Hevy CSV import. No new sync system added yet.'
      icon='♕'
      backHref='/fitness'
      backLabel='Health'
      primaryAction='Review next lift'
      stats={stats}
      items={items}
      sideTitle='Next improvements'
      sideItems={sideItems}
    />
  );
}
