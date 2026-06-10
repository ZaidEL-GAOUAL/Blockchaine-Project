import { Ticket } from 'lucide-react'

import { formatEth, formatEur } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { TicketCategory } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

export function TicketCategoryCard({
  category,
  isSelected,
  onSelect,
}: {
  category: TicketCategory
  isSelected?: boolean
  onSelect?: () => void
}) {
  const remaining = category.maxSupply - category.mintedCount

  return (
    <Card
      className={cn(
        'grid gap-5 transition duration-200',
        isSelected && 'border-[var(--accent)] shadow-[0_25px_65px_rgba(61,68,40,0.16)]',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <Badge>{category.symbol}</Badge>
          <div>
            <h3 className="font-display text-2xl text-[var(--foreground)]">
              {category.name}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              {category.description}
            </p>
          </div>
        </div>
        <div className="rounded-full bg-[var(--background-soft)] p-3 text-[var(--accent)]">
          <Ticket className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            On-chain price
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {formatEth(category.priceEth)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Card checkout
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {formatEur(category.priceEur)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Remaining
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {remaining} / {category.maxSupply}
          </p>
        </div>
      </div>

      <ul className="grid gap-2 text-sm text-[var(--muted-foreground)]">
        {category.benefits.map((benefit) => (
          <li key={benefit}>• {benefit}</li>
        ))}
      </ul>

      {onSelect ? (
        <Button variant={isSelected ? 'primary' : 'secondary'} onClick={onSelect}>
          {isSelected ? 'Selected' : 'Choose this pass'}
        </Button>
      ) : null}
    </Card>
  )
}
