/* =====================================================================
   Modelo de dados + motor de roteamento (portado do protótipo v1).
   Na Fase 3 este mock é trocado por chamadas à API (TanStack Query),
   mantendo os mesmos tipos.
   ===================================================================== */

export type TecnicaKey = 'DTF' | 'Subli' | 'Silk' | 'Patch' | 'Bordado' | 'Etiqueta'

export interface Tecnica { label: string; cor: string; entry: string | null }
export const TECNICAS: Record<TecnicaKey, Tecnica> = {
  DTF: { label: 'DTF', cor: '--set-dtf', entry: 'dtf_arte' },
  Subli: { label: 'Sublimação', cor: '--set-sublimacao', entry: 'sub_imp' },
  Silk: { label: 'Silk', cor: '--set-silk', entry: 'silk_arte' },
  Patch: { label: 'Patch', cor: '--set-corte', entry: 'acab' },
  Bordado: { label: 'Bordado', cor: '--set-bordado', entry: 'acab' },
  Etiqueta: { label: 'Etiqueta', cor: '--set-costura', entry: null },
}
export const DESIGN_ORDER: TecnicaKey[] = ['DTF', 'Subli', 'Silk', 'Patch', 'Bordado', 'Etiqueta']

export interface Station { id: string; nome: string; lane: string }
export const STATIONS: Station[] = [
  { id: 'dtf_arte', nome: 'Arte DTF', lane: '--set-dtf' },
  { id: 'dtf_imp', nome: 'Impressão DTF', lane: '--set-dtf' },
  { id: 'dtf_prensa', nome: 'Recorte + Prensa', lane: '--set-dtf' },
  { id: 'silk_arte', nome: 'Arte / Tela Silk', lane: '--set-silk' },
  { id: 'silk_imp', nome: 'Silkar a Peça', lane: '--set-silk' },
  { id: 'sub_imp', nome: 'Impressão Subli', lane: '--set-sublimacao' },
  { id: 'sub_cal', nome: 'Calandra + Laser', lane: '--set-sublimacao' },
  { id: 'acab', nome: 'Acabamento', lane: '--set-bordado' },
  { id: 'costura', nome: 'CD Costura', lane: '--set-costura' },
  { id: 'cq', nome: 'CQ + Embalagem', lane: '--set-embalagem' },
  { id: 'despacho', nome: 'Despacho', lane: '--set-expedicao' },
  { id: 'entregue', nome: 'Entregue', lane: '--set-expedicao' },
]

export interface Cliente { id: number; nome: string; doc: string; contato: string; endereco: string; vendedor: string; segmento: string }
export interface BomItem { insumoId: number; qtd: number; un: string }
export interface Referencia { cod: string; nome: string; genero: string; design: TecnicaKey[]; bom: BomItem[] }
export interface Insumo { id: number; nome: string; tipo: string; un: string; saldo: number; minimo: number; custo: number }
export interface Tamanho { tam: string; qtd: number; uni: number; inf?: boolean }
export interface Layout { refCod: string; ref: string; tecido: string; cor: string; corHex: string; design: TecnicaKey[]; grade: string; tamanhos: Tamanho[] }
export type Status = 'rascunho' | 'aprovado' | 'producao' | 'entregue'
export interface Pedido {
  pedido: string; clienteId: number | null; cliente: string; vendedor: string; contato: string;
  entrega: string; pagamento: string; depto: string; status: Status; aprovado: boolean; late?: boolean; layouts: Layout[]
}
export interface KCard { id: string; pedido: string; cliente: string; tec: TecnicaKey; station: string; prazo: string; late: boolean; val: number; artes: number }

