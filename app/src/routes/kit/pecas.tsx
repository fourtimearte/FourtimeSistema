import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Peças de montagem do próprio /kit. Não são componentes do sistema —
 *  são a moldura que exibe os componentes do sistema. Ficam separadas de
 *  propósito: se um dia esta moldura virar componente do app, foi porque
 *  alguém a promoveu de verdade, e não por acidente. */

export function SecaoKit({
  id, numero, titulo, lead, children,
}: {
  id: string
  numero: string
  titulo: string
  lead?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-heading flex items-center gap-2.5 text-[17px] font-semibold">
        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
          {numero}
        </span>
        {titulo}
      </h2>
      {lead && <p className="text-muted-foreground mt-1 mb-3 max-w-[78ch] text-[12.5px]">{lead}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export function Bloco({
  titulo, nota, className, children,
}: {
  titulo?: string
  nota?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn('gap-0 px-(--ft-card-pad)', className)}>
      {titulo && (
        <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2">
          <h3 className="font-heading text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            {titulo}
          </h3>
          {nota && <span className="text-muted-foreground text-[11px]">{nota}</span>}
        </div>
      )}
      {children}
    </Card>
  )
}

export function Fileira({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex flex-wrap items-center gap-2.5', className)}>{children}</div>
}

/** Explica a decisão em vez de só mostrar o resultado. Um kit que só
 *  mostra não impede ninguém de repetir o erro que a regra evita. */
export function Porque({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground border-info bg-secondary mt-2.5 rounded-r-2xl border-l-[3px] px-3.5 py-2.5 text-[11.5px]">
      {children}
    </p>
  )
}

export function Token({ nome, valor, uso }: { nome: string; valor?: string; uso: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-dashed py-1.5 text-[12px] last:border-b-0">
      {valor && <span className="size-5 shrink-0 rounded border" style={{ background: valor }} />}
      <code className="min-w-[168px] font-mono text-[11.5px]">{nome}</code>
      <span className="text-muted-foreground">{uso}</span>
    </div>
  )
}

export function Amostra({ cor, rotulo, nota }: { cor: string; rotulo: string; nota?: string }) {
  return (
    <div className="bg-secondary overflow-hidden rounded-2xl">
      <div className="h-11" style={{ background: cor }} />
      <div className="px-2 py-1.5">
        <div className="text-[11px] font-semibold">{rotulo}</div>
        {nota && <div className="text-muted-foreground font-mono text-[9.5px]">{nota}</div>}
      </div>
    </div>
  )
}
