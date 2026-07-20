import { create } from 'zustand'
import {
  PEDIDOS_SEED, TECNICAS, type Pedido, type KCard, type TecnicaKey,
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
  toasts: Toast[]
  // ações
  login: (perfil: string) => void
  goto: (p: PageId) => void
  rebuildKanban: () => void
  aprovarPedido: (pedido: string) => TecnicaKey[] | null
  moveCard: (cardId: string, station: string) => void
  toggleDesign: (pedido: string, layoutIdx: number, tag: TecnicaKey) => void
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

export const useApp = create<AppState>((set, get) => ({
  logged: false,
  perfil: 'Administração',
  page: 'dashboard',
  pedidos: JSON.parse(JSON.stringify(PEDIDOS_SEED)),
  kcards: roteia(PEDIDOS_SEED),
  fin: { PD003929: { sinal: 0 }, PD003912: { sinal: 1798.5 }, PD003940: { sinal: 299 }, PD003944: { sinal: 0 } },
  seq: 3945,
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

  toggleDesign: (pedido, layoutIdx, tag) => {
    const pedidos = get().pedidos
    const p = pedidos.find(x => x.pedido === pedido)
    if (!p) return
    const l = p.layouts[layoutIdx]
    const i = l.design.indexOf(tag)
    if (i >= 0) { if (l.design.length > 1) l.design.splice(i, 1) }
    else l.design.push(tag)
    set({ pedidos: [...pedidos], kcards: p.aprovado ? roteia(pedidos) : get().kcards })
  },

  toast: (msg) => { TID++; const id = TID; set({ toasts: [...get().toasts, { id, msg }] }); setTimeout(() => get().dismissToast(id), 2600) },
  dismissToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}))
