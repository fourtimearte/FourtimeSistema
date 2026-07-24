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
  past: Pedido[]; future: Pedido[]; layoutClip: Layout | null
  clientes: Cliente[]; cliSeq: number
  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => Cliente
  updateCliente: (id: number, partial: Partial<Cliente>) => void
  deleteCliente: (id: number) => void
  login: (perfil: string) => void
  goto: (p: PageId) => void
  toggleDinheiro: () => void
  rebuildKanban: () => void
  aprovarPedido: (pedido: string) => TecnicaKey[] | null
  moveCard: (cardId: string, station: string) => void
  abrirNoEditor: (pedido: string) => void
  setCurPed: (i: number) => void
  novoOrcamento: () => void
  criarPedidoDe: (base: Pedido, cli?: Cliente) => void
  undo: () => void; redo: () => void
  copyLayout: (pIdx: number, lIdx: number) => void
  pasteLayout: (pIdx: number, lIdx?: number) => void
  abrirPedido: (p: Pedido) => void
  fecharAba: (idx: number) => void
  updateHeader: (idx: number, field: keyof Pedido, value: string) => void
  patchPedido: (idx: number, partial: Partial<Pedido>) => void
  toggleHeaderObsTag: (idx: number, tag: string) => void
  patchLayout: (pIdx: number, lIdx: number, partial: Partial<Layout>) => void
  addLayout: (pIdx: number) => void
  duplicateLayout: (pIdx: number, lIdx: number) => void
  deleteLayout: (pIdx: number, lIdx: number) => void
  setGrade: (pIdx: number, lIdx: number, grade: 'adulto' | 'infantil') => void
  setGenero: (pIdx: number, lIdx: number, genero: string) => void
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
  addAnot: (idx: number, a: import('./model').Anotacao) => void
  updAnot: (idx: number, id: string, partial: Partial<import('./model').Anotacao>) => void
  delAnot: (idx: number, id: string) => void
  clearAnot: (idx: number) => void
  registrarPagamento: (pedido: string) => void
  toast: (msg: string) => void
  dismissToast: (id: number) => void
}

let KID = 0, TID = 0
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
/* Roteador MARK42: o orçamento APROVADO se divide pelas tags de Design de
   cada layout e vira vários "pedidos de departamento" — um card por técnica,
   carregando exatamente os layouts (L-NN) que aquele departamento produz. */
function roteia(pedidos: Pedido[], prev?: KCard[]): KCard[] {
  KID = 0; const cards: KCard[] = []
  pedidos.filter(p => p.aprovado).forEach(p => {
    const tot = pedTotais(p)
    pedTecnicas(p).forEach(tec => {
      KID++
      const lays: string[] = []; let pecas = 0
      p.layouts.forEach((l, i) => {
        if (l.design.some(d => d.tag === tec)) {
          lays.push('L-' + String(i + 1).padStart(2, '0'))
          pecas += Object.values(l.tamanhos).reduce((s, t) => s + (t?.qtd ?? 0), 0)
        }
      })
      /* preserva a estação de um card já em produção (re-rotear não “volta” o card) */
      const antes = prev?.find(c => c.pedido === p.pedido && c.tec === tec)
      cards.push({ id: 'k' + KID, pedido: p.pedido, cliente: p.cliente, tec, station: antes?.station ?? (TECNICAS[tec].entry as string), prazo: p.entrega, late: !!p.late, val: tot.valor, artes: p.layouts.length, lays, pecas })
    })
  })
  return cards
}
function novoPedido(seq: number, perfil: string): Pedido {
  return { pedido: 'PD' + String(seq).padStart(6, '0'), clienteId: null, cliente: '', cpf: '', vendedor: perfil === 'Comercial' ? '' : perfil, contato: '', depto: '', embalagem: '', entrega: '', envio: '', pagamento: '50% sinal + saldo', obs: '', obsTags: [], status: 'rascunho', aprovado: false, layouts: [novoLayout()], criadoPor: perfil, atualizadoEm: new Date().toISOString() }
}

