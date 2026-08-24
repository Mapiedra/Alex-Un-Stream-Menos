import type { TokenKey } from '../theme/palette.ts'

interface Props {
  label: string
  value: string
  token: TokenKey
  /** La formula, expuesta al jugador. El publico de incrementales la exige. */
  hint?: string
}

export function ResourceRow({ label, value, token, hint }: Props) {
  return (
    <div
      title={hint ?? ''}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 'var(--space-4)',
        padding: 'var(--space-1) 0',
      }}
    >
      <span className="pixel" style={{ fontSize: 'var(--pixel-s)', color: `var(--c-${token})` }}>
        {label}
      </span>
      <span className="data" style={{ color: 'var(--c-textBright)' }}>
        {value}
      </span>
    </div>
  )
}
