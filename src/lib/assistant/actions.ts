export type AssistantAction =
  | {
      id: string;
      type: 'complete_habit';
      label: string;
      habitId: string;
      habitName?: string;
      done: boolean;
    }
  | {
      id: string;
      type: 'add_goal_milestone';
      label: string;
      goalId: string;
      goalTitle?: string;
      text: string;
    }
  | {
      id: string;
      type: 'complete_goal_milestone';
      label: string;
      goalId: string;
      goalTitle?: string;
      milestoneId: string;
      milestoneText?: string;
      done: boolean;
    }
  | {
      id: string;
      type: 'create_goal';
      label: string;
      title: string;
      goalType: 'short' | 'long';
      priority: 'high' | 'medium' | 'low';
      deadline?: string;
      description?: string;
      milestones?: string[];
    };

function normalizeOne(raw: unknown, index: number): AssistantAction | null {
  if (!raw || typeof raw !== 'object') return null;
  const action = raw as Record<string, unknown>;
  const type = String(action.type ?? '');
  const id = String(action.id ?? `${type}-${index}-${Date.now()}`);
  const label = String(action.label ?? 'Apply update');

  if (type === 'complete_habit' && typeof action.habitId === 'string') {
    return {
      id,
      type,
      label,
      habitId: action.habitId,
      habitName: typeof action.habitName === 'string' ? action.habitName : undefined,
      done: action.done !== false,
    };
  }

  if (type === 'add_goal_milestone' && typeof action.goalId === 'string' && typeof action.text === 'string') {
    return {
      id,
      type,
      label,
      goalId: action.goalId,
      goalTitle: typeof action.goalTitle === 'string' ? action.goalTitle : undefined,
      text: action.text,
    };
  }

  if (type === 'complete_goal_milestone' && typeof action.goalId === 'string' && typeof action.milestoneId === 'string') {
    return {
      id,
      type,
      label,
      goalId: action.goalId,
      goalTitle: typeof action.goalTitle === 'string' ? action.goalTitle : undefined,
      milestoneId: action.milestoneId,
      milestoneText: typeof action.milestoneText === 'string' ? action.milestoneText : undefined,
      done: action.done !== false,
    };
  }

  if (type === 'create_goal' && typeof action.title === 'string') {
    const goalType = action.goalType === 'long' ? 'long' : 'short';
    const priority = ['high', 'medium', 'low'].includes(String(action.priority))
      ? (action.priority as 'high' | 'medium' | 'low')
      : 'medium';
    return {
      id,
      type,
      label,
      title: action.title,
      goalType,
      priority,
      deadline: typeof action.deadline === 'string' ? action.deadline : undefined,
      description: typeof action.description === 'string' ? action.description : undefined,
      milestones: Array.isArray(action.milestones)
        ? action.milestones.filter((m): m is string => typeof m === 'string').slice(0, 8)
        : undefined,
    };
  }

  return null;
}

export function normalizeAssistantActions(value: unknown): AssistantAction[] {
  if (!Array.isArray(value)) return [];
  const actions: AssistantAction[] = [];
  value.forEach((raw, index) => {
    const action = normalizeOne(raw, index);
    if (action) actions.push(action);
  });
  return actions;
}
