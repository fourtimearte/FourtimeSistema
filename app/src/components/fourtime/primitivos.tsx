import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/* Peças de negócio da Fourtime. Ficam aqui, não em components/ui — aquele
   é território do shadcn e precisa continuar atualizável por `shadcn add`. */

export function Badge({
  children, tom = 'neutro', className,
}: { children: ReactNode; tom?: 'neutro' | 'pj' | 'pf' | 'alerta' | 'ok' | 'aviso'; className?: string }) {
  const tons = {
    neutro: 'bg-secondary text-secondary-foreground',
    pj: 'bg-cat-6/15 text-cat-6',
    pf: 'bg-cat-5/15 text-cat-5',
    /* alerta é SEMPRE contorno, nunca preenchido: com muitos na tela, o
       preenchido domina e o operador para de enxergar o resto */
    alerta: 'border border-destructive text-destructive',
    aviso: 'border border-warning text-warning',
    ok: 'border border-success text-success',
  }
  return (
    <span className={cn('inline-flex h-4 items-center rounded px-1.5 text-[9.5px] font-bold tracking-wide', tons[tom], className)}>
      {children}
    </span>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('bg-secondary text-secondary-foreground inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold', className)}>
      {children}
    </span>
  )
}

export function KpiFiltro({
  rotulo, valor, nota, proporcao, ativo, onClick, icone, cor,
}: {
  rotulo: string; valor: number | string; nota: string; proporcao: number
  ativo: boolean; onClick: () => void; icone: ReactNode; cor?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        'bg-card flex flex-col gap-1.5 rounded-lg border p-(--ft-card-pad) text-left transition-colors',
        ativo ? 'border-primary ring-primary ring-1 ring-inset' : 'hover:border-ring',
      )}
    >
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.05em] uppercase">
        {icone}
        {rotulo}
      </span>
      <span className="font-mono text-2xl leading-none font-semibold tabular-nums" style={cor ? { color: cor } : undefined}>
        {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
      </span>
      <span className="text-muted-foreground text-[11px]">{nota}</span>
      <span className="bg-secondary mt-0.5 h-[3px] overflow-hidden rounded-full">
        <span className="block h-full rounded-full" style={{ width: `${proporcao}%`, background: cor ?? 'var(--primary)' }} />
      </span>
    </button>
  )
}

export function Vazio({ titulo, descricao, acao }: { titulo: string; descricao: string; acao?: ReactNode }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
      <span className="text-foreground text-[13px] font-semibold">{titulo}</span>
      <span className="max-w-[46ch] text-xs">{descricao}</span>
      {acao}
    </div>
  )
}

/* Os três estados que somem quando ninguém desenha: carregando, erro e
   vazio. O caso feliz todo mundo faz; estes aparecem no dia em que o
   cliente tem zero pedidos ou a rede cai. */

export function Esqueleto({ className }: { className?: string }) {
  return <span className={cn('esqueleto block h-3 w-full', className)} aria-hidden />
}

export function Carregando({ linhas = 3, rotulo = 'Carregando…' }: { linhas?: number; rotulo?: string }) {
  return (
    <div className="flex flex-col gap-2 p-1" role="status" aria-label={rotulo}>
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} className={i === linhas - 1 ? 'w-3/5' : i % 2 ? 'w-4/5' : 'w-full'} />
      ))}
    </div>
  )
}

export function Erro({
  titulo = 'Não foi possível carregar', descricao, aoTentar,
}: {
  titulo?: string
  descricao: string
  aoTentar?: () => void
}) {
  return (
    <div className="border-destructive/40 text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <span className="text-destructive text-[13px] font-semibold">{titulo}</span>
      <span className="max-w-[46ch] text-xs">{descricao}</span>
      {aoTentar && (
        <button
          onClick={aoTentar}
          className="hover:bg-accent mt-1 h-(--ft-control-h-sm) rounded-lg border px-3 text-xs font-medium"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}
