import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Plus, Clock, Calendar, Paperclip, Layers, PencilLine, PackageCheck } from 'lucide-react'
import { useApp } from '../store/useApp'
import { STATIONS, TECNICAS, money, entregaTs, pedTotais, type KCard, type Pedido } from '../store/model'
import { PageHead, Btn, TecTag, Badge, cvar } from '../components/ui'

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
            <Column key={st.id} id={st.id} nome={st.nome} lane={st.lane} cards={kcards.filter(c => c.station === st.id)} onOpen={abrirNoEditor} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

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
function Card({ card, onOpen }: { card: KCard; onOpen: (pedido: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id })
  const style: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)', padding: 14, boxShadow: 'var(--sh-1)', cursor: 'grab', opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
    ...(card.late ? { borderLeft: '3px solid var(--alert)', background: 'linear-gradient(0deg,var(--alert-bg),var(--alert-bg)),var(--bg-surface)' } : {}),
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span className="mono" onClick={e => { e.stopPropagation(); onOpen(card.pedido) }} onPointerDown={e => e.stopPropagation()} title="Abrir no Editor"
          style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'color-mix(in srgb,var(--text) 25%,transparent)', textUnderlineOffset: 3 }}>{card.pedido}</span>
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
