'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ERA_STYLE, Emblem } from '@/components/Emblem';
import { ApiError, api, formatPrice, type Me, type PlanName, type Price } from '@/lib/api';

// Shown if the API cannot reach Stripe (e.g. before `npm run stripe:setup`).
const FALLBACK_PRICES: Price[] = [
  { plan: 'monthly', amount: 999, currency: 'usd', interval: 'month' },
  { plan: 'yearly', amount: 5999, currency: 'usd', interval: 'year' },
];

function PlanView() {
  const router = useRouter();
  const canceled = useSearchParams().get('canceled');
  const [me, setMe] = useState<Me | null>(null);
  const [prices, setPrices] = useState<Price[]>(FALLBACK_PRICES);
  const [selected, setSelected] = useState<PlanName>('yearly');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Me>('/me')
      .then((m) => (m.plan ? setMe(m) : router.replace('/quiz')))
      .catch((e) => (e instanceof ApiError && e.status === 401 ? router.replace('/quiz') : setError(e.message)));
    api<{ prices: Price[] }>('/billing/prices')
      .then((r) => r.prices.length && setPrices(r.prices))
      .catch(() => {});
  }, [router]);

  async function checkout() {
    setPaying(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan: selected }) });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      setPaying(false);
    }
  }

  if (!me?.plan) {
    return <div className="mx-auto max-w-5xl px-5 py-24 text-dust">{error ?? 'Loading your plan…'}</div>;
  }

  const { plan } = me;
  const style = ERA_STYLE[plan.era];
  const monthly = prices.find((p) => p.plan === 'monthly');
  const yearly = prices.find((p) => p.plan === 'yearly');
  const saving = monthly && yearly ? Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100) : 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-10 lg:grid-cols-[1fr_420px]">
      <section className="rise">
        {canceled && (
          <p className="mb-6 rounded-xl border border-white/10 bg-night-2 px-4 py-3 text-sm text-dust">
            No problem. Your plan is saved, and the first two stories are still free.
          </p>
        )}
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: style.color }}>
          Your personal path
        </p>
        <h1 className="mt-3 font-display text-5xl">
          {plan.eraTitle}: <span className="italic text-dust">{style.tagline.toLowerCase()}</span>
        </h1>
        <p className="mt-4 text-dust">
          {plan.lessons.length} stories · {plan.lessons.reduce((n, l) => n + l.decisions, 0)} decisions · {me.user.answers?.minutesPerDay} min a day · about {plan.days} days
        </p>

        <ol className="relative mt-10 space-y-4 border-l pl-8" style={{ borderColor: `${style.color}55` }}>
          {plan.lessons.map((l, i) => (
            <li key={l.id} className="rise relative" style={{ animationDelay: `${i * 120}ms` }}>
              <span
                className="absolute -left-[41px] top-5 grid h-5 w-5 place-items-center rounded-full border-2 bg-night"
                style={{ borderColor: style.color }}
              >
                {l.free && <span className="h-2 w-2 rounded-full" style={{ background: style.color }} />}
              </span>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-night-2 p-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-dust">Chapter {i + 1} · {l.year} · {l.decisions} decisions</p>
                  <h3 className="mt-1 font-display text-xl">{l.title}</h3>
                </div>
                {l.free ? (
                  <Link href={`/lessons/${l.id}`} className="shrink-0 rounded-full bg-parchment px-4 py-2 text-xs font-semibold text-night">
                    Free · Play
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-dust">🔒 Premium</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <aside className="rise lg:sticky lg:top-24 lg:self-start" style={{ animationDelay: '150ms' }}>
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-night-2 p-7">
          <Emblem era={plan.era} className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.07]" />
          {me.premium ? (
            <>
              <h2 className="font-display text-3xl">You are Premium</h2>
              <p className="mt-2 text-dust">Every era, every chapter and every decision is open.</p>
              <Link href="/lessons" className="mt-6 block rounded-full bg-gold py-4 text-center font-semibold text-night">
                Open the library
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl">Unlock your full path</h2>
              <ul className="mt-4 space-y-2 text-sm text-parchment/90">
                <li>✦ All 5 chapters of {plan.eraTitle}, plus every other era</li>
                <li>✦ What really happened after every choice</li>
                <li>✦ Progress saved across devices</li>
              </ul>

              <div className="mt-6 space-y-3" role="radiogroup" aria-label="Choose a plan">
                {[yearly, monthly].filter(Boolean).map((p) => {
                  const price = p!;
                  const active = selected === price.plan;
                  return (
                    <button
                      key={price.plan}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelected(price.plan)}
                      className={`relative flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                        active ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {price.plan === 'yearly' && saving > 0 && (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-night">
                          Save {saving}%
                        </span>
                      )}
                      <span>
                        <span className="block font-semibold capitalize">{price.plan}</span>
                        {price.plan === 'yearly' && (
                          <span className="text-xs text-dust">
                            {formatPrice({ ...price, amount: Math.round(price.amount / 12) })} / month, billed yearly
                          </span>
                        )}
                      </span>
                      <span className="font-display text-2xl">
                        {formatPrice(price)}
                        <span className="text-sm text-dust">/{price.interval === 'year' ? 'yr' : 'mo'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={checkout}
                disabled={paying}
                className="relative mt-6 w-full overflow-hidden rounded-full bg-gold py-4 font-semibold text-night transition hover:bg-[#f0c877] disabled:opacity-60"
              >
                <span className="relative z-10">{paying ? 'Opening secure checkout…' : 'Start Premium'}</span>
                {!paying && <span className="shimmer absolute inset-0" />}
              </button>
              {error && <p className="mt-3 text-sm text-rome">{error}</p>}
              <p className="mt-4 text-center text-xs text-dust">Cancel anytime in two clicks · Secure payment by Stripe</p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense>
      <PlanView />
    </Suspense>
  );
}
