import { cn } from '@/lib/utils'

/** Cabeçalho de página. Título, uma linha do que a tela faz, e o canto
 *  direito para ações e alertas.
 *
 *  A linha de descrição não é enfeite: é onde cabe a regra da tela ("o
 *  Dashboard lê de todas e não escreve em nenhuma"). Sem lugar para ela,
 *  a regra vira comentário no código e ninguém que usa o sistema a lê. */
export function CabecalhoPagina({
  titulo, descricao, children,
}: {
  titulo: string
  descricao?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold">{titulo}</h1>
        {descricao && <p className="text-muted-foreground mt-0.5 max-w-[80ch] text-[12.5px]">{descricao}</p>}
      </div>
      <div className="flex-1" />
      {children}
    </div>
  )
}

/** Painel: caixa com cabeçalho, o contêiner padrão de conteúdo da tela. */
export function Painel({
  titulo, nota, acao, semPadding, className, children,
}: {
  titulo?: string
  nota?: string
  acao?: React.ReactNode
  semPadding?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('bg-card rounded-lg border', className)}>
      {(titulo || acao) && (
        <div className="flex items-center gap-2 border-b px-(--ft-pad-x) py-(--ft-pad-y)">
          {titulo && <h2 className="font-heading text-[13px] font-semibold">{titulo}</h2>}
          <span className="flex-1" />
          {nota && <span className="text-muted-foreground text-[11px]">{nota}</span>}
          {acao}
        </div>
      )}
      <div className={semPadding ? '' : 'flex flex-col gap-3 p-(--ft-card-pad)'}>{children}</div>
    </section>
  )
}

/** Observação com barra colorida à esquerda. `tom` escolhe a cor. */
export function Nota({
  tom = 'info', className, children,
}: {
  tom?: 'info' | 'aviso' | 'perigo'
  className?: string
  children: React.ReactNode
}) {
  const barra = { info: 'border-info', aviso: 'border-warning', perigo: 'border-destructive' }[tom]
  return (
    <p
      className={cn(
        'text-muted-foreground bg-secondary rounded-r-lg border-l-[3px] px-3 py-2 text-[11.5px]',
        barra,
        className,
      )}
    >
      {children}
    </p>
  )
}
