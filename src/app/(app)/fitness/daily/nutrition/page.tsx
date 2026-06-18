import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Meals', value: '3 logged', note: 'One evening note still useful' },
  { label: 'Protein', value: '168 g', note: 'Close the 12 g gap first' },
  { label: 'Water', value: '72 oz', note: '24 oz remaining' }
];

const items = [
  { title: 'Breakfast', meta: 'Protein anchor', detail: 'Keep the first meal boring and reliable', tone: 'good' as const },
  { title: 'Lunch', meta: 'Balanced', detail: 'Carbs and protein carried the day', tone: 'cyan' as const },
  { title: 'Dinner', meta: 'Pending', detail: 'Log the rough meal after eating, not perfectly', tone: 'warn' as const },
  { title: 'Water', meta: '72 / 96 oz', detail: 'One bottle finishes the target', tone: 'cyan' as const }
];

const sideItems = [
  'Protein floor before calorie precision.',
  'One quick note beats a blank day.',
  'Hydration closes before bed, not during bed.',
  'Avoid turning food tracking into moral accounting.'
];

export default function DailyNutritionPage() {
  return (
    <LifeDetailPage
      eyebrow='Daily'
      title='Nutrition Log'
      subtitle='A daily food and water log that matches the dashboard style.'
      icon='♨'
      backHref='/fitness/daily'
      backLabel='Daily'
      primaryAction='Add meal'
      stats={stats}
      items={items}
      sideTitle='Daily nutrition rules'
      sideItems={sideItems}
    />
  );
}
