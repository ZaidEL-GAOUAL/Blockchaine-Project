import { Button } from '@/shared/ui/button'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 8,
}: {
  value: number
  onChange: (nextValue: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--background-soft)] px-3 py-2">
      <Button
        variant="ghost"
        className="h-9 w-9 rounded-full px-0 py-0"
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
      >
        -
      </Button>
      <span className="min-w-8 text-center text-sm font-semibold text-[var(--foreground)]">
        {value}
      </span>
      <Button
        variant="ghost"
        className="h-9 w-9 rounded-full px-0 py-0"
        onClick={() => onChange(Math.min(max, value + 1))}
        type="button"
      >
        +
      </Button>
    </div>
  )
}
