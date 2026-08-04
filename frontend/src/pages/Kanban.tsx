import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Plus, Clock, Calendar, Paperclip, Layers, PencilLine, PackageCheck, X, FileText, PencilRuler, MapPin } from 'lucide-react'
import { useApp } from '../store/useApp'
import { STATIONS, TECNICAS, money, entregaTs, pedTotais, ordemTamanhos, generoClasse, type KCard, type Pedido, type Layout } from '../store/model'
import { PageHead, Btn, TecTag, Badge, cvar } from '../components/ui'
import { exportarHtml } from '../lib/exportHtml'

/* =====================================================================
   Produção — 2 kanbans na mesma página (PESQUISA §8 + MARK42):
   1) FILA DE PEDIDOS (topo): pedidos aprovados em ordem de entrega.
      Clique abre o modal do pedido com TODOS os módulos de layout;
      clicar num módulo localiza a fatia no kanban de departamentos.
   2) KANBAN DE PRODUÇÃO (abaixo): o pedido aprovado se DIVIDE pelas tags
      de Design dos layouts e vira vários pedidos de departamento. O modal
      do cartão (estilo Trello) traz os módulos de layout DA FATIA, anexos
      e o orçamento HTML embutido (clique no título nome · PD#).
   ===================================================================== */

const LANES: [string, string][] = [
  ['DTF', '--set-dtf'], ['Sublimação', '--set-sublimacao'], ['Silk', '--set-silk'],
  ['Bordado/Patch', '--set-bordado'], ['Costura', '--set-costura'], ['Embalagem', '--set-embalagem'], ['Expedição', '--set-expedicao'],
]