export const CLIENTES: Cliente[] = [
  { id: 1, nome: 'Escola João XXIII', doc: '12.345.678/0001-11', contato: '(62) 99912-3421', endereco: 'Goiânia-GO', vendedor: 'Henrique', segmento: 'Escola' },
  { id: 2, nome: 'Time Vôlei Sub-15', doc: '—', contato: '(62) 98110-7788', endereco: 'Aparecida-GO', vendedor: 'Daniele', segmento: 'Esporte' },
  { id: 3, nome: 'Academia Pulse', doc: '22.987.654/0001-90', contato: '(62) 99740-1122', endereco: 'Goiânia-GO', vendedor: 'Henrique', segmento: 'Academia' },
  { id: 4, nome: 'Padaria Estrela', doc: '33.111.222/0001-45', contato: '(62) 99655-3030', endereco: 'Trindade-GO', vendedor: 'Kevelin', segmento: 'Comércio' },
  { id: 5, nome: 'Auto Peças Silva', doc: '44.222.333/0001-70', contato: '(62) 99333-8080', endereco: 'Goiânia-GO', vendedor: 'Daniele', segmento: 'Indústria' },
  { id: 6, nome: 'Faculdade Sigma', doc: '55.444.555/0001-32', contato: '(62) 98800-4545', endereco: 'Anápolis-GO', vendedor: 'Henrique', segmento: 'Faculdade' },
]
export const INSUMOS: Insumo[] = [
  { id: 1, nome: 'Malha Dry-fit PET', tipo: 'Tecido', un: 'kg', saldo: 180, minimo: 60, custo: 38.0 },
  { id: 2, nome: 'Malha PV (Poliviscose)', tipo: 'Tecido', un: 'kg', saldo: 44, minimo: 50, custo: 32.5 },
  { id: 3, nome: 'Tinta DTF branca', tipo: 'Tinta', un: 'L', saldo: 12, minimo: 6, custo: 210.0 },
  { id: 4, nome: 'Tinta Sublimação (kit)', tipo: 'Tinta', un: 'L', saldo: 5, minimo: 8, custo: 180.0 },
  { id: 5, nome: 'Filme DTF', tipo: 'Insumo', un: 'm', saldo: 320, minimo: 100, custo: 4.2 },
  { id: 6, nome: 'Punho ribana', tipo: 'Aviamento', un: 'par', saldo: 640, minimo: 200, custo: 2.1 },
  { id: 7, nome: 'Gola careca', tipo: 'Aviamento', un: 'un', saldo: 410, minimo: 150, custo: 1.8 },
  { id: 8, nome: 'Elástico 3cm', tipo: 'Aviamento', un: 'm', saldo: 75, minimo: 120, custo: 0.9 },
  { id: 9, nome: 'Tela de silk 120 fios', tipo: 'Insumo', un: 'un', saldo: 18, minimo: 8, custo: 45.0 },
  { id: 10, nome: 'Linha costura (cone)', tipo: 'Aviamento', un: 'un', saldo: 96, minimo: 40, custo: 9.5 },
]
export const REFERENCIAS: Referencia[] = [
  { cod: 'REF-4021', nome: 'Camiseta dry-fit gola careca', genero: 'Adulto', design: ['DTF', 'Silk'], bom: [{ insumoId: 1, qtd: 0.22, un: 'kg' }, { insumoId: 7, qtd: 1, un: 'un' }, { insumoId: 10, qtd: 0.05, un: 'un' }] },
  { cod: 'REF-2087', nome: 'Uniforme sublimado manga curta', genero: 'Adulto', design: ['Subli'], bom: [{ insumoId: 1, qtd: 0.26, un: 'kg' }, { insumoId: 4, qtd: 0.02, un: 'L' }, { insumoId: 10, qtd: 0.06, un: 'un' }] },
  { cod: 'REF-1150', nome: 'Camiseta silk algodão', genero: 'Adulto', design: ['Silk'], bom: [{ insumoId: 2, qtd: 0.2, un: 'kg' }, { insumoId: 9, qtd: 0.02, un: 'un' }, { insumoId: 10, qtd: 0.04, un: 'un' }] },
  { cod: 'REF-3310', nome: 'Regata dry treino', genero: 'Adulto', design: ['DTF'], bom: [{ insumoId: 1, qtd: 0.18, un: 'kg' }, { insumoId: 8, qtd: 0.3, un: 'm' }, { insumoId: 10, qtd: 0.04, un: 'un' }] },
  { cod: 'REF-5502', nome: 'Polo piquet bordada', genero: 'Adulto', design: ['Bordado'], bom: [{ insumoId: 2, qtd: 0.24, un: 'kg' }, { insumoId: 7, qtd: 1, un: 'un' }, { insumoId: 6, qtd: 1, un: 'par' }] },
]
export const PEDIDOS_SEED: Pedido[] = [
  { pedido: 'PD003929', clienteId: 1, cliente: 'Escola João XXIII', vendedor: 'Henrique', contato: '(62) 99912-3421', entrega: '22/07/2026', pagamento: '50% sinal + saldo', depto: 'Uniformes', status: 'rascunho', aprovado: false,
    layouts: [{ refCod: 'REF-4021', ref: 'Camiseta dry-fit gola careca', tecido: 'Dry-fit 100% poliéster', cor: 'Azul-marinho', corHex: '#12213F', design: ['DTF', 'Silk'], grade: 'adulto',
      tamanhos: [{ tam: '10A', qtd: 6, uni: 79.9, inf: true }, { tam: 'PP', qtd: 4, uni: 89.9 }, { tam: 'M', qtd: 10, uni: 89.9 }, { tam: 'G', qtd: 8, uni: 89.9 }] }] },
  { pedido: 'PD003912', clienteId: 2, cliente: 'Time Vôlei Sub-15', vendedor: 'Daniele', contato: '(62) 98110-7788', entrega: '14/07/2026', pagamento: 'À vista', depto: 'Esporte', status: 'producao', aprovado: true, late: true,
    layouts: [{ refCod: 'REF-2087', ref: 'Uniforme sublimado manga curta', tecido: 'Dry-fit PET', cor: 'Full print', corHex: '#0E7490', design: ['Subli'], grade: 'adulto',
      tamanhos: [{ tam: 'P', qtd: 8, uni: 119.9 }, { tam: 'M', qtd: 12, uni: 119.9 }, { tam: 'G', qtd: 10, uni: 119.9 }] }] },
  { pedido: 'PD003940', clienteId: 4, cliente: 'Padaria Estrela', vendedor: 'Kevelin', contato: '(62) 99655-3030', entrega: '25/07/2026', pagamento: '50% sinal + saldo', depto: 'Comércio', status: 'aprovado', aprovado: true,
    layouts: [{ refCod: 'REF-1150', ref: 'Camiseta silk algodão', tecido: 'PV', cor: 'Preto', corHex: '#1B1B1F', design: ['Silk'], grade: 'adulto',
      tamanhos: [{ tam: 'M', qtd: 6, uni: 49.9 }, { tam: 'G', qtd: 6, uni: 49.9 }] }] },
  { pedido: 'PD003944', clienteId: 3, cliente: 'Academia Pulse', vendedor: 'Henrique', contato: '(62) 99740-1122', entrega: '28/07/2026', pagamento: 'À vista', depto: 'Academia', status: 'aprovado', aprovado: true,
    layouts: [
      { refCod: 'REF-3310', ref: 'Regata dry treino', tecido: 'Dry-fit PET', cor: 'Royal', corHex: '#2456C6', design: ['DTF'], grade: 'adulto', tamanhos: [{ tam: 'P', qtd: 10, uni: 69.9 }, { tam: 'M', qtd: 14, uni: 69.9 }, { tam: 'G', qtd: 8, uni: 69.9 }] },
      { refCod: 'REF-5502', ref: 'Polo piquet bordada', tecido: 'Piquet', cor: 'Marinho', corHex: '#12213F', design: ['Bordado'], grade: 'adulto', tamanhos: [{ tam: 'M', qtd: 6, uni: 98.0 }, { tam: 'G', qtd: 6, uni: 98.0 }] },
    ] },
]

