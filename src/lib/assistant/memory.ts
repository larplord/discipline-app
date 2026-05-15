export const MEMORY_TYPES = [
  'goal',
  'project',
  'school',
  'money',
  'fitness',
  'business',
  'preference',
  'pattern',
  'lesson',
  'open_loop',
  'vault',
  'system',
] as const;

export const MEMORY_STATUSES = ['pending', 'approved', 'rejected', 'archived'] as const;
export const MEMORY_SENSITIVITIES = ['low', 'medium', 'high'] as const;

export type MemoryType = typeof MEMORY_TYPES[number];
export type MemoryStatus = typeof MEMORY_STATUSES[number];
export type MemorySensitivity = typeof MEMORY_SENSITIVITIES[number];

export type AssistantMemoryRecord = {
  id: string;
  text: string;
  summary?: string;
  type: MemoryType;
  status: MemoryStatus;
  sensitivity: MemorySensitivity;
  tags: string[];
  source?: string;
  reason?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AssistantMemoryCandidate = {
  text: string;
  type: MemoryType;
  sensitivity: MemorySensitivity;
  tags: string[];
  reason?: string;
  status?: MemoryStatus;
};

export function normalizeMemoryType(value: unknown): MemoryType {
  return MEMORY_TYPES.includes(value as MemoryType) ? (value as MemoryType) : 'system';
}

export function normalizeMemoryStatus(value: unknown): MemoryStatus {
  return MEMORY_STATUSES.includes(value as MemoryStatus) ? (value as MemoryStatus) : 'pending';
}

export function normalizeMemorySensitivity(value: unknown): MemorySensitivity {
  return MEMORY_SENSITIVITIES.includes(value as MemorySensitivity) ? (value as MemorySensitivity) : 'medium';
}

export function shouldAutoApproveMemory(candidate: AssistantMemoryCandidate) {
  if (candidate.status === 'approved') return true;
  if (candidate.sensitivity !== 'low') return false;
  return ['preference', 'system', 'lesson'].includes(candidate.type);
}
