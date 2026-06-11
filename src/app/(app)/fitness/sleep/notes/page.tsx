import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepNotesPage() {
  return <LifeDetailPage eyebrow="Sleep" title="Sleep Factors & Notes" subtitle="Track the factors affecting sleep manually for now. Device data stays untouched." icon="⊘" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Add note" stats={[{ label: 'Caffeine', value: '1 cup', note: 'before noon' }, { label: 'Screen time', value: '2h 15m', note: 'moderate' }, { label: 'Stress', value: 'Medium', note: 'watch this' }]} items={[{ title: 'Caffeine', meta: 'Good', detail: 'Kept before 12 PM', tone: 'good' }, { title: 'Screen time', meta: 'Moderate', detail: 'Reduce before bed', tone: 'warn' }, { title: 'Hydration', meta: 'Good', detail: '2.4 L today', tone: 'good' }]} sideTitle="Note prompts" sideItems={["What made sleep easier?", "What made sleep harder?", "What is one adjustment for tonight?"]} />;
}
