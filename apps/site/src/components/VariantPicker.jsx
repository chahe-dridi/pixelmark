import { VARIANTS } from 'pixelmark'
import { countPicks, togglePick } from '../lib/variants'

// Choose a scene's variants. Each option row starts on "Any" (the scene
// picks at random); choosing one value pins it, choosing several shuffles
// between them on every play.
export default function VariantPicker({ scene, picks = {}, onChange, compact = false }) {
  const options = VARIANTS[scene] || []
  if (!options.length) return <p className="text-sm text-muted">This scene has no variants: it plays the same way every time.</p>

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {options.map((opt) => {
        const chosen = picks[opt.key] || []
        const any = chosen.length === 0
        return (
          <fieldset key={opt.key}>
            <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2 text-xs text-muted">
              <span className="font-medium text-fg/85">{opt.label}</span>
              <span className="font-mono text-[11px]">
                {any ? 'random' : chosen.length === 1 ? 'pinned' : `shuffles ${chosen.length}`}
              </span>
            </legend>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                aria-pressed={any}
                onClick={() => onChange({ ...picks, [opt.key]: [] })}
                className={`border px-2.5 py-1 text-xs transition-colors ${any ? 'border-accent bg-accent-soft text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'}`}
              >
                Any
              </button>
              {opt.options.map(([value, label]) => {
                const on = chosen.some((v) => v === value)
                return (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(togglePick(picks, opt.key, value))}
                    className={`border px-2.5 py-1 text-xs transition-colors ${on ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}
      {countPicks(picks) > 0 && (
        <button type="button" onClick={() => onChange({})} className="text-xs text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
          Reset to all variants
        </button>
      )}
    </div>
  )
}
