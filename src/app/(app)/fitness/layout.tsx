import { FitnessSubnav } from '@/components/fitness/FitnessSubnav';
import '@/styles/pages/Fitness.css';

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fitness-page-header">
        <h1 className="fitness-page-title">Fitness</h1>
        <p className="fitness-page-sub">Training, nutrition, and recovery in one hub.</p>
      </div>
      <FitnessSubnav />
      {children}
    </>
  );
}
