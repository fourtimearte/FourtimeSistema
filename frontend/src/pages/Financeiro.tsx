import { Wallet } from 'lucide-react'
import { useApp } from '../store/useApp'
import { pedTotais, money, moneyK } from '../store/model'
import { PageHead, Panel, Kpi, kpiGrid, Badge, Btn, thStyle, tdStyle } from '../components/ui'

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
      <PageHead crumb="Gestão · ERP" title="Financeiro"
        desc='Sinal e saldo de cada pedido. O valor vem do Editor — aqui ele fica consultável e "baixável". A entrega dispara a cobrança do saldo.' />
      <div style={kpiGrid}>
        <Kpi label="Recebido (sinais)" value={moneyK(totRec)} delta="entradas" />
        <Kpi label="A receber (saldo)" value={moneyK(totAberto)} delta="em aberto" color="var(--warning)" />
        <Kpi label="Faturamento aprovado" value={moneyK(fat)} delta="total" />
      </div>
      <Panel title="A receber por pedido" sub="sinal / saldo / status" icon={<Wallet size={17} />}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Pedido', 'Cliente', 'Total', 'Sinal', 'Saldo', 'Status', ''].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(({ p, t, sinal, saldo }) => (
                <tr key={p.pedido}>
                  <td className="mono" style={tdStyle}>{p.pedido}</td>
                  <td style={tdStyle}><b>{p.cliente}</b></td>
                  <td className="mono" style={tdStyle}>R$ {money(t)}</td>
                  <td className="mono" style={tdStyle}>R$ {money(sinal)}</td>
                  <td className="mono" style={{ ...tdStyle, color: saldo > 0 ? 'var(--danger)' : undefined, fontWeight: saldo > 0 ? 600 : undefined }}>R$ {money(saldo)}</td>
                  <td style={tdStyle}>{saldo <= 0 ? <Badge kind="success">pago</Badge> : sinal > 0 ? <Badge kind="warning">parcial</Badge> : <Badge kind="danger">pendente</Badge>}</td>
                  <td style={tdStyle}>{saldo > 0 ? <Btn size="sm" onClick={() => registrarPagamento(p.pedido)}><Wallet size={14} />Baixar</Btn> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
