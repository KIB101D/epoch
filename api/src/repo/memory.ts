import type { Subscription } from '../domain/subscription.js';
import type { FunnelAnswers, Repo, User } from './types.js';

/** In-memory implementation of the storage port, used by unit tests. */
export class MemoryRepo implements Repo {
  users = new Map<string, User>();
  subs = new Map<string, Subscription>();
  events = new Set<string>();

  async createUser(userId: string) {
    const user: User = {
      userId,
      answers: null,
      email: null,
      stripeCustomerId: null,
      completedLessons: [],
      createdAt: new Date().toISOString(),
    };
    this.users.set(userId, user);
    return { ...user };
  }

  async getUser(userId: string) {
    const u = this.users.get(userId);
    return u ? { ...u, completedLessons: [...u.completedLessons] } : null;
  }

  async saveAnswers(userId: string, answers: FunnelAnswers) {
    const u = this.users.get(userId);
    if (u) u.answers = answers;
  }

  async linkCustomer(userId: string, customerId: string) {
    const u = this.users.get(userId);
    if (u) u.stripeCustomerId = customerId;
  }

  async findUserIdByCustomer(customerId: string) {
    for (const u of this.users.values()) if (u.stripeCustomerId === customerId) return u.userId;
    return null;
  }

  async setEmail(userId: string, email: string) {
    const u = this.users.get(userId);
    if (u) u.email = email;
  }

  async completeLesson(userId: string, lessonId: string) {
    const u = this.users.get(userId);
    if (u && !u.completedLessons.includes(lessonId)) u.completedLessons.push(lessonId);
  }

  async getSubscription(userId: string) {
    const s = this.subs.get(userId);
    return s ? { ...s } : null;
  }

  async putSubscriptionIfNewer(sub: Subscription) {
    const current = this.subs.get(sub.userId);
    if (current && current.lastEventCreated > sub.lastEventCreated) return false;
    this.subs.set(sub.userId, { ...sub });
    return true;
  }

  async markPaymentIssue(userId: string) {
    const s = this.subs.get(userId);
    if (s) s.paymentIssue = true;
  }

  async claimEvent(eventId: string) {
    if (this.events.has(eventId)) return false;
    this.events.add(eventId);
    return true;
  }

  async releaseEvent(eventId: string) {
    this.events.delete(eventId);
  }
}
