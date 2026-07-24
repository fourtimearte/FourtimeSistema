import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Plus, Clock, Calendar, Paperclip, Layers, PencilLine, PackageCheck, X, FileText, PencilRuler, ArrowRight } from 'lucide-react'
import { useApp } from '../store/useApp'
import { STATIONS, TECNICAS, money, entregaTs, pedTotais, type KCard, type Pedido } from '../store/model'
import { PageHead, Btn, TecTag, Badge, cvar } from '../components/ui'
import { exportarHtml } from '../lib/exportHtml'

/* =====================================================================
   Produção — 2 kanbans na mesma página (PESQUISA §8 + MARK42):
   1) KANBAN DE PEDIDOS (topo): todos os pedidos aprovados numa fileira
      horizontal, em ordem de entrega. Cada card é o pedido-mãe, com o
      progresso das suas fatias por departamento.
   2) KANBAN DE PRODUÇÃO (abaixo): o pedido aprovado se DIVIDE pelas tags
      de Design dos layouts e vira vários pedidos de departamento — um
      card por técnica com os L-NN que aquele departamento produz.
   Pipeline: cadastro de cliente → orçamento no Editor → aprovado entra
   aqui → fatias percorrem as estações → tudo entregue = pedido entregue.
   ===================================================================== */

const LANES: [string, string][] = [
  ['DTF', '--set-dtf'], ['Sublimação', '--set-sublimacao'], ['Silk', '--set-silk'],
  ['Bordado/Patch', '--set-bordado'], ['Costura', '--set-costura'], ['Embalagem', '--set-embalagem'], ['Expedição', '--set-expedicao'],
]

export default function Kanban() {
  const { pedidos, kcards, moveCard, goto, abrirNoEditor, semDinheiro, toast } = useApp()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const nLate = kcards.filter(c => c.late).length
  const [selCardId, setSelCardId] = useState<string | null>(null)
  const selCard = kcards.find(c => c.id === selCardId) ?? null

  /* pedidos aprovados em ordem de entrega (mais urgente primeiro) */
  const fila = pedidos.filter(p => p.aprovado).sort((a, b) => entregaTs(a.entrega) - entregaTs(b.entrega))

  function onDragEnd(e: DragEndEvent) {
    const over = e.over?.id as string | undefined
    if (!over) return
    const card = kcards.find(c => c.id === e.active.id)
    if (!card || card.station === over) return
    moveCard(card.id, over)
    const st = STATIONS.find(s => s.id === over)
    toast(card.pedido + ' · ' + TECNICAS[card.tec].label + ' → ' + (st?.nome ?? over))
  }

  return (
    <div>
      <PageHead crumb="Produção · MES/PCP" title="Produção"
        desc="No topo, a fila de pedidos em ordem de entrega. Abaixo, o pedido aprovado se divide pelas tags de Design e vira um card por departamento — arraste entre as estações."
        actions={<>
          {nLate > 0 && <span style={alertChip}><Clock size={12} />{nLate} atrasado(s)</span>}
          <Btn size="sm" onClick={() => goto('comercial')}><Plus size={16} />Novo pedido</Btn>
        </>} />

      {/* ============ 1 · KANBAN DE PEDIDOS (fileira horizontal) ============ */}
      <div style={{ marginBottom: 22 }}>
        <div style={secHead}>
          <span style={secTitle}>Fila de pedidos</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ordem de entrega · {fila.length} pedido(s) · clique abre no Editor</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 10 }}>
          {fila.map(p => <PedidoCard key={p.pedido} p={p} cards={kcards.filter(c => c.pedido === p.pedido)} semDinheiro={semDinheiro} onOpen={() => abrirNoEditor(p.pedido)} />)}
          {!fila.length && <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: '18px 4px' }}>Nenhum pedido aprovado ainda — aprove um orçamento no Editor para ele entrar na fila.</div>}
        </div>
      </div>

      {/* ============ 2 · KANBAN DE PRODUÇÃO (por departamento) ============ */}
      <div style={secHead}>
        <span style={secTitle}>Departamentos</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          Faixas: {LANES.map(([n, c]) => <span key={n} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#fff', background: cvar(c), borderRadius: 4, padding: '1px 6px' }}>{n}</span>)}
        </span>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
          {STATIONS.map(st => (
            <Column key={st.id} id={st.id} nome={st.nome} lane={st.lane} cards={kcards.filter(c => c.station === st.id)} onOpen={id => setSelCardId(id)} />
          ))}
        </div>
      </DndContext>

      {selCard && <CardModal card={selCard} pedido={pedidos.find(p => p.pedido === selCard.pedido) ?? null}
        onClose={() => setSelCardId(null)}
        onMove={st => moveCard(selCard.id, st)}
        onEditor={() => { setSelCardId(null); abrirNoEditor(selCard.pedido) }} />}
    </div>
  )
}

/* =====================================================================
   Modal do cartão (estilo Trello): fatia do pedido + anexos (imagens dos
   layouts) + o orçamento em versão HTML embutido — sem sair do Kanban.
   ===================================================================== */
