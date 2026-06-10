import type { PropsWithChildren } from 'react'

import { Wallet } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'My Tickets', to: '/my-tickets' },
  { label: 'Seller Dashboard', to: '/seller' },
]

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(116,128,84,0.2),transparent_60%)]" />
      <div className="pointer-events-none absolute left-0 top-24 h-64 w-64 rounded-full bg-[rgba(139,113,77,0.18)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(172,162,122,0.18)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-6 z-30 rounded-full border border-[var(--border)] bg-[var(--panel)]/85 px-5 py-3 shadow-[0_18px_50px_rgba(76,60,45,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="rounded-full bg-[var(--accent)] p-3 text-[var(--accent-foreground)]">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-xl">Blockchaine Tickets</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Caffeine front-end demo
                </p>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 py-8">{children}</main>

        <footer className="border-t border-[var(--border)] py-8 text-sm text-[var(--muted-foreground)]">
          Frontend-only prototype for the course project: event discovery, ETH checkout,
          fake card flow, and seller setup screens.
        </footer>
      </div>
    </div>
  )
}
