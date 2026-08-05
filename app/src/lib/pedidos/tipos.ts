/** Modelo de pedido do V6 — enxuto de propósito.
 *  O contrato completo é o `.ft`; aqui ficam só os campos que as telas leem.
 *  Quando o importador de `.ft` entrar, ele preenche esta forma. */
export type TecnicaKey = 'DTF' | 'Subli' | 'Silk' | 'Patch' | 'Bordado' | 'Etiqueta'
export type StatusPedido = 'rascunho' | 'aprovado' | 'producao' | 'entregue'

export interface Tamanho { qtd: number; uni: number }
export interface Layout {
  ref: string
  cor: string
  tecnicas: TecnicaKey[]
  tamanhos: Record<string, Tamanho>
}
export interface Pedido {
  pedido: string
  clienteId: number | null
  cliente: string
  vendedor: string
  entrega: string          // dd/mm/aaaa
  status: StatusPedido
  estacao?: string         // id da estação no Kanban
  layouts: Layout[]
}

/** Uma técnica = uma cor, do editor ao card do Kanban.
 *  Sai da paleta CATEGÓRICA (--cat-*), não da rampa sequencial. */
export const TECNICAS: Record<TecnicaKey, { rotulo: string; cor: string }> = {
  DTF: { rotulo: 'DTF', cor: 'var(--cat-1)' },
  Subli: { rotulo: 'Sublimação', cor: 'var(--cat-5)' },
  Silk: { rotulo: 'Silk', cor: 'var(--cat-4)' },
  Patch: { rotulo: 'Patch', cor: 'var(--cat-7)' },
  Bordado: { rotulo: 'Bordado', cor: 'var(--cat-2)' },
  Etiqueta: { rotulo: 'Etiqueta', cor: 'var(--cat-8)' },
}
export const ORDEM_TECNICAS: TecnicaKey[] = ['DTF', 'Subli', 'Silk', 'Patch', 'Bordado', 'Etiqueta']

/** Estações do Kanban, na ordem do pipeline MARK42. */
export const ESTACOES: { id: string; nome: string }[] = [
  { id: 'separacao', nome: 'Separação' },
  { id: 'corte', nome: 'Corte Manual' },
  { id: 'dtf_mont', nome: 'DTF Montagem' },
  { id: 'dtf_imp', nome: 'DTF Impressão' },
  { id: 'dtf_rec', nome: 'DTF Recorte' },
  { id: 'dtf_prensa', nome: 'DTF Prensa' },
  { id: 'silk_mont', nome: 'Silk Montagem' },
  { id: 'silk_tela', nome: 'Revelação de Tela' },
  { id: 'silk_peca', nome: 'Silkar a Peça' },
  { id: 'sub_imp', nome: 'Subli Impressão' },
  { id: 'sub_cal', nome: 'Calandra' },
  { id: 'laser', nome: 'Corte a Laser' },
  { id: 'acab', nome: 'Acabamento' },
  { id: 'costura', nome: 'CD Costura' },
  { id: 'cq', nome: 'CQ + Embalagem' },
  { id: 'despacho', nome: 'Despacho' },
  { id: 'entregue', nome: 'Entregue' },
]
export const nomeEstacao = (id?: string) => ESTACOES.find((e) => e.id === id)?.nome ?? '—'
