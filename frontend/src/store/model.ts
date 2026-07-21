/* =====================================================================
   Modelo de dados — schema .ft (superset do editor v172) + roteamento.
   NÃO remover campos — só acrescentar (contrato .ft inviolável).
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
/** técnicas que abrem seletor de código de cor (como no v172) */
export const TEM_CODIGO: TecnicaKey[] = ['DTF', 'Subli']

/* grades de tamanho (v172) */
export const TAM_ADULTO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'G1', 'G2', 'G3', 'G4']
export const TAM_INFANTIL = ['2A', '4A', '6A', '8A', '10A', '12A', '14A']
export const isInfantil = (t: string) => TAM_INFANTIL.includes(t)

/* paletas de código de cor (placeholder — substituir pelos hex reais do v172) */
function paleta(prefix: string, n: number, pad: number) {
  const arr: { code: string; hex: string }[] = []
  for (let i = 1; i <= n; i++) {
    const code = prefix + String(i).padStart(pad, '0')
    const h = Math.round((i * 137.508) % 360); const s = 52 + (i % 4) * 10; const l = 44 + (i % 5) * 6
    arr.push({ code, hex: `hsl(${h} ${s}% ${l}%)` })
  }
  return arr
}
export const DTF_CORES = paleta('', 300, 3)          // 001..300
export const SB_CORES = paleta('S', 87, 2)           // S01..S87
export function codigoHex(tag: TecnicaKey, code: string): string {
  const tbl = tag === 'DTF' ? DTF_CORES : tag === 'Subli' ? SB_CORES : []
  return tbl.find(c => c.code === code)?.hex ?? '#98A3B0'
}

export const CORES: { nome: string; hex: string }[] = [
  { nome: 'Preto', hex: '#1B1B1F' }, { nome: 'Branco', hex: '#F3F4F6' }, { nome: 'Vermelho Fourtime', hex: '#C6161B' },
  { nome: 'Azul-marinho', hex: '#12213F' }, { nome: 'Royal', hex: '#2456C6' }, { nome: 'Verde bandeira', hex: '#0B7A3B' },
  { nome: 'Amarelo ouro', hex: '#F2B705' }, { nome: 'Laranja', hex: '#EA580C' }, { nome: 'Rosa pink', hex: '#DB2777' },
  { nome: 'Roxo', hex: '#6D28D9' }, { nome: 'Cinza mescla', hex: '#9AA1AC' }, { nome: 'Grafite', hex: '#3A3F47' },
]
export function corHexPorNome(nome: string): string {
  return CORES.find(x => x.nome.toLowerCase() === nome.trim().toLowerCase())?.hex ?? '#98A3B0'
}
export const OBS_TAGS = [{ tag: 'URGENTE', cor: 'var(--danger)' }, { tag: 'ATRASADO', cor: 'var(--warning)' }]
/* catálogos p/ autocomplete (Banco de Dados do v172) */
export const TECIDOS = ['Dry-fit 100% poliéster', 'Dry-fit PET', 'Malha PV (Poliviscose)', 'Piquet', 'Helanca light', 'Dry premium', 'Ribana', 'Algodão penteado 30.1', 'Poliéster', 'Moletom flanelado', 'Tactel', 'Oxford']
export const VENDEDORES = ['Henrique', 'Daniele', 'Kevelin', 'Planejamento', 'Arte']
export const DEPARTAMENTOS = ['Uniformes', 'Esporte', 'Comércio', 'Academia', 'Faculdade', 'Escola', 'Eventos', 'Corporativo']
export const EMBALAGENS = ['Saco individual', 'Caixa', 'A granel', 'Sacola personalizada']
export const PAGAMENTOS = ['À vista', '50% sinal + saldo', '30/60', 'Pix', 'Cartão 3x', 'Boleto']

/* ---- tipos ---- */
export interface Cliente { id: number; nome: string; doc: string; contato: string; endereco: string; vendedor: string; segmento: string }
export interface BomItem { insumoId: number; qtd: number; un: string }
export interface Referencia { cod: string; nome: string; genero: string; design: TecnicaKey[]; bom: BomItem[] }
export interface Insumo { id: number; nome: string; tipo: string; un: string; saldo: number; minimo: number; custo: number }
export interface Tamanho { qtd: number; uni: number }
export interface DesignTag { tag: TecnicaKey; cores: string[] }
export interface Layout {
  refCod: string; ref: string; grade: 'adulto' | 'infantil'
  tecidos: string[]; cor: string; corHex: string
  design: DesignTag[]
  tamanhos: Record<string, Tamanho>
  img: string | null; obs: string; obsTags: string[]
}
export type Status = 'rascunho' | 'aprovado' | 'producao' | 'entregue'
/** anotação livre sobre a folha A4. x/y/w/h em fração (0..1) do documento. */
export interface Anotacao { id: string; tipo: 'circulo' | 'retangulo' | 'seta' | 'texto'; x: number; y: number; w: number; h: number; cor: string; texto?: string }
export const ANOT_CORES = ['#C6161B', '#2563EB', '#047857', '#EA580C', '#161A20']
export interface Pedido {
  pedido: string; clienteId: number | null; cliente: string; cpf: string; vendedor: string; contato: string
  depto: string; embalagem: string; entrega: string; envio: string; pagamento: string; obs: string; obsTags?: string[]
  status: Status; aprovado: boolean; late?: boolean; layouts: Layout[]; anotacoes?: Anotacao[]
}
export interface KCard { id: string; pedido: string; cliente: string; tec: TecnicaKey; station: string; prazo: string; late: boolean; val: number; artes: number }

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

/* ---- dados mock ---- */
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

function dt(tag: TecnicaKey, cores: string[] = []): DesignTag { return { tag, cores } }
function L(o: Partial<Layout>): Layout {
  return { refCod: '', ref: 'Nova referência', grade: 'adulto', tecidos: [''], cor: '', corHex: '#98A3B0', design: [dt('DTF')], tamanhos: {}, img: null, obs: '', obsTags: [], ...o }
}
export function novoLayout(): Layout { return L({ tamanhos: { P: { qtd: 0, uni: 0 }, M: { qtd: 0, uni: 0 }, G: { qtd: 0, uni: 0 } } }) }

export const PEDIDOS_SEED: Pedido[] = [
  { pedido: 'PD003929', clienteId: 1, cliente: 'Escola João XXIII', cpf: '12.345.678/0001-11', vendedor: 'Henrique', contato: '(62) 99912-3421', depto: 'Uniformes', embalagem: 'Saco individual', entrega: '22/07/2026', envio: '', pagamento: '50% sinal + saldo', obs: 'Arte aprovada pelo cliente', status: 'rascunho', aprovado: false,
    layouts: [L({ refCod: 'REF-4021', ref: 'Camiseta dry-fit gola careca', grade: 'adulto', tecidos: ['Dry-fit 100% poliéster', 'Ribana punho'], cor: 'Azul-marinho', corHex: '#12213F', design: [dt('DTF', ['017', '142']), dt('Silk')], tamanhos: { '10A': { qtd: 6, uni: 79.9 }, PP: { qtd: 4, uni: 89.9 }, M: { qtd: 10, uni: 89.9 }, G: { qtd: 8, uni: 89.9 } } })] },
  { pedido: 'PD003912', clienteId: 2, cliente: 'Time Vôlei Sub-15', cpf: '—', vendedor: 'Daniele', contato: '(62) 98110-7788', depto: 'Esporte', embalagem: 'Caixa', entrega: '14/07/2026', envio: '', pagamento: 'À vista', obs: '', status: 'producao', aprovado: true, late: true,
    layouts: [L({ refCod: 'REF-2087', ref: 'Uniforme sublimado manga curta', grade: 'adulto', tecidos: ['Dry-fit PET'], cor: 'Full print', corHex: '#0E7490', design: [dt('Subli', ['S12', 'S40'])], tamanhos: { P: { qtd: 8, uni: 119.9 }, M: { qtd: 12, uni: 119.9 }, G: { qtd: 10, uni: 119.9 } } })] },
  { pedido: 'PD003940', clienteId: 4, cliente: 'Padaria Estrela', cpf: '33.111.222/0001-45', vendedor: 'Kevelin', contato: '(62) 99655-3030', depto: 'Comércio', embalagem: '', entrega: '25/07/2026', envio: '', pagamento: '50% sinal + saldo', obs: '', status: 'aprovado', aprovado: true,
    layouts: [L({ refCod: 'REF-1150', ref: 'Camiseta silk algodão', grade: 'adulto', tecidos: ['PV'], cor: 'Preto', corHex: '#1B1B1F', design: [dt('Silk')], tamanhos: { M: { qtd: 6, uni: 49.9 }, G: { qtd: 6, uni: 49.9 } } })] },
  { pedido: 'PD003944', clienteId: 3, cliente: 'Academia Pulse', cpf: '22.987.654/0001-90', vendedor: 'Henrique', contato: '(62) 99740-1122', depto: 'Academia', embalagem: '', entrega: '28/07/2026', envio: '', pagamento: 'À vista', obs: '', status: 'aprovado', aprovado: true,
    layouts: [
      L({ refCod: 'REF-3310', ref: 'Regata dry treino', grade: 'adulto', tecidos: ['Dry-fit PET'], cor: 'Royal', corHex: '#2456C6', design: [dt('DTF', ['201'])], tamanhos: { P: { qtd: 10, uni: 69.9 }, M: { qtd: 14, uni: 69.9 }, G: { qtd: 8, uni: 69.9 } } }),
      L({ refCod: 'REF-5502', ref: 'Polo piquet bordada', grade: 'adulto', tecidos: ['Piquet'], cor: 'Marinho', corHex: '#12213F', design: [dt('Bordado')], tamanhos: { M: { qtd: 6, uni: 98.0 }, G: { qtd: 6, uni: 98.0 } } }),
    ] },
]

