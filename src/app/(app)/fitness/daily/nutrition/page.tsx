import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function DailyNutritionPage() {
  return <LifeDetailPage eyebrow="Daily" title="Nutrition Log" subtitle="A daily food and water log that matches the dashboard style." icon="♨" backHref="/fitness/daily" backLabel="Daily" primaryAction="Add meal" stats={[{ label: 'Water', value: '1.6 / 2 L', note: 'good pace' }, { label: 'Meals', value: '2 / 3', note: 'dinner left' }, { label: 'Protein', value: '168 g', note: 'near target' }]} items={[{ title: 'Water', meta: '+250 ml', detail: 'Quick add', tone: 'cyan' }, { title: 'Meal', meta: 'Lunch logged', detail: 'Protein + vegetables', tone: 'good' }, { title: 'Dinner', meta: 'Open', detail: 'Plan before evening', tone: 'warn' }]} sideTitle="Daily nutrition rules" sideItems={["Prioritise protein first", "Use water quick-add during work blocks", "Keep late snacks intentional"]} />;
}
