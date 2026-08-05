/* =====================================================================
   O CICLO COMERCIAL DO ORÇAMENTO
   ---------------------------------------------------------------------
   O Kanban de Produção começa no orçamento APROVADO. Tudo que acontece
   antes disso — o cliente que ligou, o briefing, o orçamento montado, o
   envio, a negociação — hoje não mora em lugar nenhum: está no WhatsApp
   de quem atendeu. É por isso que ninguém sabe responder "quantos
   orçamentos estão parados esperando o cliente" nem "quantos a gente
   perde".

   Estas etapas são esse pedaço que faltava. Elas param no APROVADO: dali
   em diante quem manda é a rota de produção.
   ===================================================================== */

export type EtapaKey =
  | 'contato'
  | 'briefing'
  | 'montagem'
  | 'enviado'
  | 'negociacao'
  | 'aprovacao'
  | 'aprovado'
  | 'producao'
  | 'entregue'
  | 'perdido'

export type GrupoEtapa = 'Prospecção' | 'Elaboração' | 'Negociação' | 'Fechamento'

export interface Etapa {
  key: EtapaKey
  nome: string
  grupo: GrupoEtapa
  cor: string
  /** o que precisa acontecer para sair desta etapa */
  saida: string
  /** aparece como coluna no funil? Produção, entregue e perdido não — o
   *  funil é o caminho ATÉ o sim, não o depois. */
  noFunil: boolean
  /** dias parado a partir dos quais a etapa vira preocupação */
  alertaDias?: number
}

export const ETAPAS: Etapa[] = [
  { key: 'contato', nome: 'Contato', grupo: 'Prospecção', cor: 'var(--cat-6)', noFunil: true, alertaDias: 2,
    saida: 'Alguém respondeu e sabemos o que o cliente quer.' },
  { key: 'briefing', nome: 'Briefing', grupo: 'Prospecção', cor: 'var(--cat-6)', noFunil: true, alertaDias: 3,
    saida: 'Peças, quantidades e prazo definidos.' },
  { key: 'montagem', nome: 'Em montagem', grupo: 'Elaboração', cor: 'var(--cat-3)', noFunil: true, alertaDias: 3,
    saida: 'O `.ft` está pronto e tem preço em todas as linhas.' },
  { key: 'enviado', nome: 'Enviado ao cliente', grupo: 'Negociação', cor: 'var(--cat-5)', noFunil: true, alertaDias: 4,
    saida: 'O cliente confirmou que recebeu e leu.' },
  { key: 'negociacao', nome: 'Em negociação', grupo: 'Negociação', cor: 'var(--cat-5)', noFunil: true, alertaDias: 5,
    saida: 'Preço, prazo e peças acordados.' },
  { key: 'aprovacao', nome: 'Aguardando aprovação', grupo: 'Negociação', cor: 'var(--warning)', noFunil: true, alertaDias: 5,
    saida: 'O cliente disse sim, por escrito.' },
  { key: 'aprovado', nome: 'Aprovado', grupo: 'Fechamento', cor: 'var(--success)', noFunil: true, alertaDias: 2,
    saida: 'O roteador fatiou o pedido e ele entrou na produção.' },
  { key: 'producao', nome: 'Em produção', grupo: 'Fechamento', cor: 'var(--cat-1)', noFunil: false,
    saida: 'A produção entrega. Daqui em diante quem manda é o Kanban.' },
  { key: 'entregue', nome: 'Entregue', grupo: 'Fechamento', cor: 'var(--success)', noFunil: false,
    saida: 'Fim do ciclo. Fica no arquivo, consultável.' },
  { key: 'perdido', nome: 'Perdido', grupo: 'Fechamento', cor: 'var(--destructive)', noFunil: false,
    saida: 'Fim do ciclo. Fica no arquivo — perder sem registrar o motivo é perder duas vezes.' },
]

export const etapa = (k: EtapaKey) => ETAPAS.find((e) => e.key === k)!
export const nomeEtapa = (k: EtapaKey) => etapa(k).nome
export const corEtapa = (k: EtapaKey) => etapa(k).cor
export const ETAPAS_FUNIL = ETAPAS.filter((e) => e.noFunil)
export const ORDEM_ETAPAS = ETAPAS.map((e) => e.key)

/** Onde o ciclo comercial termina — em qualquer um destes, o orçamento
 *  saiu do funil e vive no arquivo. */
export const ETAPAS_FECHADAS: EtapaKey[] = ['producao', 'entregue', 'perdido']
export const ETAPAS_GANHAS: EtapaKey[] = ['aprovado', 'producao', 'entregue']

/* ---------------------------------------------------------- motivo da perda */

export type MotivoPerda = 'preco' | 'prazo' | 'sem-resposta' | 'concorrente' | 'desistiu'

export const MOTIVOS_PERDA: Record<MotivoPerda, string> = {
  preco: 'Preço acima do orçamento do cliente',
  prazo: 'Prazo não atendia',
  'sem-resposta': 'Cliente sumiu',
  concorrente: 'Fechou com concorrente',
  desistiu: 'Desistiu do projeto',
}

/* ------------------------------------------------------------------ evento */

/** Uma linha do histórico. É o que responde "por onde este orçamento
 *  passou e quanto tempo levou em cada lugar" — a pergunta que o WhatsApp
 *  nunca respondeu. */
export interface Evento {
  etapa: EtapaKey
  data: string /* dd/mm/aaaa */
  nota?: string
}
