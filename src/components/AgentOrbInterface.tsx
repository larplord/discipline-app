'use client';

import { useEffect, useRef, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';

type Mode = 'voice' | 'text';
type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

type AgentMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const INITIAL_MESSAGES: AgentMessage[] = [
  { role: 'assistant', content: 'Voice interface ready. Tap the orb and speak, or switch to text mode.' },
];

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function getVoiceSupportMessage() {
  if (typeof window === 'undefined') return 'Voice is loading.';
  if (!window.isSecureContext) return 'Voice needs HTTPS or localhost. Use the Cloudflare link, not a raw IP address.';
  if (!getSpeechRecognitionConstructor()) return 'Voice recognition is not supported in this browser. Try Chrome on Android, or use text mode.';
  return null;
}

export function AgentOrbInterface() {
  const [mode, setMode] = useState<Mode>('voice');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>(INITIAL_MESSAGES);
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState('Tap the orb to speak');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function sendMessage(text: string, options: { speakReply?: boolean } = {}) {
    const cleanText = text.trim();
    if (!cleanText || busyRef.current) return;

    busyRef.current = true;
    setError(null);
    setTranscript('');
    setInput('');
    const nextMessages: AgentMessage[] = [...messages, { role: 'user', content: cleanText }];
    setMessages(nextMessages);
    setOrbState('thinking');
    setVoiceStatus('Thinking');

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
          message: cleanText,
          history: nextMessages.slice(-8),
          appSnapshot: {
            source: options.speakReply ? 'agent-dashboard-voice-orb' : 'agent-dashboard-text-console',
            currentPage: 'Agent dashboard',
            projects: [],
            activity: [],
            note: 'No data right now unless Daniel has added dashboard records.',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Assistant request failed.');

      const reply = String(data.reply ?? 'No response returned.');
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);

      if (options.speakReply) {
        speakReply(reply);
      } else {
        setOrbState('idle');
        setVoiceStatus('Tap the orb to speak');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Assistant request failed.';
      setError(message);
      setMessages((current) => [...current, { role: 'assistant', content: `Setup issue: ${message}` }]);
      setOrbState('idle');
      setVoiceStatus('Tap the orb to retry');
    } finally {
      busyRef.current = false;
    }
  }

  function speakReply(reply: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setOrbState('idle');
      setVoiceStatus('Reply ready in text stream');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply.replace(/[*_`#>\[\]()]/g, ''));
    utterance.rate = 0.98;
    utterance.pitch = 0.92;
    utterance.volume = 1;
    utterance.onstart = () => {
      setOrbState('speaking');
      setVoiceStatus('Speaking');
    };
    utterance.onend = () => {
      setOrbState('idle');
      setVoiceStatus('Tap the orb to speak');
    };
    utterance.onerror = () => {
      setOrbState('idle');
      setVoiceStatus('Reply ready in text stream');
    };
    window.speechSynthesis.speak(utterance);
  }

  function startVoiceCapture() {
    if (busyRef.current || orbState === 'thinking') return;

    const supportMessage = getVoiceSupportMessage();
    if (supportMessage) {
      setError(supportMessage);
      setVoiceStatus('Voice unavailable');
      setMode('text');
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) return;

    recognitionRef.current?.abort();
    finalTranscriptRef.current = '';
    setTranscript('');
    setError(null);
    setVoiceStatus('Listening');
    setOrbState('listening');

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setOrbState('listening');
      setVoiceStatus('Listening');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) final = `${final} ${text}`.trim();
        else interim = `${interim} ${text}`.trim();
      }

      finalTranscriptRef.current = final;
      setTranscript(interim || final);
    };

    recognition.onerror = (event) => {
      const errorCode = event.error ?? 'unknown';
      const message = errorCode === 'not-allowed'
        ? 'Microphone permission was blocked. Allow microphone access in the browser, then tap the orb again.'
        : `Voice capture issue: ${errorCode}. Try again or switch to text mode.`;
      setError(message);
      setVoiceStatus('Voice issue');
      setOrbState('idle');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      const finalText = finalTranscriptRef.current.trim();

      if (!finalText) {
        setOrbState('idle');
        setVoiceStatus('No speech detected');
        return;
      }

      void sendMessage(finalText, { speakReply: true });
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setOrbState('idle');
      setVoiceStatus('Tap again');
    }
  }

  function stopVoiceCapture() {
    recognitionRef.current?.stop();
    setVoiceStatus('Processing');
  }

  const textMode = mode === 'text';
  const voiceCaption = orbState === 'listening'
    ? 'Listening'
    : orbState === 'thinking'
      ? 'Thinking'
      : orbState === 'speaking'
        ? 'Speaking'
        : 'Voice online';

  return (
    <div className={`agent-orb-interface ${textMode ? 'text-mode' : 'voice-mode'} ${orbState}`}>
      <div className="agent-mode-toggle" aria-label="Agent input mode">
        <span>{textMode ? 'Text' : 'Voice'}</span>
        <button
          type="button"
          aria-pressed={textMode}
          onClick={() => {
            recognitionRef.current?.abort();
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
            setError(null);
            setOrbState('idle');
            setVoiceStatus('Tap the orb to speak');
            setMode((current) => current === 'voice' ? 'text' : 'voice');
          }}
        >
          <i />
        </button>
      </div>

      {!textMode ? (
        <div className="agent-voice-stack">
          <button
            type="button"
            className="agent-orb-shell"
            aria-label={orbState === 'listening' ? 'Stop listening' : 'Activate voice orb'}
            onClick={orbState === 'listening' ? stopVoiceCapture : startVoiceCapture}
          >
            <div className="agent-orb-rings" />
            <div className="agent-orb-core" />
            <div className="agent-orb-sheen" />
            <div className="agent-orb-caption">
              <span>{voiceCaption}</span>
              <strong>{orbState === 'listening' ? 'Tap to send' : voiceStatus}</strong>
            </div>
          </button>

          <div className="agent-voice-readout" aria-live="polite">
            <span>{orbState === 'listening' ? 'Live transcript' : 'Last exchange'}</span>
            <p>{transcript || messages.at(-1)?.content || 'Tap the orb and speak.'}</p>
          </div>

          {error && <div className="agent-text-error agent-voice-error">{error}</div>}
        </div>
      ) : (
        <section className="agent-text-console" aria-label="Noen text console">
          <header>
            <span>Noen text interface</span>
            <strong>{orbState === 'thinking' ? 'Thinking…' : 'Online'}</strong>
          </header>

          <div className="agent-text-stream">
            {messages.slice(-5).map((message, index) => (
              <article key={`${message.role}-${index}`} className={message.role}>
                <span>{message.role === 'assistant' ? 'Noen' : 'Daniel'}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          {error && <div className="agent-text-error">{error}</div>}

          <form
            className="agent-text-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type to Noen..."
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
