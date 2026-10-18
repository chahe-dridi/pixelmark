// The frame every live preview sits in: a title bar, then a dark "screen"
// with scanlines and pixel corner brackets.
const Corner = ({ className }) => (
  <span aria-hidden="true" className={`pointer-events-none absolute size-3 border-accent/70 ${className}`} />
)

export default function Stage({ title, right, children, className = '', screenClass = '' }) {
  return (
    <div className={`flex flex-col border border-line bg-surface ${className}`}>
      {(title || right) && (
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-line px-3 text-xs sm:px-4">
          <div className="flex min-w-0 items-center gap-2 text-muted">{title}</div>
          <div className="flex shrink-0 items-center gap-3">{right}</div>
        </div>
      )}
      <div className={`stage relative flex flex-1 items-center justify-center overflow-hidden ${screenClass}`}>
        <Corner className="left-2 top-2 border-l-2 border-t-2" />
        <Corner className="right-2 top-2 border-r-2 border-t-2" />
        <Corner className="bottom-2 left-2 border-b-2 border-l-2" />
        <Corner className="bottom-2 right-2 border-b-2 border-r-2" />
        {children}
      </div>
    </div>
  )
}