export const useApp = create<AppState>((set, get) => {
  /** ponto único de edição: grava histórico do pedido ativo, aplica e re-roteia */
  const edit = (pIdx: number, mut: (pedidos: Pedido[]) => void) => {
    const st = get()
    const past = [...st.past, clone(st.pedidos[st.curPed])].slice(-40)
    const pedidos = st.pedidos
    mut(pedidos)
    if (pedidos[pIdx]) pedidos[pIdx].atualizadoEm = new Date().toISOString()
    set({ pedidos: [...pedidos], past, future: [], kcards: pedidos[pIdx].aprovado ? roteia(pedidos, st.kcards) : st.kcards })
  }
  return {
    logged: false, perfil: 'Administração', page: 'dashboard',
    pedidos: clone(PEDIDOS_SEED), kcards: roteia(PEDIDOS_SEED),
    fin: { PD003929: { sinal: 0 }, PD003912: { sinal: 1798.5 }, PD003940: { sinal: 299 }, PD003944: { sinal: 0 } },
    seq: 3945, curPed: 0, semDinheiro: false, toasts: [], past: [], future: [], layoutClip: null,
    clientes: clone(CLIENTES), cliSeq: CLIENTES.length,

    addCliente: (c) => {
      const cliSeq = get().cliSeq + 1
      const novo: Cliente = { ativo: true, ...c, id: cliSeq, criadoEm: new Date().toISOString() }
      set({ clientes: [novo, ...get().clientes], cliSeq })
      get().toast('Cliente "' + novo.nome + '" cadastrado')
      return novo
    },
    updateCliente: (id, partial) => {
      set({ clientes: get().clientes.map(c => c.id === id ? { ...c, ...partial, id } : c) })
      get().toast('Cliente atualizado')
    },
    deleteCliente: (id) => {
      const c = get().clientes.find(x => x.id === id)
      set({ clientes: get().clientes.filter(x => x.id !== id) })
      get().toast(c ? 'Cliente "' + c.nome + '" removido' : 'Cliente removido')
    },

    login: (perfil) => set({ logged: true, perfil, page: perfil === 'Produção' ? 'producao' : perfil === 'Comercial' ? 'comercial' : 'dashboard' }),
    goto: (page) => set({ page }),
    toggleDinheiro: () => set({ semDinheiro: !get().semDinheiro }),
    rebuildKanban: () => set({ kcards: roteia(get().pedidos, get().kcards) }),
    aprovarPedido: (pedido) => {
      const p = get().pedidos.find(x => x.pedido === pedido); if (!p) return null
      const tecs = pedTecnicas(p); if (!tecs.length) return null
      p.aprovado = true; p.status = 'producao'
      set({ pedidos: [...get().pedidos], kcards: roteia(get().pedidos, get().kcards) }); return tecs
    },
    moveCard: (cardId, station) => {
      const kcards = get().kcards.map(c => c.id === cardId ? { ...c, station, late: station === 'entregue' ? false : c.late } : c)
      /* sincroniza o pedido-mãe: todas as fatias entregues → pedido entregue */
      const moved = kcards.find(c => c.id === cardId)
      let pedidos = get().pedidos
      if (moved) {
        const irmas = kcards.filter(c => c.pedido === moved.pedido)
        const todasEntregues = irmas.every(c => c.station === 'entregue')
        const p = pedidos.find(x => x.pedido === moved.pedido)
        if (p) {
          const novo: typeof p.status = todasEntregues ? 'entregue' : 'producao'
          if (p.status !== novo) { p.status = novo; if (todasEntregues) p.late = false; pedidos = [...pedidos] }
        }
      }
      set({ kcards, pedidos })
    },
    abrirNoEditor: (pedido) => {
      const i = get().pedidos.findIndex(p => p.pedido === pedido)
      if (i < 0) return
      set({ curPed: i, page: 'comercial', past: [], future: [] })
      get().toast('Aberto no editor: ' + pedido)
    },
    setCurPed: (curPed) => set({ curPed, past: [], future: [] }),

    novoOrcamento: () => { const seq = get().seq + 1; const p = novoPedido(seq, get().perfil); set({ pedidos: [p, ...get().pedidos], fin: { ...get().fin, [p.pedido]: { sinal: 0 } }, seq, curPed: 0, page: 'comercial', past: [], future: [] }); get().toast('Novo orçamento ' + p.pedido) },
    criarPedidoDe: (base, cli) => {
      const seq = get().seq + 1; const p: Pedido = clone(base)
      p.pedido = 'PD' + String(seq).padStart(6, '0'); p.status = 'rascunho'; p.aprovado = false; p.late = false
      p.criadoPor = get().perfil; p.atualizadoEm = new Date().toISOString()
      if (cli) { p.clienteId = cli.id; p.cliente = cli.nome; p.cpf = cli.doc; p.contato = cli.contato; p.vendedor = cli.vendedor; p.endereco = [cli.endereco, cli.cidade].filter(Boolean).join(' — ') }
      set({ pedidos: [p, ...get().pedidos], fin: { ...get().fin, [p.pedido]: { sinal: 0 } }, seq, curPed: 0, page: 'comercial', past: [], future: [] }); get().toast('Novo orçamento ' + p.pedido + ' criado')
    },
    undo: () => {
      const st = get(); if (!st.past.length) return
      const past = [...st.past]; const prev = past.pop() as Pedido
      const pedidos = st.pedidos; const cur = clone(pedidos[st.curPed]); pedidos[st.curPed] = prev
      set({ pedidos: [...pedidos], past, future: [cur, ...st.future].slice(0, 40), kcards: pedidos[st.curPed].aprovado ? roteia(pedidos, st.kcards) : st.kcards })
    },
    redo: () => {
      const st = get(); if (!st.future.length) return
      const future = [...st.future]; const next = future.shift() as Pedido
      const pedidos = st.pedidos; const cur = clone(pedidos[st.curPed]); pedidos[st.curPed] = next
      set({ pedidos: [...pedidos], future, past: [...st.past, cur].slice(-40), kcards: pedidos[st.curPed].aprovado ? roteia(pedidos, st.kcards) : st.kcards })
    },

    copyLayout: (pIdx, lIdx) => { set({ layoutClip: clone(get().pedidos[pIdx].layouts[lIdx]) }); get().toast('Layout L-' + String(lIdx + 1).padStart(2, '0') + ' copiado') },
    pasteLayout: (pIdx, lIdx) => { const clip = get().layoutClip; if (!clip) return; edit(pIdx, ped => { if (lIdx == null) ped[pIdx].layouts.push(clone(clip)); else ped[pIdx].layouts[lIdx] = clone(clip) }); get().toast(lIdx == null ? 'Layout colado' : 'Layout colado sobre L-' + String(lIdx + 1).padStart(2, '0')) },
    abrirPedido: (p) => { const seq = get().seq; set({ pedidos: [p, ...get().pedidos], fin: { ...get().fin, [p.pedido]: get().fin[p.pedido] ?? { sinal: 0 } }, curPed: 0, page: 'comercial', past: [], future: [], seq }); get().toast('Aberto ' + p.pedido) },
    fecharAba: (idx) => {
      const st = get(); if (idx < 0 || idx >= st.pedidos.length) return
      const pedidos = st.pedidos.filter((_, i) => i !== idx)
      let curPed = st.curPed
      if (idx < st.curPed) curPed = st.curPed - 1
      else if (idx === st.curPed) curPed = Math.min(st.curPed, pedidos.length - 1)
      set({ pedidos, curPed: Math.max(0, curPed), past: [], future: [] })
    },

    updateHeader: (idx, field, value) => edit(idx, ped => { (ped[idx] as any)[field] = value }),
    patchPedido: (idx, partial) => edit(idx, ped => Object.assign(ped[idx], partial)),
    toggleHeaderObsTag: (idx, tag) => edit(idx, ped => { const o = ped[idx].obsTags ?? (ped[idx].obsTags = []); const i = o.indexOf(tag); if (i >= 0) o.splice(i, 1); else o.push(tag) }),
    patchLayout: (pIdx, lIdx, partial) => edit(pIdx, ped => Object.assign(ped[pIdx].layouts[lIdx], partial)),
    addLayout: (pIdx) => edit(pIdx, ped => { ped[pIdx].layouts.push(novoLayout()) }),
    duplicateLayout: (pIdx, lIdx) => { edit(pIdx, ped => ped[pIdx].layouts.splice(lIdx + 1, 0, clone(ped[pIdx].layouts[lIdx]))); get().toast('Layout duplicado') },
    deleteLayout: (pIdx, lIdx) => { if (get().pedidos[pIdx].layouts.length <= 1) return; edit(pIdx, ped => ped[pIdx].layouts.splice(lIdx, 1)) },
    setGrade: (pIdx, lIdx, grade) => edit(pIdx, ped => { ped[pIdx].layouts[lIdx].grade = grade }),
    setGenero: (pIdx, lIdx, genero) => edit(pIdx, ped => { ped[pIdx].layouts[lIdx].genero = genero }),
    setTecido: (pIdx, lIdx, tIdx, value) => edit(pIdx, ped => { ped[pIdx].layouts[lIdx].tecidos[tIdx] = value }),
    addTecido: (pIdx, lIdx) => edit(pIdx, ped => { ped[pIdx].layouts[lIdx].tecidos.push('') }),
    removeTecido: (pIdx, lIdx, tIdx) => edit(pIdx, ped => { const t = ped[pIdx].layouts[lIdx].tecidos; if (t.length > 1) t.splice(tIdx, 1) }),
    toggleDesign: (pIdx, lIdx, tag) => {
      const d = get().pedidos[pIdx].layouts[lIdx].design
      if (d.some(x => x.tag === tag) && d.length <= 1) { get().toast('O layout precisa de ao menos 1 técnica'); return }
      edit(pIdx, ped => { const dd = ped[pIdx].layouts[lIdx].design; const i = dd.findIndex(x => x.tag === tag); if (i >= 0) dd.splice(i, 1); else dd.push({ tag, cores: [] }) })
    },
    addDesignCor: (pIdx, lIdx, tag, code) => edit(pIdx, ped => { const dt = ped[pIdx].layouts[lIdx].design.find(x => x.tag === tag); if (dt && !dt.cores.includes(code)) dt.cores.push(code) }),
    removeDesignCor: (pIdx, lIdx, tag, code) => edit(pIdx, ped => { const dt = ped[pIdx].layouts[lIdx].design.find(x => x.tag === tag); if (dt) dt.cores = dt.cores.filter(c => c !== code) }),
    setSize: (pIdx, lIdx, tam, field, value) => edit(pIdx, ped => { const tm = ped[pIdx].layouts[lIdx].tamanhos; if (!tm[tam]) tm[tam] = { qtd: 0, uni: 0 }; tm[tam][field] = value }),
    setImg: (pIdx, lIdx, data) => edit(pIdx, ped => { ped[pIdx].layouts[lIdx].img = data }),
    setObs: (pIdx, lIdx, value) => edit(pIdx, ped => { ped[pIdx].layouts[lIdx].obs = value }),
    toggleObsTag: (pIdx, lIdx, tag) => edit(pIdx, ped => { const o = ped[pIdx].layouts[lIdx].obsTags; const i = o.indexOf(tag); if (i >= 0) o.splice(i, 1); else o.push(tag) }),

    addAnot: (idx, a) => edit(idx, ped => { (ped[idx].anotacoes ?? (ped[idx].anotacoes = [])).push(a) }),
    updAnot: (idx, id, partial) => edit(idx, ped => { const an = ped[idx].anotacoes?.find(x => x.id === id); if (an) Object.assign(an, partial) }),
    delAnot: (idx, id) => edit(idx, ped => { ped[idx].anotacoes = (ped[idx].anotacoes ?? []).filter(x => x.id !== id) }),
    clearAnot: (idx) => edit(idx, ped => { ped[idx].anotacoes = [] }),
    registrarPagamento: (pedido) => {
      const p = get().pedidos.find(x => x.pedido === pedido); if (!p) return
      const t = pedTotais(p).valor; const fin = { ...get().fin }; if (!fin[pedido]) fin[pedido] = { sinal: 0 }
      if (fin[pedido].sinal <= 0) { fin[pedido] = { sinal: +(t * 0.5).toFixed(2) }; get().toast('Sinal de 50% registrado em ' + pedido) }
      else { fin[pedido] = { sinal: t }; get().toast('Saldo baixado — ' + pedido + ' quitado') }
      set({ fin })
    },
    toast: (msg) => { TID++; const id = TID; set({ toasts: [...get().toasts, { id, msg }] }); setTimeout(() => get().dismissToast(id), 2600) },
    dismissToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
  }
})

export { CLIENTES }
