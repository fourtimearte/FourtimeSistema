import { useState } from 'react'
import { Plus, Box, Layers, Check, AlertTriangle } from 'lucide-react'
import { useApp } from '../store/useApp'
import { INSUMOS, REFERENCIAS, moneyK } from '../store/model'
import { PageHead, Btn, Panel, Kpi, kpiGrid, Badge, thStyle, tdStyle } from '../components/ui'

export default function Estoque() {
  const { pedidos, toast } = useApp()
  const critico = INSUMOS.filter(i => i.saldo < i.minimo).length
  const imob = INSUMOS.reduce((s, i) => s + i.saldo * i.custo, 0)
  const aprovados = pedidos.filter(p => p.aprovado)

  const [sepPd, setSepPd] = useState('')
  const [done, setDone] = useState<Record<number, boolean>>({})

  const pedido = aprovados.find(p => p.pedido === sepPd)
  const needs: Record<number, { qtd: number; un: string }> = {}
  if (pedido) pedido.layouts.forEach(l => {
    const r = REFERENCIAS.find(x => x.cod === l.refCod); if (!r) return
    const pcs = l.tamanhos.reduce((s, t) => s + t.qtd, 0)
    r.bom.forEach(b => { if (!needs[b.insumoId]) needs[b.insumoId] = { qtd: 0, un: b.un }; needs[b.insumoId].qtd += b.qtd * pcs })
  })
  const needKeys = Object.keys(needs).map(Number)

  function concluir() {
    const allDone = needKeys.every(k => done[k])
    if (!allDone) { toast('Faltam ' + needKeys.filter(k => !done[k]).length + ' item(ns) para separar'); return }
    toast(pedido!.pedido + ' liberado para a produção')
  }

  return (
    <div>
      <PageHead crumb="Materiais · ERP" title="Estoque + Separação"
        desc="Saldo de insumos e peças lisas, com alerta de mínimo. A Separação lê a BOM do pedido e mostra o que separar da prateleira antes de liberar a produção."
        actions={<Btn size="sm" variant="primary" onClick={() => toast('Entrada de compra (protótipo)')}><Plus size={16} />Entrada</Btn>} />
      <div style={kpiGrid}>
        <Kpi label="Itens críticos" value={String(critico)} delta="abaixo do mínimo" color="var(--warning)" />
        <Kpi label="Itens cadastrados" value={String(INSUMOS.length)} delta="insumos + aviamentos" />
        <Kpi label="Valor imobilizado" value={moneyK(imob)} delta="saldo × custo" />
      </div>

      <Panel title="Insumos & matéria-prima" sub="Entrada/saída manual · baixa automática pela BOM (horizonte)" icon={<Box size={17} />}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Item', 'Tipo', 'Saldo', 'Mínimo', 'Custo', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {INSUMOS.map(i => { const crit = i.saldo < i.minimo; return (
                <tr key={i.id}>
                  <td style={tdStyle}><b>{i.nome}</b></td>
                  <td style={tdStyle}>{i.tipo}</td>
                  <td className="mono" style={{ ...tdStyle, color: crit ? 'var(--danger)' : undefined, fontWeight: crit ? 600 : undefined }}>{i.saldo} {i.un}</td>
                  <td className="mono" style={tdStyle}>{i.minimo} {i.un}</td>
                  <td className="mono" style={tdStyle}>R$ {i.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={tdStyle}>{crit ? <span style={alertOutline}><AlertTriangle size={12} />no mínimo</span> : <Badge kind="success">ok</Badge>}</td>
                </tr>
              ) })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Separação de Items" sub="Escolha um pedido aprovado para separar os insumos da BOM" icon={<Layers size={17} />}
        right={<select value={sepPd} onChange={e => { setSepPd(e.target.value); setDone({}) }} style={selStyle}>
          <option value="">— pedido —</option>
          {aprovados.map(p => <option key={p.pedido} value={p.pedido}>{p.pedido} · {p.cliente}</option>)}
        </select>}>
        {!pedido ? <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: 12, textAlign: 'center' }}>Selecione um pedido aprovado para ver a lista de separação.</div>
          : !needKeys.length ? <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: 12, textAlign: 'center' }}>Este pedido usa referências sem BOM cadastrada.</div>
          : <>
            <div style={{ marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>Pedido <b className="mono" style={{ color: 'var(--text)' }}>{pedido.pedido}</b> · {pedido.cliente} — clique para separar cada item:</div>
            {needKeys.map(k => { const ins = INSUMOS.find(x => x.id === k)!; const n = needs[k]; const falta = ins.saldo < n.qtd; const isDone = !!done[k]
              return (
                <div key={k} onClick={() => setDone(d => ({ ...d, [k]: !d[k] }))} style={{ ...sepRow, cursor: 'pointer' }}>
                  <span style={{ ...chk, background: isDone ? 'var(--success)' : 'transparent', borderColor: isDone ? 'var(--success)' : 'var(--border-strong)', color: isDone ? '#fff' : 'transparent' }}><Check size={12} /></span>
                  <span style={{ flex: 1, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : 'var(--text)' }}>{ins.nome}</span>
                  <span className="mono" style={{ fontSize: 12, color: falta ? 'var(--danger)' : 'var(--text-muted)', fontWeight: falta ? 700 : 400 }}>precisa {Math.round(n.qtd * 100) / 100} {n.un}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80, textAlign: 'right' }}>saldo {ins.saldo} {ins.un}</span>
                </div>
              )
            })}
            <div style={{ marginTop: 12 }}><Btn variant="primary" size="sm" onClick={concluir}><Check size={14} />Concluir separação → liberar produção</Btn></div>
          </>}
      </Panel>
    </div>
  )
}
const selStyle: React.CSSProperties = { height: 36, padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 13, minWidth: 220 }
const sepRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 7, background: 'var(--bg-surface)' }
const chk: React.CSSProperties = { width: 20, height: 20, borderRadius: 6, border: '2px solid var(--border-strong)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const alertOutline: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, height: 23, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: 'transparent', color: 'var(--alert)', border: '1.5px solid var(--alert)' }
