import { create } from 'zustand'
import {
  PEDIDOS_SEED, TECNICAS, CLIENTES, type Pedido, type KCard, type TecnicaKey, type Cliente,
  pedTotais, pedTecnicas,
} from './model'

export type PageId = 'dashboard' | 'comercial' | 'crm' | 'producao' | 'ficha' | 'estoque' | 'financeiro'

interface Toast { id: number; msg: string }

interface AppState {
  logged: boolean
  perfil: string
  page: PageId
  pedidos: Pedido[]
  kcards: KCard[]
  fin: Record<string, { sinal: number }>
  seq: number
  curPed: number
  toasts: Toast[]
  // navegação / sessão
  login: (perfil: string) => void
  goto: (p: PageId) => void
  // kanban
  rebuildKanban: () => void
  aprovarPedido: (pedido: string) => TecnicaKey[] | null
  moveCard: (cardId: string, station: string) => void
  // editor
  setCurPed: (i: number) => void
  novoOrcamento: () => void
  criarPedidoDe: (base: Pedido, cli?: Cliente) => void
  updateHeader: (idx: number, field: keyof Pedido, value: string) => void
  patchPedido: (idx: number, partial: Partial<Pedido>) => void
  updateLayout: (pIdx: number, lIdx: number, field: string, value: string) => void
  patchLayout: (pIdx: number, lIdx: number, partial: Record<string, unknown>) => void
  updateSize: (pIdx: number, lIdx: number, tIdx: number, field: 'qtd' | 'uni', value: number) => void
  addLayout: (pIdx: number) => void
  deleteLayout: (pIdx: number, lIdx: number) => void
  toggleDesign: (pIdx: number, lIdx: number, tag: TecnicaKey) => void
  // financeiro
  registrarPagamento: (pedido: string) => void
  // feedback
  toast: (msg: string) => void
  dismissToast: (id: number) => void
}

let KID = 0
let TID = 0

function roteia(pedidos: Pedido[]): KCard[] {
  KID = 0
  const cards: KCard[] = []
  pedidos.filter(p => p.aprovado).forEach(p => {
    const tot = pedTotais(p)
    pedTecnicas(p).forEach(tec => {
      KID++
      cards.push({ id: 'k' + KID, pedido: p.pedido, cliente: p.cliente, tec, station: TECNICAS[tec].entry as string, prazo: p.entrega, late: !!p.late, val: tot.valor, artes: p.layouts.length })
    })
  })
  return cards
}

function novoLayout() {
  return { refCod: '', ref: 'Nova referência', tecido: '', cor: '', corHex: '#98A3B0', design: ['DTF'] as TecnicaKey[], grade: 'adulto', tamanhos: [{ tam: 'P', qtd: 0, uni: 0 }, { tam: 'M', qtd: 0, uni: 0 }, { tam: 'G', qtd: 0, uni: 0 }] }
}

