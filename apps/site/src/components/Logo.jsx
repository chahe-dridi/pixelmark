// The site mark: a "P" on a 16-cell grid with one accent pixel
export default function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="currentColor" d="M3 3h6v2H3zM3 5h2v8H3zM9 5h2v3H9zM5 8h4v2H5z" />
      <path fill="var(--accent)" d="M11 11h2v2h-2z" />
    </svg>
  )
}
