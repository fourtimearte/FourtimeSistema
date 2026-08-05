/* =====================================================================
   Regras de pedido e agregações do Dashboard — FUNÇÕES PURAS.
   O Dashboard LÊ de todas as páginas e não escreve em nenhuma; por isso
   tudo aqui é cálculo sobre a lista, sem estado e sem DOM.
   ===================================================================== */
import { ORDEM_TECNICAS, TECNICAS, nomeEstacao, type Pedido, type TecnicaKey } from './tipos'

/** dd/mm/aaaa → Date. Data inválida vira null em vez de NaN silencioso.
 *
 *  Cuidado que um teste pegou: o `new Date` do JavaScript **não rejeita**
 *  componente fora de faixa — ele TRANSBORDA. `new Date(9999, 98, 99)` vira
 *  o ano 10007 sem reclamar, e um prazo assim passaria por válido, entrando
 *  na conta de atraso com um número absurdo. Por isso a data é reconstruída
 *  e conferida componente a componente. */
export function dataBr(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s ?? '').trim())
  if (!m) return null
  const [dia, mes, ano] = [+m[1], +m[2], +m[3]]
  const d = new Date(ano, mes - 1, dia)
  const ok = d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
  return ok ? d : null
}

export function totais(p: Pedido) {
  let pecas = 0
  let valor = 0
  for (const l of p.layouts)
    for (const t of Object.values(l.tamanhos)) {
      pecas += t.qtd
      valor += t.qtd * t.uni
    }
  return { pecas, valor }
}

/** As tags de Design de cada layout — no sistema elas SÃO a rota da produção. */
export function tecnicas(p: Pedido): TecnicaKey[] {
  const s = new Set<TecnicaKey>()
  for (const l of p.layouts) for (const t of l.tecnicas) s.add(t)
  return ORDEM_TECNICAS.filter((t) => s.has(t))
}

export const emProducao = (p: Pedido) => p.status === 'producao'

/** Meia-noite de hoje, como número.
 *
 *  Escrito assim por causa de um erro que já estava no código: a versão
 *  anterior fazia `hoje.setHours(0,0,0,0)` — e `setHours` **muda o Date que
 *  recebeu**. Quem chamasse `atrasado()` zerava o relógio do `hoje` do
 *  chamador, e a função seguinte media o atraso a partir de outra hora. O
 *  resultado dependia da ORDEM das chamadas. Aqui nada é mutado. */
export const meiaNoite = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Prazo vencido, olhando só a data — hora não entra em prazo de entrega. */
export function venceu(entrega: string, hoje: Date): boolean {
  const d = dataBr(entrega)
  return !!d && d.getTime() < meiaNoite(hoje)
}

/** Atrasado = prazo vencido e ainda não entregue. Entregue nunca é atraso. */
export function atrasado(p: Pedido, hoje: Date): boolean {
  if (p.status === 'entregue' || p.status === 'rascunho') return false
  return venceu(p.entrega, hoje)
}

export function diasDeAtraso(entrega: string, hoje: Date): number {
  const d = dataBr(entrega)
  if (!d) return 0
  return Math.max(0, Math.floor((meiaNoite(hoje) - d.getTime()) / 864e5))
}

export function noMes(p: Pedido, hoje: Date): boolean {
  const d = dataBr(p.entrega)
  return !!d && d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth()
}

export interface KpisDashboard {
  emProducao: number
  valorEmProducao: number
  atrasados: number
  faturadoMes: number
  aReceber: number
  pedidosMes: number
  ticketMedio: number
}

export function kpis(pedidos: Pedido[], hoje: Date): KpisDashboard {
  const prod = pedidos.filter(emProducao)
  const atras = pedidos.filter((p) => atrasado(p, hoje))
  const entregues = pedidos.filter((p) => p.status === 'entregue' && noMes(p, hoje))
  const abertos = pedidos.filter((p) => p.status !== 'rascunho' && p.status !== 'entregue')
  const doMes = pedidos.filter((p) => noMes(p, hoje))
  const valores = pedidos.filter((p) => p.status !== 'rascunho').map((p) => totais(p).valor)
  return {
    emProducao: prod.length,
    valorEmProducao: prod.reduce((s, p) => s + totais(p).valor, 0),
    atrasados: atras.length,
    faturadoMes: entregues.reduce((s, p) => s + totais(p).valor, 0),
    aReceber: abertos.reduce((s, p) => s + totais(p).valor, 0),
    pedidosMes: doMes.length,
    ticketMedio: valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0,
  }
}

/** Onde os cards se acumulam. Uma grandeza só, variando intensidade →
 *  o gráfico usa a rampa SEQUENCIAL (--chart-*). */
export function gargalos(pedidos: Pedido[], limite = 6): { estacao: string; nome: string; n: number }[] {
  const m: Record<string, number> = {}
  for (const p of pedidos) if (emProducao(p) && p.estacao) m[p.estacao] = (m[p.estacao] ?? 0) + 1
  return Object.entries(m)
    .map(([estacao, n]) => ({ estacao, nome: nomeEstacao(estacao), n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, limite)
}

/** Quanto de cada técnica. Categorias distintas → paleta CATEGÓRICA (--cat-*).
 *  Com a rampa vermelha, cinco técnicas se distinguiriam só por claridade. */
export function giroPorTecnica(pedidos: Pedido[]): { tecnica: TecnicaKey; rotulo: string; cor: string; n: number; pct: number }[] {
  const m = {} as Record<TecnicaKey, number>
  let total = 0
  for (const p of pedidos) {
    if (p.status === 'rascunho') continue
    for (const t of tecnicas(p)) {
      m[t] = (m[t] ?? 0) + 1
      total++
    }
  }
  return ORDEM_TECNICAS.filter((t) => m[t])
    .map((t) => ({ tecnica: t, rotulo: TECNICAS[t].rotulo, cor: TECNICAS[t].cor, n: m[t], pct: total ? (m[t] / total) * 100 : 0 }))
    .sort((a, b) => b.n - a.n)
}

export function maisAtrasados(pedidos: Pedido[], hoje: Date, limite = 6): Pedido[] {
  return pedidos
    .filter((p) => atrasado(p, hoje))
    .sort((a, b) => diasDeAtraso(b.entrega, hoje) - diasDeAtraso(a.entrega, hoje))
    .slice(0, limite)
}

export const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 96.400 → "96,4k" — para caber no tile do KPI sem cortar. */
export function moedaCurta(v: number): string {
  if (v >= 1000) return (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'
  return moeda(v)
}
