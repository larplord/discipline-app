import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function NutritionDetailPage() {
  return <LifeDetailPage eyebrow="Health" title="Nutrition / Macros" subtitle="A clean food and macro surface for now. Food database syncing can come later." icon="♧" backHref="/fitness" backLabel="Health" primaryAction="Add meal note" stats={[{ label: 'Calories', value: '1,942', note: 'of 2,400 kcal' }, { label: 'Protein', value: '168 g', note: '93% complete' }, { label: 'Next meal', value: 'Dinner', note: 'protein + greens' }]} items={[{ title: 'Breakfast', meta: 'Logged', detail: 'Protein oats and coffee', tone: 'good' }, { title: 'Lunch', meta: 'Logged', detail: 'Chicken, rice, vegetables', tone: 'good' }, { title: 'Dinner', meta: 'Planned', detail: 'Lean protein target remains', tone: 'cyan' }]} sideTitle="Simple targets" sideItems={["Hit protein before adding snacks", "Keep dinner clean and repeatable", "Review macro balance at night"]} />;
}