function CardModal({ card, pedido, onClose, onMove, onEditor }: {
  card: KCard; pedido: Pedido | null; onClose: () => void; onMove: (station: string) => void; onEditor: () => void
}) {
  const [verOrc, setVerOrc] = useState(false)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const st = STATIONS.find(s => s.id === card.station)
  /* layouts da fatia (L-01 → índice 0) + demais anexos do pedido */
  const fatiaIdx = card.lays.map(l => parseInt(l.slice(2), 10) - 1)
  const anexos = (pedido?.layouts ?? []).map((l, i) => ({ l, i, daFatia: fatiaIdx.includes(i) })).filter(a => a.l.img)
  const html = useMemo(() => (pedido && verOrc) ? exportarHtml(pedido) : '', [pedido, verOrc])

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,17,22,.55)' }} />
      <div style={{ position: 'relative', width: 880, maxWidth: '100%', maxHeight: '94vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '4px solid ' + cvar(TECNICAS[card.tec].cor), borderRadius: 12, boxShadow: 'var(--sh-4)' }}>
        {/* cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 2 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{card.pedido}</span>
              <TecTag tec={card.tec} />
              <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--info-fg)', background: 'var(--info-bg)', borderRadius: 999, padding: '2px 8px' }}><Layers size={11} />{card.lays.join(' · ') || '—'}</span>
              {card.late && <span style={alertChip}><Clock size={12} />ATRASADO</span>}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 5 }}>{card.cliente}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={13} />{card.prazo || 'sem data'}</span>
              <span className="mono">{card.pecas} pçs desta fatia</span>
              <span>na estação <b style={{ color: 'var(--text)' }}>{st?.nome ?? card.station}</b></span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><X size={15} /></button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* ações (mover estação + editor) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-subtle)', fontWeight: 700 }}>Mover para</span>
            <select value={card.station} onChange={e => onMove(e.target.value)} style={{ height: 32, padding: '0 8px', borderRadius: 8, font: 'inherit', fontSize: 13, background: 'var(--bg-surface-2)', color: 'var(--text)', border: '1px solid var(--border-strong)', cursor: 'pointer' }}>
              {STATIONS.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <span style={{ flex: 1 }} />
            <Btn size="sm" onClick={onEditor}><PencilRuler size={14} />Editar no Editor</Btn>
          </div>

          {/* anexos */}
          <h4 style={secH4}><Paperclip size={13} />Anexos ({anexos.length})</h4>
          {anexos.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 18 }}>
              {anexos.map(a => (
                <div key={a.i} onClick={() => setZoomImg(a.l.img)} style={{ cursor: 'zoom-in', border: '1px solid ' + (a.daFatia ? 'color-mix(in srgb,' + cvar(TECNICAS[card.tec].cor) + ' 55%,transparent)' : 'var(--border)'), borderRadius: 10, overflow: 'hidden', background: 'var(--bg-surface-2)' }}>
                  <img src={a.l.img as string} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '5px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="mono" style={{ fontWeight: 700 }}>L-{String(a.i + 1).padStart(2, '0')}</span>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.l.ref}</span>
                    {a.daFatia && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: 99, background: cvar(TECNICAS[card.tec].cor), flex: '0 0 auto' }} title="layout desta fatia" />}
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: 'var(--text-subtle)', fontSize: 13, marginBottom: 18 }}>Nenhuma imagem anexada nos layouts deste pedido.</div>}

          {/* orçamento embutido (HTML) */}
          <h4 style={secH4}><FileText size={13} />Orçamento</h4>
          {!verOrc ? (
            <button onClick={() => setVerOrc(true)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
              padding: '12px 14px', borderRadius: 10, border: '1px dashed var(--border-strong)', background: 'var(--bg-surface-2)', color: 'var(--text)',
            }}>
              <FileText size={18} style={{ color: 'var(--set-comercial)' }} />
              <span style={{ flex: 1 }}>
                <b style={{ display: 'block', fontSize: 13 }}>{(card.cliente || 'Orçamento')} · {card.pedido}.html</b>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Abrir a versão HTML do pedido aqui dentro (como no Trello) — sem valores.</span>
              </span>
              <ArrowRight size={16} style={{ color: 'var(--text-subtle)' }} />
            </button>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <FileText size={13} style={{ color: 'var(--set-comercial)' }} />
                <span className="mono" style={{ fontWeight: 600 }}>{card.pedido}.html</span>
                <button onClick={() => setVerOrc(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', font: 'inherit', fontSize: 12 }}>Fechar visualização</button>
              </div>
              <iframe title="orçamento" srcDoc={html} style={{ width: '100%', height: 560, border: 'none', display: 'block', background: '#EEF1F4' }} />
            </div>
          )}
        </div>
      </div>

      {/* zoom de anexo */}
      {zoomImg && (
        <div onClick={() => setZoomImg(null)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(10,12,16,.82)', display: 'grid', placeItems: 'center', cursor: 'zoom-out', padding: 24 }}>
          <img src={zoomImg} style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: 10, boxShadow: 'var(--sh-4)' }} />
        </div>
      )}
    </div>,
    document.body,
  )
}
const secH4: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-subtle)', margin: '0 0 9px', fontWeight: 700 }

