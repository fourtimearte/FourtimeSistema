import { Check, Plus } from 'lucide-react'
import { fundoTextura, type CorTecido, type Tecido } from '@/lib/biblioteca'
import { cardSuperficie } from '@/components/fourtime/superficie'
import { cn } from '@/lib/utils'

/** Amostra de cor selecionável.
 *
 *  O tique é branco com sombra projetada porque a amostra pode ser branca:
 *  um tique que herdasse a cor do texto sumiria justamente na cor mais
 *  usada da fábrica. */
export function SwatchCor({
  cor, selecionada, aoAlternar,
}: {
  cor: CorTecido
  selecionada: boolean
  aoAlternar: (nome: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => aoAlternar(cor.nome)}
      aria-pressed={selecionada}
      aria-label={cor.nome}
      title={`${cor.nome} · ${cor.hex}`}
      className={cn(
        'relative size-9 rounded-xl border transition-transform',
        'hover:-translate-y-0.5 hover:scale-105',
        'focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none',
        selecionada && 'ring-primary ring-offset-background ring-2 ring-offset-2',
      )}
      style={{ background: cor.hex }}
    >
      {selecionada && (
        <Check
          className="absolute inset-0 m-auto size-4 text-white [filter:drop-shadow(0_1px_1.5px_rgba(0,0,0,.55))]"
          strokeWidth={3}
        />
      )}
    </button>
  )
}

export function AdicionarCor({ aoClicar }: { aoClicar?: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label="Adicionar cor"
      className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-9 place-items-center rounded-xl border border-dashed transition-colors"
    >
      <Plus className="size-4" />
    </button>
  )
}

export function PaletaCores({
  cores, selecionadas, aoAlternar, aoAdicionar,
}: {
  cores: CorTecido[]
  selecionadas: string[]
  aoAlternar: (nome: string) => void
  aoAdicionar?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {cores.map((c) => (
        <SwatchCor key={c.nome} cor={c} selecionada={selecionadas.includes(c.nome)} aoAlternar={aoAlternar} />
      ))}
      <AdicionarCor aoClicar={aoAdicionar} />
    </div>
  )
}

/** Card de tecido: amostra + ficha técnica curta. */
export function CardTecido({ t }: { t: Tecido }) {
  return (
    <article className={cn(cardSuperficie, 'transition-shadow hover:shadow-lg')}>
      <div className="h-[86px]" style={{ background: fundoTextura(t.textura, t.cor.hex) }} aria-hidden />
      <div className="p-3.5">
        <div className="text-[13px] font-semibold">{t.nome}</div>
        <div className="text-muted-foreground font-mono text-[10.5px]">{t.ref}</div>
        <p className="text-muted-foreground mt-1.5 text-[11px] leading-snug">{t.composicao}</p>
        <span className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 font-mono text-[10.5px]">
          <i className="size-3 shrink-0 rounded border" style={{ background: t.cor.hex }} />
          {t.cor.nome}
        </span>
      </div>
    </article>
  )
}
