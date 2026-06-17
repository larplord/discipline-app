'use client';

import { useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';

type Mode = 'voice' | 'text';
type OrbState = 'idle' | 'listening' | 'thinking';

type AgentMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function AgentOrbInterface() {
  const [mode, setMode] = useState<Mode>('voice');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([
    { role: 'assistant', content: 'Text mode ready. Ask JARVIS what to do next.' },
  ]);
  const [error, setError] = useState<string | null>(null);

  function pulseOrb() {
    if (orbState === 'thinking') return;
    setError(null);
    setOrbState('listening');
    window.setTimeout(() => setOrbState('idle'), 1400);
  }

  async function sendTextMessage() {
    const text = input.trim();
    if (!text || orbState === 'thinking') return;

    setError(null);
    setInput('');
    const nextMessages: AgentMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setOrbState('thinking');

    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Single-Operator': 'true',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8),
          appSnapshot: {
            source: 'agent-dashboard-orb',
            currentPage: 'Agent dashboard',
            projects: [],
            activity: [],
            note: 'No data right now unless Daniel has added dashboard records.',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Assistant request failed.');
      setMessages((current) => [...current, { role: 'assistant', content: String(data.reply ?? 'No response returned.') }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Assistant request failed.';
      setError(message);
      setMessages((current) => [...current, { role: 'assistant', content: `Setup issue: ${message}` }]);
    } finally {
      setOrbState('idle');
    }
  }

  const textMode = mode === 'text';

  return (
    <div className={`agent-orb-interface ${textMode ? 'text-mode' : 'voice-mode'} ${orbState}`}>
      <div className="agent-mode-toggle" aria-label="Agent input mode">
        <span>{textMode ? 'Text' : 'Voice'}</span>
        <button
          type="button"
          aria-pressed={textMode}
          onClick={() => {
            setError(null);
            setMode((current) => current === 'voice' ? 'text' : 'voice');
          }}
        >
          <i />
        </button>
      </div>

      {!textMode ? (
        <button type="button" className="agent-orb-shell" aria-label="Activate voice orb" onClick={pulseOrb}>
          <div className="agent-orb-rings" />
          <div className="agent-orb-core" />
          <div className="agent-orb-sheen" />
          <div className="agent-orb-caption">
            <span>{orbState === 'listening' ? 'Listening' : 'Voice standby'}</span>
            <strong>Tap the orb</strong>
          </div>
        </button>
      ) : (
        <section className="agent-text-console" aria-label="JARVIS text console">
          <header>
            <span>JARVIS text interface</span>
            <strong>{orbState === 'thinking' ? 'Thinking…' : 'Online'}</strong>
          </header>

          <div className="agent-text-stream">
            {messages.slice(-5).map((message, index) => (
              <article key={`${message.role}-${index}`} className={message.role}>
                <span>{message.role === 'assistant' ? 'JARVIS' : 'Daniel'}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          {error && <div className="agent-text-error">{error}</div>}

          <form
            className="agent-text-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              void sendTextMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type to JARVIS..."
              disabled={orbState === 'thinking'}
            />
            <button type="submit" disabled={!input.trim() || orbState === 'thinking'}>
              {orbState === 'thinking' ? 'Sending' : 'Send'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
