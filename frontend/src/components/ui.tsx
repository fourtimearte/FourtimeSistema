import type { ReactNode, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { TECNICAS, type TecnicaKey } from '../store/model'

/* =====================================================================
   COMPONENTES BASE — agora são só MARCAÇÃO.
   Toda a aparência vem de styles/kit.css (Design Kit v5, portado do HTML
   de clientes). Não voltar a colocar estilo inline aqui: se faltar um
   visual, a regra nova vai no kit.css e vale para o sistema inteiro.
   ===================================================================== */

/** cor de token (CSS var) usada em estilo inline dinâmico */
export const cvar = (name: string): string => `var(${name})`

export function Btn({ children, variant = 'secondary', size = 'md', onClick, style, disabled, title, className }: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void; style?: CSSProperties; disabled?: boolean; title?: string; className?: string
}) {
  const cls = ['btn', 'btn-' + variant, size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '', className || ''].filter(Boolean).join(' ')
  return <button type="button" className={cls} style={style} onClick={onClick} disabled={disabled} title={title}>{children}</button>
}

export function IconBtn({ children, onClick, title, style }: { children: ReactNode; onClick?: () => void; title?: string; style?: CSSProperties }) {
  return <button type="button" className="iconbtn" onClick={onClick} title={title} aria-label={title} style={style}>{children}</button>
}

export function Panel({ title, sub, icon, right, children, flush }: {
  title?: string; sub?: string; icon?: ReactNode; right?: ReactNode; children: ReactNode; flush?: boolean
}) {
  return (
    <section className="panel">
      {title && (
        <div className="p-head">
          {icon && <span className="p-ico">{icon}</span>}
          <div><h2>{title}</h2>{sub && <div className="p-sub">{sub}</div>}</div>
          {right && <div className="p-right">{right}</div>}
        </div>
      )}
      <div className={'p-body' + (flush ? ' flush' : '')}>{children}</div>
    </section>
  )
}

/** tabela do sistema — sempre dentro de um wrapper que rola no mobile */
export function TableWrap({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return <div className="tscroll"><table className="tbl" style={{ minWidth }}>{children}</table></div>
}

export function Kpi({ label, value, delta, color, bar, onClick, icon, on }: {
  label: string; value: string; delta?: string; color?: string; bar?: number; onClick?: () => void; icon?: ReactNode; on?: boolean
}) {
  return (
    <div className={'kpi' + (on ? ' on' : '')} onClick={onClick} style={onClick ? undefined : { cursor: 'default' }}>
      <div className="k-lbl">{icon}{label}</div>
      <div className="k-val" style={color ? { color } : undefined}>{value}</div>
      {delta && <div className="k-delta">{delta}</div>}
      {bar != null && <div className="k-bar"><i style={{ width: bar + '%', background: color || undefined }} /></div>}
    </div>
  )
}

export function TecTag({ tec, style }: { tec: TecnicaKey; style?: CSSProperties }) {
  const t = TECNICAS[tec]
  return <span className="badge badge-set" style={{ background: cvar(t.cor), ...style }}>{t.label}</span>
}

export function PageHead({ crumb, title, desc, actions }: { crumb: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="pagehead">
      <div className="tt">
        <h1><span className="n">{crumb}</span>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}

/* grid de KPIs: use <div className="kpis"> — a regra está no kit.css.
   (thStyle/tdStyle/kpiGrid foram removidos: tabela agora é <TableWrap>.) */

type BadgeKind = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'pf' | 'pj'
export function Badge({ kind = 'neutral', children, dot = true }: { kind?: BadgeKind; children: ReactNode; dot?: boolean }) {
  return <span className={'badge badge-' + kind}>{dot && <i className="d" />}{children}</span>
}

export function Drawer({ open, onClose, accent, title, sub, children, foot }: {
  open: boolean; onClose: () => void; accent?: string; title: ReactNode; sub?: ReactNode; children: ReactNode; foot?: ReactNode
}) {
  /* portal para o body: fora do fluxo da página, o drawer nunca fica sob o
     topbar sticky do Shell (mesma lição do AnotarModal) */
  return createPortal(
    <>
      <div className={'scrim' + (open ? ' show' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' show' : '')} style={{ borderTop: '4px solid ' + (accent || 'var(--primary)') }}>
        <div className="dw-head">
          <div style={{ flex: 1, minWidth: 0 }}><h3>{title}</h3>{sub && <div className="sub">{sub}</div>}</div>
          <button className="iconbtn close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="dw-body">{open ? children : null}</div>
        {foot && <div className="dw-foot">{foot}</div>}
      </aside>
    </>,
    document.body,
  )
}
export const drawerH4: CSSProperties = { fontSize: 'var(--fs-11)', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-subtle)', margin: 'var(--sp-10) 0 var(--sp-4)', fontWeight: 600 }
