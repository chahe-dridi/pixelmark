import { useState } from 'react'
import { CheckIcon, CopyIcon } from './Icons'

export default function CopyButton({ text, label = 'Copy', className = '' }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1400)
    } catch { /* clipboard blocked: nothing to do */ }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg ${className}`}
    >
      {done ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      <span aria-live="polite">{done ? 'Copied' : label}</span>
    </button>
  )
}
