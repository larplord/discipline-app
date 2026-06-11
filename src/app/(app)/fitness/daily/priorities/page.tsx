import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyPrioritiesPage() {
  return <LifeDetailPage eyebrow="Daily" title="Top Priorities" subtitle="A simple priority board for today’s most important moves." icon="☑" backHref="/fitness/daily" backLabel="Daily" primaryAction="Add priority" stats={[{ label: 'High priority', value: '2', note: 'today' }, { label: 'Completed', value: '2 / 3', note: 'strong pace' }, { label: 'Next block', value: 'Workout', note: '6:00 PM' }]} items={[{ title: 'Finish project proposal', meta: 'High', detail: 'Done', tone: 'good' }, { title: 'Study for exam', meta: 'High', detail: 'Still open', tone: 'warn' }, { title: 'Workout & mobility', meta: 'Medium', detail: 'Evening block', tone: 'cyan' }]} sideTitle="Priority rules" sideItems={["Pick three or fewer important outcomes", "Finish one before adding more", "Move unfinished work to tomorrow during review"]} />;
}
