export type Era = 'rome' | 'egypt' | 'napoleon';
export type Goal = 'curiosity' | 'study' | 'kids';
export type PlanName = 'monthly' | 'yearly';

export interface PersonalPlan {
  era: Era;
  eraTitle: string;
  days: number;
  lessons: { id: string; title: string; year: string; free: boolean; decisions: number }[];
}

export interface Me {
  user: {
    answers: { era: Era; goal: Goal; minutesPerDay: number } | null;
    email: string | null;
    completedLessons: string[];
  };
  plan: PersonalPlan | null;
  subscription: {
    status: string;
    plan: PlanName | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    paymentIssue: boolean;
  } | null;
  premium: boolean;
}

export interface LessonMeta {
  id: string;
  era: Era;
  order: number;
  title: string;
  year: string;
  minutes: number;
  free: boolean;
  teaser: string;
  /** Number of decisions (scenes) in the story. */
  decisions: number;
  locked: boolean;
  completed: boolean;
}

export interface DecisionOption {
  label: string;
  outcome: string;
  historical: boolean;
}

export interface Scene {
  moment: string;
  text: string[];
  decision: { prompt: string; options: DecisionOption[] };
}

export interface Lesson extends Omit<LessonMeta, 'locked' | 'completed' | 'decisions'> {
  scenes: Scene[];
}

export interface Price {
  plan: PlanName;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'content-type': 'application/json', ...init.headers } : init?.headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'error', data.message ?? res.statusText);
  return data as T;
}

export const formatPrice = (p: Price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.amount / 100);
