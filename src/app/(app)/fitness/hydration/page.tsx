import { LifeDetailPage } from '@/components/fitness/LifeDetailPage';

const stats = [
  { label: 'Consumed', value: '72 oz', note: '75% of the 96 oz target' },
  { label: 'Remaining', value: '24 oz', note: 'Two quick-adds closes the day' },
  { label: 'Best window', value: 'Before 8 PM', note: 'Avoid waking up thirsty or too full' },
];

const items = [
  { title: '+8 oz water', meta: 'Small glass', detail: 'Use when you only need a light top-off.', tone: 'cyan' as const },
  { title: '+16 oz water', meta: 'Bottle refill', detail: 'Most useful default quick-add for training days.', tone: 'good' as const },
  { title: '+24 oz water', meta: 'Large bottle', detail: 'Use after gym, sauna, long walk, or high caffeine.', tone: 'warn' as const },
  { title: 'Electrolytes', meta: 'Optional', detail: 'Useful if sweat, headache, or heavy leg day shows up.', tone: 'cyan' as const },
];

const sideItems = [
  'Morning: 16 oz before caffeine.',
  'Midday: 24 oz between meals.',
  'Training: 16–24 oz during or after lifting.',
  'Evening: finish remaining water before wind-down.',
];

export default function HydrationDetailPage() {
  return (
    <LifeDetailPage
      eyebrow="Health"
      title="Hydration Log"
      subtitle="Quick-add water, review the day, and keep hydration visible without needing watch sync."
      icon="♢"
      backHref="/fitness"
      backLabel="Health"
      primaryAction="Mark hydration checked"
      stats={stats}
      items={items}
      sideTitle="Today’s routine"
      sideItems={sideItems}
    />
  );
}
