import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface ComboOpt { label: string; value: string; sub?: string; hex?: string }

/**
 * Popover de autocomplete do v172: campo + botão que abre uma lista com
 * busca no topo. Aceita texto livre. `rotulo` = rótulo dentro da caixa
 * (aparece com o valor); `rightAddon` = botões dentro da caixa (+ / swatch).
 */
export default function Combo({ value, onSelect, options, placeholder, leftSwatch, allowFree = true, rotulo, upper, rightAddon, tintClass }: {
  value: string; onSelect: (v: string, opt?: ComboOpt) => void; options: ComboOpt[]
  placeholder?: string; leftSwatch?: string; allowFree?: boolean; rotulo?: string; upper?: boolean; rightAddon?: ReactNode; tintClass?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [open])

  const filt = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()) || (o.sub ?? '').toLowerCase().includes(q.toLowerCase()))
  const commitFree = () => { const v = q.trim(); if (v) { onSelect(v); setOpen(false) } }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div role="button" tabIndex={0} className={'cb-ctrl' + (tintClass ? ' ' + tintClass : '')} onClick={() => { setOpen(o => !o); setQ('') }} style={control}>
        {leftSwatch !== undefined && <i style={{ width: 20, height: 20, borderRadius: 5, border: '1px solid var(--border-strong)', background: leftSwatch, flex: '0 0 auto' }} />}
        <span style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6, overflow: 'hidden', textAlign: 'left' }}>
          {rotulo && value && <span style={rotuloCss}>{rotulo}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--text)' : 'var(--text-subtle)', textTransform: upper ? 'uppercase' : undefined, fontSize: upper ? 12 : undefined, fontWeight: upper && !value ? 600 : undefined, letterSpacing: upper && !value ? '.04em' : undefined }}>{value || placeholder}</span>
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', flex: '0 0 auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        {rightAddon}
      </div>
      {open && (
        <div style={popover}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && allowFree) commitFree() }} placeholder="Buscar…" style={search} />
          <div style={list}>
            {filt.slice(0, 60).map(o => (
              <div key={o.value + (o.sub ?? '')} onClick={() => { onSelect(o.value, o); setOpen(false) }} style={item} className="combo-item">
                {o.hex !== undefined && <i style={{ width: 14, height: 14, borderRadius: 4, border: '1px solid var(--border-strong)', background: o.hex, flex: '0 0 auto' }} />}
                <span style={{ flex: 1 }}>{o.label}</span>
                {o.sub && <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.sub}</span>}
              </div>
            ))}
            {allowFree && q.trim() && !filt.some(o => o.value.toLowerCase() === q.trim().toLowerCase()) && (
              <div onClick={commitFree} style={{ ...item, color: 'var(--primary)', fontWeight: 600 }} className="combo-item">Usar “{q.trim()}”</div>
            )}
            {!filt.length && !q && <div style={{ padding: 10, fontSize: 12, color: 'var(--text-subtle)' }}>Sem itens — digite para adicionar.</div>}
          </div>
        </div>
      )}
      <style>{`.combo-item:hover{background:var(--bg-hover)}`}</style>
    </div>
  )
}

const control: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 'var(--control-h-lg)', padding: '0 8px 0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, cursor: 'pointer' }
const rotuloCss: CSSProperties = { flex: '0 0 auto', fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)' }
const popover: CSSProperties = { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--sh-4)', padding: 5, minWidth: 220 }
const search: CSSProperties = { width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 13, outline: 'none', marginBottom: 5 }
const list: CSSProperties = { maxHeight: 220, overflowY: 'auto' }
const item: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }
