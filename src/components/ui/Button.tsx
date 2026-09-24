import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border border-primary',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-muted',
  ghost: 'bg-transparent text-ink hover:bg-surface-muted border border-transparent',
  danger: 'bg-surface text-critical border border-critical hover:bg-critical-soft',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: IconName
  size?: 'sm' | 'md'
  children?: ReactNode
}

export function Button({ variant = 'secondary', icon, size = 'md', className = '', children, ...rest }: ButtonProps) {
  const sizing = size === 'sm' ? 'h-8 px-2.5 text-sm gap-1.5' : 'h-10 px-4 text-sm gap-2'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Texto para lectores de pantalla y tooltip. Obligatorio. */
  label: string
}

export function IconButton({ icon, label, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink disabled:opacity-40 ${className}`}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}
