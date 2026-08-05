/* =====================================================================
   GRADE DE TAMANHOS — funções puras
   A grade é o coração comercial do orçamento: é dela que saem quantidade,
   subtotal e o número que o cliente olha. Por isso o cálculo mora aqui,
   testável, e não dentro do componente que desenha a tabela.
   ===================================================================== */

export const TAMANHOS_ADULTO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'] as const
export const TAMANHOS_INFANTIL = ['2A', '4A', '6A', '8A', '10A', '12A', '14A', '16A'] as const

export type Grade = 'adulta' | 'infantil'

export interface LinhaGrade { tamanho: string; qtd: number; uni: number }

/** Tamanho infantil é o que casa `<n>A`. Feito por padrão e não por lista
 *  fechada porque a fábrica inventa tamanho novo (`18A`) sem avisar o
 *  sistema — e um tamanho desconhecido não pode virar erro. */
export const ehInfantil = (t: string) => /^\d{1,2}A$/i.test((t ?? '').trim())

/** O sinal que o editor antigo já dava e não pode se perder: um tamanho
 *  infantil digitado numa grade adulta (ou o contrário) quase sempre é
 *  engano de digitação — e sai caro, porque a peça é cortada em outro
 *  molde. Não é erro: é classificação, e por isso ganha fundo tingido em
 *  vez de contorno vermelho (contorno vermelho aqui é atraso). */
export function foraDaGrade(tamanho: string, grade: Grade): 'infantil' | 'adulto' | null {
  const inf = ehInfantil(tamanho)
  if (grade === 'adulta' && inf) return 'infantil'
  if (grade === 'infantil' && !inf) return 'adulto'
  return null
}

export const subtotal = (l: LinhaGrade) => l.qtd * l.uni

export function totaisGrade(linhas: LinhaGrade[]) {
  const pecas = linhas.reduce((s, l) => s + l.qtd, 0)
  const valor = linhas.reduce((s, l) => s + subtotal(l), 0)
  /* média ponderada, não média dos unitários: com 30 peças a 89,90 e 2 a
     94,90, a média simples mentiria em quase 3 reais na peça */
  return { pecas, valor, medio: pecas ? valor / pecas : 0 }
}

/** Detecta a grade pelo conteúdo, para não obrigar ninguém a declarar. */
export function gradeProvavel(linhas: LinhaGrade[]): Grade {
  const inf = linhas.filter((l) => ehInfantil(l.tamanho)).length
  return inf > linhas.length / 2 ? 'infantil' : 'adulta'
}