export default function Kanban() {
  const { pedidos, kcards, moveCard, goto, abrirNoEditor, semDinheiro, toast } = useApp()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const nLate = useMemo(() => kcards.filter(c => c.late).length, [kcards])
  const [selCardId, setSelCardId] = useState<string | null>(null)
  const [selPed, setSelPed] = useState<string | null>(null)
  const [hlIds, setHlIds] = useState<string[]>([])
  const selCard = kcards.find(c => c.id === selCardId) ?? null
  const selPedido = pedidos.find(p => p.pedido === selPed) ?? null
  const hlSet = useMemo(() => new Set(hlIds), [hlIds])

  /* agrupa os cards por estação UMA vez (em vez de filtrar 21× por render) */
  const cardsByStation = useMemo(() => {
    const m: Record<string, KCard[]> = {}
    for (const st of STATIONS) m[st.id] = []
    for (const c of kcards) (m[c.station] ?? (m[c.station] = [])).push(c)
    return m
  }, [kcards])
  /* cards por pedido (para os cartões da fila) */
  const cardsByPedido = useMemo(() => {
    const m: Record<string, KCard[]> = {}
    for (const c of kcards) (m[c.pedido] ?? (m[c.pedido] = [])).push(c)
    return m
  }, [kcards])

  /* pedidos aprovados em ordem de entrega (mais urgente primeiro) */
  const fila = useMemo(() => pedidos.filter(p => p.aprovado).sort((a, b) => entregaTs(a.entrega) - entregaTs(b.entrega)), [pedidos])

  function onDragEnd(e: DragEndEvent) {
    const over = e.over?.id as string | undefined
    if (!over) return
    const card = kcards.find(c => c.id === e.active.id)
    if (!card || card.station === over) return
    moveCard(card.id, over)
    const st = STATIONS.find(s => s.id === over)
    toast(card.pedido + ' · ' + TECNICAS[card.tec].label + ' → ' + (st?.nome ?? over))
  }

  /* clique num módulo do modal do pedido → localiza a(s) fatia(s) daquele
     layout no kanban de departamentos (destaca e rola até o card) */
  function localizar(pedido: string, layIdx: number) {
    const lay = 'L-' + String(layIdx + 1).padStart(2, '0')
    const alvo = kcards.filter(c => c.pedido === pedido && c.lays.includes(lay))
    if (!alvo.length) { toast('Este layout ainda não está no kanban (pedido não roteado)'); return }
    setSelPed(null)
    setHlIds(alvo.map(c => c.id))
    setTimeout(() => document.getElementById('kcard-' + alvo[0].id)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' }), 60)
    setTimeout(() => setHlIds([]), 3200)
    const nomes = alvo.map(c => TECNICAS[c.tec].label + ' → ' + (STATIONS.find(s => s.id === c.station)?.nome ?? c.station)).join(' · ')
    toast(lay + ' está em: ' + nomes)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* topo fixo: título + fila de pedidos + cabeçalho dos departamentos */}
      <div style={{ flex: '0 0 auto', padding: '24px 32px 0', minWidth: 0 }}>
        <PageHead crumb="MES" title="Produção"
          desc="No topo, a fila de pedidos em ordem de entrega. Abaixo, o pedido aprovado se divide pelas tags de Design e vira um card por departamento — arraste entre as estações."
          actions={<>
            {nLate > 0 && <span className="alertchip"><Clock size={12} />{nLate} atrasado(s)</span>}
            <Btn size="sm" onClick={() => goto('comercial')}><Plus size={16} />Novo pedido</Btn>
          </>} />

        {/* ============ 1 · FILA DE PEDIDOS (fileira horizontal) ============ */}
        <div style={{ marginBottom: 18 }}>
          <div className="sechead">
            <span className="sectitle">Fila de pedidos</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ordem de entrega · {fila.length} pedido(s) · clique abre os módulos do pedido</span>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 10 }}>
            {fila.map(p => <PedidoCard key={p.pedido} p={p} cards={cardsByPedido[p.pedido] ?? EMPTY} semDinheiro={semDinheiro} onOpen={setSelPed} />)}
            {!fila.length && <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: '18px 4px' }}>Nenhum pedido aprovado ainda — aprove um orçamento no Editor para ele entrar na fila.</div>}
          </div>
        </div>

        {/* ============ 2 · KANBAN DE PRODUÇÃO (por departamento) ============ */}
        <div className="sechead">
          <span className="sectitle">Departamentos</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            Faixas: {LANES.map(([n, c]) => <span key={n} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#fff', background: cvar(c), borderRadius: 4, padding: '1px 6px' }}>{n}</span>)}
          </span>
        </div>
      </div>

      {/* board: ocupa toda a largura e altura restante (estilo Trello) */}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', gap: 14, overflowX: 'auto', overflowY: 'hidden', padding: '0 32px 20px', alignItems: 'stretch' }}>
          {STATIONS.map(st => (
            <Column key={st.id} id={st.id} nome={st.nome} lane={st.lane} cards={cardsByStation[st.id] ?? EMPTY} hlSet={hlSet} onOpen={setSelCardId} />
          ))}
        </div>
      </DndContext>

      {selCard && <CardModal card={selCard} pedido={pedidos.find(p => p.pedido === selCard.pedido) ?? null}
        onClose={() => setSelCardId(null)}
        onMove={st => moveCard(selCard.id, st)}
        onEditor={() => { setSelCardId(null); abrirNoEditor(selCard.pedido) }} />}

      {selPedido && <PedidoModal p={selPedido} cards={kcards.filter(c => c.pedido === selPedido.pedido)}
        onClose={() => setSelPed(null)}
        onLocate={i => localizar(selPedido.pedido, i)}
        onEditor={() => { setSelPed(null); abrirNoEditor(selPedido.pedido) }} />}
    </div>
  )
}

/* =====================================================================
   Módulo de layout (leitura) — o MESMO padrão visual do módulo do Editor
   na versão sem dinheiro: L-NN, referência (tingida por gênero), imagem,
   tabela Tam/Qtd com Total, e a coluna Tecido / Cor / Design / Obs.
   É a unidade em que o pedido se divide para os kanbans.
   ===================================================================== */
