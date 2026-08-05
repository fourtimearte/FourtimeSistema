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

/* =====================================================================
   AS ESTAÇÕES E AS ROTAS
   ---------------------------------------------------------------------
   A diferença do Trello atual não é visual: lá alguém tem de arrastar o
   card pelas 20 colunas certas e lembrar por onde cada técnica passa.
   Aqui a rota é DADO, não memória — sai das tags de Design do orçamento
   aprovado. Por isso ROTAS mora junto do modelo, e não dentro da tela.
   ===================================================================== */
export type FaixaKey = 'preparo' | 'dtf' | 'silk' | 'subli' | 'acab'

export const FAIXAS: { key: FaixaKey; nome: string; cor: string }[] = [
  { key: 'preparo', nome: 'Preparo', cor: 'var(--muted-foreground)' },
  { key: 'dtf', nome: 'DTF', cor: 'var(--cat-1)' },
  { key: 'silk', nome: 'Silk', cor: 'var(--cat-4)' },
  { key: 'subli', nome: 'Sublimação', cor: 'var(--cat-5)' },
  { key: 'acab', nome: 'Acabamento & fechamento', cor: 'var(--cat-2)' },
]

export interface Estacao {
  id: string
  nome: string
  faixa: FaixaKey
  /** só quando a estação foge da cor da faixa (ex.: patch é laranja mesmo
   *  morando no acabamento) */
  cor?: string
}

/** Ordem canônica do pipeline MARK42. A posição nesta lista é o que mede
 *  "quão adiantado" um card está — por isso a ordem importa. */
export const ESTACOES: Estacao[] = [
  { id: 'separacao', nome: 'Separação', faixa: 'preparo' },
  { id: 'corte', nome: 'Corte manual', faixa: 'preparo' },

  { id: 'dtf_mont', nome: 'Montagem', faixa: 'dtf' },
  { id: 'dtf_imp', nome: 'Impressão', faixa: 'dtf' },
  { id: 'dtf_rec', nome: 'Recorte', faixa: 'dtf' },
  { id: 'dtf_prensa', nome: 'Prensa', faixa: 'dtf' },
  { id: 'etiq_dtf', nome: 'Etiqueta DTF', faixa: 'dtf' },

  { id: 'silk_mont', nome: 'Montagem', faixa: 'silk' },
  { id: 'silk_tela', nome: 'Revelação de tela', faixa: 'silk' },
  { id: 'etiq_silk', nome: 'Etiqueta Silk', faixa: 'silk' },
  { id: 'silk_peca', nome: 'Silkar a peça', faixa: 'silk' },

  { id: 'sub_imp', nome: 'Impressão', faixa: 'subli' },
  { id: 'etiq_sub', nome: 'Etiqueta sublimada', faixa: 'subli' },
  { id: 'sub_cal', nome: 'Calandra', faixa: 'subli' },
  { id: 'laser', nome: 'Corte a laser', faixa: 'subli' },

  { id: 'bordado_ext', nome: 'Bordado externo', faixa: 'acab', cor: 'var(--cat-2)' },
  { id: 'prensa_patch', nome: 'Prensa patch', faixa: 'acab', cor: 'var(--cat-7)' },
  { id: 'etiqueta', nome: 'Etiqueta', faixa: 'acab', cor: 'var(--cat-8)' },
  { id: 'acab', nome: 'Acabamento', faixa: 'acab' },
  { id: 'costura', nome: 'CD Costura', faixa: 'acab', cor: 'var(--cat-6)' },
  { id: 'cq', nome: 'CQ + embalagem', faixa: 'acab', cor: 'var(--cat-8)' },
  { id: 'despacho', nome: 'Despacho', faixa: 'acab', cor: 'var(--muted-foreground)' },

  /* ENTREGUE não é coluna. No Trello viraram 2.082 cards que ninguém rola
     até o fim; aqui é histórico consultável. Fica na lista porque é posição
     de rota, mas o quadro não desenha coluna para ela. */
  { id: 'entregue', nome: 'Entregue', faixa: 'acab' },
]

export const ESTACAO_FINAL = 'entregue'
export const estacao = (id?: string) => ESTACOES.find((e) => e.id === id)
export const nomeEstacao = (id?: string) => estacao(id)?.nome ?? '—'
export const corEstacao = (id?: string) => {
  const e = estacao(id)
  if (!e) return 'var(--muted-foreground)'
  return e.cor ?? FAIXAS.find((f) => f.key === e.faixa)!.cor
}
/** Nome cheio, para fora do quadro: "Montagem" sozinho é ambíguo — existe
 *  em três faixas. */
export const nomeCheio = (id?: string) => {
  const e = estacao(id)
  if (!e) return '—'
  const f = FAIXAS.find((x) => x.key === e.faixa)!
  return e.faixa === 'preparo' || e.faixa === 'acab' ? e.nome : `${f.nome} · ${e.nome}`
}

/** A rota de cada técnica. Um pedido que mistura técnicas se FATIA: cada
 *  fatia corre a sua faixa e todas reconvergem na CD Costura. */
export const ROTAS: Record<TecnicaKey, string[]> = {
  DTF: ['separacao', 'corte', 'dtf_mont', 'dtf_imp', 'dtf_rec', 'dtf_prensa', 'etiq_dtf', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
  Silk: ['separacao', 'corte', 'silk_mont', 'silk_tela', 'etiq_silk', 'silk_peca', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
  /* sublimação vem direto do estoque, em tecido cru — não passa pelo corte manual */
  Subli: ['separacao', 'sub_imp', 'etiq_sub', 'sub_cal', 'laser', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
  Patch: ['separacao', 'prensa_patch', 'costura', 'cq', 'despacho', 'entregue'],
  /* facção externa: sai da casa e volta para a costura */
  Bordado: ['separacao', 'bordado_ext', 'costura', 'cq', 'despacho', 'entregue'],
  Etiqueta: ['separacao', 'etiqueta', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
}

/** Onde as fatias se reencontram. Antes daqui elas correm sozinhas. */
export const ESTACAO_REENCONTRO = 'costura'