/* ---------- card do pedido-mãe (fileira horizontal) ---------- */
function PedidoCard({ p, cards, semDinheiro, onOpen }: { p: Pedido; cards: KCard[]; semDinheiro: boolean; onOpen: () => void }) {
  const tot = pedTotais(p)
  const entregues = cards.filter(c => c.station === 'entregue').length
  const done = p.status === 'entregue'
  return (
    <div onClick={onOpen} title="Abrir no Editor" style={{
      flex: '0 0 250px', cursor: 'pointer', borderRadius: 12, background: 'var(--bg-surface)', boxShadow: 'var(--sh-1)', padding: '12px 14px',
      border: '1px solid ' + (p.late ? 'color-mix(in srgb,var(--alert) 55%,transparent)' : 'var(--border)'),
      borderTop: '3px solid ' + (done ? 'var(--success)' : p.late ? 'var(--alert)' : 'var(--set-comercial)'),
      opacity: done ? .75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{p.pedido}</span>
        {done ? <Badge kind="success">entregue</Badge> : p.late ? <span style={alertChip}><Clock size={11} />ATRASADO</span> : null}
        <PencilLine size={13} style={{ marginLeft: 'auto', color: 'var(--text-subtle)' }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.cliente || '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: p.late ? 'var(--alert)' : undefined, fontWeight: p.late ? 600 : undefined }}><Calendar size={13} />{p.entrega || 'sem data'}</span>
        <span className="mono">{tot.pecas} pçs</span>
        {!semDinheiro && <span className="mono" style={{ fontWeight: 600, color: 'var(--text)' }}>R$ {money(tot.valor)}</span>}
      </div>
      {/* fatias por departamento: bolinha na cor da técnica + estação atual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {cards.map(c => {
          const st = STATIONS.find(s => s.id === c.station)
          const ok = c.station === 'entregue'
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: ok ? 'var(--success-fg)' : 'var(--text-muted)' }}>
              <i style={{ width: 8, height: 8, borderRadius: 99, background: cvar(TECNICAS[c.tec].cor), flex: '0 0 auto' }} />
              <b style={{ color: ok ? 'var(--success-fg)' : 'var(--text)' }}>{TECNICAS[c.tec].label}</b>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ok ? '✓ entregue' : '→ ' + (st?.nome ?? c.station)}</span>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'var(--bg-muted)', overflow: 'hidden' }}>
        <i style={{ display: 'block', height: '100%', width: (cards.length ? entregues / cards.length * 100 : 0) + '%', background: done ? 'var(--success)' : 'var(--set-comercial)', transition: 'width .25s' }} />
      </div>
    </div>
  )
}

/* ---------- coluna do kanban de produção ---------- */
function Column({ id, nome, lane, cards, onOpen }: { id: string; nome: string; lane: string; cards: KCard[]; onOpen: (pedido: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ flex: '0 0 262px', background: 'var(--bg-surface-2)', border: '1px solid ' + (isOver ? 'var(--primary)' : 'var(--border)'), borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: 640, outline: isOver ? '2px dashed var(--primary)' : 'none', outlineOffset: -3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)', borderTop: '3px solid ' + cvar(lane), borderRadius: '12px 12px 0 0' }}>
        {id === 'entregue' && <PackageCheck size={14} style={{ color: 'var(--text-muted)' }} />}
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em', flex: 1, color: 'var(--text)' }}>{nome}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-muted)', borderRadius: 999, padding: '1px 8px' }}>{cards.length}</span>
      </div>
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 40 }}>
        {cards.map(c => <Card key={c.id} card={c} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

/* ---------- card de departamento (fatia MARK42 do pedido) ---------- */
function Card({ card, onOpen }: { card: KCard; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id })
  const style: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)', padding: 14, boxShadow: 'var(--sh-1)', cursor: 'pointer', opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
    ...(card.late ? { borderLeft: '3px solid var(--alert)', background: 'linear-gradient(0deg,var(--alert-bg),var(--alert-bg)),var(--bg-surface)' } : {}),
  }
  /* clique simples abre o modal do cartão; arrastar (>5px) continua sendo drag */
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => onOpen(card.id)} title="Abrir cartão">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{card.pedido}</span>
        {card.late && <span style={alertChip}><Clock size={12} />ATRASADO</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{card.cliente}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <TecTag tec={card.tec} />
        {/* a fatia: quais layouts este departamento produz */}
        <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--info-fg)', background: 'var(--info-bg)', borderRadius: 999, padding: '2px 8px' }}>
          <Layers size={11} />{card.lays.join(' · ') || '—'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: card.late ? 'var(--alert)' : undefined, fontWeight: card.late ? 600 : undefined }}><Calendar size={13} />{card.prazo}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Paperclip size={13} />{card.lays.length || card.artes} arte(s)</span>
        <span className="mono" style={{ fontWeight: 600, color: 'var(--text)' }}>{card.pecas} pçs</span>
      </div>
    </div>
  )
}

const secHead: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, flexWrap: 'wrap' }
const secTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }
const alertChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, height: 23, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: 'var(--alert)', color: '#fff' }