function LayoutModule({ l, idx, destaque, rodape, onClick }: {
  l: Layout; idx: number; destaque?: string; rodape?: React.ReactNode; onClick?: () => void
}) {
  const linhas = ordemTamanhos(l)
  const qtdTot = linhas.reduce((s, t) => s + (l.tamanhos[t]?.qtd ?? 0), 0)
  const gen = generoClasse(l.genero)
  return (
    <div onClick={onClick} className={'lmod' + (onClick ? ' click' : '')}
      style={destaque ? { ['--acc-b' as string]: 'color-mix(in srgb,' + destaque + ' 45%,transparent)' } : undefined}>
      {/* cabeçalho: L-NN + referência (tinta de gênero, como no Editor) */}
      <div className="lmod-head">
        <span className="lmod-n">L-{String(idx + 1).padStart(2, '0')}</span>
        <span className={'lmod-ref cb-ctrl' + (gen ? ' ' + gen : '')}>{l.ref || '—'}</span>
      </div>
      {/* corpo no mesmo grid do Editor: imagem · tabela · coluna direita */}
      <div className="lmod-grid">
        {l.img
          ? <img src={l.img} />
          : <div className="lmod-noimg">sem imagem</div>}
        <table className="qtd">
          <thead><tr><th>Tam</th><th>Qtd</th></tr></thead>
          <tbody>
            {linhas.map(t => (
              <tr key={t}>
                <td className="tam">{t}</td>
                <td>{l.tamanhos[t]?.qtd || ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td className="tam">Total</td><td>{qtdTot}</td></tr></tfoot>
        </table>
        <div className="lmod-side">
          <div className="databox"><span className="microlbl">Tecido</span><span className="v">{l.tecidos.filter(Boolean).join(' · ') || '—'}</span></div>
          <div className="databox"><span className="microlbl">Cor</span><span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 4, border: '1px solid var(--border-strong)', background: l.corHex, display: 'inline-block', flex: '0 0 auto' }} />{l.cor || '—'}</span></div>
          <div className="databox">
            <span className="microlbl">Design</span>
            <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
              {l.design.map(d => (
                <span key={d.tag} className="tectag-mini" style={{ background: cvar(TECNICAS[d.tag].cor) }}>
                  {TECNICAS[d.tag].label}{d.cores.length ? ' ' + d.cores.join(',') : ''}
                </span>
              ))}
            </span>
          </div>
          {l.obs ? <div className="databox stack"><div style={{ fontSize: 'var(--fs-11)', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: l.obs }} /></div>
            : <div className="databox ph">Observações da peça…</div>}
        </div>
      </div>
      {rodape}
    </div>
  )
}

/* =====================================================================
   Orçamento em TELA CHEIA — o documento HTML do pedido ocupa toda a tela
   (não um box lateral). Barra fina no topo + iframe preenchendo o resto.
   ===================================================================== */
function OrcPanel({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  const html = useMemo(() => exportarHtml(pedido), [pedido])
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <FileText size={16} style={{ color: 'var(--set-comercial)' }} />
        <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{(pedido.cliente || 'Orçamento')} · {pedido.pedido}.html</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>versão HTML — sem valores</span>
        <button className="btn" onClick={onClose} style={{ marginLeft: 'auto' }}><X size={15} />Fechar</button>
      </div>
      <iframe title="orçamento" srcDoc={html} style={{ flex: 1, width: '100%', border: 'none', display: 'block', background: '#EEF1F4' }} />
    </div>,
    document.body,
  )
}

/* =====================================================================
   Modal do cartão de departamento (estilo Trello): título nome · PD#
   clicável abre o orçamento (painel lateral); Mover no cabeçalho;
   módulos DA FATIA. Ocupa boa parte da tela.
   ===================================================================== */
function CardModal({ card, pedido, onClose, onMove, onEditor }: {
  card: KCard; pedido: Pedido | null; onClose: () => void; onMove: (station: string) => void; onEditor: () => void
}) {
  const [verOrc, setVerOrc] = useState(false)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const cor = cvar(TECNICAS[card.tec].cor)
  /* a fatia: índices dos layouts que este departamento produz (L-01 → 0) */
  const fatiaIdx = card.lays.map(l => parseInt(l.slice(2), 10) - 1)
  const anexos = (pedido?.layouts ?? []).map((l, i) => ({ l, i, daFatia: fatiaIdx.includes(i) })).filter(a => a.l.img)

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: '2.5vh 2vw' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,17,22,.55)' }} />
      <div style={{ position: 'relative', width: 'min(1180px,96vw)', height: '95vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '4px solid ' + cor, borderRadius: 12, boxShadow: 'var(--sh-4)', overflow: 'hidden' }}>
        {/* cabeçalho: título clicável (abre orçamento) + Mover para + fechar */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setVerOrc(true)} title="Abrir o orçamento (versão HTML) na lateral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--text)' }}>
                <FileText size={15} style={{ color: 'var(--set-comercial)' }} />
                <span style={{ fontWeight: 700, fontSize: 15, textDecoration: 'underline', textDecorationColor: 'color-mix(in srgb,var(--set-comercial) 45%,transparent)', textUnderlineOffset: 3 }}>
                  {(card.cliente || 'Orçamento')} <span className="mono">· {card.pedido}</span>
                </span>
              </button>
              <TecTag tec={card.tec} />
              <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--info-fg)', background: 'var(--info-bg)', borderRadius: 999, padding: '2px 8px' }}><Layers size={11} />{card.lays.join(' · ') || '—'}</span>
              {card.late && <span className="alertchip"><Clock size={12} />ATRASADO</span>}
            </div>
            {/* sticky header enxuto: nome, número, vendedor, entrega */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-muted)', marginTop: 5, flexWrap: 'wrap' }}>
              <span><span className="microlbl">Vendedor</span> <b style={{ color: 'var(--text)' }}>{pedido?.vendedor || '—'}</b></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: card.late ? 'var(--alert)' : undefined }}><Calendar size={13} /><span className="microlbl">Entrega</span> <b style={{ color: card.late ? 'var(--alert)' : 'var(--text)' }}>{card.prazo || 'sem data'}</b></span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
            <span className="microlbl">Mover</span>
            <select className="input sm" value={card.station} onChange={e => onMove(e.target.value)} title="Mover para"
              style={{ maxWidth: 200 }}>
              {STATIONS.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <button className="iconbtn sm" onClick={onClose} title="Fechar"><X size={15} /></button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
          {/* CABEÇALHO DO ORÇAMENTO (acima dos layouts; some ao rolar — o topo
              fixo do modal continua mostrando nome, número, vendedor, entrega) */}
          {pedido && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, background: 'var(--bg-surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{pedido.cliente || 'Orçamento'}</span>
                <span className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>· {pedido.pedido}</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{pedTotais(pedido).pecas} pçs · {pedido.layouts.length} layouts</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '8px 16px' }}>
                {([['Cliente', pedido.cliente], ['CPF/CNPJ', pedido.cpf], ['Departamento', pedido.depto], ['Vendedor', pedido.vendedor], ['Contato', pedido.contato], ['Embalagem', pedido.embalagem], ['Entrega', pedido.entrega], ['Envio', pedido.envio], ['Pagamento', pedido.pagamento]] as [string, string][]).map(([k, v]) => (
                  <div key={k}><div className="microlbl block">{k}</div><div style={{ fontSize: 12, fontWeight: 500 }}>{v || '—'}</div></div>
                ))}
              </div>
            </div>
          )}

          {/* anexos */}
          <h4 className="sech4"><Paperclip size={13} />Anexos ({anexos.length})</h4>
          {anexos.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 18 }}>
              {anexos.map(a => (
                <div key={a.i} onClick={() => setZoomImg(a.l.img)} style={{ cursor: 'zoom-in', border: '1px solid ' + (a.daFatia ? 'color-mix(in srgb,' + cor + ' 55%,transparent)' : 'var(--border)'), borderRadius: 10, overflow: 'hidden', background: 'var(--bg-surface-2)' }}>
                  <img src={a.l.img as string} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '5px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="mono" style={{ fontWeight: 700 }}>L-{String(a.i + 1).padStart(2, '0')}</span>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.l.ref}</span>
                    {a.daFatia && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: 99, background: cor, flex: '0 0 auto' }} title="layout desta fatia" />}
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: 'var(--text-subtle)', fontSize: 13, marginBottom: 18 }}>Nenhuma imagem anexada nos layouts deste pedido.</div>}

          {/* a DIVISÃO do pedido: módulos de layout desta fatia */}
          <h4 className="sech4"><Layers size={13} />Módulos de layout desta fatia ({fatiaIdx.length}) — {TECNICAS[card.tec].label}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {fatiaIdx.map(i => pedido?.layouts[i] && (
              <LayoutModule key={i} l={pedido.layouts[i]} idx={i} destaque={cor} />
            ))}
            {!fatiaIdx.length && <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Nenhum layout nesta fatia.</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn size="sm" onClick={onEditor}><PencilRuler size={14} />Editar no Editor</Btn>
          </div>
        </div>
      </div>

      {/* zoom de anexo */}
      {zoomImg && (
        <div onClick={() => setZoomImg(null)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(10,12,16,.82)', display: 'grid', placeItems: 'center', cursor: 'zoom-out', padding: 24 }}>
          <img src={zoomImg} style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: 10, boxShadow: 'var(--sh-4)' }} />
        </div>
      )}
      {verOrc && pedido && <OrcPanel pedido={pedido} onClose={() => setVerOrc(false)} />}
    </div>,
    document.body,
  )
}

