/* =====================================================================
   O ROTEADOR — o cérebro do Kanban, e nenhuma linha dele conhece o DOM.
   ---------------------------------------------------------------------
   Um pedido aprovado não entra no quadro inteiro: ele se FATIA. Cada
   layout, para cada tag de Design, vira um card de departamento que corre
   a sua faixa. As fatias reconvergem na CD Costura.

   Tudo aqui é função pura sobre listas — é o que permite testar a rota
   sem abrir navegador, e é o que sobra intacto quando o importador de
   `.ft` substituir o seed.
   ===================================================================== */
import { ESTACOES, ESTACAO_FINAL, ESTACAO_REENCONTRO, ROTAS, TECNICAS, type Pedido, type TagKey, type TecnicaKey } from './tipos'
import { dataBr, diasDeAtraso, venceu } from './regras'

export interface KCard {
  id: string
  pedido: string
  clienteId: number | null
  cliente: string
  vendedor: string
  entrega: string
  tecnica: TecnicaKey
  corTecnica: string
  /** índices dos layouts do pedido que ESTA fatia produz — L-01 é o índice 0.
   *  Um card só, com vários layouts, é o que o Trello já faz na prática: o
   *  operador da prensa não quer quatro cards do mesmo pedido na mesma
   *  coluna, quer um card dizendo quais peças estão ali. */
  layouts: number[]
  refs: string[]
  /** rótulos prontos: L-01 · L-03 · L-06 */
  rotulosLayout: string[]
  anexos: number
  pecas: number
  valor: number
  estacao: string
  /** etiquetas da produção — o que está acontecendo com este trabalho agora */
  tags: TagKey[]
  /** a rota inteira viaja com o card: a tela nunca precisa recalcular por onde ele passa */
  rota: string[]
}

/** Hash estável de string. Precisa ser determinístico: o mesmo pedido tem
 *  de cair na mesma estação em todo carregamento, senão o quadro "muda
 *  sozinho" a cada F5 e ninguém confia nele. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

const ORDEM = ESTACOES.map((e) => e.id)
const posGlobal = (id?: string) => Math.max(0, ORDEM.indexOf(id ?? ''))

/** Fatia os pedidos em cards de departamento.
 *
 *  Rascunho não é roteado (ainda não é produção) e entregue sai do quadro
 *  (vira histórico). O que sobra é aprovado — que entra na Separação — e
 *  em produção, cuja posição na faixa é derivada do avanço do pedido.
 *
 *  A fatia é **por pedido e por técnica**, não por layout. Se três layouts
 *  do mesmo pedido levam DTF, eles viajam JUNTOS num card só: o operador
 *  da prensa não quer três cards iguais na mesma coluna, quer um card
 *  dizendo quais peças estão ali (L-01 · L-03 · L-06).
 *
 *  As fatias do mesmo pedido não avançam juntas de propósito: na fábrica
 *  o DTF não espera o bordado. É esse desencontro que faz o "aguarda
 *  irmão" na costura ser um estado real e não decoração. */
export function rotear(pedidos: Pedido[]): KCard[] {
  const cards: KCard[] = []
  for (const p of pedidos) {
    if (p.status === 'rascunho' || p.status === 'entregue') continue

    /* agrupa os índices de layout por técnica, preservando a ordem */
    const porTecnica = new Map<TecnicaKey, number[]>()
    p.layouts.forEach((l, i) => {
      for (const t of l.tecnicas) porTecnica.set(t, [...(porTecnica.get(t) ?? []), i])
    })

    for (const [tecnica, layouts] of porTecnica) {
      const rota = ROTAS[tecnica]
      const id = `${p.pedido}-${tecnica}`
      let pecas = 0
      let valor = 0
      for (const i of layouts)
        for (const t of Object.values(p.layouts[i].tamanhos)) {
          pecas += t.qtd
          valor += t.qtd * t.uni
        }
      cards.push({
        id,
        pedido: p.pedido,
        clienteId: p.clienteId,
        cliente: p.cliente,
        vendedor: p.vendedor,
        entrega: p.entrega,
        tecnica,
        corTecnica: TECNICAS[tecnica].cor,
        layouts,
        refs: layouts.map((i) => p.layouts[i].ref),
        rotulosLayout: layouts.map(rotuloLayout),
        /* até o importador de `.ft` existir, cada layout carrega exatamente
           um mockup — então anexos = quantidade de layouts da fatia */
        anexos: layouts.length,
        pecas,
        valor,
        tags: [],
        rota,
        estacao: p.status === 'aprovado' ? rota[0] : posicaoNaRota(rota, p.estacao, id),
      })
    }
  }
  return cards
}

/** L-01, L-02 … O rótulo é o mesmo do editor e do A4; mudar aqui quebraria
 *  a conversa entre a produção e o orçamento impresso. */
export const rotuloLayout = (i: number) => `L-${String(i + 1).padStart(2, '0')}`

/** Converte o avanço do pedido na posição equivalente dentro da rota da
 *  fatia — rotas têm comprimentos diferentes, então é proporção, não
 *  índice. O deslocamento de ±1 vem do hash do card: determinístico, mas
 *  suficiente para as fatias não andarem em bloco. */
