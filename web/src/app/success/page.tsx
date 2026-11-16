'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, type Me } from '@/lib/api';

/**
 * Stripe redirects here right after payment, but access is granted by the webhook,
 * which can arrive a few seconds later. So we poll /me instead of trusting the redirect.
 */
export default function SuccessPage() {
  const [state, setState] = useState<'waiting' | 'active' | 'slow'>('waiting');

  useEffect(() => {
    let tries = 0;
    let stopped = false;
    const tick = async () => {
      tries += 1;
      try {
        const me = await api<Me>('/me');
        if (me.premium) return !stopped && setState('active');
      } catch {}
      if (tries >= 15) return !stopped && setState('slow');
      setTimeout(tick, 1500);
    };
    tick();
    return () => {
      stopped = true;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 pb-24 pt-24 text-center">
      <div className="relative grid h-28 w-28 place-items-center">
        <span className={`absolute inset-0 rounded-full border border-gold/40 ${state === 'waiting' ? 'animate-ping' : ''}`} />
        <span className="grid h-20 w-20 place-items-center rounded-full bg-gold text-3xl text-night">
          {state === 'active' ? '✓' : '…'}
        </span>
      </div>
      {state === 'active' ? (
        <div className="rise">
          <h1 className="mt-10 font-display text-5xl">Welcome to Premium</h1>
          <p className="mt-4 text-dust">Every era, every decision. History is waiting for your call.</p>
          <Link href="/lessons" className="mt-8 inline-block rounded-full bg-gold px-8 py-4 font-semibold text-night">
            Open the library
          </Link>
        </div>
      ) : state === 'waiting' ? (
        <div>
          <h1 className="mt-10 font-display text-4xl">Confirming your payment…</h1>
          <p className="mt-4 text-dust">This usually takes a few seconds.</p>
        </div>
      ) : (
        <div>
          <h1 className="mt-10 font-display text-4xl">Payment received</h1>
          <p className="mt-4 text-dust">
            Access is still being confirmed. Refresh in a minute, or check that the Stripe webhook listener is running.
          </p>
          <Link href="/account" className="mt-8 inline-block text-sm text-gold underline-offset-4 hover:underline">
            Go to my account
          </Link>
        </div>
      )}
    </div>
  );
}
