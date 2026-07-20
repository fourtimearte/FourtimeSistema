import { create } from 'zustand'
import {
  PEDIDOS_SEED, TECNICAS, CLIENTES, novoLayout,
  type Pedido, type KCard, type TecnicaKey, type Cliente, type Layout,
  pedTotais, pedTecnicas,
} from './model'

export type PageId = 'dashboard' | 'comercial' | 'crm' | 'producao' | 'ficha' | 'estoque' | 'financeiro'
interface Toast { id: number; msg: string }

interface AppState {
  logged: boolean; perfil: string; page: PageId
  pedidos: Pedido[]; kcards: KCard[]; fin: Record<string, { sinal: number }>
  seq: number; curPed: number; semDinheiro: boolean; toasts: Toast[]
  login: (perfil: string) => void
  goto: (p: PageId) => void
  toggleDinheiro: () => void
  rebuildKanban: () => void
  aprovarPedido: (pedido: string) => TecnicaKey[] | null
  moveCard: (cardId: string, station: string) => void
  setCurPed: (i: number) => void
  novoOrcamento: () => void
  criarPedidoDe: (base: Pedido, cli?: Cliente) => void
  updateHeader: (idx: number, field: keyof Pedido, value: string) => void
  patchPedido: (idx: number, partial: Partial<Pedido>) => void
  // layout
  patchLayout: (pIdx: number, lIdx: number, partial: Partial<Layout>) => void
  addLayout: (pIdx: number) => void
  duplicateLayout: (pIdx: number, lIdx: number) => void
  deleteLayout: (pIdx: number, lIdx: number) => void
  setGrade: (pIdx: number, lIdx: number, grade: 'adulto' | 'infantil') => void
  setTecido: (pIdx: number, lIdx: number, tIdx: number, value: string) => void
  addTecido: (pIdx: number, lIdx: number) => void
  removeTecido: (pIdx: number, lIdx: number, tIdx: number) => void
  toggleDesign: (pIdx: number, lIdx: number, tag: TecnicaKey) => void
  addDesignCor: (pIdx: number, lIdx: number, tag: TecnicaKey, code: string) => void
  removeDesignCor: (pIdx: number, lIdx: number, tag: TecnicaKey, code: string) => void
  setSize: (pIdx: number, lIdx: number, tam: string, field: 'qtd' | 'uni', value: number) => void
  setImg: (pIdx: number, lIdx: number, data: string | null) => void
  setObs: (pIdx: number, lIdx: number, value: string) => void
  toggleObsTag: (pIdx: number, lIdx: number, tag: string) => void
  // financeiro
  registrarPagamento: (pedido: string) => void
  toast: (msg: string) => void
  dismissToast: (id: number) => void
}

let KID = 0, TID = 0
function roteia(pedidos: Pedido[]): KCard[] {
  KID = 0; const cards: KCard[] = []
  pedidos.filter(p => p.aprovado).forEach(p => {
    const tot = pedTotais(p)
    pedTecnicas(p).forEach(tec => { KID++; cards.push({ id: 'k' + KID, pedido: p.pedido, cliente: p.cliente, tec, station: TECNICAS[tec].entry as string, prazo: p.entrega, late: !!p.late, val: tot.valor, artes: p.layouts.length }) })
  })
  return cards
}
function reroute(get: () => AppState, set: (s: Partial<AppState>) => void, pIdx: number) {
  const pedidos = get().pedidos
  set({ pedidos: [...pedidos], kcards: pedidos[pIdx].aprovado ? roteia(pedidos) : get().kcards })
}
function novoPedido(seq: number, perfil: string): Pedido {
  return { pedido: 'PD' + String(seq).padStart(6, '0'), clienteId: null, cliente: '', cpf: '', vendedor: perfil === 'Comercial' ? '' : perfil, contato: '', depto: '', embalagem: '', entrega: '', envio: '', pagamento: '50% sinal + saldo', obs: '', status: 'rascunho', aprovado: false, layouts: [novoLayout()] }
}

