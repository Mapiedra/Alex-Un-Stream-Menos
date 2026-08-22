/** Formato de cifras. Nunca en fuente de pixeles: son largas y hay que leerlas. */
export function fmt(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

export function eur(n: number, decimals = 0): string {
  return `${fmt(n, decimals)} €`
}
