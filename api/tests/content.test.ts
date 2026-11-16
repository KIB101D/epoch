import { describe, expect, it } from 'vitest';
import { ERAS, LESSONS } from '../src/content/lessons.js';

describe('lesson content', () => {
  it('has unique ids and five stories per era, ordered 1..5', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const era of Object.keys(ERAS)) {
      const orders = LESSONS.filter((l) => l.era === era).map((l) => l.order).sort();
      expect(orders).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('keeps the first two stories of every era free and the rest premium', () => {
    for (const l of LESSONS) expect(l.free).toBe(l.order <= 2);
  });

  it('gives every scene exactly one historical choice', () => {
    for (const l of LESSONS) {
      expect(l.scenes.length).toBeGreaterThanOrEqual(2);
      for (const s of l.scenes) {
        expect(s.decision.options.length).toBeGreaterThanOrEqual(2);
        expect(s.decision.options.filter((o) => o.historical)).toHaveLength(1);
      }
    }
  });
});
