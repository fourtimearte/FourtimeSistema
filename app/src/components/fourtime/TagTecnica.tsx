import { TECNICAS, type TecnicaKey } from '@/lib/pedidos/tipos'
import { cn } from '@/lib/utils'

/** Uma técnica = uma cor, do editor ao card do Kanban.
 *
 *  Está aqui, e não copiada em cada tela, porque a cor da tag DTF do
 *  orçamento e a do card na esteira precisam ser a MESMA — se cada tela
 *  escreve o seu chip, uma delas fica para trás numa mudança de paleta e
 *  o operador passa a ver duas cores para a mesma coisa. */
export function TagTecnica({
  tecnica, tamanho = 'md', className,
}: {
  tecnica: TecnicaKey
  tamanho?: 'sm' | 'md'
  className?: string
}) {
  const t = TECNICAS[tecnica]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold text-(--cat-foreground)',
        tamanho === 'sm' ? 'h-4 px-1.5 text-[9.5px]' : 'h-5 px-2 text-[10px]',
        className,
      )}
      style={{ background: t.cor }}
    >
      {t.rotulo}
    </span>
  )
}

/** Só a bolinha da técnica, para onde não cabe o rótulo (card denso, fila).
 *  Nunca aparece sozinha sem `title`: cor sem nome não é informação. */
export function PontoTecnica({ tecnica, className }: { tecnica: TecnicaKey; className?: string }) {
  const t = TECNICAS[tecnica]
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ background: t.cor }}
      title={t.rotulo}
      aria-label={t.rotulo}
      role="img"
    />
  )
}
