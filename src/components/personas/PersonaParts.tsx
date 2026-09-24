import { useEffect, useId, useRef, useState } from 'react'
import { daysUntil, formatDate, isExpired } from '../../lib/dates'
import { dataUrlKb, imageFileToDataUrl } from '../../lib/images'
import type { Persona, PersonaStat } from '../../types'
import { Button, IconButton } from '../ui/Button'

/** Retrato de la persona, o sus iniciales si no hay imagen. */
export function Portrait({ persona, size = 64 }: { persona: Pick<Persona, 'name' | 'portrait'>; size?: number }) {
  const initials = persona.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return persona.portrait ? (
    <img
      src={persona.portrait}
      alt={`Retrato de ${persona.name}`}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full border border-line object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size / 2.6 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-semibold text-ink-muted"
    >
      {initials || '?'}
    </span>
  )
}

/** Estado de vigencia: vencida (alerta), vence pronto (aviso) o vigente. */
export function ValidityLabel({ persona }: { persona: Pick<Persona, 'expiresAt'> }) {
  if (isExpired(persona.expiresAt)) {
    return <span className="font-semibold text-critical">Vencida el {formatDate(persona.expiresAt)}</span>
  }
  const days = daysUntil(persona.expiresAt)
  if (days <= 30) {
    return (
      <span className="font-semibold text-assumption-ink">
        Vence en {days} {days === 1 ? 'día' : 'días'} ({formatDate(persona.expiresAt)})
      </span>
    )
  }
  return <span className="text-ink-muted">Vigente hasta el {formatDate(persona.expiresAt)}</span>
}

/** Lista editable de textos (necesidades, motivaciones, frustraciones). */
export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const id = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const set = (i: number, value: string) => onChange(items.map((x, j) => (j === i ? value : x)))

  const shouldFocusLast = useRef(false)
  const add = () => {
    shouldFocusLast.current = true
    onChange([...items, ''])
  }
  // Enfoca el campo nuevo recién cuando ya existe en pantalla.
  useEffect(() => {
    if (!shouldFocusLast.current) return
    shouldFocusLast.current = false
    listRef.current?.querySelector<HTMLInputElement>('li:last-child input')?.focus()
  }, [items.length])

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend id={id} className="mb-1 text-xs font-semibold text-ink-muted">
        {label}
      </legend>
      <ul ref={listRef} className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <input
              aria-label={`${label} ${i + 1}`}
              value={item}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  add()
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
            />
            <IconButton
              icon="trash"
              label={`Quitar ${label.toLowerCase()} ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost" icon="plus" className="self-start" onClick={add} aria-describedby={id}>
        Agregar
      </Button>
    </fieldset>
  )
}

/** Pares etiqueta: valor (p. ej. "Viajes al año: 30"). */
export function StatsEditor({ stats, onChange }: { stats: PersonaStat[]; onChange: (stats: PersonaStat[]) => void }) {
  const set = (i: number, patch: Partial<PersonaStat>) =>
    onChange(stats.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="sr-only">Estadísticas</legend>
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            aria-label={`Etiqueta de la estadística ${i + 1}`}
            placeholder="Viajes al año"
            value={s.label}
            onChange={(e) => set(i, { label: e.target.value })}
            className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
          />
          <input
            aria-label={`Valor de la estadística ${i + 1}`}
            placeholder="30"
            value={s.value}
            onChange={(e) => set(i, { value: e.target.value })}
            className="w-28 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
          />
          <IconButton icon="trash" label={`Quitar estadística ${i + 1}`} onClick={() => onChange(stats.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button size="sm" variant="ghost" icon="plus" className="self-start" onClick={() => onChange([...stats, { label: '', value: '' }])}>
        Agregar estadística
      </Button>
    </fieldset>
  )
}

/**
 * Selector de imagen: pegar una URL o subir un archivo (que se achica automáticamente).
 * `maxSide` define el tamaño máximo en píxeles del lado más largo.
 */
export function ImagePicker({
  label,
  maxSide,
  onPick,
}: {
  label: string
  maxSide: number
  onPick: (src: string) => void
}) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await imageFileToDataUrl(file, maxSide)
      onPick(dataUrl)
      setMessage({ text: `Imagen reducida y guardada (${dataUrlKb(dataUrl)} KB).` })
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'No se pudo leer la imagen.', error: true })
    }
  }

  const applyUrl = () => {
    const value = url.trim()
    if (!/^https?:\/\//i.test(value)) {
      setMessage({ text: 'La dirección debe empezar por http:// o https://', error: true })
      return
    }
    onPick(value)
    setUrl('')
    setMessage(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-ink-muted">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        <input
          id={id}
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              applyUrl()
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
        />
        <Button size="sm" onClick={applyUrl} disabled={!url.trim()}>
          Usar URL
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <Button size="sm" onClick={() => fileRef.current?.click()}>
          Subir archivo
        </Button>
      </div>
      <p role="status" className={`text-xs ${message?.error ? 'text-critical' : 'text-ink-muted'}`}>
        {message?.text}
      </p>
    </div>
  )
}
