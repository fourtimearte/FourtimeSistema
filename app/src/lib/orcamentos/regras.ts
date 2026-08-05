/* =====================================================================
   REGRAS DO CICLO COMERCIAL — funções puras
   O funil e o arquivo saem daqui. Nada de DOM: é o que permite conferir
   a taxa de conversão num teste em vez de na tela.
   ===================================================================== */
import { dataBr, meiaNoite, totais } from '@/lib/pedidos/regras'
import type { Pedido } from '@/lib/pedidos/tipos'
import {
  ETAPAS, ETAPAS_FECHADAS, ETAPAS_GANHAS, MOTIVOS_PERDA, ORDEM_ETAPAS,
  type Etapa, type EtapaKey, type Evento, type MotivoPerda,
} from './tipos'

/** Hash estável — o mesmo orçamento tem de cair sempre na mesma etapa,
 *  senão o funil "muda sozinho" a cada F5 e ninguém confia nele. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/* rascunho no seed = orçamento que ainda não fechou; espalha pelo funil */
const FUNIL_ABERTO: EtapaKey[] = ['contato', 'briefing', 'montagem', 'enviado', 'negociacao', 'aprovacao']

/** A etapa comercial de um pedido.
 *
 *  Derivada, não guardada: o seed só conhece `status`, e inventar um
 *  arquivo de dados paralelo criaria duas verdades sobre o mesmo pedido.
 *  Quando o importador de `.ft` entrar, ele preenche `etapa` de verdade e
 *  esta função vira um `p.etapa ?? derivada`. */
export function etapaDe(p: Pedido): EtapaKey {
  if (p.etapa && ORDEM_ETAPAS.includes(p.etapa as EtapaKey)) return p.etapa as EtapaKey
  if (p.status === 'entregue') return 'entregue'
  if (p.status === 'producao') return 'producao'
  if (p.status === 'aprovado') return 'aprovado'
  const h = hash(p.pedido)
  /* 1 em 6 dos abertos vira perdido — sem nenhum perdido no quadro, a
     taxa de conversão daria 100% e a tela mentiria bonito */
  if (h > 0.84) return 'perdido'
  return FUNIL_ABERTO[Math.floor((h / 0.84) * FUNIL_ABERTO.length) % FUNIL_ABERTO.length]
}

export function motivoPerda(p: Pedido): MotivoPerda | null {
  if (etapaDe(p) !== 'perdido') return null
  const ms = Object.keys(MOTIVOS_PERDA) as MotivoPerda[]
  return ms[Math.floor(hash(p.pedido + 'motivo') * ms.length)]
}

export const ordemEtapa = (k: EtapaKey) => ORDEM_ETAPAS.indexOf(k)
export const fechado = (k: EtapaKey) => ETAPAS_FECHADAS.includes(k)
export const ganho = (k: EtapaKey) => ETAPAS_GANHAS.includes(k)

/* ------------------------------------------------------------ histórico */

const somaDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const paraBr = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

/** O caminho que o orçamento já percorreu, com data em cada parada.
 *
 *  É o que responde "por onde este orçamento passou e quanto tempo levou
 *  em cada lugar" — a pergunta que o WhatsApp nunca respondeu.
 *
 *  As datas são contadas para trás **a partir de hoje**, e não da entrega.
 *  A primeira versão ancorava na entrega, que é uma data FUTURA: todo
 *  evento caía no futuro e "dias na etapa" dava zero para o quadro inteiro
 *  — a coluna mais útil da tela nascia inútil. Histórico é passado.
 *
 *  Enquanto o `.ft` não guardar o histórico de verdade, é melhor mostrar
 *  um caminho plausível e dizer que é derivado do que deixar a seção
 *  vazia. */
export function historico(p: Pedido, hoje: Date): Evento[] {
  const atual = etapaDe(p)
  if (!dataBr(p.entrega)) return []
  const percorridas = ORDEM_ETAPAS.filter(
    (k) => ordemEtapa(k) <= ordemEtapa(atual) && (k !== 'perdido' || atual === 'perdido'),
  )
  const passo = 1 + Math.floor(hash(p.pedido + 'passo') * 4) /* 1 a 4 dias entre etapas */
  const naEtapa = Math.floor(hash(p.pedido + 'dias') * 9) /* 0 a 8 dias na atual */
  const base = new Date(meiaNoite(hoje))
  const total = percorridas.length
  return percorridas.map((k, i) => ({
    etapa: k,
    data: paraBr(somaDias(base, -naEtapa - (total - 1 - i) * passo)),
  }))
}

export const entradaNaEtapa = (p: Pedido, hoje: Date): Date | null => {
  const h = historico(p, hoje)
  return h.length ? dataBr(h[h.length - 1].data) : null
}

export function diasNaEtapa(p: Pedido, hoje: Date): number {
  const d = entradaNaEtapa(p, hoje)
  if (!d) return 0
  return Math.max(0, Math.floor((meiaNoite(hoje) - d.getTime()) / 864e5))
}

/** Parado tempo demais para a etapa em que está. Cada etapa tem o seu
 *  limite: dois dias sem responder um contato é ruim; dois dias esperando
 *  o cliente aprovar é normal. */
