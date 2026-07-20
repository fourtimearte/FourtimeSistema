import { Plus, BarChart3 } from 'lucide-react'
import { useApp } from '../store/useApp'
import { INSUMOS, pedTotais, moneyK } from '../store/model'
import { PageHead, Btn, Kpi, kpiGrid } from '../components/ui'

export default function Dashboard() {
  const { pedidos, kcards, goto, toast } = useApp()
  const emProducao = new Set(kcards.filter(c => c.station !== 'entregue').map(c => c.pedido)).size
  const atrasados = pedidos.filter(p => p.aprovado && p.late).length
  const fat = pedidos.filter(p => p.aprovado).reduce((s, p) => s + pedTotais(p).valor, 0)
  const critico = INSUMOS.filter(i => i.saldo < i.minimo).length

  return (
    <div>
      <PageHead crumb="Início" title="Dashboard"
        desc="Visão geral da fábrica — pedidos, produção e materiais. Cada indicador leva à página de origem."
        actions={<>
          <Btn size="sm" onClick={() => toast('Filtro de período (protótipo)')}><BarChart3 size={16} />Período</Btn>
          <Btn size="sm" variant="primary" onClick={() => goto('comercial')}><Plus size={16} />Novo orçamento</Btn>
        </>} />
      <div style={kpiGrid}>
        <Kpi label="Pedidos em produção" value={String(emProducao)} delta="▲ fluxo ativo" bar={62} onClick={() => goto('producao')} />
        <Kpi label="Atrasados" value={String(atrasados)} delta="prazo estourado" color="var(--danger)" bar={22} onClick={() => goto('producao')} />
        <Kpi label="Faturamento (aprovados)" value={moneyK(fat)} delta="▲ 12%" bar={74} onClick={() => goto('financeiro')} />
        <Kpi label="Estoque crítico" value={String(critico)} delta="itens no mínimo" color="var(--warning)" bar={30} onClick={() => goto('estoque')} />
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16 }}>Pedidos recentes</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Fase 1 (React) — o painel "Novos trabalhos" por departamento entra na Fase 2 com Recharts e cards de setor.</div>
        </div>
        <div style={{ padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Pedido', 'Cliente', 'Status', 'Peças', 'Valor'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {pedidos.map(p => { const t = pedTotais(p); return (
                <tr key={p.pedido} style={{ cursor: 'pointer' }} onClick={() => goto('comercial')}>
                  <td className="mono" style={td}>{p.pedido}</td>
                  <td style={td}><b>{p.cliente || '(sem cliente)'}</b></td>
                  <td style={td}><span style={badge(p.aprovado)}>{p.status}</span></td>
                  <td className="mono" style={td}>{t.pecas}</td>
                  <td className="mono" style={td}>R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ) })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', background: 'var(--bg-surface-2)', fontWeight: 600 }
const td: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }
const badge = (ok: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: ok ? 'var(--info-bg)' : 'var(--bg-muted)', color: ok ? 'var(--info-fg)' : 'var(--text-muted)' })
