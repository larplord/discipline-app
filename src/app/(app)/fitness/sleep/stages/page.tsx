import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepStagesPage() {
  return <LifeDetailPage eyebrow="Sleep" title="Sleep Stages" subtitle="Readable stage explanations and tonight’s stage balance." icon="〽" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Close guide" stats={[{ label: 'REM', value: '1h 32m', note: '20%' }, { label: 'Core', value: '4h 41m', note: '61%' }, { label: 'Deep', value: '55m', note: '12%' }]} items={[{ title: 'REM', meta: 'Dream / memory', detail: 'Important for mood and learning', tone: 'cyan' }, { title: 'Core', meta: 'Main sleep', detail: 'Largest part of the night', tone: 'good' }, { title: 'Deep', meta: 'Recovery', detail: 'Physical repair window', tone: 'warn' }]} sideTitle="How to improve" sideItems={["Keep room cool", "Use a repeatable wind-down routine", "Avoid late heavy meals"]} />;
}
