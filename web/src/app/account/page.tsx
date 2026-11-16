'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, api, type Me } from '@/lib/api';

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Payment issue',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  paused: 'Paused',
};

const fmtDate = (s: number) => new Date(s * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Me>('/me')
      .then(setMe)
      .catch((e) => (e instanceof ApiError && e.status === 401 ? setNoSession(true) : setError(e.message)));
  }, []);

  async function openPortal() {
    setOpening(true);
    try {
      const { url } = await api<{ url: string }>('/billing/portal', { method: 'POST' });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open billing');
      setOpening(false);
    }
  }

  if (noSession)
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">No account yet</h1>
        <p className="mt-3 text-dust">Take the 30-second quiz to get your personal path.</p>
        <Link href="/quiz" className="mt-8 inline-block rounded-full bg-gold px-8 py-4 font-semibold text-night">
          Find my era
        </Link>
      </div>
    );
  if (!me) return <div className="mx-auto max-w-3xl px-5 py-24 text-dust">{error ?? 'Loading…'}</div>;

  const sub = me.subscription;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-12">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Account</p>
      <h1 className="mt-3 font-display text-5xl">Your Epoch</h1>

      {sub?.paymentIssue && (
        <div className="mt-8 rounded-2xl border border-rome/40 bg-rome/10 p-5 text-sm">
          <p className="font-semibold">Your last payment did not go through.</p>
          <p className="mt-1 text-parchment/80">You keep access while Stripe retries. Update your card to avoid losing it.</p>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-night-2 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-dust">Subscription</p>
          <p className="mt-3 font-display text-3xl">{sub ? STATUS_LABEL[sub.status] ?? sub.status : 'Free'}</p>
          {sub?.plan && <p className="mt-1 text-sm capitalize text-dust">{sub.plan} plan</p>}
          {sub?.currentPeriodEnd && (
            <p className="mt-4 text-sm text-parchment/80">
              {sub.cancelAtPeriodEnd ? 'Access ends on ' : 'Renews on '}
              {fmtDate(sub.currentPeriodEnd)}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-night-2 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-dust">Progress</p>
          <p className="mt-3 font-display text-3xl">{me.user.completedLessons.length} decisions</p>
          {me.plan && <p className="mt-1 text-sm text-dust">Path: {me.plan.eraTitle}</p>}
          {me.user.email && <p className="mt-4 text-sm text-parchment/80">{me.user.email}</p>}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {sub ? (
          <button
            onClick={openPortal}
            disabled={opening}
            className="rounded-full border border-parchment/30 px-6 py-3 text-sm transition hover:border-parchment disabled:opacity-60"
          >
            {opening ? 'Opening…' : 'Manage billing or cancel'}
          </button>
        ) : (
          <Link href="/plan" className="rounded-full bg-gold px-6 py-3 font-semibold text-night">
            Upgrade to Premium
          </Link>
        )}
        <Link href="/lessons" className="rounded-full px-6 py-3 text-sm text-dust hover:text-parchment">
          Library →
        </Link>
      </div>
      {error && <p className="mt-4 text-sm text-rome">{error}</p>}
    </div>
  );
}