/* =====================================================================
   Modal do pedido (fila): TODOS os módulos de layout, do primeiro ao
   último. Clicar num módulo localiza a fatia no kanban de departamentos.
   ===================================================================== */
function PedidoModal({ p, cards, onClose, onLocate, onEditor }: {
  p: Pedido; cards: KCard[]; onClose: () => void; onLocate: (layIdx: number) => void; onEditor: () => void
}) {
  const tot = pedTotais(p)
  const [verOrc, setVerOrc] = useState(false)
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: '2.5vh 2vw' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,17,22,.55)' }} />
      <div style={{ position: 'relative', width: 'min(1120px,96vw)', height: '95vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '4px solid ' + (p.late ? 'var(--alert)' : 'var(--set-comercial)'), borderRadius: 12, boxShadow: 'var(--sh-4)', overflow: 'hidden' }}>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setVerOrc(true)} title="Abrir o orçamento (versão HTML) na lateral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--text)' }}>
                <FileText size={15} style={{ color: 'var(--set-comercial)' }} />
                <span style={{ fontWeight: 700, fontSize: 15, textDecoration: 'underline', textDecorationColor: 'color-mix(in srgb,var(--set-comercial) 45%,transparent)', textUnderlineOffset: 3 }}>{p.cliente || 'Orçamento'} <span className="mono">· {p.pedido}</span></span>
              </button>
              {p.status === 'entregue' ? <Badge kind="success">entregue</Badge> : p.late ? <span className="alertchip"><Clock size={12} />ATRASADO</span> : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 5, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={13} />{p.entrega || 'sem data'}</span>
              <span className="mono">{tot.pecas} pçs · {p.layouts.length} layout(s)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
            <Btn size="sm" onClick={onEditor}><PencilRuler size={14} />Editor</Btn>
            <button className="iconbtn sm" onClick={onClose} title="Fechar"><X size={15} /></button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
          <h4 className="sech4"><Layers size={13} />Módulos de layout ({p.layouts.length}) — clique para localizar no kanban de departamentos</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {p.layouts.map((l, i) => {
              const lay = 'L-' + String(i + 1).padStart(2, '0')
              const fatias = cards.filter(c => c.lays.includes(lay))
              const corDest = fatias.length === 1 ? cvar(TECNICAS[fatias[0].tec].cor) : undefined
              return (
                <LayoutModule key={i} l={l} idx={i} destaque={corDest} onClick={() => onLocate(i)}
                  rodape={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 9, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                      <MapPin size={12} style={{ color: 'var(--text-subtle)' }} />
                      {fatias.length ? fatias.map(c => {
                        const ok = c.station === 'entregue'
                        return (
                          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: ok ? 'var(--success-fg)' : 'var(--text-muted)' }}>
                            <i style={{ width: 7, height: 7, borderRadius: 99, background: cvar(TECNICAS[c.tec].cor) }} />
                            <b style={{ color: ok ? 'var(--success-fg)' : 'var(--text)' }}>{TECNICAS[c.tec].label}</b>
                            {ok ? '✓ entregue' : '→ ' + (STATIONS.find(s => s.id === c.station)?.nome ?? c.station)}
                          </span>
                        )
                      }) : <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>ainda sem fatia no kanban</span>}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--set-comercial)', fontWeight: 600 }}>localizar →</span>
                    </div>
                  } />
              )
            })}
          </div>
        </div>
      </div>
      {verOrc && <OrcPanel pedido={p} onClose={() => setVerOrc(false)} />}
    </div>,
    document.body,
  )
}

