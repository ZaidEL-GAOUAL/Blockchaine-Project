import type { HTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[var(--border)] bg-[var(--panel)]/95 p-6 shadow-[0_22px_60px_rgba(76,60,45,0.08)] backdrop-blur',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
