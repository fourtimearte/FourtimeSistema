import { Wallet } from 'lucide-react'
import { useApp } from '../store/useApp'
import { pedTotais, money, moneyK } from '../store/model'
import { PageHead, Panel, Kpi, Badge, Btn, TableWrap } from '../components/ui'

export default function Financeiro() {
  const { pedidos, fin, registrarPagamento } = useApp()
  const aprovados = pedidos.filter(p => p.aprovado)
  const fat = aprovados.reduce((s, p) => s + pedTotais(p).valor, 0)
  let totRec = 0, totAberto = 0
  const rows = aprovados.map(p => {
    const t = pedTotais(p).valor; const sinal = fin[p.pedido]?.sinal ?? 0; const saldo = Math.max(0, t - sinal)
    totRec += sinal; totAberto += saldo
    return { p, t, sinal, saldo }
  })

  return (
    <div>
      <PageHead crumb="ERP" title="Financeiro"
        desc='Sinal e saldo de cada pedido. O valor vem do Editor — aqui ele fica consultável e "baixável". A entrega dispara a cobrança do saldo.' />

      <div className="kpis">
        <Kpi label="Recebido (sinais)" value={moneyK(totRec)} delta="entradas" />
        <Kpi label="A receber (saldo)" value={moneyK(totAberto)} delta="em aberto" color="var(--warning)" />
        <Kpi label="Faturamento aprovado" value={moneyK(fat)} delta="total" />
      </div>

      <Panel title="A receber por pedido" sub="sinal / saldo / status" icon={<Wallet size={17} />} flush>
        <TableWrap minWidth={760}>
          <thead>
            <tr>
              <th>Pedido</th><th>Cliente</th>
              <th className="num">Total</th><th className="num">Sinal</th><th className="num">Saldo</th>
              <th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, t, sinal, saldo }) => (
              <tr key={p.pedido}>
                <td className="mono">{p.pedido}</td>
                <td><b>{p.cliente}</b></td>
                <td className="num">R$ {money(t)}</td>
                <td className="num">R$ {money(sinal)}</td>
                <td className="num" style={saldo > 0 ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>R$ {money(saldo)}</td>
                <td>{saldo <= 0 ? <Badge kind="success">pago</Badge> : sinal > 0 ? <Badge kind="warning">parcial</Badge> : <Badge kind="danger">pendente</Badge>}</td>
                <td>{saldo > 0 ? <Btn size="sm" onClick={() => registrarPagamento(p.pedido)}><Wallet size={14} />Baixar</Btn> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </div>
  )
}
