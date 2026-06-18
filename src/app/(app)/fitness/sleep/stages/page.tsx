import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'REM', value: '1h 32m', note: 'Memory and emotional processing' },
  { label: 'Core', value: '4h 41m', note: 'Main sleep body' },
  { label: 'Deep', value: '55m', note: 'Recovery and physical repair' }
];

const items = [
  { title: 'REM', meta: '20%', detail: 'Good enough; protect total sleep first', tone: 'good' as const },
  { title: 'Core', meta: '61%', detail: 'Normal main sleep distribution', tone: 'cyan' as const },
  { title: 'Deep', meta: '12%', detail: 'Improve through routine, not force', tone: 'cyan' as const },
  { title: 'Awake', meta: '34m', detail: 'Watch stress and late screens', tone: 'warn' as const }
];

const sideItems = [
  'Prioritise total sleep before stage optimisation.',
  'Keep caffeine early.',
  'Cool, dark, boring room wins.',
  'Do not panic over one noisy watch reading.'
];

export default function SleepStagesPage() {
  return (
    <LifeDetailPage
      eyebrow='Sleep'
      title='Sleep Stages'
      subtitle='Readable stage explanations and tonight’s stage balance.'
      icon='〽'
      backHref='/fitness/sleep'
      backLabel='Sleep'
      primaryAction='Close guide'
      stats={stats}
      items={items}
      sideTitle='How to improve'
      sideItems={sideItems}
    />
  );
}
