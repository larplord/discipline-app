import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type LocalArchiveContext = {
  previousConversationSnippets: Array<{
    source?: string;
    title?: string;
    role: string;
    content: string;
    timestamp?: number;
  }>;
  vaultSnippets: Array<{
    title: string;
    path: string;
    snippet: string;
  }>;
  errors: string[];
};

const LOCAL_ARCHIVE_SCRIPT = String.raw`
import json
import os
import re
import sqlite3
import sys
from pathlib import Path

STOPWORDS = {
    'the','and','for','that','this','with','you','your','are','was','were','have','has','had','what','when','where','why','how',
    'can','could','would','should','about','from','into','onto','like','just','now','then','than','said','previously','preveously',
    'dashboard','dashbord','hermes','jarvis','noen','access','make','give','working','main','here','there','them','they','will',
}

def clean_text(value, limit):
    text = str(value or '')
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:limit]

def should_skip_message(value):
    text = str(value or '').strip()
    if not text:
        return True
    noisy_markers = [
        'SYSTEM:  You are Noen',
        'SYSTEM:\nYou are Noen',
        'Return ONLY compact valid JSON',
        'LOCAL HERMES + OBSIDIAN ARCHIVE CONTEXT',
        'You are replying to the DisciplineOS dashboard',
    ]
    return any(marker in text for marker in noisy_markers)

def query_terms(query):
    raw = re.findall(r"[A-Za-z0-9_'-]{3,}", query.lower())
    terms = []
    for term in raw:
        term = term.strip("'-_")
        if len(term) < 3 or term in STOPWORDS:
            continue
        if term not in terms:
            terms.append(term)
        if len(terms) >= 10:
            break
    return terms

def load_previous_conversations(db_path, query, terms):
    if not db_path or not Path(db_path).exists():
        return [], ['Hermes state database not found.']
    snippets = []
    errors = []
    try:
        con = sqlite3.connect(db_path)
        con.row_factory = sqlite3.Row
        recent_sql = """
            select m.role, m.content, m.timestamp, s.source, s.title
            from messages m
            left join sessions s on s.id = m.session_id
            where m.role = 'user' and coalesce(m.content, '') <> ''
            order by m.timestamp desc
            limit 16
        """
        for row in con.execute(recent_sql):
            if should_skip_message(row['content']):
                continue
            snippets.append({
                'role': row['role'],
                'content': clean_text(row['content'], 500),
                'timestamp': row['timestamp'],
                'source': row['source'],
                'title': row['title'],
            })

        if terms:
            clauses = ' or '.join(['lower(m.content) like ?' for _ in terms])
            params = [f'%{term}%' for term in terms]
            relevant_sql = f"""
                select m.role, m.content, m.timestamp, s.source, s.title
                from messages m
                left join sessions s on s.id = m.session_id
                where m.role = 'user'
                  and coalesce(m.content, '') <> ''
                  and ({clauses})
                order by m.timestamp desc
                limit 14
            """
            seen = {(item['role'], item['content']) for item in snippets}
            for row in con.execute(relevant_sql, params):
                if should_skip_message(row['content']):
                    continue
                content = clean_text(row['content'], 650)
                key = (row['role'], content)
                if key in seen:
                    continue
                snippets.append({
                    'role': row['role'],
                    'content': content,
                    'timestamp': row['timestamp'],
                    'source': row['source'],
                    'title': row['title'],
                })
                seen.add(key)
        con.close()
    except Exception as exc:
        errors.append(f'Hermes conversation search failed: {exc}')
    return snippets[:12], errors

def title_from_markdown(path, text):
    for line in text.splitlines()[:40]:
        if line.startswith('#'):
            return line.lstrip('#').strip()[:120]
    return path.stem

def best_snippet(text, terms, limit=520):
    compact = re.sub(r'\s+', ' ', text).strip()
    if not compact:
        return ''
    lower = compact.lower()
    hit_positions = [lower.find(term) for term in terms if lower.find(term) >= 0]
    if hit_positions:
        pos = min(hit_positions)
        start = max(0, pos - 360)
        end = min(len(compact), pos + limit)
        prefix = '…' if start > 0 else ''
        suffix = '…' if end < len(compact) else ''
        return prefix + compact[start:end] + suffix
    return compact[:limit]

def load_vault_snippets(vault_path, query, terms):
    if not vault_path or not Path(vault_path).exists():
        return [], ['Obsidian vault path not found.']
    root = Path(vault_path)
    snippets = []
    errors = []
    try:
        candidates = []
        md_files = [p for p in root.rglob('*.md') if '.obsidian' not in p.parts]
        for path in md_files[:2500]:
            try:
                rel = str(path.relative_to(root))
                text = path.read_text(encoding='utf-8', errors='ignore')
                lower_path = rel.lower()
                lower_text = text.lower()
                if terms:
                    score = sum(5 for term in terms if term in lower_path) + sum(1 for term in terms if term in lower_text)
                else:
                    score = 1 if any(name in lower_path for name in ['start here', 'readme', 'index']) else 0
                if score <= 0:
                    continue
                candidates.append((score, path.stat().st_mtime, rel, path, text))
            except Exception:
                continue
        candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
        if not candidates and any(term in {'vault', 'note', 'notes', 'obsidian'} for term in terms):
            for path in sorted(md_files, key=lambda p: p.stat().st_mtime if p.exists() else 0, reverse=True)[:8]:
                try:
                    rel = str(path.relative_to(root))
                    text = path.read_text(encoding='utf-8', errors='ignore')
                    candidates.append((1, path.stat().st_mtime, rel, path, text))
                except Exception:
                    continue
        for _score, _mtime, rel, path, text in candidates[:3]:
            snippets.append({
                'title': title_from_markdown(path, text),
                'path': rel,
                'snippet': best_snippet(text, terms),
            })
    except Exception as exc:
        errors.append(f'Vault search failed: {exc}')
    return snippets, errors

def resolve_vault_path(raw_path):
    candidates = []
    if raw_path:
        cleaned = str(raw_path).strip().strip('"').strip("'")
        if cleaned:
            candidates.append(cleaned)
    env_path = os.environ.get('OBSIDIAN_VAULT_PATH')
    if env_path:
        cleaned = str(env_path).strip().strip('"').strip("'")
        if cleaned:
            candidates.append(cleaned)
    candidates.extend([
        '/root/CAN Valt',
        os.path.expanduser('~/CAN Valt'),
    ])
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return candidates[0] if candidates else ''

def main():
    payload = json.loads(sys.argv[1])
    query = str(payload.get('query') or '')
    terms = query_terms(query)
    db_path = payload.get('stateDbPath') or os.path.expanduser('~/.hermes/state.db')
    vault_path = resolve_vault_path(payload.get('vaultPath'))

    previous, prev_errors = load_previous_conversations(db_path, query, terms)
    vault, vault_errors = load_vault_snippets(vault_path, query, terms)
    print(json.dumps({
        'previousConversationSnippets': previous,
        'vaultSnippets': vault,
        'errors': prev_errors + vault_errors,
    }, ensure_ascii=False))

main()
`;

