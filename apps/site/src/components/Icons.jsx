// Small, hand-drawn icons on a 16px pixel grid (crisp at any size)
const Svg = ({ children, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" {...p}>
    {children}
  </svg>
)

export const GitHubIcon = (p) => (
  <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export const NpmIcon = (p) => (
  <Svg {...p}>
    <path d="M0 4h16v7H8v1H4v-1H0zM1 5v5h2V6h1v4h1V5zm5 0v6h2v-1h2V5zm2 1h1v3H8zm3-1v5h2V6h1v4h1V5z" fillRule="evenodd" />
  </Svg>
)

export const SunIcon = (p) => (
  <Svg {...p}>
    <path d="M7 0h2v2H7zM7 14h2v2H7zM0 7h2v2H0zM14 7h2v2h-2zM2 2h2v2H2zM12 2h2v2h-2zM2 12h2v2H2zM12 12h2v2h-2zM5 4h6v1h1v6h-1v1H5v-1H4V5h1z" />
  </Svg>
)

export const MoonIcon = (p) => (
  <Svg {...p}>
    <path d="M6 1h4v1H8v1H7v2H6v6h1v1h1v1h4v-1h2v1h-1v1h-2v1H6v-1H4v-1H3v-1H2V9H1V6h1V4h1V3h1V2h2z" />
  </Svg>
)

export const MenuIcon = (p) => (
  <Svg {...p}>
    <path d="M1 3h14v2H1zM1 7h14v2H1zM1 11h14v2H1z" />
  </Svg>
)

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M2 2h2v1h1v1h1v1h1v1h2V5h1V4h1V3h1V2h2v2h-1v1h-1v1h-1v1h-1v2h1v1h1v1h1v1h1v2h-2v-1h-1v-1h-1v-1H9v-1H7v1H6v1H5v1H4v1H2v-2h1v-1h1v-1h1V9h1V7H5V6H4V5H3V4H2z" />
  </Svg>
)

export const CopyIcon = (p) => (
  <Svg {...p}>
    <path d="M4 1h9v2h-2V3H6v8H4zM6 5h9v10H6zm2 2v6h5V7z" fillRule="evenodd" />
  </Svg>
)

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M13 3h2v2h-1v1h-1v1h-1v1h-1v1h-1v1H9v1H8v1H7v1H5v-1H4v-1H3V9H2V7h2v1h1v1h1v1h1V9h1V8h1V7h1V6h1V5h1V4h1z" />
  </Svg>
)

export const ArrowIcon = (p) => (
  <Svg {...p}>
    <path d="M1 7h10V5h1v1h1v1h1v2h-1v1h-1v1h-1V9H1z" />
  </Svg>
)

export const SkipIcon = (p) => (
  <Svg {...p}>
    <path d="M2 3h2v1h1v1h1v1h1v1h1v2H7v1H6v1H5v1H4v1H2zM9 3h2v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1H9z" />
  </Svg>
)

export const SearchIcon = (p) => (
  <Svg {...p}>
    <path d="M5 1h5v1h1v1h1v1h1v5h-1v1h-1v1h1v1h1v1h1v1h1v2h-2v-1h-1v-1h-1v-1h-1v-1H9v1H5v-1H4v-1H3V9H2V4h1V3h1V2h1zm0 2v1H4v5h1v1h5V9h1V4h-1V3z" fillRule="evenodd" />
  </Svg>
)

export const FilterIcon = (p) => (
  <Svg {...p}>
    <path d="M1 2h14v2h-1v1h-1v1h-1v1h-1v1h-1v6H8v1H6V8H5V7H4V6H3V5H2V4H1z" />
  </Svg>
)

export const ShuffleIcon = (p) => (
  <Svg {...p}>
    <path d="M11 1h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1V6H9v1H8v2h1v1h2V9h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-2H8v-1H7v-1H6V7h1V6h1V5h3zM1 4h4v1h1v1H5v1H4V6H1zm3 5h1v1h1v1H5v1H1v-2h3z" />
  </Svg>
)

export const ChevronIcon = (p) => (
  <Svg {...p}>
    <path d="M3 5h2v1h1v1h1v1h2V7h1V6h1V5h2v2h-1v1h-1v1h-1v1H9v1H7v-1H6V9H5V8H4V7H3z" />
  </Svg>
)

export const LayersIcon = (p) => (
  <Svg {...p}>
    <path d="M7 1h2v1h2v1h2v1h2v2h-2v1h-2v1H9v1H7V8H5V7H3V6H1V4h2V3h2V2h2zM1 9h2v1h2v1h2v1h2v-1h2v-1h2V9h2v2h-2v1h-2v1H9v1H7v-1H5v-1H3v-1H1z" />
  </Svg>
)
