'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/client';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

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

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function getVoiceSupportMessage() {
  if (typeof window === 'undefined') return 'Voice is loading.';
  if (!window.isSecureContext) return 'Voice needs HTTPS. Use the Cloudflare dashboard link.';
  if (!getRecognitionConstructor()) return 'This browser does not support live voice recognition. Chrome on Android is recommended.';
  return null;
}

function cleanForSpeech(text: string) {
  return text.replace(/[*_`#>\[\](){}]/g, '').replace(/\s+/g, ' ').trim();
}

export function FloatingVoiceAssistant() {
  const pathname = usePathname();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [expanded, setExpanded] = useState(false);
  const [keepListening, setKeepListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState('Voice standby. Tap to keep JARVIS listening while you move through the command centre.');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const keepListeningRef = useRef(false);
  const busyRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    keepListeningRef.current = keepListening;
  }, [keepListening]);

  useEffect(() => {
    if (keepListening) {
      setLastReply((current) => current.includes('Current section:') ? current : `${current}\nCurrent section: ${pathname}`);
    }
  }, [keepListening, pathname]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  async function sendVoiceMessage(text: string) {
    const cleanText = text.trim();
    if (!cleanText || busyRef.current) return;

    busyRef.current = true;
    setVoiceState('thinking');
    setTranscript('');
    setError(null);

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
          history: [
            { role: 'user', content: cleanText },
          ],
          appSnapshot: {
            source: 'floating-global-voice-assistant',
            currentPath: pathname,
            note: 'Daniel is speaking through the persistent bottom-right voice orb while navigating the dashboard.',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Assistant request failed.');

      const reply = String(data.reply ?? 'No response returned.');
      setLastReply(reply);
      speakReply(reply);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Assistant request failed.';
      setError(message);
      setVoiceState('error');
      setLastReply(`Setup issue: ${message}`);
      scheduleRestart();
    } finally {
      busyRef.current = false;
    }
  }

  function speakReply(reply: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceState(keepListeningRef.current ? 'listening' : 'idle');
      scheduleRestart();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanForSpeech(reply));
    utterance.rate = 0.98;
    utterance.pitch = 0.92;
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => scheduleRestart();
    utterance.onerror = () => scheduleRestart();
    window.speechSynthesis.speak(utterance);
  }

  function scheduleRestart() {
    if (!keepListeningRef.current) {
      setVoiceState('idle');
      return;
    }

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (keepListeningRef.current && !busyRef.current && !recognitionRef.current) {
        startListening();
      }
    }, 650);
  }

  function startListening() {
    const supportMessage = getVoiceSupportMessage();
    if (supportMessage) {
      setError(supportMessage);
      setVoiceState('error');
      setExpanded(true);
      setKeepListening(false);
      return;
    }

    const Recognition = getRecognitionConstructor();
    if (!Recognition) return;

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    finalTranscriptRef.current = '';
    setTranscript('');
    setError(null);
    setExpanded(true);

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceState('listening');

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
      const code = event.error ?? 'unknown';
      const message = code === 'not-allowed'
        ? 'Microphone permission is blocked. Allow microphone access for this site.'
        : `Voice capture issue: ${code}.`;
      setError(message);
      setVoiceState('error');
      recognitionRef.current = null;
      if (code === 'not-allowed') setKeepListening(false);
      else scheduleRestart();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      const finalText = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = '';

      if (finalText) {
        void sendVoiceMessage(finalText);
        return;
      }

      scheduleRestart();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      scheduleRestart();
    }
  }

  function stopListening() {
    setKeepListening(false);
    keepListeningRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceState('idle');
    setTranscript('');
  }

  function toggleListening() {
    if (keepListeningRef.current) {
      stopListening();
      return;
    }
    setKeepListening(true);
    keepListeningRef.current = true;
    startListening();
  }

  const stateLabel = voiceState === 'listening'
    ? 'Listening'
    : voiceState === 'thinking'
      ? 'Thinking'
      : voiceState === 'speaking'
        ? 'Speaking'
        : voiceState === 'error'
          ? 'Voice issue'
          : 'Standby';

  return (
    <aside className={`floating-voice-assistant ${expanded ? 'expanded' : ''} ${voiceState}`} aria-label="Persistent JARVIS voice assistant">
      {expanded && (
        <section className="floating-voice-panel" aria-live="polite">
          <header>
            <span>JARVIS Voice</span>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Collapse voice panel">×</button>
          </header>
          <div className="floating-voice-status-row">
            <i />
            <strong>{stateLabel}</strong>
            <small>{keepListening ? 'Persistent across sections' : 'Tap orb to arm'}</small>
          </div>
          <p className="floating-voice-transcript">{transcript || lastReply}</p>
          {error && <p className="floating-voice-error">{error}</p>}
        </section>
      )}

      <button
        type="button"
        className="floating-voice-button"
        aria-pressed={keepListening}
        aria-label={keepListening ? 'Stop persistent voice assistant' : 'Start persistent voice assistant'}
        onClick={toggleListening}
        onDoubleClick={() => setExpanded((current) => !current)}
      >
        <span className="floating-voice-pulse" />
        <span className="floating-voice-core">◌</span>
        <em>{keepListening ? 'ON' : 'MIC'}</em>
      </button>
    </aside>
  );
}
