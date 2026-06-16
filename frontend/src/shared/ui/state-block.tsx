import type { ReactNode } from 'react'

import { Card } from '@/shared/ui/card'

export function StateBlock({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="grid gap-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
        {eyebrow}
      </p>
      <div className="grid gap-2">
        <h2 className="font-display text-3xl text-[var(--foreground)]">{title}</h2>
        <p className="mx-auto max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      {action}
    </Card>
  )
}