/* ---- helpers de negócio ---- */
export function pedTotais(p: Pedido) {
  let pecas = 0, valor = 0
  p.layouts.forEach(l => l.tamanhos.forEach(t => { pecas += t.qtd; valor += t.qtd * t.uni }))
  return { pecas, valor }
}
export function pedTecnicas(p: Pedido): TecnicaKey[] {
  const s = new Set<TecnicaKey>()
  p.layouts.forEach(l => l.design.forEach(d => { if (TECNICAS[d] && TECNICAS[d].entry) s.add(d) }))
  return [...s]
}
export function insumoNome(id: number) { return INSUMOS.find(i => i.id === id)?.nome ?? '?' }
export function bomCusto(r: Referencia) { return r.bom.reduce((s, b) => { const i = INSUMOS.find(x => x.id === b.insumoId); return s + (i ? i.custo * b.qtd : 0) }, 0) }
export const CORES: { nome: string; hex: string }[] = [
  { nome: 'Preto', hex: '#1B1B1F' }, { nome: 'Branco', hex: '#F3F4F6' }, { nome: 'Vermelho Fourtime', hex: '#C6161B' },
  { nome: 'Azul-marinho', hex: '#12213F' }, { nome: 'Royal', hex: '#2456C6' }, { nome: 'Verde bandeira', hex: '#0B7A3B' },
  { nome: 'Amarelo ouro', hex: '#F2B705' }, { nome: 'Laranja', hex: '#EA580C' }, { nome: 'Rosa pink', hex: '#DB2777' },
  { nome: 'Roxo', hex: '#6D28D9' }, { nome: 'Cinza mescla', hex: '#9AA1AC' }, { nome: 'Grafite', hex: '#3A3F47' },
]
export function corHexPorNome(nome: string): string {
  const c = CORES.find(x => x.nome.toLowerCase() === nome.trim().toLowerCase())
  return c ? c.hex : '#98A3B0'
}
export function money(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
export function moneyK(v: number) { return v >= 1000 ? 'R$ ' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : 'R$ ' + money(v) }
