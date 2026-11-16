'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import { api, type Era, type LessonMeta } from '@/lib/api';

export default function LibraryPage() {
  const [lessons, setLessons] = useState<LessonMeta[] | null>(null);

  useEffect(() => {
    api<{ lessons: LessonMeta[] }>('/lessons').then((r) => setLessons(r.lessons));
  }, []);

  const eras = Object.keys(ERA_STYLE) as Era[];
  const done = lessons?.filter((l) => l.completed).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Library</p>
          <h1 className="mt-3 font-display text-5xl">Every decision, every era</h1>
        </div>
        {lessons && (
          <p className="text-sm text-dust">
            <span className="font-display text-2xl text-parchment">{done}</span> / {lessons.length} decisions made
          </p>
        )}
      </div>

      {!lessons && <p className="mt-16 text-dust">Opening the archive…</p>}

      {lessons &&
        eras.map((era) => (
          <section key={era} className="mt-14">
            <div className="mb-5 flex items-center gap-4">
              <Emblem era={era} className="h-10 w-10" />
              <div>
                <h2 className="font-display text-3xl">{ERA_STYLE[era].title}</h2>
                <p className="text-sm text-dust">{ERA_STYLE[era].tagline}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {lessons
                .filter((l) => l.era === era)
                .sort((a, b) => a.order - b.order)
                .map((l) => (
                  <Link
                    key={l.id}
                    href={l.locked ? '/plan' : `/lessons/${l.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-night-2 p-6 transition hover:-translate-y-1 hover:border-white/25"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${ERA_STYLE[era].color}, transparent)` }}
                    />
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-dust">
                      <span>{l.year}</span>
                      <span>{l.minutes} min</span>
                    </div>
                    <h3 className={`mt-4 font-display text-2xl ${l.locked ? 'text-parchment/60' : ''}`}>{l.title}</h3>
                    <p className={`mt-2 text-sm ${l.locked ? 'text-dust/60 blur-[1.5px]' : 'text-dust'}`}>{l.teaser}</p>
                    <div className="mt-6 text-xs">
                      {l.completed ? (
                        <span className="text-gold">✓ Decision made</span>
                      ) : l.locked ? (
                        <span className="text-dust">🔒 Unlock with Premium →</span>
                      ) : (
                        <span className="text-parchment">{l.free ? 'Free · ' : ''}Play →</span>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        ))}
    </div>
  );
}
