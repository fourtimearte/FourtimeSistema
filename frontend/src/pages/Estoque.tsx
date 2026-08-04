import { useState } from 'react'
import { Plus, Box, Layers, Check, AlertTriangle } from 'lucide-react'
import { useApp } from '../store/useApp'
import { INSUMOS, REFERENCIAS, moneyK, layoutPecas } from '../store/model'
import { PageHead, Btn, Panel, Kpi, Badge, TableWrap } from '../components/ui'

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
    const pcs = layoutPecas(l)
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
      <PageHead crumb="ERP" title="Estoque + Separação"
        desc="Saldo de insumos e peças lisas, com alerta de mínimo. A Separação lê a BOM do pedido e mostra o que separar da prateleira antes de liberar a produção."
        actions={<Btn size="sm" variant="primary" onClick={() => toast('Entrada de compra (protótipo)')}><Plus size={16} />Entrada</Btn>} />

      <div className="kpis">
        <Kpi label="Itens críticos" value={String(critico)} delta="abaixo do mínimo" color="var(--warning)" />
        <Kpi label="Itens cadastrados" value={String(INSUMOS.length)} delta="insumos + aviamentos" />
        <Kpi label="Valor imobilizado" value={moneyK(imob)} delta="saldo × custo" />
      </div>

      <Panel title="Insumos & matéria-prima" sub="Entrada/saída manual · baixa automática pela BOM (horizonte)" icon={<Box size={17} />} flush>
        <TableWrap minWidth={720}>
          <thead>
            <tr>
              <th>Item</th><th>Tipo</th>
              <th className="num">Saldo</th><th className="num">Mínimo</th><th className="num">Custo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {INSUMOS.map(i => { const crit = i.saldo < i.minimo; return (
              <tr key={i.id}>
                <td><b>{i.nome}</b></td>
                <td>{i.tipo}</td>
                <td className="num" style={crit ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>{i.saldo} {i.un}</td>
                <td className="num">{i.minimo} {i.un}</td>
                <td className="num">R$ {i.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{crit
                  ? <span className="badge badge-alert"><AlertTriangle size={12} />no mínimo</span>
                  : <Badge kind="success">ok</Badge>}</td>
              </tr>
            ) })}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title="Separação de Items" sub="Escolha um pedido aprovado para separar os insumos da BOM" icon={<Layers size={17} />}
        right={
          <select className="input" style={{ minWidth: 220, width: 'auto' }} value={sepPd}
            onChange={e => { setSepPd(e.target.value); setDone({}) }}>
            <option value="">— pedido —</option>
            {aprovados.map(p => <option key={p.pedido} value={p.pedido}>{p.pedido} · {p.cliente}</option>)}
          </select>}>
        {!pedido ? <div className="emptybox">Selecione um pedido aprovado para ver a lista de separação.</div>
          : !needKeys.length ? <div className="emptybox">Este pedido usa referências sem BOM cadastrada.</div>
          : <>
            <div style={{ marginBottom: 10, fontSize: 'var(--fs-13)', color: 'var(--text-muted)' }}>
              Pedido <b className="mono" style={{ color: 'var(--text)' }}>{pedido.pedido}</b> · {pedido.cliente} — clique para separar cada item:
            </div>
            {needKeys.map(k => {
              const ins = INSUMOS.find(x => x.id === k)!; const n = needs[k]
              const falta = ins.saldo < n.qtd; const isDone = !!done[k]
              return (
                <div key={k} className={'listrow click' + (isDone ? ' done' : '')} onClick={() => setDone(d => ({ ...d, [k]: !d[k] }))}>
                  <span className="chk"><Check size={12} /></span>
                  <span className="lbl">{ins.nome}</span>
                  <span className={'qt' + (falta ? ' falta' : '')}>precisa {Math.round(n.qtd * 100) / 100} {n.un}</span>
                  <span className="qt right">saldo {ins.saldo} {ins.un}</span>
                </div>
              )
            })}
            <div style={{ marginTop: 12 }}>
              <Btn variant="primary" size="sm" onClick={concluir}><Check size={14} />Concluir separação → liberar produção</Btn>
            </div>
          </>}
      </Panel>
    </div>
  )
}
