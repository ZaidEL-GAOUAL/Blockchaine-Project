import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_18px_40px_rgba(61,68,40,0.22)] hover:bg-[var(--accent-strong)]',
  secondary:
    'bg-[var(--panel)] text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--panel-strong)]',
  ghost:
    'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]',
  outline:
    'bg-transparent text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--panel)]',
}

export function Button({
  className,
  variant = 'primary',
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
