import CopyButton from './CopyButton'
import { INSTALL } from '../lib/site'

export default function CodeBlock({ code, title = 'code', className = '' }) {
  return (
    <div className={`overflow-hidden border border-line bg-surface ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-muted">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-fg/90"><code>{code}</code></pre>
    </div>
  )
}

export function InstallCommand({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 border border-line bg-surface py-2.5 pl-4 pr-3 font-mono text-sm ${className}`}>
      <span className="select-none text-accent">$</span>
      <code className="flex-1 text-fg">{INSTALL}</code>
      <CopyButton text={INSTALL} />
    </div>
  )
}
