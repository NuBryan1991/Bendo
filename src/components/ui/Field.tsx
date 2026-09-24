import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const CONTROL =
  'w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted/80 disabled:bg-surface-muted'

interface WrapperProps {
  label: string
  hint?: ReactNode
  children: (id: string, describedBy?: string) => ReactNode
}

/** Etiqueta + control + ayuda opcional, conectados para lectores de pantalla. */
function FieldWrapper({ label, hint, children }: WrapperProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-ink-muted">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>

export function TextField({ label, hint, className = '', ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      {(id, d) => <input id={id} aria-describedby={d} className={`${CONTROL} ${className}`} {...rest} />}
    </FieldWrapper>
  )
}

type TextAreaProps = { label: string; hint?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ label, hint, className = '', rows = 3, ...rest }: TextAreaProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      {(id, d) => (
        <textarea id={id} aria-describedby={d} rows={rows} className={`${CONTROL} resize-y ${className}`} {...rest} />
      )}
    </FieldWrapper>
  )
}

type SelectProps<T extends string | number> = {
  label: string
  hint?: ReactNode
  value: T
  options: { value: T; label: string }[]
  onValueChange: (value: T) => void
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>

export function SelectField<T extends string | number>({
  label,
  hint,
  value,
  options,
  onValueChange,
  className = '',
  ...rest
}: SelectProps<T>) {
  return (
    <FieldWrapper label={label} hint={hint}>
      {(id, d) => (
        <select
          id={id}
          aria-describedby={d}
          className={`${CONTROL} ${className}`}
          value={String(value)}
          onChange={(e) => {
            const match = options.find((o) => String(o.value) === e.target.value)
            if (match) onValueChange(match.value)
          }}
          {...rest}
        >
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldWrapper>
  )
}

/** Control segmentado accesible (grupo de radios con aspecto de botones). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  hideLabel,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  disabled?: boolean
  hideLabel?: boolean
}) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-1" disabled={disabled}>
      <legend className={hideLabel ? 'sr-only' : 'mb-1 text-xs font-semibold text-ink-muted'}>{label}</legend>
      <div className="inline-flex self-start rounded-md border border-line-strong bg-surface p-0.5">
        {options.map((o) => {
          const checked = o.value === value
          return (
            <label
              key={o.value}
              className={`relative cursor-pointer rounded px-2.5 py-1 text-xs font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                checked ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
