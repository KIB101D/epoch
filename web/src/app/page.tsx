import Link from 'next/link';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import type { Era } from '@/lib/api';

const ERAS: { era: Era; year: string; rotate: string; offset: string }[] = [
  { era: 'rome', year: '49 BC', rotate: '-6deg', offset: 'translate-y-6' },
  { era: 'egypt', year: '48 BC', rotate: '2deg', offset: '-translate-y-2' },
  { era: 'napoleon', year: '1805', rotate: '7deg', offset: 'translate-y-10' },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 overflow-x-clip px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-24">
        <div className="rise">
          <p className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gold">
            <span className="h-px w-8 bg-gold" /> Interactive history
          </p>
          <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">
            History is a series of <span className="gold-text italic">choices.</span>
            <br /> Make them.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-dust">
            Stand on the bank of the Rubicon with Caesar. Hide in Cleopatra&apos;s palace. Hold the heights at Austerlitz,
            or don&apos;t. Five-minute stories, every one a chain of decisions.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/quiz"
              className="group relative overflow-hidden rounded-full bg-gold px-7 py-4 font-semibold text-night shadow-[0_10px_40px_-10px_rgb(226_182_95/0.7)] transition hover:bg-[#f0c877]"
            >
              <span className="relative z-10">Find my era · 30 sec</span>
              <span className="shimmer absolute inset-0" />
            </Link>
            <Link href="/lessons/rome-rubicon" className="text-sm text-parchment/80 underline-offset-4 hover:underline">
              or try a free lesson →
            </Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t hairline pt-6">
            {[
              ['15', 'stories'],
              ['39', 'decisions'],
              ['6', 'free stories'],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl text-parchment">{n}</dt>
                <dd className="text-xs uppercase tracking-widest text-dust">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto h-[360px] w-full max-w-[340px] sm:h-[420px] sm:max-w-md">
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-3xl" />
          {ERAS.map(({ era, year, rotate, offset }, i) => (
            <div
              key={era}
              className={`float absolute top-1/2 -mt-28 ${offset}`}
              style={{ left: `${i * 28}%`, ['--r' as string]: rotate, animationDelay: `${i * -2}s`, zIndex: i + 1 }}
            >
              <article
                className="w-36 rounded-2xl border border-white/10 bg-night-2/95 p-4 shadow-2xl backdrop-blur sm:w-48 sm:p-5"
                style={{ boxShadow: `0 30px 60px -20px ${ERA_STYLE[era].glow}` }}
              >
                <Emblem era={era} className="h-14 w-14" animate />
                <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-dust">{year}</p>
                <h3 className="font-display text-2xl">{ERA_STYLE[era].title}</h3>
                <p className="mt-1 text-xs text-dust">{ERA_STYLE[era].figure}</p>
                <div className="mt-4 h-0.5 w-10 rounded" style={{ background: ERA_STYLE[era].color }} />
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y hairline bg-night-2/50">
        <div className="mx-auto grid max-w-6xl gap-px px-5 py-8 sm:grid-cols-3 sm:py-12">
          {[
            ['01', 'Pick your era', 'A 30-second quiz builds a path around the period you care about.'],
            ['02', 'Live the moment', 'Each story is a few scenes that put you in the room where history was decided.'],
            ['03', 'Make the calls', 'Choose, see what it would cost, learn what really happened, and get your verdict.'],
          ].map(([n, t, d]) => (
            <div key={n} className="p-6">
              <p className="font-display text-sm text-gold">{n}</p>
              <h3 className="mt-3 font-display text-2xl">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dust">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-rome/30 bg-gradient-to-br from-rome/20 via-night-2 to-night p-8 sm:p-12">
          <Emblem era="rome" className="absolute -right-6 -top-6 h-48 w-48 opacity-10" />
          <p className="text-xs uppercase tracking-[0.3em] text-rome">Free lesson · 49 BC</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl sm:text-5xl">
            The Senate orders you to give up your army. Do you cross the river?
          </h2>
          <Link
            href="/lessons/rome-rubicon"
            className="mt-8 inline-block rounded-full border border-parchment/30 px-6 py-3 text-sm transition hover:border-parchment hover:bg-parchment hover:text-night"
          >
            Stand at the Rubicon →
          </Link>
        </div>
      </section>
    </>
  );
}