export function parado(p: Pedido, hoje: Date): boolean {
  const e = ETAPAS.find((x) => x.key === etapaDe(p))!
  if (!e.alertaDias || fechado(e.key)) return false
  return diasNaEtapa(p, hoje) > e.alertaDias
}

export const valorDe = (p: Pedido) => totais(p).valor
export const pecasDe = (p: Pedido) => totais(p).pecas

/* ----------------------------------------------------------------- KPIs */

export interface KpisComercial {
  emAberto: number
  valorEmAberto: number
  parados: number
  ganhos: number
  perdidos: number
  /** ganhos ÷ (ganhos + perdidos). Orçamento ainda aberto não entra na
   *  conta: contá-lo como perdido derrubaria a taxa toda semana em que a
   *  equipe vendesse bem e tivesse muita coisa em aberto. */
  conversao: number
  ticketMedio: number
}

export function kpisComercial(pedidos: Pedido[], hoje: Date): KpisComercial {
  const etapas = pedidos.map((p) => ({ p, e: etapaDe(p) }))
  const abertos = etapas.filter((x) => !fechado(x.e) && x.e !== 'aprovado')
  const ganhos = etapas.filter((x) => ganho(x.e))
  const perdidos = etapas.filter((x) => x.e === 'perdido')
  const decididos = ganhos.length + perdidos.length
  const valoresGanhos = ganhos.map((x) => valorDe(x.p))
  return {
    emAberto: abertos.length,
    valorEmAberto: abertos.reduce((s, x) => s + valorDe(x.p), 0),
    parados: etapas.filter((x) => parado(x.p, hoje)).length,
    ganhos: ganhos.length,
    perdidos: perdidos.length,
    conversao: decididos ? ganhos.length / decididos : 0,
    ticketMedio: valoresGanhos.length ? valoresGanhos.reduce((a, b) => a + b, 0) / valoresGanhos.length : 0,
  }
}

/** Quantos e quanto em cada etapa — a leitura do funil. */
export function porEtapa(pedidos: Pedido[]): Record<EtapaKey, Pedido[]> {
  const m = {} as Record<EtapaKey, Pedido[]>
  for (const e of ETAPAS) m[e.key] = []
  for (const p of pedidos) (m[etapaDe(p)] ??= []).push(p)
  return m
}

export function resumoFunil(pedidos: Pedido[]): { etapa: Etapa; n: number; valor: number }[] {
  const m = porEtapa(pedidos)
  return ETAPAS.map((etapa) => ({
    etapa,
    n: m[etapa.key].length,
    valor: m[etapa.key].reduce((s, p) => s + valorDe(p), 0),
  }))
}

/* -------------------------------------------------------------- filtros */

export interface FiltrosOrcamento {
  busca: string
  etapa: EtapaKey | null
  vendedor: string | null
  soParados: boolean
}
export const FILTROS_ORCAMENTO_VAZIO: FiltrosOrcamento = {
  busca: '', etapa: null, vendedor: null, soParados: false,
}

const normaliza = (s: string) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function filtrarOrcamentos(pedidos: Pedido[], f: FiltrosOrcamento, hoje: Date): Pedido[] {
  const q = normaliza(f.busca)
  return pedidos.filter((p) => {
    if (f.etapa && etapaDe(p) !== f.etapa) return false
    if (f.vendedor && p.vendedor !== f.vendedor) return false
    if (f.soParados && !parado(p, hoje)) return false
    if (!q) return true
    return normaliza(`${p.pedido} ${p.cliente} ${p.vendedor}`).includes(q)
  })
}

export type ColunaArquivo = 'pedido' | 'cliente' | 'etapa' | 'entrega' | 'valor' | 'pecas'

export function ordenarOrcamentos(
  pedidos: Pedido[],
  coluna: ColunaArquivo,
  desc: boolean,
): Pedido[] {
  const chave = (p: Pedido): string | number => {
    switch (coluna) {
      case 'pedido': return p.pedido
      case 'cliente': return normaliza(p.cliente)
      case 'etapa': return ordemEtapa(etapaDe(p))
      /* data ordena por tempo, não por texto: "01/12" antes de "02/01"
         seria o que uma ordenação alfabética faria */
      case 'entrega': return dataBr(p.entrega)?.getTime() ?? Number.POSITIVE_INFINITY
      case 'valor': return valorDe(p)
      case 'pecas': return pecasDe(p)
    }
  }
  return [...pedidos].sort((a, b) => {
    const x = chave(a)
    const y = chave(b)
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')
    return desc ? -r : r
  })
}

export const vendedoresDe = (pedidos: Pedido[]) =>
  [...new Set(pedidos.map((p) => p.vendedor))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))

/** Move o orçamento para outra etapa. Devolve lista nova.
 *  Ao contrário da produção, aqui NÃO há rota fixa: o comercial volta atrás,
 *  pula o briefing quando o cliente já sabe o que quer, e às vezes um
 *  perdido volta a viver. Travar isso atrapalharia mais do que ajudaria. */
export function moverEtapa(pedidos: Pedido[], numero: string, destino: EtapaKey): Pedido[] {
  return pedidos.map((p) => (p.pedido === numero ? { ...p, etapa: destino } : p))
}
