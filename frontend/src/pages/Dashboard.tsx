import { Plus, BarChart3, ListOrdered } from 'lucide-react'
import { useApp } from '../store/useApp'
import { INSUMOS, pedTotais, moneyK } from '../store/model'
import { PageHead, Btn, Kpi, Panel, TableWrap, Badge } from '../components/ui'

/* Visual 100% do Design Kit v5 — nada de estilo inline aqui: .kpis, .panel,
   .tbl e .badge vivem em styles/kit.css e valem para o sistema inteiro. */

export default function Dashboard() {
  const { pedidos, kcards, goto, toast } = useApp()
  const emProducao = new Set(kcards.filter(c => c.station !== 'entregue').map(c => c.pedido)).size
  const atrasados = pedidos.filter(p => p.aprovado && p.late).length
  const fat = pedidos.filter(p => p.aprovado).reduce((s, p) => s + pedTotais(p).valor, 0)
  const critico = INSUMOS.filter(i => i.saldo < i.minimo).length

  return (
    <div>
      <PageHead crumb="INÍCIO" title="Dashboard"
        desc="Visão geral da fábrica — pedidos, produção e materiais. Cada indicador leva à página de origem."
        actions={<>
          <Btn size="sm" onClick={() => toast('Filtro de período (protótipo)')}><BarChart3 size={16} />Período</Btn>
          <Btn size="sm" variant="primary" onClick={() => goto('comercial')}><Plus size={16} />Novo orçamento</Btn>
        </>} />

      <div className="kpis">
        <Kpi label="Pedidos em produção" value={String(emProducao)} delta="▲ fluxo ativo" bar={62} onClick={() => goto('producao')} />
        <Kpi label="Atrasados" value={String(atrasados)} delta="prazo estourado" color="var(--danger)" bar={22} onClick={() => goto('producao')} />
        <Kpi label="Faturamento (aprovados)" value={moneyK(fat)} delta="▲ 12%" bar={74} onClick={() => goto('financeiro')} />
        <Kpi label="Estoque crítico" value={String(critico)} delta="itens no mínimo" color="var(--warning)" bar={30} onClick={() => goto('estoque')} />
      </div>

      <Panel title="Pedidos recentes" icon={<ListOrdered size={17} />} flush
        sub='Fase 1 (React) — o painel "Novos trabalhos" por departamento entra na Fase 2 com Recharts e cards de setor.'>
        <TableWrap minWidth={640}>
          <thead>
            <tr>
              <th>Pedido</th><th>Cliente</th><th>Status</th>
              <th className="num">Peças</th><th className="num">Valor</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => { const t = pedTotais(p); return (
              <tr key={p.pedido} style={{ cursor: 'pointer' }} onClick={() => goto('comercial')}>
                <td className="mono">{p.pedido}</td>
                <td><b>{p.cliente || '(sem cliente)'}</b></td>
                <td><Badge kind={p.aprovado ? 'info' : 'neutral'}>{p.status}</Badge></td>
                <td className="num">{t.pecas}</td>
                <td className="num">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ) })}
          </tbody>
        </TableWrap>
      </Panel>
    </div>
  )
}
