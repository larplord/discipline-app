import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function SleepAnalysisPage() {
  return <LifeDetailPage eyebrow="Sleep" title="Detailed Sleep Analysis" subtitle="A cleaner breakdown of the existing sleep cards. Live Watch sync remains unchanged." icon="✣" backHref="/fitness/sleep" backLabel="Sleep" primaryAction="Review tonight" stats={[{ label: 'Avg sleep', value: '7h 31m', note: '7-day average' }, { label: 'Avg score', value: '83', note: 'good' }, { label: 'Best night', value: '8h 03m', note: 'Sunday' }]} items={[{ title: 'Consistency', meta: 'Good', detail: 'Bed/wake within 45 minutes', tone: 'good' }, { title: 'Deep sleep', meta: '55m', detail: 'Within useful range', tone: 'cyan' }, { title: 'Focus next', meta: 'Screens', detail: 'Reduce evening exposure', tone: 'warn' }]} sideTitle="Sleep coach notes" sideItems={["Weekend schedule is the biggest risk", "Earlier screen cutoff should lift score", "Keep caffeine before noon"]} />;
}
