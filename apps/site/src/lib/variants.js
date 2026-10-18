// The site keeps variant picks as { key: [values] } per scene (an empty or
// missing list means "any"). These helpers turn that into the library's
// `variants` prop, where one value pins it and a list shuffles between them.

export function toSceneVariants(picks = {}) {
  const out = {}
  for (const [key, values] of Object.entries(picks)) {
    if (!values?.length) continue
    out[key] = values.length === 1 ? values[0] : values
  }
  return Object.keys(out).length ? out : undefined
}

/** { scene: picks } → the `variants` prop (or undefined when nothing is picked). */
export function toVariantsProp(all = {}) {
  const out = {}
  for (const [scene, picks] of Object.entries(all)) {
    const v = toSceneVariants(picks)
    if (v) out[scene] = v
  }
  return Object.keys(out).length ? out : undefined
}

export const countPicks = (picks = {}) => Object.values(picks).filter((v) => v?.length).length

export function togglePick(picks, key, value) {
  const cur = picks[key] || []
  const next = cur.some((v) => v === value) ? cur.filter((v) => v !== value) : [...cur, value]
  return { ...picks, [key]: next }
}
