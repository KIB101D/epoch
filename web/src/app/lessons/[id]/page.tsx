'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import { ApiError, api, type Lesson, type LessonMeta, type Scene } from '@/lib/api';

const LINE_DELAY = 450; // ms between paragraphs coming into focus

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'locked' | 'missing'>('loading');
  const [step, setStep] = useState(0); // current scene; === scenes.length means the summary
  const [choices, setChoices] = useState<number[]>([]);
  const [next, setNext] = useState<LessonMeta | null>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStep(0);
    setChoices([]);
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

  function choose(option: number) {
    setChoices((c) => [...c.slice(0, step), option]);
  }

  function advance() {
    const nextStep = step + 1;
    setStep(nextStep);
    // Progress needs a session from the quiz; a guest playing a free story simply is not tracked.
    if (lesson && nextStep === lesson.scenes.length) api(`/lessons/${id}/complete`, { method: 'POST' }).catch(() => {});
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (state === 'loading') return <div className="mx-auto max-w-3xl px-5 py-24 text-dust">Turning the page…</div>;
  if (state === 'missing') return <div className="mx-auto max-w-3xl px-5 py-24 text-dust">This page of history is missing.</div>;
  if (state === 'locked') return <Locked />;

  const l = lesson!;
  const style = ERA_STYLE[l.era];
  const total = l.scenes.length;
  const finished = step >= total;

  return (
    <article className="pb-24">
      <header
        className="relative overflow-hidden border-b hairline"
        style={{ background: `radial-gradient(800px 360px at 20% 0%, ${style.glow}, transparent 70%)` }}
      >
        <Emblem era={l.era} className="absolute -right-10 top-4 h-72 w-72 opacity-[0.08]" animate />
        <div className="rise mx-auto max-w-3xl px-5 pb-10 pt-14">
          <Link href={`/lessons?era=${l.era}`} className="text-xs uppercase tracking-[0.3em] text-dust hover:text-parchment">
            ← {style.title} · Chapter {l.order} of 5
          </Link>
          <p className="mt-8 font-display text-lg" style={{ color: style.color }}>
            {l.year}
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">{l.title}</h1>
          <p className="mt-4 text-lg italic text-dust">{l.teaser}</p>
        </div>
      </header>

      {/* Progress: one segment per decision */}
      <div ref={top} className="sticky top-16 z-30 border-b hairline bg-night/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
          <div className="flex flex-1 gap-1.5">
            {l.scenes.map((_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full transition-all duration-700"
                  style={{
                    width: i < step || finished || (i === step && choices[step] !== undefined) ? '100%' : i === step ? '35%' : '0%',
                    background: style.color,
                  }}
                />
              </span>
            ))}
          </div>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.25em] text-dust">
            {finished ? 'Verdict' : `Decision ${step + 1} / ${total}`}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5">
        {finished ? (
          <Summary lesson={l} choices={choices} next={next} />
        ) : (
          <SceneView
            key={step}
            scene={l.scenes[step]}
            color={style.color}
            choice={choices[step] ?? null}
            onChoose={choose}
            onContinue={advance}
            isLast={step === total - 1}
          />
        )}
      </div>
    </article>
  );
}

