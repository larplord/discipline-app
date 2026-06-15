import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function PrsDetailPage() {
  return <LifeDetailPage eyebrow="Health" title="Personal Records" subtitle="A focused record board from the current Hevy CSV import. No new sync system added yet." icon="♕" backHref="/fitness" backLabel="Health" primaryAction="Review next lift" stats={[]} items={[]} sideTitle="Next improvements" sideItems={[]} />;
}
