import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Epoch · Step into history',
  description: 'Five-minute interactive history lessons where you make the call.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="sticky top-0 z-40 border-b hairline bg-night/70 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="font-display text-2xl tracking-wide">
              <span className="gold-text">Epoch</span>
            </Link>
            <div className="flex items-center gap-5 text-sm text-dust">
              <Link href="/lessons" className="hover:text-parchment">
                Library
              </Link>
              <Link href="/account" className="hover:text-parchment">
                Account
              </Link>
              <Link
                href="/quiz"
                className="hidden rounded-full border border-gold/40 px-4 py-1.5 text-gold transition hover:bg-gold hover:text-night sm:inline-block"
              >
                Start
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mx-auto max-w-6xl px-5 py-12 text-xs text-dust/70">
          Epoch is a portfolio demo. Payments run in Stripe test mode: use card 4242 4242 4242 4242.
        </footer>
      </body>
    </html>
  );
}
