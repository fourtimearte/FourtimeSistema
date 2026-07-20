import type { ReactNode, CSSProperties } from 'react'
import { TECNICAS, type TecnicaKey } from '../store/model'

/** cor de token (CSS var) usada em estilo inline dinâmico */
export const cvar = (name: string): string => `var(${name})`

export function Btn({ children, variant = 'secondary', size = 'md', onClick, style }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; style?: CSSProperties
}) {
  const h = size === 'sm' ? 'var(--control-h-sm)' : size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h)'
  const base: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: h, padding: size === 'sm' ? '0 11px' : '0 16px', borderRadius: 8, fontSize: size === 'sm' ? 12 : 13, fontWeight: 600, cursor: 'pointer', border: '1px solid transparent', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all var(--mov-rapido) var(--ease)', width: size === 'lg' ? '100%' : undefined }
  const v: Record<string, CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--primary-fg)' },
    secondary: { background: 'var(--bg-surface)', color: 'var(--text)', borderColor: 'var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--text-muted)' },
    danger: { background: 'var(--danger)', color: '#fff' },
  }
  return <button style={{ ...base, ...v[variant], ...style }} onClick={onClick}>{children}</button>
}

export function Panel({ title, sub, icon, right, children }: { title?: string; sub?: string; icon?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', marginBottom: 32, overflow: 'hidden' }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          {icon && <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-brand)', color: '#fff', display: 'grid', placeItems: 'center' }}>{icon}</span>}
          <div><h2 style={{ fontSize: 16 }}>{title}</h2>{sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}</div>
          {right && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{right}</div>}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

export function Kpi({ label, value, delta, color, bar, onClick }: { label: string; value: string; delta?: string; color?: string; bar?: number; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--bg-surface)', boxShadow: 'var(--sh-1)', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 2px', color: color || 'var(--text)' }}>{value}</div>
      {delta && <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{delta}</div>}
      {bar != null && <div style={{ marginTop: 8, height: 4, borderRadius: 999, background: 'var(--bg-muted)', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: bar + '%', background: color || 'var(--primary)', borderRadius: 999 }} /></div>}
    </div>
  )
}

export function TecTag({ tec, style }: { tec: TecnicaKey; style?: CSSProperties }) {
  const t = TECNICAS[tec]
  return <span style={{ display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff', background: cvar(t.cor), whiteSpace: 'nowrap', ...style }}>{t.label}</span>
}

export function PageHead({ crumb, title, desc, actions }: { crumb: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{crumb}</div>
        <h1 style={{ fontSize: 24, letterSpacing: '-.02em' }}>{title}</h1>
        {desc && <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '5px 0 0', maxWidth: '74ch' }}>{desc}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

export const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16, marginBottom: 32 }
