import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyFocusPage() {
  return <LifeDetailPage eyebrow="Daily" title="Focus History" subtitle="Review today’s focus sessions and keep the work blocks visible." icon="◷" backHref="/fitness/daily" backLabel="Daily" primaryAction="Start focus block" stats={[{ label: 'Focus time', value: '2h 40m', note: 'of 4h goal' }, { label: 'Sessions', value: '3', note: 'today' }, { label: 'Completion', value: '67%', note: 'on track' }]} items={[{ title: 'Deep Work: Project', meta: '90m', detail: 'Completed', tone: 'good' }, { title: 'Study Session', meta: '90m', detail: 'Planned', tone: 'cyan' }, { title: 'Work Block', meta: '60m', detail: 'Upcoming', tone: 'warn' }]} sideTitle="Focus protocol" sideItems={["Clarify the output before starting", "Keep phone away during the block", "Record one short note after finishing"]} />;
}
