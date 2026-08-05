import { cn } from '@/lib/utils'

export interface Aba { id: string; rotulo: string; contagem?: number }

/** Abas com a semântica ARIA correta (tablist/tab/tabpanel) e navegação
 *  por seta — não são botões que trocam `display`.
 *
 *  Vive aqui porque a ficha do cliente, a do card e o editor precisam da
 *  mesma peça; três implementações viram três comportamentos de teclado. */
export function Abas({
  abas, ativa, aoTrocar, className,
}: {
  abas: Aba[]
  ativa: string
  aoTrocar: (id: string) => void
  className?: string
}) {
  function porSeta(e: React.KeyboardEvent) {
    const i = abas.findIndex((a) => a.id === ativa)
    if (e.key === 'ArrowRight') aoTrocar(abas[(i + 1) % abas.length].id)
    else if (e.key === 'ArrowLeft') aoTrocar(abas[(i - 1 + abas.length) % abas.length].id)
    else if (e.key === 'Home') aoTrocar(abas[0].id)
    else if (e.key === 'End') aoTrocar(abas[abas.length - 1].id)
    else return
    e.preventDefault()
  }

  return (
    <div role="tablist" onKeyDown={porSeta} className={cn('flex gap-0.5 border-b', className)}>
      {abas.map((a) => {
        const on = a.id === ativa
        return (
          <button
            key={a.id}
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={on}
            aria-controls={`painel-${a.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => aoTrocar(a.id)}
            className={cn(
              'relative flex h-(--ft-control-h) items-center gap-1.5 rounded-t-md px-3 text-[12.5px] font-medium transition-colors',
              on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {a.rotulo}
            {a.contagem != null && (
              <span className="bg-secondary rounded-full px-1.5 font-mono text-[10px] tabular-nums">{a.contagem}</span>
            )}
            {/* a barra é filha da aba ativa, não um elemento que desliza:
                sem animação de posição, sem dessincronizar no resize */}
            {on && <span className="bg-primary absolute inset-x-1 -bottom-px h-0.5 rounded-full" />}
          </button>
        )
      })}
    </div>
  )
}

export function PainelAba({ id, ativa, children }: { id: string; ativa: string; children: React.ReactNode }) {
  if (id !== ativa) return null
  return (
    <div role="tabpanel" id={`painel-${id}`} aria-labelledby={`aba-${id}`} tabIndex={0} className="outline-none">
      {children}
    </div>
  )
}