/* ---- helpers de negócio ---- */
export function layoutPecas(l: Layout) { return Object.values(l.tamanhos).reduce((s, t) => s + t.qtd, 0) }
export function layoutValor(l: Layout) { return Object.values(l.tamanhos).reduce((s, t) => s + t.qtd * t.uni, 0) }
export function pedTotais(p: Pedido) {
  let pecas = 0, valor = 0
  p.layouts.forEach(l => Object.values(l.tamanhos).forEach(t => { pecas += t.qtd; valor += t.qtd * t.uni }))
  return { pecas, valor }
}
export function pedTecnicas(p: Pedido): TecnicaKey[] {
  const s = new Set<TecnicaKey>()
  p.layouts.forEach(l => l.design.forEach(d => { if (TECNICAS[d.tag] && TECNICAS[d.tag].entry) s.add(d.tag) }))
  return [...s]
}
/** ordem de linhas da tabela: base = grade atual; cruzadas (com qtd) no topo (adulto) ou fim (infantil) */
export function ordemTamanhos(l: Layout): string[] {
  const base = l.grade === 'adulto' ? TAM_ADULTO : TAM_INFANTIL
  const cross = (l.grade === 'adulto' ? TAM_INFANTIL : TAM_ADULTO).filter(t => (l.tamanhos[t]?.qtd ?? 0) > 0 || l.tamanhos[t] !== undefined)
  return l.grade === 'adulto' ? [...cross, ...base] : [...base, ...cross]
}
/** validação antes de aprovar/imprimir (v172 §20): Ref, Tecido, Cor, Design por layout + Departamento */
export function validarPedido(p: Pedido): string[] {
  const errs: string[] = []
  if (!p.depto.trim()) errs.push('Departamento (cabeçalho)')
  p.layouts.forEach((l, i) => {
    const n = 'L-' + String(i + 1).padStart(2, '0')
    if (!l.ref.trim() || l.ref === 'Nova referência') errs.push('Referência (' + n + ')')
    if (!l.tecidos.some(t => t.trim())) errs.push('Tecido (' + n + ')')
    if (!l.cor.trim()) errs.push('Cor (' + n + ')')
    if (!l.design.length) errs.push('Design (' + n + ')')
  })
  return errs
}
export function insumoNome(id: number) { return INSUMOS.find(i => i.id === id)?.nome ?? '?' }
export function bomCusto(r: Referencia) { return r.bom.reduce((s, b) => { const i = INSUMOS.find(x => x.id === b.insumoId); return s + (i ? i.custo * b.qtd : 0) }, 0) }
export function money(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
export function moneyK(v: number) { return v >= 1000 ? 'R$ ' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : 'R$ ' + money(v) }
