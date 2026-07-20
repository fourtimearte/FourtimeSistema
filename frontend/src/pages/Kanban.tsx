import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Plus, Clock, Calendar, Paperclip } from 'lucide-react'
import { useApp } from '../store/useApp'
import { STATIONS, TECNICAS, money, type KCard } from '../store/model'
import { PageHead, Btn, TecTag, cvar } from '../components/ui'

const LANES: [string, string][] = [
  ['DTF', '--set-dtf'], ['Sublimação', '--set-sublimacao'], ['Silk', '--set-silk'],
  ['Bordado/Patch', '--set-bordado'], ['Costura', '--set-costura'], ['Embalagem', '--set-embalagem'], ['Expedição', '--set-expedicao'],
]

export default function Kanban() {
  const { kcards, moveCard, goto, toast } = useApp()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const nLate = kcards.filter(c => c.late).length

  function onDragEnd(e: DragEndEvent) {
    const over = e.over?.id as string | undefined
    if (!over) return
    const card = kcards.find(c => c.id === e.active.id)
    if (!card || card.station === over) return
    moveCard(card.id, over)
    const st = STATIONS.find(s => s.id === over)
    toast(card.pedido + ' → ' + (st?.nome ?? over))
  }

  return (
    <div>
      <PageHead crumb="Produção · MES/PCP" title="Kanban de Produção"
        desc="Cada card é uma fatia de pedido por técnica. A rota foi gerada pelas tags de Design do orçamento aprovado — arraste os cards entre as estações. Atraso = contorno vermelho vazado."
        actions={<>
          {nLate > 0 && <span style={alertChip}><Clock size={12} />{nLate} atrasado(s)</span>}
          <Btn size="sm" onClick={() => goto('comercial')}><Plus size={16} />Novo pedido</Btn>
        </>} />
      <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
        Faixas: {LANES.map(([n, c]) => <span key={n} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#fff', background: cvar(c), borderRadius: 4, padding: '1px 6px' }}>{n}</span>)}
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
          {STATIONS.map(st => (
            <Column key={st.id} id={st.id} nome={st.nome} lane={st.lane} cards={kcards.filter(c => c.station === st.id)} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

function Column({ id, nome, lane, cards }: { id: string; nome: string; lane: string; cards: KCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ flex: '0 0 262px', background: 'var(--bg-surface-2)', border: '1px solid ' + (isOver ? 'var(--primary)' : 'var(--border)'), borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: 640, outline: isOver ? '2px dashed var(--primary)' : 'none', outlineOffset: -3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)', borderTop: '3px solid ' + cvar(lane), borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em', flex: 1, color: 'var(--text)' }}>{nome}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-muted)', borderRadius: 999, padding: '1px 8px' }}>{cards.length}</span>
      </div>
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 40 }}>
        {cards.map(c => <Card key={c.id} card={c} />)}
      </div>
    </div>
  )
}

function Card({ card }: { card: KCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id })
  const style: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)', padding: 20, boxShadow: 'var(--sh-1)', cursor: 'grab', opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
    ...(card.late ? { borderLeft: '3px solid var(--alert)', background: 'linear-gradient(0deg,var(--alert-bg),var(--alert-bg)),var(--bg-surface)' } : {}),
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{card.pedido}</span>
        {card.late && <span style={alertChip}><Clock size={12} />ATRASADO</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{card.cliente}</div>
      <TecTag tec={card.tec} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: card.late ? 'var(--alert)' : undefined, fontWeight: card.late ? 600 : undefined }}><Calendar size={13} />{card.prazo}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Paperclip size={13} />{card.artes} arte(s)</span>
        <span className="mono" style={{ fontWeight: 600, color: 'var(--text)' }}>R$ {money(card.val)}</span>
      </div>
    </div>
  )
}

const alertChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, height: 23, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: 'var(--alert)', color: '#fff' }