export async function loadLocalArchiveContext(query: string): Promise<LocalArchiveContext> {
  if (process.env.ASSISTANT_LOCAL_ARCHIVE === 'false') {
    return { previousConversationSnippets: [], vaultSnippets: [], errors: ['Local archive context disabled.'] };
  }

  try {
    const configuredVaultPath = process.env.OBSIDIAN_VAULT_PATH?.replace(/^['\"]|['\"]$/g, '');
    const vaultPath = configuredVaultPath && configuredVaultPath !== '/root/CAN'
      ? configuredVaultPath
      : '/root/CAN Valt';

    const payload = JSON.stringify({
      query,
      stateDbPath: process.env.HERMES_STATE_DB_PATH || '/root/.hermes/state.db',
      vaultPath,
    });

    const { stdout, stderr } = await execFileAsync('python3', ['-c', LOCAL_ARCHIVE_SCRIPT, payload], {
      cwd: process.cwd(),
      timeout: Number(process.env.ASSISTANT_LOCAL_ARCHIVE_TIMEOUT_MS ?? 12000),
      maxBuffer: 1024 * 1024,
    });

    const parsed = JSON.parse(String(stdout || '{}')) as Partial<LocalArchiveContext>;
    return {
      previousConversationSnippets: Array.isArray(parsed.previousConversationSnippets) ? parsed.previousConversationSnippets : [],
      vaultSnippets: Array.isArray(parsed.vaultSnippets) ? parsed.vaultSnippets : [],
      errors: [
        ...(Array.isArray(parsed.errors) ? parsed.errors.map(String) : []),
        ...(stderr ? [String(stderr).slice(0, 500)] : []),
      ].filter(Boolean),
    };
  } catch (error) {
    return {
      previousConversationSnippets: [],
      vaultSnippets: [],
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

export function formatLocalArchiveContext(context: LocalArchiveContext) {
  const previousLines = context.previousConversationSnippets
    .map((item) => {
      const source = item.source ? ` [${item.source}]` : '';
      const title = item.title ? ` ${item.title}` : '';
      return `- ${item.role}${source}${title}: ${item.content}`;
    })
    .join('\n');

  const vaultLines = context.vaultSnippets
    .map((item) => `- ${item.title} (${item.path}): ${item.snippet}`)
    .join('\n');

  const errorLines = context.errors.map((error) => `- ${error}`).join('\n');

  return `
LOCAL HERMES + OBSIDIAN ARCHIVE CONTEXT
This context is loaded server-side from Daniel's Hermes conversation archive and Obsidian vault. Use it as read-only background knowledge. Do not claim to have searched beyond these snippets unless the snippet supports it.

Obsidian vault snippets:
${vaultLines || '- no matching vault notes found'}

Previous Hermes user conversation snippets:
${previousLines || '- no relevant or recent user conversation snippets found'}

Archive access notes:
${errorLines || '- local archive search completed'}
`;
}