function SceneView({
  scene,
  color,
  choice,
  onChoose,
  onContinue,
  isLast,
}: {
  scene: Scene;
  color: string;
  choice: number | null;
  onChoose: (i: number) => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  const picked = choice !== null ? scene.decision.options[choice] : null;
  const historical = scene.decision.options.find((o) => o.historical)!;
  const decisionDelay = 300 + scene.text.length * LINE_DELAY;

  return (
    <section className="pt-12">
      <p className="focus-in text-xs uppercase tracking-[0.3em]" style={{ color }}>
        {scene.moment}
      </p>
      <div className="mt-6 space-y-6 text-lg leading-relaxed text-parchment/90 sm:text-xl">
        {scene.text.map((p, i) => (
          <p key={i} className="focus-in" style={{ animationDelay: `${150 + i * LINE_DELAY}ms` }}>
            {p}
          </p>
        ))}
      </div>

      <div className="rise mt-12 rounded-3xl border border-white/10 bg-night-2 p-6 sm:p-8" style={{ animationDelay: `${decisionDelay}ms` }}>
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color }}>
          Your decision
        </p>
        <h2 className="mt-3 font-display text-3xl">{scene.decision.prompt}</h2>
        <div className="mt-6 grid gap-3">
          {scene.decision.options.map((o, i) => {
            const isPicked = choice === i;
            return (
              <button
                key={o.label}
                disabled={choice !== null}
                onClick={() => onChoose(i)}
                className={`group flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                  isPicked
                    ? 'border-gold bg-gold/10'
                    : choice !== null
                      ? 'border-white/5 opacity-40'
                      : 'border-white/10 hover:-translate-y-0.5 hover:border-white/30'
                }`}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border font-display text-sm transition group-hover:border-parchment"
                  style={{ borderColor: isPicked ? 'var(--color-gold)' : undefined }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-display text-xl">{o.label}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-8 space-y-5 border-t hairline pt-8">
            {!picked.historical && (
              <div className="focus-in">
                <p className="text-xs uppercase tracking-[0.3em] text-dust">Your outcome</p>
                <p className="mt-2 text-lg leading-relaxed">{picked.outcome}</p>
              </div>
            )}
            <div
              className="focus-in relative rounded-2xl border border-gold/30 bg-gold/5 p-5 pr-24"
              style={{ animationDelay: picked.historical ? '0ms' : '500ms' }}
            >
              <span
                className={`stamp absolute right-4 top-4 grid h-16 w-16 place-items-center rounded-full border-2 text-center text-[9px] font-bold uppercase leading-tight tracking-wider ${
                  picked.historical ? 'border-gold text-gold' : 'border-rome text-rome'
                }`}
                style={{ animationDelay: '900ms' }}
              >
                {picked.historical ? 'As in history' : 'History rewritten'}
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {picked.historical ? 'You made the real call' : 'What really happened'}
              </p>
              {!picked.historical && <p className="mt-2 font-display text-xl">{historical.label}</p>}
              <p className="mt-2 leading-relaxed text-parchment/90">{historical.outcome}</p>
            </div>
            <div className="focus-in pt-2" style={{ animationDelay: '1100ms' }}>
              <button onClick={onContinue} className="rounded-full bg-gold px-7 py-3 font-semibold text-night transition hover:bg-[#f0c877]">
                {isLast ? 'See your verdict →' : 'Continue the story →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function rankFor(matched: number, total: number) {
  if (matched === total) return { title: 'Born for this age', line: 'Every call you made is the one history made.' };
  if (matched / total >= 0.5) return { title: 'Shrewd strategist', line: 'You read the moment the way its leaders did, mostly.' };
  if (matched > 0) return { title: 'Bold dissenter', line: 'You took the road not taken more often than not.' };
  return { title: 'Rewriter of history', line: 'Not one choice like the real one. A very different world.' };
}

function Summary({ lesson, choices, next }: { lesson: Lesson; choices: number[]; next: LessonMeta | null }) {
  const style = ERA_STYLE[lesson.era];
  const results = lesson.scenes.map((s, i) => ({ scene: s, picked: s.decision.options[choices[i]], real: s.decision.options.find((o) => o.historical)! }));
  const matched = results.filter((r) => r.picked?.historical).length;
  const rank = rankFor(matched, results.length);

  return (
    <section className="pt-12">
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-night-2 p-8 text-center sm:p-12">
        <Emblem era={lesson.era} className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
        <p className="focus-in text-xs uppercase tracking-[0.3em] text-dust">Your verdict</p>
        <p className="stamp mx-auto mt-6 font-display text-7xl" style={{ animationDelay: '250ms' }}>
          <span className="gold-text">{matched}</span>
          <span className="text-dust">/{results.length}</span>
        </p>
        <p className="focus-in mt-2 text-sm text-dust" style={{ animationDelay: '500ms' }}>
          choices matched history
        </p>
        <h2 className="focus-in mt-6 font-display text-4xl" style={{ animationDelay: '700ms' }}>
          {rank.title}
        </h2>
        <p className="focus-in mt-2 text-dust" style={{ animationDelay: '850ms' }}>
          {rank.line}
        </p>
      </div>

      <ol className="mt-10 space-y-3">
        {results.map((r, i) => (
          <li
            key={i}
            className="rise flex gap-4 rounded-2xl border border-white/10 bg-night-2/60 p-5"
            style={{ animationDelay: `${1000 + i * 150}ms` }}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${r.picked?.historical ? 'bg-gold text-night' : 'border border-rome text-rome'}`}
            >
              {r.picked?.historical ? '✓' : '✗'}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: style.color }}>
                {r.scene.moment}
              </p>
              <p className="mt-1">
                You: <span className="font-display text-lg">{r.picked?.label}</span>
              </p>
              {!r.picked?.historical && <p className="text-sm text-dust">History: {r.real.label}</p>}
            </div>
          </li>
        ))}
      </ol>

      <div className="rise mt-10 flex flex-wrap gap-3" style={{ animationDelay: `${1100 + results.length * 150}ms` }}>
        {next ? (
          next.locked ? (
            <Link href="/plan" className="relative overflow-hidden rounded-full bg-gold px-7 py-4 font-semibold text-night">
              <span className="relative z-10">Unlock chapter {next.order}: {next.title} →</span>
              <span className="shimmer absolute inset-0" />
            </Link>
          ) : (
            <Link href={`/lessons/${next.id}`} className="rounded-full bg-gold px-7 py-4 font-semibold text-night">
              Chapter {next.order}: {next.title} →
            </Link>
          )
        ) : (
          <Link href="/lessons" className="rounded-full bg-gold px-7 py-4 font-semibold text-night">
            Choose another era →
          </Link>
        )}
        <Link
          href={`/lessons?era=${lesson.era}`}
          className="rounded-full border border-parchment/30 px-6 py-4 text-sm transition hover:border-parchment"
        >
          Back to {style.title}
        </Link>
      </div>
    </section>
  );
}

function Locked() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="stamp text-5xl">🔒</p>
      <h1 className="mt-6 font-display text-4xl">This chapter is part of Premium</h1>
      <p className="mt-3 text-dust">Unlock every chapter of every era, with what really happened after each choice.</p>
      <Link href="/plan" className="mt-8 inline-block rounded-full bg-gold px-8 py-4 font-semibold text-night">
        See plans
      </Link>
    </div>
  );
}
