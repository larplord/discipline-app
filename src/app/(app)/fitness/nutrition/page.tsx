import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Calories', value: '1,942 / 2,400', note: '458 kcal available today' },
  { label: 'Protein', value: '168 / 180 g', note: '12 g left to hit the floor' },
  { label: 'Macro lock', value: '81%', note: 'Good alignment for a training day' },
];

const items = [
  { title: 'Add meal note', meta: 'Manual', detail: 'Log what happened without waiting for a food database.', tone: 'cyan' as const },
  { title: 'Protein top-off', meta: '12 g needed', detail: 'Small shake, Greek yoghurt, eggs, or lean meat closes the gap.', tone: 'good' as const },
  { title: 'Carb timing', meta: '50 g left', detail: 'Best used around training or the next focused work block.', tone: 'cyan' as const },
  { title: 'Evening guardrail', meta: 'No drift', detail: 'Keep fats controlled and avoid random late snacks.', tone: 'warn' as const },
];

const sideItems = [
  'Hit protein before chasing perfect calories.',
  'Keep one simple repeatable meal available.',
  'Use carbs around training or demanding work.',
  'Close the day with a short note, not guilt accounting.',
];

export default function NutritionDetailPage() {
  return (
    <LifeDetailPage
      eyebrow="Health"
      title="Nutrition / Macros"
      subtitle="A clean food and macro surface for practical decision-making while deeper food syncing waits."
      icon="♧"
      backHref="/fitness"
      backLabel="Health"
      primaryAction="Log meal note"
      stats={stats}
      items={items}
      sideTitle="Simple targets"
      sideItems={sideItems}
    />
  );
}
