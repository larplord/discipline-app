'use client';

import { AssistantChat } from '@/components/AssistantChat';
import '@/styles/pages/Assistant.css';

export default function AssistantPage() {
  return (
    <main className="assistant-page fade-in">
      <section className="assistant-shell">
        <aside className="assistant-context-panel">
          <div className="assistant-kicker">Noen Core</div>
          <h1>Assistant</h1>
          <p>Private chat foundation with personality, memory scaffolding, and read-only app context.</p>

          <div className="assistant-memory-card">
            <span>Memory layers</span>
            <ul>
              <li>Personality prompt</li>
              <li>Recent chat history</li>
              <li>Long-term memory snippets</li>
              <li>Habits, goals, journal, projects</li>
            </ul>
          </div>
        </aside>

        <AssistantChat />
      </section>
    </main>
  );
}
