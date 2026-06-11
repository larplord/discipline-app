import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyActivityPage() {
  return <LifeDetailPage eyebrow="Daily" title="Activity" subtitle="Manual movement snapshot for now. Apple Watch syncing can be added later when ready." icon="⌁" backHref="/fitness/daily" backLabel="Daily" primaryAction="Add activity note" stats={[{ label: 'Steps', value: '7,842', note: 'manual snapshot' }, { label: 'Goal', value: '10,000', note: '2,158 left' }, { label: 'Movement', value: 'Good', note: 'active day' }]} items={[{ title: 'Morning walk', meta: 'Logged', detail: 'Light activity', tone: 'good' }, { title: 'Workout', meta: '6:00 PM', detail: 'Upcoming', tone: 'warn' }, { title: 'Evening walk', meta: 'Optional', detail: 'Use if steps are low', tone: 'cyan' }]} sideTitle="Movement plan" sideItems={["Take a short walk after meals", "Use stairs when convenient", "Finish step target before wind-down"]} />;
}
