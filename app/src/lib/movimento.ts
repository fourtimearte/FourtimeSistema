/* =====================================================================
   CATÁLOGO DAS ANIMAÇÕES NOMEADAS
   O nome é o contrato: "aplica quicar no botão de salvar" tem de dar
   sempre a mesma animação. Os nomes vieram do kit v5; os valores foram
   refeitos sobre os tokens do V6 (ver a seção MOVIMENTO em tokens-v6.css).
   ===================================================================== */
export type GrupoMov = 'entrada' | 'atencao' | 'estado'

export interface Movimento {
  nome: string
  classe: string
  grupo: GrupoMov
  descricao: string
  uso: string
  tempo: string
  /* como a demonstração é montada — nem toda animação cabe num quadrado */
  palco?: 'caixa' | 'chip' | 'linha' | 'cascata' | 'girar' | 'esqueleto' | 'contar'
}

export const MOVIMENTOS: Movimento[] = [
  { nome: 'surgir', classe: 'mov-surgir', grupo: 'entrada', descricao: 'Fade-in suave', uso: 'Qualquer elemento que aparece', tempo: '300ms' },
  { nome: 'subir', classe: 'mov-subir', grupo: 'entrada', descricao: 'Fade + sobe 18px', uso: 'Seções e cards ao rolar', tempo: '500ms' },
  { nome: 'crescer', classe: 'mov-crescer', grupo: 'entrada', descricao: 'Escala 0.9 → 1 com fade', uso: 'Modais, popovers, avisos', tempo: '300ms · back.out' },
  { nome: 'deslizar', classe: 'mov-deslizar', grupo: 'entrada', descricao: 'Entra pela direita', uso: 'Gavetas e painéis laterais', tempo: '300ms', palco: 'chip' },
  { nome: 'cascata', classe: 'mov-cascata', grupo: 'entrada', descricao: 'Filhos entram em sequência', uso: 'Listas, grids, colunas do Kanban', tempo: 'atraso de 80ms', palco: 'cascata' },

  { nome: 'pulsar', classe: 'mov-pulsar', grupo: 'atencao', descricao: 'Pulso de escala', uso: 'Ação importante, marca de novidade', tempo: '1,1s ×2', palco: 'chip' },
  { nome: 'quicar', classe: 'mov-quicar', grupo: 'atencao', descricao: 'Quica ao confirmar', uso: 'Sucesso, item somado ao pedido', tempo: '900ms' },
  { nome: 'tremer', classe: 'mov-tremer', grupo: 'atencao', descricao: 'Treme na horizontal', uso: 'Erro de validação, ação bloqueada', tempo: '500ms' },
  { nome: 'brilhar', classe: 'mov-brilhar', grupo: 'atencao', descricao: 'Anel de foco pulsa uma vez', uso: 'Campo ou linha recém-alterada', tempo: '900ms', palco: 'linha' },
  { nome: 'piscar', classe: 'mov-piscar', grupo: 'atencao', descricao: 'Fundo destaca e some', uso: 'Linha de tabela que mudou', tempo: '1,1s', palco: 'linha' },

  { nome: 'pressionar', classe: 'mov-pressionar', grupo: 'estado', descricao: 'Afunda no clique', uso: 'Retorno tátil de botão', tempo: '200ms' },
  { nome: 'girar', classe: 'mov-girar', grupo: 'estado', descricao: 'Roda continuamente', uso: 'Carregando', tempo: '800ms · contínuo', palco: 'girar' },
  { nome: 'esqueleto', classe: 'esqueleto', grupo: 'estado', descricao: 'Brilho percorrendo o vazio', uso: 'Conteúdo carregando', tempo: '1,1s · contínuo', palco: 'esqueleto' },
  { nome: 'contar', classe: '', grupo: 'estado', descricao: 'Número sobe de 0 até o valor', uso: 'KPIs e totais', tempo: '900ms', palco: 'contar' },
  { nome: 'expandir', classe: 'mov-expandir', grupo: 'estado', descricao: 'Abre a altura suavemente', uso: 'Detalhe do pedido, acordeão', tempo: '300ms' },
]

export const GRUPOS_MOV: { key: GrupoMov; titulo: string; nota: string }[] = [
  { key: 'entrada', titulo: 'Entradas', nota: 'o elemento aparecendo' },
  { key: 'atencao', titulo: 'Atenção', nota: 'chamar o olho para uma mudança' },
  { key: 'estado', titulo: 'Estado', nota: 'carregando, pressionado, contando' },
]
