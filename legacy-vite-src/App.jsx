import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Habits from './pages/Habits.jsx';
import Goals from './pages/Goals.jsx';
import Journal from './pages/Journal.jsx';
import Focus from './pages/Focus.jsx';
import Analytics from './pages/Analytics.jsx';
import Identity from './pages/Identity.jsx';
import Nutrition from './pages/Nutrition.jsx';

const PAGES = {
  dashboard: Dashboard,
  habits:    Habits,
  goals:     Goals,
  journal:   Journal,
  focus:     Focus,
  nutrition: Nutrition,
  analytics: Analytics,
  identity:  Identity,
};

export default function App() {
  const [page, setPage]           = useState('dashboard');
  const [sidebarOpen, setSidebar] = useState(false);

  // Re-render trigger for cross-component updates
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const Page = PAGES[page] ?? Dashboard;

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebar(false)}
      />

      <Sidebar
        activePage={page}
        onNav={(p) => { setPage(p); setSidebar(false); }}
        open={sidebarOpen}
        tick={tick}
      />

      <div className="main-content">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebar(o => !o)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
            Discipline<span style={{ color: 'var(--accent)' }}>OS</span>
          </span>
          <div style={{ width: 32 }} />
        </div>

        <Page onRefresh={refresh} key={`${page}-${tick}`} onNav={setPage} />
      </div>
    </div>
  );
}
