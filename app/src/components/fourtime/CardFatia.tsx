import { ArrowRight } from 'lucide-react'
import { TECNICAS } from '@/lib/pedidos/tipos'
import { cardAtrasado, diasCard, type KCard } from '@/lib/pedidos/roteador'
import { Badge } from '@/components/fourtime/primitivos'

/** O card do Kanban: uma FATIA do pedido, não o pedido inteiro.
 *
 *  Mora aqui, e não dentro da tela do Kanban, porque o /kit precisa
 *  renderizar o card REAL. Um kit que desenha uma versão simplificada do
 *  card começa a mentir no mesmo instante — e a mentira só é descoberta
 *  quando alguém confia nela. */
export function CardFatia({
  c, hoje, espera, realce, onAbrir, onAvancar, onArrasta,
}: {
  c: KCard
  hoje: Date
  espera?: boolean
  realce?: boolean
  onAbrir?: () => void
  onAvancar?: () => void
  onArrasta?: (c: KCard | null) => void
}) {
  const atrasada = cardAtrasado(c, hoje)
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
      className={`bg-card group relative flex cursor-grab flex-col gap-1 rounded-md border p-1.5 transition-[border-color,box-shadow] active:cursor-grabbing ${
        atrasada ? 'border-destructive' : 'hover:border-ring'
      } ${realce ? 'ring-primary ring-2' : ''}`}
    >
      <button onClick={onAbrir} className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-1.5">
          {/* o mockup é o que o operador reconhece antes do número */}
          <span
            className="text-muted-foreground/70 grid size-8 shrink-0 place-items-center rounded border border-dashed text-[8px]"
            aria-hidden
          >
            arte
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10.5px] font-semibold">{c.pedido}</span>
              <span
                className="ml-auto size-2 shrink-0 rounded-full"
                style={{ background: c.corTecnica }}
                title={TECNICAS[c.tecnica].rotulo}
              />
            </div>
            <div className="truncate text-[11.5px] font-medium">{c.cliente}</div>
            <div className="text-muted-foreground truncate text-[10px]">
              {c.ref} · {c.cor}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {atrasada ? (
            <Badge tom="alerta">
              {diasCard(c, hoje)} {diasCard(c, hoje) === 1 ? 'DIA' : 'DIAS'}
            </Badge>
          ) : (
            <span className="text-muted-foreground font-mono text-[10px]">{c.entrega.slice(0, 5)}</span>
          )}
          {espera && <Badge tom="aviso">AGUARDA IRMÃO</Badge>}
          <span className="text-muted-foreground ml-auto font-mono text-[10px] tabular-nums">{c.pecas}p</span>
        </div>
      </button>

      {/* Avançar é o gesto primário: a rota já é conhecida, ninguém precisa
          escolher a coluna. O arrastar fica para a exceção — e funciona no
          dedo, onde arrastar não funciona. */}
      <button
        onClick={onAvancar}
        aria-label={`Avançar ${c.pedido} ${TECNICAS[c.tecnica].rotulo}`}
        className="border-input bg-card hover:bg-accent absolute right-1 -bottom-2 hidden size-6 place-items-center rounded-full border opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:grid"
      >
        <ArrowRight className="size-3" />
      </button>
    </article>
  )
}

