import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

export default function NutritionDetailPage() {
  return <LifeDetailPage eyebrow="Health" title="Nutrition / Macros" subtitle="A clean food and macro surface for now. Food database syncing can come later." icon="♧" backHref="/fitness" backLabel="Health" primaryAction="Add meal note" stats={[]} items={[]} sideTitle="Simple targets" sideItems={[]} />;
}