export const useApp = create<AppState>((set, get) => ({
  logged: false,
  perfil: 'Administração',
  page: 'dashboard',
  pedidos: JSON.parse(JSON.stringify(PEDIDOS_SEED)),
  kcards: roteia(PEDIDOS_SEED),
  fin: { PD003929: { sinal: 0 }, PD003912: { sinal: 1798.5 }, PD003940: { sinal: 299 }, PD003944: { sinal: 0 } },
  seq: 3945,
  curPed: 0,
  toasts: [],

  login: (perfil) => set({ logged: true, perfil, page: perfil === 'Produção' ? 'producao' : perfil === 'Comercial' ? 'comercial' : 'dashboard' }),
  goto: (page) => set({ page }),
  rebuildKanban: () => set({ kcards: roteia(get().pedidos) }),

  aprovarPedido: (pedido) => {
    const p = get().pedidos.find(x => x.pedido === pedido)
    if (!p) return null
    const tecs = pedTecnicas(p)
    if (!tecs.length) return null
    p.aprovado = true; p.status = 'producao'
    set({ pedidos: [...get().pedidos], kcards: roteia(get().pedidos) })
    return tecs
  },
  moveCard: (cardId, station) => {
    const cards = get().kcards.map(c => c.id === cardId ? { ...c, station, late: station === 'entregue' ? false : c.late } : c)
    set({ kcards: cards })
  },

  setCurPed: (curPed) => set({ curPed }),

  novoOrcamento: () => {
    const seq = get().seq + 1
    const pd = 'PD' + String(seq).padStart(6, '0')
    const novo: Pedido = { pedido: pd, clienteId: null, cliente: '', vendedor: get().perfil === 'Comercial' ? '' : get().perfil, contato: '', entrega: '', pagamento: '50% sinal + saldo', depto: '', status: 'rascunho', aprovado: false, layouts: [novoLayout()] }
    set({ pedidos: [novo, ...get().pedidos], fin: { ...get().fin, [pd]: { sinal: 0 } }, seq, curPed: 0, page: 'comercial' })
    get().toast('Novo orçamento ' + pd)
  },
  criarPedidoDe: (base, cli) => {
    const seq = get().seq + 1
    const pd = 'PD' + String(seq).padStart(6, '0')
    const novo: Pedido = JSON.parse(JSON.stringify(base))
    novo.pedido = pd; novo.status = 'rascunho'; novo.aprovado = false; novo.late = false
    if (cli) { novo.clienteId = cli.id; novo.cliente = cli.nome; novo.contato = cli.contato; novo.vendedor = cli.vendedor }
    set({ pedidos: [novo, ...get().pedidos], fin: { ...get().fin, [pd]: { sinal: 0 } }, seq, curPed: 0, page: 'comercial' })
    get().toast('Novo orçamento ' + pd + ' criado')
  },
  updateHeader: (idx, field, value) => {
    const pedidos = get().pedidos
    ;(pedidos[idx] as any)[field] = value
    set({ pedidos: [...pedidos] })
  },
  patchPedido: (idx, partial) => {
    const pedidos = get().pedidos
    Object.assign(pedidos[idx], partial)
    set({ pedidos: [...pedidos] })
  },
  updateLayout: (pIdx, lIdx, field, value) => {
    const pedidos = get().pedidos
    ;(pedidos[pIdx].layouts[lIdx] as any)[field] = value
    set({ pedidos: [...pedidos] })
  },
  patchLayout: (pIdx, lIdx, partial) => {
    const pedidos = get().pedidos
    Object.assign(pedidos[pIdx].layouts[lIdx], partial)
    set({ pedidos: [...pedidos], kcards: pedidos[pIdx].aprovado ? roteia(pedidos) : get().kcards })
  },
  updateSize: (pIdx, lIdx, tIdx, field, value) => {
    const pedidos = get().pedidos
    pedidos[pIdx].layouts[lIdx].tamanhos[tIdx][field] = value
    set({ pedidos: [...pedidos], kcards: pedidos[pIdx].aprovado ? roteia(pedidos) : get().kcards })
  },
  addLayout: (pIdx) => {
    const pedidos = get().pedidos
    pedidos[pIdx].layouts.push(novoLayout())
    set({ pedidos: [...pedidos] })
  },
  deleteLayout: (pIdx, lIdx) => {
    const pedidos = get().pedidos
    if (pedidos[pIdx].layouts.length <= 1) return
    pedidos[pIdx].layouts.splice(lIdx, 1)
    set({ pedidos: [...pedidos], kcards: pedidos[pIdx].aprovado ? roteia(pedidos) : get().kcards })
  },
  toggleDesign: (pIdx, lIdx, tag) => {
    const pedidos = get().pedidos
    const l = pedidos[pIdx].layouts[lIdx]
    const i = l.design.indexOf(tag)
    if (i >= 0) { if (l.design.length > 1) l.design.splice(i, 1); else { get().toast('O layout precisa de ao menos 1 técnica'); return } }
    else l.design.push(tag)
    set({ pedidos: [...pedidos], kcards: pedidos[pIdx].aprovado ? roteia(pedidos) : get().kcards })
  },

  registrarPagamento: (pedido) => {
    const p = get().pedidos.find(x => x.pedido === pedido)
    if (!p) return
    const t = pedTotais(p).valor
    const fin = { ...get().fin }
    if (!fin[pedido]) fin[pedido] = { sinal: 0 }
    if (fin[pedido].sinal <= 0) { fin[pedido] = { sinal: +(t * 0.5).toFixed(2) }; get().toast('Sinal de 50% registrado em ' + pedido) }
    else { fin[pedido] = { sinal: t }; get().toast('Saldo baixado — ' + pedido + ' quitado') }
    set({ fin })
  },

  toast: (msg) => { TID++; const id = TID; set({ toasts: [...get().toasts, { id, msg }] }); setTimeout(() => get().dismissToast(id), 2600) },
  dismissToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}))

export function clientePedidos(cid: number) { return useApp.getState().pedidos.filter(p => p.clienteId === cid) }
export { CLIENTES }