/* ---------- card do pedido-mãe (fileira horizontal) ---------- */
const PedidoCard = memo(function PedidoCard({ p, cards, semDinheiro, onOpen }: { p: Pedido; cards: KCard[]; semDinheiro: boolean; onOpen: (pedido: string) => void }) {
  const tot = pedTotais(p)
  const entregues = cards.filter(c => c.station === 'entregue').length
  const done = p.status === 'entregue'
  return (
    <div onClick={() => onOpen(p.pedido)} title="Abrir os módulos do pedido" style={{
      flex: '0 0 250px', cursor: 'pointer', borderRadius: 12, background: 'var(--bg-surface)', boxShadow: 'var(--sh-1)', padding: '12px 14px',
      border: '1px solid ' + (p.late ? 'color-mix(in srgb,var(--alert) 55%,transparent)' : 'var(--border)'),
      borderTop: '3px solid ' + (done ? 'var(--success)' : p.late ? 'var(--alert)' : 'var(--set-comercial)'),
      opacity: done ? .75 : 1,
      contentVisibility: 'auto', containIntrinsicSize: '250px 170px',
    } as React.CSSProperties}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{p.pedido}</span>
        {done ? <Badge kind="success">entregue</Badge> : p.late ? <span className="alertchip"><Clock size={11} />ATRASADO</span> : null}
        <Layers size={13} style={{ marginLeft: 'auto', color: 'var(--text-subtle)' }} />
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
})

/* ---------- coluna do kanban de produção (memo: só re-renderiza quando os
   cards da coluna ou o conjunto de destaque mudam) ---------- */
const Column = memo(function Column({ id, nome, lane, cards, hlSet, onOpen }: { id: string; nome: string; lane: string; cards: KCard[]; hlSet: Set<string>; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ flex: '0 0 262px', height: '100%', background: 'var(--bg-surface-2)', border: '1px solid ' + (isOver ? 'var(--primary)' : 'var(--border)'), borderRadius: 12, display: 'flex', flexDirection: 'column', minHeight: 0, outline: isOver ? '2px dashed var(--primary)' : 'none', outlineOffset: -3 }}>
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)', borderTop: '3px solid ' + cvar(lane), borderRadius: '12px 12px 0 0' }}>
        {id === 'entregue' && <PackageCheck size={14} style={{ color: 'var(--text-muted)' }} />}
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em', flex: 1, color: 'var(--text)' }}>{nome}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-muted)', borderRadius: 999, padding: '1px 8px' }}>{cards.length}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 8, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {cards.map(c => <Card key={c.id} card={c} hl={hlSet.has(c.id)} onOpen={onOpen} />)}
      </div>
    </div>
  )
})

