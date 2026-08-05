/** A superfície do Luma, numa constante só.
 *
 *  É exatamente o que o `Card` do shadcn aplica: raio grande, sombra macia
 *  e um anel de 5% no lugar da borda. Existe porque nem toda superfície
 *  pode ser um `<Card>` — um KPI é um `<button>`, uma coluna do Kanban é
 *  uma `<section>` que rola. Sem esta constante, cada uma dessas
 *  reescreveria as classes à mão, e foi assim que o sistema inteiro acabou
 *  com `rounded-lg border` e cara de caixa em vez de cartão. */
export const cardSuperficie =
  'bg-card text-card-foreground overflow-hidden rounded-4xl shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10'

/** Caixa interna, dentro de um cartão. Raio menor de propósito: dois raios
 *  iguais aninhados fazem a interna parecer maior que a externa. */
export const caixaInterna = 'bg-secondary rounded-2xl'
