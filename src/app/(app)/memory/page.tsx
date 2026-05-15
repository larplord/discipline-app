'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { MEMORY_SENSITIVITIES, MEMORY_STATUSES, MEMORY_TYPES, normalizeMemorySensitivity, normalizeMemoryStatus, normalizeMemoryType, type AssistantMemoryRecord, type MemorySensitivity, type MemoryStatus, type MemoryType } from '@/lib/assistant/memory';
import '@/styles/pages/Memory.css';

type VaultDraft = {
  id: string;
  title: string;
  folder?: string;
  content: string;
  reason?: string;
  status: 'queued' | 'approved' | 'rejected' | 'written';
  createdAt?: unknown;
  updatedAt?: unknown;
};

type VaultNote = {
  id: string;
  title?: string;
  path?: string;
  summary?: string;
  tags?: string[];
  updatedAt?: unknown;
};

type ThreadState = {
  summary: string;
  updatedAt?: unknown;
};

const STATUS_LABELS: Record<MemoryStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

export default function MemoryPage() {
  const { uid } = useUserData();
  const [memories, setMemories] = useState<AssistantMemoryRecord[]>([]);
  const [vaultDrafts, setVaultDrafts] = useState<VaultDraft[]>([]);
  const [vaultNotes, setVaultNotes] = useState<VaultNote[]>([]);
  const [thread, setThread] = useState<ThreadState>({ summary: '' });
  const [filter, setFilter] = useState<MemoryStatus | 'all'>('pending');
  const [editing, setEditing] = useState<Record<string, Partial<AssistantMemoryRecord>>>({});
  const [summaryDraft, setSummaryDraft] = useState('');

  useEffect(() => {
    const db = getFirestoreDb();
    const base = doc(db, 'users', uid);
    const unsubMemory = onSnapshot(collectionRef(uid, 'assistantMemory'), (snap) => {
      const rows: AssistantMemoryRecord[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const text = String(data.text ?? data.summary ?? '');
        if (!text.trim()) return;
        rows.push({
          id: d.id,
          text,
          summary: typeof data.summary === 'string' ? data.summary : undefined,
          type: normalizeMemoryType(data.type),
          status: normalizeMemoryStatus(data.status ?? 'approved'),
          sensitivity: normalizeMemorySensitivity(data.sensitivity),
          tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
          reason: typeof data.reason === 'string' ? data.reason : undefined,
          source: typeof data.source === 'string' ? data.source : undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      rows.sort((a, b) => timestampMs(b.updatedAt ?? b.createdAt) - timestampMs(a.updatedAt ?? a.createdAt));
      setMemories(rows);
    });

    const unsubVaultInbox = onSnapshot(collectionRef(uid, 'assistantVaultInbox'), (snap) => {
      const rows: VaultDraft[] = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          id: d.id,
          title: String(data.title ?? 'Untitled vault draft'),
          folder: typeof data.folder === 'string' ? data.folder : undefined,
          content: String(data.content ?? ''),
          reason: typeof data.reason === 'string' ? data.reason : undefined,
          status: ['queued', 'approved', 'rejected', 'written'].includes(String(data.status)) ? data.status as VaultDraft['status'] : 'queued',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      rows.sort((a, b) => timestampMs(b.updatedAt ?? b.createdAt) - timestampMs(a.updatedAt ?? a.createdAt));
      setVaultDrafts(rows);
    });

    const unsubVaultNotes = onSnapshot(collectionRef(uid, 'assistantVaultNotes'), (snap) => {
      const rows: VaultNote[] = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          id: d.id,
          title: typeof data.title === 'string' ? data.title : d.id,
          path: typeof data.path === 'string' ? data.path : undefined,
          summary: typeof data.summary === 'string' ? data.summary : undefined,
          tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
          updatedAt: data.updatedAt,
        });
      });
      rows.sort((a, b) => timestampMs(b.updatedAt) - timestampMs(a.updatedAt));
      setVaultNotes(rows);
    });

    const unsubThread = onSnapshot(doc(base, 'assistantThreads', 'default'), (snap) => {
      const data = snap.data();
      const next = { summary: String(data?.summary ?? ''), updatedAt: data?.updatedAt };
      setThread(next);
      setSummaryDraft(next.summary);
    });

    return () => {
      unsubMemory();
      unsubVaultInbox();
      unsubVaultNotes();
      unsubThread();
    };
  }, [uid]);

  const counts = useMemo(() => {
    return MEMORY_STATUSES.reduce((acc, status) => ({ ...acc, [status]: memories.filter((m) => m.status === status).length }), {} as Record<MemoryStatus, number>);
  }, [memories]);

  const visibleMemories = filter === 'all' ? memories : memories.filter((memory) => memory.status === filter);
  const pendingVaultDrafts = vaultDrafts.filter((draft) => draft.status === 'queued');

  function collectionRef(userId: string, name: string) {
    return collection(getFirestoreDb(), 'users', userId, name);
  }

  function startEdit(memory: AssistantMemoryRecord) {
    setEditing((current) => ({ ...current, [memory.id]: { ...memory } }));
  }

  function updateEdit(id: string, patch: Partial<AssistantMemoryRecord>) {
    setEditing((current) => ({ ...current, [id]: { ...(current[id] ?? {}), ...patch } }));
  }

  async function saveMemory(id: string) {
    const draft = editing[id];
    if (!draft) return;
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'assistantMemory', id), {
      text: String(draft.text ?? '').trim(),
      summary: String(draft.text ?? '').trim(),
      type: normalizeMemoryType(draft.type),
      status: normalizeMemoryStatus(draft.status),
      sensitivity: normalizeMemorySensitivity(draft.sensitivity),
      tags: Array.isArray(draft.tags) ? draft.tags : [],
      updatedAt: serverTimestamp(),
    });
    setEditing((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function setMemoryStatus(id: string, status: MemoryStatus) {
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'assistantMemory', id), { status, updatedAt: serverTimestamp() });
  }

  async function deleteMemory(id: string) {
    if (!confirm('Delete this memory permanently?')) return;
    await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'assistantMemory', id));
  }

  async function setVaultDraftStatus(id: string, status: VaultDraft['status']) {
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'assistantVaultInbox', id), { status, updatedAt: serverTimestamp() });
  }

  async function deleteVaultDraft(id: string) {
    if (!confirm('Delete this vault draft?')) return;
    await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'assistantVaultInbox', id));
  }

  async function saveSummary() {
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'assistantThreads', 'default'), {
      summary: summaryDraft.trim(),
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="memory-page fade-in">
      <div className="memory-hero">
        <div>
          <span className="memory-kicker">Noen Memory Core</span>
          <h1>Memory Control</h1>
          <p>Review what Noen remembers, approve useful context, reject bad memory, and control vault drafts before they reach Obsidian.</p>
        </div>
        <div className="memory-stats">
          <Stat label="Pending" value={counts.pending} tone="gold" />
          <Stat label="Approved" value={counts.approved} tone="green" />
          <Stat label="Vault drafts" value={pendingVaultDrafts.length} tone="cyan" />
          <Stat label="Indexed notes" value={vaultNotes.length} tone="blue" />
        </div>
      </div>

      <section className="memory-panel memory-summary-panel">
        <div className="memory-panel-head">
          <div>
            <span>Running context</span>
            <h2>Conversation summary</h2>
          </div>
          <button type="button" onClick={() => void saveSummary()}>Save summary</button>
        </div>
        <textarea value={summaryDraft} onChange={(e) => setSummaryDraft(e.target.value)} placeholder="No running summary saved yet." />
        <p className="memory-help">This is the compact thread memory Noen reads before recent messages.</p>
      </section>

      <section className="memory-panel">
        <div className="memory-panel-head memory-tabs-head">
          <div>
            <span>Long-term memory</span>
            <h2>Memory review queue</h2>
          </div>
          <div className="memory-tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
            {MEMORY_STATUSES.map((status) => (
              <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{STATUS_LABELS[status]} ({counts[status]})</button>
            ))}
          </div>
        </div>

        <div className="memory-list">
          {visibleMemories.length === 0 ? (
            <div className="memory-empty">No memories in this view yet.</div>
          ) : visibleMemories.map((memory) => {
            const draft = editing[memory.id];
            return (
              <article key={memory.id} className={`memory-card status-${memory.status}`}>
                {draft ? (
                  <div className="memory-edit-grid">
                    <textarea value={String(draft.text ?? '')} onChange={(e) => updateEdit(memory.id, { text: e.target.value })} />
                    <div className="memory-edit-controls">
                      <select value={draft.type ?? memory.type} onChange={(e) => updateEdit(memory.id, { type: e.target.value as MemoryType })}>{MEMORY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                      <select value={draft.status ?? memory.status} onChange={(e) => updateEdit(memory.id, { status: e.target.value as MemoryStatus })}>{MEMORY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                      <select value={draft.sensitivity ?? memory.sensitivity} onChange={(e) => updateEdit(memory.id, { sensitivity: e.target.value as MemorySensitivity })}>{MEMORY_SENSITIVITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                      <input value={(draft.tags ?? memory.tags).join(', ')} onChange={(e) => updateEdit(memory.id, { tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} placeholder="tags" />
                    </div>
                    <div className="memory-actions">
                      <button onClick={() => void saveMemory(memory.id)}>Save</button>
                      <button onClick={() => setEditing((current) => { const next = { ...current }; delete next[memory.id]; return next; })}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="memory-card-top">
                      <div className="memory-badges">
                        <span>{memory.status}</span>
                        <span>{memory.type}</span>
                        <span>{memory.sensitivity}</span>
                      </div>
                      <button type="button" onClick={() => startEdit(memory)}>Edit</button>
                    </div>
                    <p>{memory.text}</p>
                    {memory.reason && <small>Reason: {memory.reason}</small>}
                    {memory.tags.length > 0 && <div className="memory-tags">{memory.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
                    <div className="memory-actions">
                      {memory.status !== 'approved' && <button onClick={() => void setMemoryStatus(memory.id, 'approved')}>Approve</button>}
                      {memory.status !== 'rejected' && <button onClick={() => void setMemoryStatus(memory.id, 'rejected')}>Reject</button>}
                      {memory.status !== 'archived' && <button onClick={() => void setMemoryStatus(memory.id, 'archived')}>Archive</button>}
                      <button className="danger" onClick={() => void deleteMemory(memory.id)}>Delete</button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="memory-two-column">
        <section className="memory-panel">
          <div className="memory-panel-head">
            <div><span>Obsidian bridge</span><h2>Vault inbox drafts</h2></div>
          </div>
          <div className="memory-list compact">
            {vaultDrafts.length === 0 ? <div className="memory-empty">No vault drafts queued.</div> : vaultDrafts.map((draft) => (
              <article key={draft.id} className={`memory-card vault status-${draft.status}`}>
                <div className="memory-card-top"><strong>{draft.title}</strong><span>{draft.status}</span></div>
                {draft.folder && <small>Folder: {draft.folder}</small>}
                {draft.reason && <small>Reason: {draft.reason}</small>}
                <p>{draft.content}</p>
                <div className="memory-actions">
                  {draft.status !== 'approved' && <button onClick={() => void setVaultDraftStatus(draft.id, 'approved')}>Approve</button>}
                  {draft.status !== 'rejected' && <button onClick={() => void setVaultDraftStatus(draft.id, 'rejected')}>Reject</button>}
                  <button className="danger" onClick={() => void deleteVaultDraft(draft.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="memory-panel">
          <div className="memory-panel-head">
            <div><span>Indexed context</span><h2>Vault notes Noen can read</h2></div>
          </div>
          <div className="memory-list compact">
            {vaultNotes.length === 0 ? <div className="memory-empty">No vault notes indexed yet. The local bridge will fill this later.</div> : vaultNotes.map((note) => (
              <article key={note.id} className="memory-card vault-note">
                <div className="memory-card-top"><strong>{note.title ?? note.id}</strong></div>
                {note.path && <small>{note.path}</small>}
                <p>{note.summary || 'No summary yet.'}</p>
                {note.tags && note.tags.length > 0 && <div className="memory-tags">{note.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`memory-stat tone-${tone}`}><strong>{value}</strong><span>{label}</span></div>;
}

function timestampMs(value: unknown) {
  if (!value) return 0;
  if (typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}
