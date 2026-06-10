import type { InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/utils'

interface FieldFrameProps {
  label: string
  hint?: string
  error?: string
}

function FieldFrame({
  label,
  hint,
  error,
  children,
}: PropsWithChildren<FieldFrameProps>) {
  return (
    <label className="grid gap-2 text-sm text-[var(--foreground)]">
      <span className="font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>
      ) : null}
    </label>
  )
}

export function Input({
  label,
  hint,
  error,
  className,
  ...props
}: FieldFrameProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <input
        className={cn(
          'h-12 rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  )
}

export function Textarea({
  label,
  hint,
  error,
  className,
  ...props
}: FieldFrameProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <textarea
        className={cn(
          'min-h-32 rounded-3xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  )
}
