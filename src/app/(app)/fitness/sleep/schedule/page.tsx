import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepSchedulePage() {
  return <LifeDetailPage eyebrow="Sleep" title="Bed / Wake Schedule" subtitle="Adjust bedtime and wake goals without touching Apple Watch or Health data syncing." icon="◷" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Save schedule" stats={[{ label: 'Bed goal', value: '10:30 PM', note: 'target' }, { label: 'Wake goal', value: '6:30 AM', note: 'target' }, { label: 'Drift', value: '+18m', note: 'on target' }]} items={[{ title: 'Bedtime goal', meta: '10:30 PM', detail: 'Current local target', tone: 'cyan' }, { title: 'Wake goal', meta: '6:30 AM', detail: 'Current local target', tone: 'cyan' }, { title: 'Wind-down reminder', meta: '9:45 PM', detail: '45 minutes before bed', tone: 'good' }]} sideTitle="Tonight’s protocol" sideItems={["Dim lights before 9:45 PM", "Prepare alarm and clothes", "Start reading instead of scrolling"]} />;
}
