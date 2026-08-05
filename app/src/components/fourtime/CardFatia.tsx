import { ArrowRight, CalendarDays, Layers, Paperclip, Plus } from 'lucide-react'
import { TAGS_CARD, TECNICAS } from '@/lib/pedidos/tipos'
import { aguardaIrmao, cardAtrasado, diasCard, type KCard } from '@/lib/pedidos/roteador'
import { cn } from '@/lib/utils'

/** O card do Kanban: uma FATIA do pedido — tudo que aquele pedido tem de uma
 *  técnica só, com os layouts listados.
 *
 *  Refeito no formato do v5, que estava certo: o operador da estação precisa
 *  reconhecer o trabalho num olhar, e o que ele procura é **de quem é** e
 *  **quais peças**. Imagem no card não ajuda — na coluna ela vira um selo de
 *  30px que não se lê e rouba a altura de três cards.
 *
 *  Mora aqui, e não dentro da tela do Kanban, porque o /kit precisa
 *  renderizar o card REAL. */
export function CardFatia({
  c, hoje, todos, realce, onAbrir, onAvancar, onArrasta, onAdicionarTag,
}: {
  c: KCard
  hoje: Date
  todos?: KCard[]
  realce?: boolean
  onAbrir?: () => void
  onAvancar?: () => void
  onArrasta?: (c: KCard | null) => void
  onAdicionarTag?: () => void
}) {
  const atrasada = cardAtrasado(c, hoje)
  const espera = todos ? aguardaIrmao(c, todos) : false
  const dias = diasCard(c, hoje)

  return (
    <article
      id={`kc-${c.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', c.id)
        e.dataTransfer.effectAllowed = 'move'
        onArrasta?.(c)
      }}
      onDragEnd={() => onArrasta?.(null)}
      className={cn(
        'bg-card ring-foreground/5 dark:ring-foreground/10 group relative flex cursor-grab flex-col rounded-3xl shadow-sm ring-1 transition-shadow active:cursor-grabbing',
        atrasada ? 'ring-destructive ring-2' : 'hover:shadow-md',
        realce && 'ring-primary ring-2',
      )}
    >
      {/* 1 — DE QUEM. O nome do cliente é o que o operador procura primeiro. */}
      <button onClick={onAbrir} className="flex flex-col gap-2.5 p-3.5 text-left">
        <div className="flex items-start gap-2">
          <span className="line-clamp-2 flex-1 text-[13.5px] leading-snug font-semibold">{c.cliente}</span>
          <span
            className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold text-(--cat-foreground)"
            style={{ background: c.corTecnica }}
          >
            {TECNICAS[c.tecnica].rotulo}
          </span>
        </div>
        <span className="text-muted-foreground -mt-1.5 font-mono text-[11.5px]">{c.pedido}</span>

        {/* 2 — QUAIS PEÇAS. Os layouts deste pedido que estão nesta estação. */}
        <div className="bg-secondary flex items-center gap-1.5 rounded-2xl px-2.5 py-2">
          <Layers className="text-muted-foreground size-3.5 shrink-0" />
          <span className="truncate font-mono text-[11.5px] font-medium">{c.rotulosLayout.join(' · ')}</span>
          <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[10.5px] tabular-nums">
            {c.pecas}p
          </span>
        </div>

        {/* 3 — QUANDO e QUANTO. */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
          <span className={cn('inline-flex items-center gap-1.5', atrasada && 'text-destructive font-semibold')}>
            <CalendarDays className="size-3.5" />
            {c.entrega}
            {atrasada && ` · ${dias}d`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Paperclip className="size-3.5" />
            {c.anexos} {c.anexos === 1 ? 'anexo' : 'anexos'}
          </span>
        </div>
      </button>

      {/* 4 — O QUE ESTÁ ACONTECENDO. Etiquetas da produção, como no Trello. */}
      <div className="flex flex-wrap items-center gap-1 px-3.5 pb-3.5">
        {espera && <TarjaCard cor="var(--warning)">AGUARDA IRMÃ</TarjaCard>}
        {c.tags.map((t) => (
          <TarjaCard key={t} cor={TAGS_CARD[t].cor}>
            {TAGS_CARD[t].rotulo}
          </TarjaCard>
        ))}
        {onAdicionarTag && (
          <button
            onClick={onAdicionarTag}
            aria-label="Adicionar etiqueta"
            title="Adicionar etiqueta"
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-[22px] shrink-0 place-items-center rounded-full border border-dashed transition-colors"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>

      {/* Avançar é o gesto primário: a rota já é conhecida, ninguém precisa
          escolher a coluna. Arrastar fica para a exceção — e não funciona no
          dedo, onde este botão funciona. */}
      {onAvancar && (
        <button
          onClick={onAvancar}
          aria-label={`Avançar ${c.pedido} ${TECNICAS[c.tecnica].rotulo}`}
          className="bg-card hover:bg-accent ring-foreground/10 absolute right-2.5 -bottom-3 hidden size-7 place-items-center rounded-full opacity-0 shadow-md ring-1 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:grid"
        >
          <ArrowRight className="size-3.5" />
        </button>
      )}
    </article>
  )
}

/** Etiqueta de informação: contorno colorido, nunca preenchida.
 *  Num quadro com dezenas de cards, três tarjas sólidas por card viram um
 *  mosaico e o olho para de ler. */
export function TarjaCard({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[22px] shrink-0 items-center rounded-full border px-2 text-[9.5px] font-bold tracking-wide"
      style={{ borderColor: cor, color: cor }}
    >
      {children}
    </span>
  )
}
