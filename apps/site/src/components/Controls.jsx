import { PALETTES, PALETTE_NAMES } from 'pixelmark'

// Small form controls shared by the gallery filters and the playground

export function Chip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`pixel-corners inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
        active ? 'bg-accent text-accent-fg' : 'bg-raised text-muted hover:text-fg'
      }`}
    >
      {children}
      {count != null && <span className={active ? 'opacity-80' : 'opacity-60'}>{count}</span>}
    </button>
  )
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm transition-colors ${
            value === o.value ? 'bg-raised text-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {o.label}
          {o.count != null && <span className="ml-1.5 font-mono text-xs opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function PaletteSwatches({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Palette" className="flex flex-wrap gap-1.5">
      {PALETTE_NAMES.map((name) => {
        const p = PALETTES[name].dark
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            title={name}
            onClick={() => onChange(name)}
            className={`flex h-8 items-center gap-1.5 border px-2 text-xs transition-colors ${
              value === name ? 'border-accent text-fg' : 'border-line text-muted hover:border-muted hover:text-fg'
            }`}
          >
            <span className="flex" aria-hidden="true">
              <span className="size-3" style={{ background: p.ink[1] }} />
              <span className="size-3" style={{ background: p.acc[2] }} />
            </span>
            {name}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-pixel text-[11px] uppercase tracking-wider text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted/70 transition-colors hover:border-muted focus:border-accent focus:outline-none'

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-fg/90">
      {label}
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 border border-line bg-raised transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:left-0.5 after:top-0.5 after:size-3.5 after:bg-muted after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-accent-fg"
      />
    </label>
  )
}
