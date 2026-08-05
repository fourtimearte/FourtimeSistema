import { useId } from 'react'
import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Rótulo + campo + ajuda + erro, numa peça só.
 *
 *  Existe porque a parte que some quando cada tela monta o seu é sempre a
 *  mesma: o `htmlFor`, o `aria-describedby` e a mensagem de erro. Campo em
 *  erro com borda vermelha e sem texto explicando não diz o que corrigir —
 *  e para quem usa leitor de tela não diz nada. */
export function Campo({
  rotulo, ajuda, erro, obrigatorio, className, children,
}: {
  rotulo: string
  ajuda?: string
  erro?: string
  obrigatorio?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => React.ReactNode
}) {
  const id = useId()
  const idAjuda = `${id}-ajuda`
  const idErro = `${id}-erro`
  const descrito = [ajuda ? idAjuda : null, erro ? idErro : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[12px] font-semibold">
        {rotulo}
        {obrigatorio && (
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': !!erro, 'aria-describedby': descrito })}
      {ajuda && !erro && (
        <span id={idAjuda} className="text-muted-foreground text-[11px]">
          {ajuda}
        </span>
      )}
      {erro && (
        <span id={idErro} role="alert" className="text-destructive flex items-center gap-1 text-[11px]">
          <TriangleAlert className="size-3 shrink-0" />
          {erro}
        </span>
      )}
    </div>
  )
}
