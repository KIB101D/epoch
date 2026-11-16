import type { Subscription } from '../domain/subscription.js';

export type Era = 'rome' | 'egypt' | 'napoleon';
export type Goal = 'curiosity' | 'study' | 'kids';

export interface FunnelAnswers {
  era: Era;
  goal: Goal;
  minutesPerDay: 5 | 10 | 15;
}

export interface User {
  userId: string;
  answers: FunnelAnswers | null;
  email: string | null;
  stripeCustomerId: string | null;
  completedLessons: string[];
  createdAt: string;
}

/**
 * Storage port. The API depends on this interface only, so the same logic runs on
 * DynamoDB in production and on an in-memory store in unit tests.
 */
export interface Repo {
  createUser(userId: string): Promise<User>;
  getUser(userId: string): Promise<User | null>;
  saveAnswers(userId: string, answers: FunnelAnswers): Promise<void>;
  linkCustomer(userId: string, customerId: string): Promise<void>;
  findUserIdByCustomer(customerId: string): Promise<string | null>;
  setEmail(userId: string, email: string): Promise<void>;
  completeLesson(userId: string, lessonId: string): Promise<void>;

  getSubscription(userId: string): Promise<Subscription | null>;
  /** Writes the subscription unless a newer event was already applied. Returns false if skipped. */
  putSubscriptionIfNewer(sub: Subscription): Promise<boolean>;
  markPaymentIssue(userId: string, eventCreated: number): Promise<void>;

  /** Records a Stripe event id. Returns false if it was already recorded (duplicate delivery). */
  claimEvent(eventId: string, type: string): Promise<boolean>;
  /** Releases a claimed event so a Stripe retry can process it again after a failure. */
  releaseEvent(eventId: string): Promise<void>;
}
