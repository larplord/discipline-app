import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepNotesPage() {
  return <LifeDetailPage eyebrow="Sleep" title="Sleep Factors & Notes" subtitle="Track the factors affecting sleep manually for now. Device data stays untouched." icon="⊘" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Add note" stats={[]} items={[]} sideTitle="Note prompts" sideItems={[]} />;
}