function posicaoNaRota(rota: string[], estacaoPedido: string | undefined, id: string): string {
  const ultimo = rota.length - 2 /* nunca cai em ENTREGUE: lá não há coluna */
  const direto = rota.indexOf(estacaoPedido ?? '')
  const base =
    direto >= 0 ? direto : Math.round((posGlobal(estacaoPedido) / (ORDEM.length - 1)) * ultimo)
  /* o ±1 vale também quando a estação do pedido existe na rota: sem ele as
     fatias chegam todas juntas na costura e o quadro vira duas pilhas */
  const i = base + Math.floor(hash(id) * 3) - 1
  return rota[Math.min(ultimo, Math.max(0, i))]
}

export const porEstacao = (cards: KCard[]): Record<string, KCard[]> => {
  const m: Record<string, KCard[]> = {}
  for (const e of ESTACOES) m[e.id] = []
  for (const c of cards) (m[c.estacao] ??= []).push(c)
  return m
}

/** Uma fatia que chegou ao reencontro mas cujos irmãos ainda estão atrás.
 *  Sem este aviso, a costura recebe meia peça e descobre tarde. */
export function aguardaIrmao(c: KCard, cards: KCard[]): boolean {
  if (c.rota.indexOf(c.estacao) < c.rota.indexOf(ESTACAO_REENCONTRO)) return false
  return cards.some(
    (o) => o.pedido === c.pedido && o.id !== c.id && o.rota.indexOf(o.estacao) < o.rota.indexOf(ESTACAO_REENCONTRO),
  )
}

export const proximaEstacao = (c: KCard): string | null => {
  const i = c.rota.indexOf(c.estacao)
  return i >= 0 && i < c.rota.length - 1 ? c.rota[i + 1] : null
}
export const estacaoAnterior = (c: KCard): string | null => {
  const i = c.rota.indexOf(c.estacao)
  return i > 0 ? c.rota[i - 1] : null
}

/** Move uma fatia. Devolve a lista nova, ou a MESMA lista quando o destino
 *  não pertence à rota daquela técnica — o quadro não deixa mandar um card
 *  de sublimação para a revelação de tela, e falhar em silêncio seria pior
 *  do que recusar. */
export function mover(cards: KCard[], id: string, destino: string): { cards: KCard[]; ok: boolean } {
  const c = cards.find((x) => x.id === id)
  if (!c || c.estacao === destino || !c.rota.includes(destino)) return { cards, ok: false }
  return { cards: cards.map((x) => (x.id === id ? { ...x, estacao: destino } : x)), ok: true }
}

export function avancar(cards: KCard[], id: string): { cards: KCard[]; ok: boolean; destino: string | null } {
  const c = cards.find((x) => x.id === id)
  const destino = c ? proximaEstacao(c) : null
  if (!destino) return { cards, ok: false, destino: null }
  return { ...mover(cards, id, destino), destino }
}

export const entregue = (c: KCard) => c.estacao === ESTACAO_FINAL

/** Liga ou desliga uma etiqueta. Devolve lista nova — nada é mutado, é o
 *  que permite desfazer e testar sem navegador. */
export function alternarTag(cards: KCard[], id: string, tag: TagKey): KCard[] {
  return cards.map((c) =>
    c.id === id ? { ...c, tags: c.tags.includes(tag) ? c.tags.filter((t) => t !== tag) : [...c.tags, tag] } : c,
  )
}

/** Uma fatia com problema ou pausada não deveria avançar sozinha. O quadro
 *  não bloqueia — quem está na estação sabe mais que o sistema —, mas avisa. */
export const travada = (c: KCard) => c.tags.includes('problema') || c.tags.includes('pausado')

/* ---------------------------------------------------------------- filtros */

export interface FiltrosKanban {
  busca: string
  tecnica: TecnicaKey | null
  vendedor: string | null
  tag: TagKey | null
  soAtrasados: boolean
}
export const FILTROS_KANBAN_VAZIO: FiltrosKanban = {
  busca: '', tecnica: null, vendedor: null, tag: null, soAtrasados: false,
}

const normaliza = (s: string) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export const cardAtrasado = (c: KCard, hoje: Date) => venceu(c.entrega, hoje)
export const diasCard = (c: KCard, hoje: Date) => diasDeAtraso(c.entrega, hoje)

export function filtrarCards(cards: KCard[], f: FiltrosKanban, hoje: Date): KCard[] {
  const q = normaliza(f.busca)
  return cards.filter((c) => {
    if (f.tecnica && c.tecnica !== f.tecnica) return false
    if (f.vendedor && c.vendedor !== f.vendedor) return false
    if (f.tag && !c.tags.includes(f.tag)) return false
    if (f.soAtrasados && !cardAtrasado(c, hoje)) return false
    if (!q) return true
    return normaliza(`${c.pedido} ${c.cliente} ${c.refs.join(' ')}`).includes(q)
  })
}

export const vendedores = (cards: KCard[]) =>
  [...new Set(cards.map((c) => c.vendedor))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))

/** A fila do topo: pedidos aprovados em ordem de entrega, o mais urgente
 *  primeiro. Data inválida vai para o fim em vez de virar NaN e embaralhar
 *  a ordem inteira. */
export function fila(pedidos: Pedido[]): Pedido[] {
  const ts = (p: Pedido) => dataBr(p.entrega)?.getTime() ?? Number.POSITIVE_INFINITY
  return pedidos.filter((p) => p.status === 'aprovado' || p.status === 'producao').sort((a, b) => ts(a) - ts(b))
}
