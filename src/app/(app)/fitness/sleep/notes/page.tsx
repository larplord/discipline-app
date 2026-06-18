import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Caffeine', value: '1 cup', note: 'Before noon — acceptable' },
  { label: 'Screen time', value: '2h 15m', note: 'Moderate evening risk' },
  { label: 'Stress', value: 'Medium', note: 'Wind-down needs protecting' }
];

const items = [
  { title: 'Caffeine', meta: 'Good', detail: 'Keep intake before 12 PM', tone: 'good' as const },
  { title: 'Screens', meta: 'Moderate', detail: 'Dim, reduce, and stop earlier tonight', tone: 'warn' as const },
  { title: 'Hydration', meta: 'Good', detail: 'Do not overcorrect right before bed', tone: 'cyan' as const },
  { title: 'Notes', meta: 'Open', detail: 'Capture anything that changed sleep quality', tone: 'cyan' as const }
];

const sideItems = [
  'What changed today compared with a good night?',
  'Was stress physical, mental, or social?',
  'Did caffeine timing stay clean?',
  'What is the smallest fix for tonight?'
];

export default function SleepNotesPage() {
  return (
    <LifeDetailPage
      eyebrow='Sleep'
      title='Sleep Factors & Notes'
      subtitle='Track the factors affecting sleep manually for now. Device data stays untouched.'
      icon='⊘'
      backHref='/fitness/sleep'
      backLabel='Sleep'
      primaryAction='Add note'
      stats={stats}
      items={items}
      sideTitle='Note prompts'
      sideItems={sideItems}
    />
  );
}
