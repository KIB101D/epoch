'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import { api, type Era, type LessonMeta } from '@/lib/api';

const ERAS = Object.keys(ERA_STYLE) as Era[];
const isEra = (v: string | null): v is Era => !!v && (ERAS as string[]).includes(v);

function Library() {
  const router = useRouter();
  const params = useSearchParams();
  const [lessons, setLessons] = useState<LessonMeta[] | null>(null);
  const [open, setOpen] = useState<Era>(isEra(params.get('era')) ? (params.get('era') as Era) : 'rome');

  useEffect(() => {
    api<{ lessons: LessonMeta[] }>('/lessons').then((r) => setLessons(r.lessons));
  }, []);

  function select(era: Era) {
    setOpen(era);
    router.replace(`/lessons?era=${era}`, { scroll: false });
  }

  const done = lessons?.filter((l) => l.completed).length ?? 0;
  const chapters = (era: Era) => (lessons ?? []).filter((l) => l.era === era).sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Library</p>
          <h1 className="mt-3 font-display text-5xl">Three eras, fifteen stories</h1>
        </div>
        {lessons && (
          <p className="text-sm text-dust">
            <span className="font-display text-2xl text-parchment">{done}</span> / {lessons.length} stories finished
          </p>
        )}
      </div>

      {!lessons && <p className="mt-16 text-dust">Opening the archive…</p>}

      {lessons && (
        <>
          {/* The three eras */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3" role="tablist" aria-label="Eras">
            {ERAS.map((era, i) => {
              const list = chapters(era);
              const finished = list.filter((l) => l.completed).length;
              const active = era === open;
              const s = ERA_STYLE[era];
              return (
                <button
                  key={era}
                  role="tab"
                  aria-selected={active}
                  onClick={() => select(era)}
                  className={`rise group relative overflow-hidden rounded-3xl border p-6 text-left transition duration-300 ${
                    active ? 'scale-[1.01] bg-night-3' : 'border-white/10 bg-night-2 hover:-translate-y-1 hover:border-white/25'
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                    borderColor: active ? s.color : undefined,
                    boxShadow: active ? `0 30px 70px -30px ${s.glow}` : undefined,
                  }}
                >
                  <Emblem era={era} className="absolute -right-6 -top-6 h-32 w-32 opacity-10 transition group-hover:opacity-20" />
                  <Emblem era={era} className="h-12 w-12" animate={active} />
                  <h2 className="mt-5 font-display text-3xl">{s.title}</h2>
                  <p className="text-sm text-dust">{s.tagline}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {list.map((l) => (
                        <span
                          key={l.id}
                          className="h-1.5 flex-1 rounded-full"
                          style={{ background: l.completed ? s.color : 'rgb(241 232 214 / 0.12)' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-dust">
                      {finished}/{list.length}
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-dust">
                    {list.filter((l) => l.free).length} free · {list.reduce((n, l) => n + l.decisions, 0)} decisions
                  </p>
                </button>
              );
            })}
          </div>

          {/* Chapters of the open era */}
          <section key={open} className="unfold mt-8 rounded-3xl border border-white/10 bg-night-2/60 p-6 sm:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl">
                {ERA_STYLE[open].title} <span className="italic text-dust">· {ERA_STYLE[open].figure}</span>
              </h2>
              <p className="text-sm text-dust">{ERA_STYLE[open].tagline}</p>
            </div>

            <ol className="relative mt-8 space-y-4 border-l pl-8" style={{ borderColor: `${ERA_STYLE[open].color}55` }}>
              {chapters(open).map((l, i) => (
                <li key={l.id} className="rise relative" style={{ animationDelay: `${i * 90}ms` }}>
                  <span
                    className="absolute -left-[45px] top-6 grid h-7 w-7 place-items-center rounded-full border-2 bg-night font-display text-xs"
                    style={{
                      borderColor: ERA_STYLE[open].color,
                      background: l.completed ? ERA_STYLE[open].color : undefined,
                      color: l.completed ? 'var(--color-night)' : undefined,
                    }}
                  >
                    {l.completed ? '✓' : l.order}
                  </span>
                  <Link
                    href={l.locked ? '/plan' : `/lessons/${l.id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-night-2 p-5 transition hover:-translate-y-0.5 hover:border-white/25 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-dust">
                        Chapter {l.order} · {l.year} · {l.decisions} decisions · {l.minutes} min
                      </p>
                      <h3 className={`mt-1 font-display text-2xl ${l.locked ? 'text-parchment/60' : ''}`}>{l.title}</h3>
                      <p className={`mt-1 text-sm ${l.locked ? 'text-dust/60' : 'text-dust'}`}>{l.teaser}</p>
                    </div>
                    <span className="shrink-0 text-sm">
                      {l.completed ? (
                        <span className="text-gold">Play again ↺</span>
                      ) : l.locked ? (
                        <span className="text-dust">🔒 Premium</span>
                      ) : (
                        <span className="rounded-full bg-parchment px-4 py-2 text-xs font-semibold text-night">
                          {l.free ? 'Free · ' : ''}Play →
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            {chapters(open).some((l) => l.locked) && (
              <Link
                href="/plan"
                className="relative mt-8 block overflow-hidden rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center transition hover:bg-gold/10"
              >
                <span className="relative z-10 text-sm">
                  <span className="text-gold">Premium</span> opens chapters 3 to 5 in every era →
                </span>
                <span className="shimmer absolute inset-0" />
              </Link>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}
