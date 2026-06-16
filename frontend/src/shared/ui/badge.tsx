import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

export function Badge({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]',
        className,
      )}
    >
      {children}
    </span>
  )
}
