'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import { api, type Era, type Goal } from '@/lib/api';

type Step = 0 | 1 | 2 | 3;

const GOALS: { value: Goal; title: string; text: string; icon: string }[] = [
  { value: 'curiosity', title: 'Pure curiosity', text: 'I just love a good story', icon: '✦' },
  { value: 'study', title: 'Study or exams', text: 'I want it to stick', icon: '✎' },
  { value: 'kids', title: 'With my kids', text: 'Something we can do together', icon: '☼' },
];

const MINUTES = [
  { value: 5, title: '5 min', text: 'A coffee break' },
  { value: 10, title: '10 min', text: 'Most popular' },
  { value: 15, title: '15 min', text: 'Deep dive' },
] as const;

const BUILD_STEPS = ['Matching scenes to your era', 'Ordering decisions by difficulty', 'Building your daily path'];

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [era, setEra] = useState<Era | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [built, setBuilt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Auto-advance after a short pause, so the selection animation is visible.
  const choose = (fn: () => void, next: Step) => {
    fn();
    setTimeout(() => setStep(next), 280);
  };

  async function finish(minutesPerDay: 5 | 10 | 15) {
    setStep(3);
    try {
      const request = api('/funnel', { method: 'POST', body: JSON.stringify({ era, goal, minutesPerDay }) });
      // Let the "building your plan" moment breathe: it is part of the funnel, not dead time.
      await Promise.all([request, new Promise((r) => setTimeout(r, 2400))]);
      router.push('/plan');
    } catch {
      setError('Could not save your answers. Is the API running?');
    }
  }

  useEffect(() => {
    if (step !== 3) return;
    const t = setInterval(() => setBuilt((b) => Math.min(b + 1, BUILD_STEPS.length)), 700);
    return () => clearInterval(t);
  }, [step]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-10">
      <div className="mb-10 flex items-center gap-4">
        {step > 0 && step < 3 && (
          <button onClick={() => setStep((s) => (s - 1) as Step)} className="text-sm text-dust hover:text-parchment" aria-label="Back">
            ←
          </button>
        )}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
        <span className="text-xs tabular-nums text-dust">{Math.min(step + 1, 3)}/3</span>
      </div>

      {step === 0 && (
        <section key="era" className="rise">
          <h1 className="font-display text-4xl sm:text-5xl">Which era pulls you in?</h1>
          <p className="mt-3 text-dust">We will build your path around it.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {(Object.keys(ERA_STYLE) as Era[]).map((e) => (
              <button
                key={e}
                onClick={() => choose(() => setEra(e), 1)}
                className={`group rounded-2xl border bg-night-2 p-6 text-left transition hover:-translate-y-1 ${
                  era === e ? 'border-gold' : 'border-white/10 hover:border-white/25'
                }`}
                style={{ boxShadow: era === e ? `0 20px 50px -20px ${ERA_STYLE[e].glow}` : undefined }}
              >
                <Emblem era={e} className="h-14 w-14 transition group-hover:scale-110" />
                <h2 className="mt-6 font-display text-2xl">{ERA_STYLE[e].title}</h2>
                <p className="mt-1 text-sm text-dust">{ERA_STYLE[e].tagline}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section key="goal" className="rise">
          <h1 className="font-display text-4xl sm:text-5xl">What brings you here?</h1>
          <div className="mt-10 grid gap-3">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => choose(() => setGoal(g.value), 2)}
                className={`flex items-center gap-5 rounded-2xl border bg-night-2 p-5 text-left transition hover:translate-x-1 ${
                  goal === g.value ? 'border-gold' : 'border-white/10 hover:border-white/25'
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-xl text-gold">{g.icon}</span>
                <span>
                  <span className="block font-display text-xl">{g.title}</span>
                  <span className="text-sm text-dust">{g.text}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section key="minutes" className="rise">
          <h1 className="font-display text-4xl sm:text-5xl">How much time a day?</h1>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {MINUTES.map((m) => (
              <button
                key={m.value}
                onClick={() => finish(m.value)}
                className="relative rounded-2xl border border-white/10 bg-night-2 p-6 text-left transition hover:-translate-y-1 hover:border-gold"
              >
                {m.value === 10 && (
                  <span className="absolute right-4 top-4 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                    Popular
                  </span>
                )}
                <span className="block font-display text-4xl">{m.title}</span>
                <span className="mt-2 block text-sm text-dust">{m.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section key="build" className="rise flex flex-col items-center pt-10 text-center">
          {era && <Emblem era={era} className="h-24 w-24" animate />}
          <h1 className="mt-8 font-display text-4xl">Building your path…</h1>
          <ul className="mt-8 space-y-3 text-left">
            {BUILD_STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 transition ${i < built ? 'text-parchment' : 'text-dust/40'}`}>
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                    i < built ? 'border-gold bg-gold text-night' : 'border-white/20'
                  }`}
                >
                  {i < built ? '✓' : ''}
                </span>
                {s}
              </li>
            ))}
          </ul>
          {error && <p className="mt-8 text-sm text-rome">{error}</p>}
        </section>
      )}
    </div>
  );
}