export const useApp = create<AppState>((set, get) => ({
  logged: false, perfil: 'Administração', page: 'dashboard',
  pedidos: JSON.parse(JSON.stringify(PEDIDOS_SEED)),
  kcards: roteia(PEDIDOS_SEED),
  fin: { PD003929: { sinal: 0 }, PD003912: { sinal: 1798.5 }, PD003940: { sinal: 299 }, PD003944: { sinal: 0 } },
  seq: 3945, curPed: 0, semDinheiro: false, toasts: [],

  login: (perfil) => set({ logged: true, perfil, page: perfil === 'Produção' ? 'producao' : perfil === 'Comercial' ? 'comercial' : 'dashboard' }),
  goto: (page) => set({ page }),
  toggleDinheiro: () => set({ semDinheiro: !get().semDinheiro }),
  rebuildKanban: () => set({ kcards: roteia(get().pedidos) }),
  aprovarPedido: (pedido) => {
    const p = get().pedidos.find(x => x.pedido === pedido); if (!p) return null
    const tecs = pedTecnicas(p); if (!tecs.length) return null
    p.aprovado = true; p.status = 'producao'
    set({ pedidos: [...get().pedidos], kcards: roteia(get().pedidos) }); return tecs
  },
  moveCard: (cardId, station) => set({ kcards: get().kcards.map(c => c.id === cardId ? { ...c, station, late: station === 'entregue' ? false : c.late } : c) }),
  setCurPed: (curPed) => set({ curPed }),

  novoOrcamento: () => { const seq = get().seq + 1; const p = novoPedido(seq, get().perfil); set({ pedidos: [p, ...get().pedidos], fin: { ...get().fin, [p.pedido]: { sinal: 0 } }, seq, curPed: 0, page: 'comercial' }); get().toast('Novo orçamento ' + p.pedido) },
  criarPedidoDe: (base, cli) => {
    const seq = get().seq + 1; const p: Pedido = JSON.parse(JSON.stringify(base))
    p.pedido = 'PD' + String(seq).padStart(6, '0'); p.status = 'rascunho'; p.aprovado = false; p.late = false
    if (cli) { p.clienteId = cli.id; p.cliente = cli.nome; p.cpf = cli.doc; p.contato = cli.contato; p.vendedor = cli.vendedor }
    set({ pedidos: [p, ...get().pedidos], fin: { ...get().fin, [p.pedido]: { sinal: 0 } }, seq, curPed: 0, page: 'comercial' }); get().toast('Novo orçamento ' + p.pedido + ' criado')
  },
  updateHeader: (idx, field, value) => { const pedidos = get().pedidos; (pedidos[idx] as any)[field] = value; set({ pedidos: [...pedidos] }) },
  patchPedido: (idx, partial) => { const pedidos = get().pedidos; Object.assign(pedidos[idx], partial); set({ pedidos: [...pedidos] }) },

  patchLayout: (pIdx, lIdx, partial) => { const pedidos = get().pedidos; Object.assign(pedidos[pIdx].layouts[lIdx], partial); reroute(get, set, pIdx) },
  addLayout: (pIdx) => { const pedidos = get().pedidos; pedidos[pIdx].layouts.push(novoLayout()); set({ pedidos: [...pedidos] }) },
  duplicateLayout: (pIdx, lIdx) => { const pedidos = get().pedidos; const copy: Layout = JSON.parse(JSON.stringify(pedidos[pIdx].layouts[lIdx])); pedidos[pIdx].layouts.splice(lIdx + 1, 0, copy); set({ pedidos: [...pedidos] }); get().toast('Layout duplicado') },
  deleteLayout: (pIdx, lIdx) => { const pedidos = get().pedidos; if (pedidos[pIdx].layouts.length <= 1) return; pedidos[pIdx].layouts.splice(lIdx, 1); reroute(get, set, pIdx) },
  setGrade: (pIdx, lIdx, grade) => { const pedidos = get().pedidos; pedidos[pIdx].layouts[lIdx].grade = grade; set({ pedidos: [...pedidos] }) },
  setTecido: (pIdx, lIdx, tIdx, value) => { const pedidos = get().pedidos; pedidos[pIdx].layouts[lIdx].tecidos[tIdx] = value; set({ pedidos: [...pedidos] }) },
  addTecido: (pIdx, lIdx) => { const pedidos = get().pedidos; pedidos[pIdx].layouts[lIdx].tecidos.push(''); set({ pedidos: [...pedidos] }) },
  removeTecido: (pIdx, lIdx, tIdx) => { const pedidos = get().pedidos; const t = pedidos[pIdx].layouts[lIdx].tecidos; if (t.length > 1) t.splice(tIdx, 1); set({ pedidos: [...pedidos] }) },
  toggleDesign: (pIdx, lIdx, tag) => {
    const pedidos = get().pedidos; const d = pedidos[pIdx].layouts[lIdx].design
    const i = d.findIndex(x => x.tag === tag)
    if (i >= 0) { if (d.length > 1) d.splice(i, 1); else { get().toast('O layout precisa de ao menos 1 técnica'); return } }
    else d.push({ tag, cores: [] })
    reroute(get, set, pIdx)
  },
  addDesignCor: (pIdx, lIdx, tag, code) => { const pedidos = get().pedidos; const dt = pedidos[pIdx].layouts[lIdx].design.find(x => x.tag === tag); if (dt && !dt.cores.includes(code)) dt.cores.push(code); set({ pedidos: [...pedidos] }) },
  removeDesignCor: (pIdx, lIdx, tag, code) => { const pedidos = get().pedidos; const dt = pedidos[pIdx].layouts[lIdx].design.find(x => x.tag === tag); if (dt) dt.cores = dt.cores.filter(c => c !== code); set({ pedidos: [...pedidos] }) },
  setSize: (pIdx, lIdx, tam, field, value) => { const pedidos = get().pedidos; const tm = pedidos[pIdx].layouts[lIdx].tamanhos; if (!tm[tam]) tm[tam] = { qtd: 0, uni: 0 }; tm[tam][field] = value; reroute(get, set, pIdx) },
  setImg: (pIdx, lIdx, data) => { const pedidos = get().pedidos; pedidos[pIdx].layouts[lIdx].img = data; set({ pedidos: [...pedidos] }) },
  setObs: (pIdx, lIdx, value) => { const pedidos = get().pedidos; pedidos[pIdx].layouts[lIdx].obs = value; set({ pedidos: [...pedidos] }) },
  toggleObsTag: (pIdx, lIdx, tag) => { const pedidos = get().pedidos; const o = pedidos[pIdx].layouts[lIdx].obsTags; const i = o.indexOf(tag); if (i >= 0) o.splice(i, 1); else o.push(tag); set({ pedidos: [...pedidos] }) },

  registrarPagamento: (pedido) => {
    const p = get().pedidos.find(x => x.pedido === pedido); if (!p) return
    const t = pedTotais(p).valor; const fin = { ...get().fin }; if (!fin[pedido]) fin[pedido] = { sinal: 0 }
    if (fin[pedido].sinal <= 0) { fin[pedido] = { sinal: +(t * 0.5).toFixed(2) }; get().toast('Sinal de 50% registrado em ' + pedido) }
    else { fin[pedido] = { sinal: t }; get().toast('Saldo baixado — ' + pedido + ' quitado') }
    set({ fin })
  },
  toast: (msg) => { TID++; const id = TID; set({ toasts: [...get().toasts, { id, msg }] }); setTimeout(() => get().dismissToast(id), 2600) },
  dismissToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}))

export { CLIENTES }