/* ---------- card de departamento (fatia MARK42 do pedido) ---------- */
const Card = memo(function Card({ card, hl, onOpen }: { card: KCard; hl: boolean; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id })
  const style: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)', padding: 14, boxShadow: 'var(--sh-1)', cursor: 'pointer', opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
    /* o navegador pula layout/paint dos cards fora da tela (virtualização
       nativa) — grande ganho no 1º paint com muitos cards. Ao arrastar,
       desliga p/ não recortar o card em voo. */
    ...(isDragging ? {} : { contentVisibility: 'auto', containIntrinsicSize: '0 118px' } as React.CSSProperties),
    ...(card.late ? { borderLeft: '3px solid var(--alert)', background: 'linear-gradient(0deg,var(--alert-bg),var(--alert-bg)),var(--bg-surface)' } : {}),
    ...(hl ? { outline: '3px solid var(--primary)', outlineOffset: 2, boxShadow: '0 0 0 6px color-mix(in srgb,var(--primary) 22%,transparent)' } : {}),
  }
  /* clique simples abre o modal do cartão; arrastar (>5px) continua sendo drag */
  return (
    <div ref={setNodeRef} id={'kcard-' + card.id} style={style} {...listeners} {...attributes} onClick={() => onOpen(card.id)} title="Abrir cartão">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{card.pedido}</span>
        {card.late && <span className="alertchip"><Clock size={12} />ATRASADO</span>}
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
})

const EMPTY: KCard[] = []
