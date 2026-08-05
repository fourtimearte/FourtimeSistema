import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Split, User, X } from 'lucide-react'
import { corEstacao, nomeCheio, nomeEstacao, TECNICAS } from '@/lib/pedidos/tipos'
import { TagTecnica } from '@/components/fourtime/TagTecnica'
import { moeda } from '@/lib/pedidos/regras'
import { aguardaIrmao, cardAtrasado, diasCard, estacaoAnterior, proximaEstacao, type KCard } from '@/lib/pedidos/roteador'
import { Badge } from '@/components/fourtime/primitivos'

/** A ficha da fatia. O que ela existe para responder é uma pergunta só:
 *  "por onde esta peça já passou e o que falta" — no Trello isso não era
 *  consultável, estava na cabeça de quem arrastou o card. */
export function FichaCard({
  card, todos, hoje, aoFechar, aoMover, aoIrPara,
}: {
  card: KCard
  todos: KCard[]
  hoje: Date
  aoFechar: () => void
  aoMover: (id: string, destino: string) => void
  aoIrPara: (pedido: string) => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [aoFechar])

  const atual = card.rota.indexOf(card.estacao)
  const anterior = estacaoAnterior(card)
  const proxima = proximaEstacao(card)
  const irmas = todos.filter((c) => c.pedido === card.pedido && c.id !== card.id)
  const atrasada = cardAtrasado(card, hoje)
  const espera = aguardaIrmao(card, todos)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="bg-background/70 absolute inset-0" onClick={aoFechar} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Fatia ${card.id}`}
        className="bg-card relative flex h-full w-full max-w-[440px] flex-col rounded-l-4xl shadow-2xl ring-1 ring-foreground/5 dark:ring-foreground/10"
      >
        <header className="flex items-start gap-2 border-b p-(--ft-card-pad)">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-semibold">{card.pedido}</span>
              <TagTecnica tecnica={card.tecnica} />
              {atrasada && <Badge tom="alerta">{diasCard(card, hoje)} DIAS</Badge>}
            </div>
            <h2 className="font-heading mt-1 truncate text-[15px] font-semibold">{card.cliente}</h2>
            <p className="text-muted-foreground text-[11.5px]">
              Layout {String(card.layIdx + 1).padStart(2, '0')} · {card.ref} · {card.cor}
            </p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="hover:bg-accent ml-auto grid size-7 shrink-0 place-items-center rounded-xl"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-(--ft-gap) overflow-y-auto p-(--ft-card-pad)">
          <div className="grid grid-cols-3 gap-2">
            <Dado rotulo="Peças" valor={card.pecas.toLocaleString('pt-BR')} />
            <Dado rotulo="Valor" valor={moeda(card.valor)} />
            <Dado rotulo="Entrega" valor={card.entrega} alerta={atrasada} />
          </div>

          {espera && (
            <p className="text-muted-foreground border-warning bg-secondary rounded-r-2xl border-l-[3px] px-3.5 py-2.5 text-[11.5px]">
              Chegou ao reencontro, mas <b className="text-foreground">uma fatia irmã ainda está atrás</b>. A costura
              receberia meia peça.
            </p>
          )}

          {/* A rota inteira, visível. É o que separa este quadro do Trello:
              ninguém precisa lembrar por onde a técnica passa. */}
          <section>
            <h3 className="font-heading mb-2 text-[12px] font-semibold">Rota da técnica</h3>
            <ol className="flex flex-col">
              {card.rota.map((id, i) => {
                const feito = i < atual
                const aqui = i === atual
                return (
                  <li key={id} className="grid grid-cols-[16px_1fr] gap-2.5">
                    <div className="flex flex-col items-center">
                      <span
                        className="grid size-4 shrink-0 place-items-center rounded-full border text-[8px]"
                        style={
                          aqui
                            ? { background: corEstacao(id), borderColor: corEstacao(id), color: 'var(--cat-foreground)' }
                            : feito
                              ? { borderColor: 'var(--success)', color: 'var(--success)' }
                              : undefined
                        }
                      >
                        {feito ? <Check className="size-2.5" /> : aqui ? '●' : ''}
                      </span>
                      {i < card.rota.length - 1 && (
                        <span className={`w-px flex-1 ${feito ? 'bg-success' : 'bg-border'}`} style={{ minHeight: 14 }} />
                      )}
                    </div>
                    <button
                      onClick={() => aoMover(card.id, id)}
                      disabled={aqui}
                      className={`hover:bg-accent -mt-0.5 mb-0.5 rounded-lg px-2 py-0.5 text-left text-[12px] disabled:hover:bg-transparent ${
                        aqui ? 'font-semibold' : feito ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {nomeCheio(id)}
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          {irmas.length > 0 && (
            <section>
              <h3 className="font-heading mb-2 flex items-center gap-1.5 text-[12px] font-semibold">
                <Split className="size-3.5" /> Fatias irmãs deste pedido
              </h3>
              <ul className="flex flex-col gap-1.5">
                {irmas.map((o) => (
                  <li
                    key={o.id}
                    className="bg-secondary flex items-center gap-2 rounded-2xl px-3 py-2 text-[11.5px]"
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: o.corTecnica }} />
                    <span className="font-medium">{TECNICAS[o.tecnica].rotulo}</span>
                    <span className="text-muted-foreground truncate">L{String(o.layIdx + 1).padStart(2, '0')} · {o.ref}</span>
                    <span className="ml-auto shrink-0" style={{ color: corEstacao(o.estacao) }}>
                      {nomeEstacao(o.estacao)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="mt-auto flex flex-wrap items-center gap-2 border-t p-(--ft-card-pad)">
          <button
            onClick={() => anterior && aoMover(card.id, anterior)}
            disabled={!anterior}
            className="hover:bg-accent flex h-(--ft-control-h) items-center gap-1.5 rounded-3xl border px-3 text-xs font-medium disabled:opacity-40"
          >
            <ArrowLeft className="size-3.5" /> Voltar
          </button>
          <button
            onClick={() => proxima && aoMover(card.id, proxima)}
            disabled={!proxima}
            className="bg-primary text-primary-foreground flex h-(--ft-control-h) items-center gap-1.5 rounded-4xl px-3.5 text-xs font-semibold disabled:opacity-40"
          >
            Avançar para {proxima ? nomeEstacao(proxima) : '—'} <ArrowRight className="size-3.5" />
          </button>
          <span className="flex-1" />
          <BotaoCliente clienteId={card.clienteId} />
          <button
            onClick={() => aoIrPara(card.pedido)}
            className="hover:bg-accent flex h-(--ft-control-h) items-center gap-1.5 rounded-3xl border px-3 text-xs font-medium"
          >
            Ver no quadro
          </button>
        </footer>
      </aside>
    </div>
  )
}

function BotaoCliente({ clienteId }: { clienteId: number | null }) {
  const ir = useNavigate()
  if (clienteId == null) return null
  return (
    <button
      onClick={() => ir('/clientes')}
      className="hover:bg-accent flex h-(--ft-control-h) items-center gap-1.5 rounded-3xl border px-3 text-xs font-medium"
    >
      <User className="size-3.5" /> Cliente
    </button>
  )
}

function Dado({ rotulo, valor, alerta }: { rotulo: string; valor: string; alerta?: boolean }) {
  return (
    <div className="bg-secondary rounded-2xl px-3 py-2.5">
      <div className="text-muted-foreground text-[10px] font-semibold tracking-[0.05em] uppercase">{rotulo}</div>
      <div className={`mt-0.5 font-mono text-[13px] tabular-nums ${alerta ? 'text-destructive font-semibold' : ''}`}>
        {valor}
      </div>
    </div>
  )
}
