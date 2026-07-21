import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { MousePointer2, Circle, Square, ArrowUpRight, Type, Eye, EyeOff, Undo2, Trash2, Printer, X } from 'lucide-react'
import { useApp } from '../store/useApp'
import { ANOT_CORES, type Anotacao } from '../store/model'
import A4Sheet from './A4Sheet'

type Tool = 'mover' | 'circulo' | 'retangulo' | 'seta' | 'texto'
const genId = () => 'a' + Date.now().toString(36) + Math.round(Math.random() * 1e4).toString(36)

export default function AnotarModal({ onClose }: { onClose: () => void }) {
  const { pedidos, curPed, semDinheiro, addAnot, updAnot, delAnot, clearAnot } = useApp()
  const p = pedidos[curPed]
  const anots = p?.anotacoes ?? []
  const [tool, setTool] = useState<Tool>('circulo')
  const [cor, setCor] = useState(ANOT_CORES[0])
  const [visivel, setVisivel] = useState(true)
  const [sel, setSel] = useState<string | null>(null)
  const [draft, setDraft] = useState<Anotacao | null>(null)
  const draftRef = useRef<Anotacao | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null)

  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { delAnot(curPed, sel); setSel(null) } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose, sel, curPed, delAnot])
  if (!p) return null

  function frac(e: React.PointerEvent) { const r = svgRef.current!.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } }

  function bgDown(e: React.PointerEvent) {
    if (tool === 'mover') { setSel(null); return }
    const f = frac(e)
    if (tool === 'texto') { const texto = prompt('Texto da anotação:'); if (texto) addAnot(curPed, { id: genId(), tipo: 'texto', x: f.x, y: f.y, w: 0, h: 0, cor, texto }); return }
    const d: Anotacao = { id: genId(), tipo: tool, x: f.x, y: f.y, w: 0, h: 0, cor }
    draftRef.current = d; setDraft(d)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function move(e: React.PointerEvent) {
    if (draftRef.current) { const f = frac(e); const d = { ...draftRef.current, w: f.x - draftRef.current.x, h: f.y - draftRef.current.y }; draftRef.current = d; setDraft(d); return }
    if (drag.current) { const f = frac(e); updAnot(curPed, drag.current.id, { x: drag.current.ox + (f.x - drag.current.sx), y: drag.current.oy + (f.y - drag.current.sy) }) }
  }
  function up() {
    const d = draftRef.current
    if (d) { if (Math.abs(d.w) > 0.006 || Math.abs(d.h) > 0.006) addAnot(curPed, d); draftRef.current = null; setDraft(null) }
    drag.current = null
  }
  function shapeDown(e: React.PointerEvent, a: Anotacao) {
    if (tool !== 'mover') return
    e.stopPropagation(); setSel(a.id); const f = frac(e); drag.current = { id: a.id, sx: f.x, sy: f.y, ox: a.x, oy: a.y }
  }

  const desenhando = tool !== 'mover'
  return createPortal(
    <div style={overlay}>
      <div style={bar}>
        <b style={{ fontSize: 13 }}>Anotações · {p.pedido}</b>
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        {([['mover', <MousePointer2 size={16} />], ['circulo', <Circle size={16} />], ['retangulo', <Square size={16} />], ['seta', <ArrowUpRight size={16} />], ['texto', <Type size={16} />]] as [Tool, React.ReactNode][]).map(([t, ic]) => (
          <button key={t} onClick={() => setTool(t)} title={t} style={{ ...tbtn, ...(tool === t ? tbtnOn : {}) }}>{ic}</button>
        ))}
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        {ANOT_CORES.map(c => <button key={c} onClick={() => setCor(c)} title="cor" style={{ width: 22, height: 22, borderRadius: 6, background: c, border: cor === c ? '2px solid var(--text)' : '1px solid var(--border-strong)', cursor: 'pointer' }} />)}
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={() => setVisivel(v => !v)} title="mostrar/ocultar" style={tbtn}>{visivel ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        <button onClick={() => { const last = anots[anots.length - 1]; if (last) delAnot(curPed, last.id) }} title="desfazer última" style={tbtn}><Undo2 size={16} /></button>
        <button onClick={() => clearAnot(curPed)} title="limpar tudo" style={tbtn}><Trash2 size={16} /></button>
        <span style={{ marginLeft: 'auto' }} />
        <button onClick={() => window.print()} style={{ ...tbtn, width: 'auto', padding: '0 12px', gap: 6, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}><Printer size={15} />Imprimir / PDF</button>
        <button onClick={onClose} title="fechar" style={tbtn}><X size={16} /></button>
      </div>

      <div style={scroll}>
        <div style={sheetWrap}>
          <A4Sheet p={p} semDinheiro={semDinheiro} />
          <svg ref={svgRef} viewBox="0 0 1000 1414" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: desenhando ? 'crosshair' : 'default' }}
            onPointerDown={bgDown} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
            <defs>{[...anots, ...(draft ? [draft] : [])].map(a => <marker key={'m' + a.id} id={'ae' + a.id} markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={a.cor} /></marker>)}</defs>
            {visivel && anots.map(a => <g key={a.id} onPointerDown={e => shapeDown(e, a)} style={{ pointerEvents: tool === 'mover' ? 'all' : 'none', cursor: tool === 'mover' ? 'move' : 'default' }}><Shape a={a} sel={sel === a.id} /></g>)}
            {draft && <Shape a={draft} sel={false} />}
          </svg>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Shape({ a, sel }: { a: Anotacao; sel: boolean }) {
  const X = a.x * 1000, Y = a.y * 1414, W = a.w * 1000, H = a.h * 1414, sw = 3
  const halo = sel ? { filter: 'drop-shadow(0 0 3px rgba(198,22,27,.9))' } : {}
  if (a.tipo === 'circulo') return <ellipse cx={X + W / 2} cy={Y + H / 2} rx={Math.abs(W / 2)} ry={Math.abs(H / 2)} fill="none" stroke={a.cor} strokeWidth={sw} style={halo} />
  if (a.tipo === 'retangulo') return <rect x={Math.min(X, X + W)} y={Math.min(Y, Y + H)} width={Math.abs(W)} height={Math.abs(H)} fill="none" stroke={a.cor} strokeWidth={sw} rx={4} style={halo} />
  if (a.tipo === 'seta') return <line x1={X} y1={Y} x2={X + W} y2={Y + H} stroke={a.cor} strokeWidth={sw} markerEnd={`url(#ae${a.id})`} style={halo} />
  if (a.tipo === 'texto') return <text x={X} y={Y} fill={a.cor} fontSize={26} fontWeight={700} fontFamily="'IBM Plex Sans',sans-serif" style={halo}>{a.texto}</text>
  return null
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 92, background: 'rgba(14,17,22,.55)', display: 'flex', flexDirection: 'column' }
const bar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }
const tbtn: CSSProperties = { width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }
const tbtnOn: CSSProperties = { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
const scroll: CSSProperties = { flex: 1, overflow: 'auto', padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }
const sheetWrap: CSSProperties = { position: 'relative', width: 720, maxWidth: '96vw', background: '#fff', borderRadius: 6, boxShadow: 'var(--sh-4)', padding: 20 }
