'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import { ApiError, api, type Lesson, type LessonMeta } from '@/lib/api';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'locked' | 'missing'>('loading');
  const [choice, setChoice] = useState<number | null>(null);
  const [next, setNext] = useState<LessonMeta | null>(null);

  useEffect(() => {
    setChoice(null);
    setState('loading');
    api<Lesson>(`/lessons/${id}`)
      .then((l) => {
        setLesson(l);
        setState('ready');
      })
      .catch((e) => setState(e instanceof ApiError && e.status === 402 ? 'locked' : 'missing'));
    api<{ lessons: LessonMeta[] }>('/lessons').then(({ lessons }) => {
      const current = lessons.find((l) => l.id === id);
      setNext(lessons.find((l) => current && l.era === current.era && l.order === current.order + 1) ?? null);
    });
  }, [id]);

  function decide(i: number) {
    setChoice(i);
    // Progress needs a session from the quiz; a guest playing a free lesson simply is not tracked.
    api(`/lessons/${id}/complete`, { method: 'POST' }).catch(() => {});
  }

  if (state === 'loading') return <div className="mx-auto max-w-3xl px-5 py-24 text-dust">Turning the page…</div>;
  if (state === 'missing') return <div className="mx-auto max-w-3xl px-5 py-24 text-dust">This page of history is missing.</div>;
  if (state === 'locked')
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-6 font-display text-4xl">This decision is part of Premium</h1>
        <p className="mt-3 text-dust">Unlock every era and see what really happened after each choice.</p>
        <Link href="/plan" className="mt-8 inline-block rounded-full bg-gold px-8 py-4 font-semibold text-night">
          See plans
        </Link>
      </div>
    );

  const l = lesson!;
  const style = ERA_STYLE[l.era];
  const picked = choice !== null ? l.decision.options[choice] : null;
  const historical = l.decision.options.find((o) => o.historical)!;

  return (
    <article className="pb-24">
      <header
        className="relative overflow-hidden border-b hairline"
        style={{ background: `radial-gradient(800px 360px at 20% 0%, ${style.glow}, transparent 70%)` }}
      >
        <Emblem era={l.era} className="absolute -right-10 top-4 h-72 w-72 opacity-[0.08]" />
        <div className="rise mx-auto max-w-3xl px-5 pb-12 pt-16">
          <Link href="/lessons" className="text-xs uppercase tracking-[0.3em] text-dust hover:text-parchment">
            ← {style.title}
          </Link>
          <p className="mt-8 font-display text-lg" style={{ color: style.color }}>
            {l.year}
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">{l.title}</h1>
          <p className="mt-4 text-lg italic text-dust">{l.teaser}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5">
        <div className="mt-12 space-y-6 text-lg leading-relaxed text-parchment/90">
          {l.body.map((p, i) => (
            <p key={i} className="rise" style={{ animationDelay: `${150 + i * 200}ms` }}>
              {p}
            </p>
          ))}
        </div>

        <section className="rise mt-14 rounded-3xl border border-white/10 bg-night-2 p-6 sm:p-8" style={{ animationDelay: '600ms' }}>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: style.color }}>
            Your decision
          </p>
          <h2 className="mt-3 font-display text-3xl">{l.decision.prompt}</h2>
          <div className="mt-6 grid gap-3">
            {l.decision.options.map((o, i) => {
              const isPicked = choice === i;
              return (
                <button
                  key={o.label}
                  disabled={choice !== null}
                  onClick={() => decide(i)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isPicked
                      ? 'border-gold bg-gold/10'
                      : choice !== null
                        ? 'border-white/5 opacity-40'
                        : 'border-white/10 hover:-translate-y-0.5 hover:border-white/30'
                  }`}
                >
                  <span className="font-display text-xl">{o.label}</span>
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="rise mt-8 space-y-5 border-t hairline pt-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-dust">Your outcome</p>
                <p className="mt-2 text-lg leading-relaxed">{picked.outcome}</p>
              </div>
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">
                  {picked.historical ? 'You chose what really happened' : 'What really happened'}
                </p>
                {!picked.historical && <p className="mt-2 font-display text-xl">{historical.label}</p>}
                <p className="mt-2 leading-relaxed text-parchment/90">{picked.historical ? 'History agrees with you.' : historical.outcome}</p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                {next ? (
                  <Link
                    href={next.locked ? '/plan' : `/lessons/${next.id}`}
                    className="rounded-full bg-gold px-6 py-3 font-semibold text-night"
                  >
                    {next.locked ? `Unlock “${next.title}” →` : `Next: ${next.title} →`}
                  </Link>
                ) : (
                  <Link href="/lessons" className="rounded-full bg-gold px-6 py-3 font-semibold text-night">
                    Back to the library
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
