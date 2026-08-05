import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, FileText, Layers, PencilRuler, User, X } from 'lucide-react'
import { ETAPAS, MOTIVOS_PERDA, corEtapa, nomeEtapa, type EtapaKey } from '@/lib/orcamentos/tipos'
import { diasNaEtapa, etapaDe, historico, motivoPerda, ordemEtapa, parado, valorDe } from '@/lib/orcamentos/regras'
import { moeda } from '@/lib/pedidos/regras'
import { TECNICAS, type Pedido } from '@/lib/pedidos/tipos'
import { gradeProvavel, ordenarTamanhos } from '@/lib/grade'
import { GradeTamanhos } from '@/components/fourtime/GradeTamanhos'
import { rotuloLayout } from '@/lib/pedidos/roteador'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** A ficha do orçamento — modal no centro, como a do card do Kanban.
 *
 *  A seção que justifica a tela é o **histórico**: por onde este orçamento
 *  passou, com data em cada parada. Hoje isso mora no WhatsApp de quem
 *  atendeu, e é por isso que ninguém sabe dizer há quantos dias o cliente
 *  está com a proposta na mão. */
export function FichaOrcamento({
  p, hoje, aoFechar, aoMover, aoCliente, aoEditor,
}: {
  p: Pedido
  hoje: Date
  aoFechar: () => void
  aoMover: (numero: string, destino: EtapaKey) => void
  aoCliente: () => void
  aoEditor: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', esc)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = antes
    }
  }, [aoFechar])

  const atual = etapaDe(p)
  const eventos = historico(p, hoje)
  const motivo = motivoPerda(p)
  const atrasado = parado(p, hoje)

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center p-[2vh_2vw]">
      <div className="bg-background/60 absolute inset-0" onClick={aoFechar} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${p.cliente} · ${p.pedido}`}
        className="bg-card ring-foreground/10 mov-crescer relative flex h-[94vh] w-[min(1080px,96vw)] flex-col overflow-hidden rounded-4xl shadow-2xl ring-1"
      >
        <div className="h-1 shrink-0" style={{ background: corEtapa(atual) }} />

        <header className="flex shrink-0 flex-wrap items-start gap-3 border-b px-(--ft-card-pad) py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="text-primary size-4 shrink-0" />
              <span className="truncate text-[15px] font-semibold">{p.cliente}</span>
              <span className="text-muted-foreground shrink-0 font-mono text-[13px]">· {p.pedido}</span>
              <span
                className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{ borderColor: corEtapa(atual), color: corEtapa(atual) }}
              >
                {nomeEtapa(atual).toUpperCase()}
              </span>
            </div>
            <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
              <Micro rotulo="Vendedor" valor={p.vendedor} />
              <Micro rotulo="Entrega" valor={p.entrega} />
              <Micro rotulo="Layouts" valor={String(p.layouts.length)} />
              <Micro rotulo="Valor" valor={moeda(valorDe(p))} />
              <Micro rotulo="Nesta etapa" valor={`${diasNaEtapa(p, hoje)} dia(s)`} alerta={atrasado} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="text-muted-foreground text-[10.5px] font-semibold tracking-[0.06em] uppercase">
              Etapa
            </label>
            <select
              value={atual}
              onChange={(e) => aoMover(p.pedido, e.target.value as EtapaKey)}
              className="bg-input/50 h-(--ft-control-h) max-w-[220px] rounded-3xl border border-transparent px-3 text-xs outline-none"
            >
              {ETAPAS.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.nome}
                </option>
              ))}
            </select>
            <button
              onClick={aoFechar}
              aria-label="Fechar"
              className="hover:bg-accent grid size-8 shrink-0 place-items-center rounded-xl"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-(--ft-card-pad) py-5">
          {motivo && (
            <p className="text-muted-foreground border-destructive bg-secondary rounded-r-2xl border-l-[3px] px-3.5 py-2.5 text-[12px]">
              Perdido — <b className="text-foreground">{MOTIVOS_PERDA[motivo]}</b>. Perder sem registrar o motivo é
              perder duas vezes: sem isso ninguém sabe se o problema é preço, prazo ou atendimento.
            </p>
          )}

          {/* HISTÓRICO — a razão de existir desta tela */}
          <section>
            <Titulo>Histórico · do contato à aprovação</Titulo>
            <ol className="flex flex-col">
              {ETAPAS.filter((e) => e.key !== 'perdido' || atual === 'perdido').map((e, i, arr) => {
                const feito = ordemEtapa(e.key) < ordemEtapa(atual)
                const aqui = e.key === atual
                const ev = eventos.find((x) => x.etapa === e.key)
                return (
                  <li key={e.key} className="grid grid-cols-[20px_1fr] gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className="grid size-5 shrink-0 place-items-center rounded-full border text-[9px]"
                        style={
                          aqui
                            ? { background: e.cor, borderColor: e.cor, color: 'var(--cat-foreground)' }
                            : feito
                              ? { borderColor: 'var(--success)', color: 'var(--success)' }
                              : undefined
                        }
                      >
                        {feito ? <Check className="size-3" /> : aqui ? '●' : ''}
                      </span>
                      {i < arr.length - 1 && (
                        <span className={cn('w-px flex-1', feito ? 'bg-success' : 'bg-border')} style={{ minHeight: 18 }} />
                      )}
                    </div>
                    <div className={cn('pb-4', !feito && !aqui && 'opacity-45')}>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <button
                          onClick={() => aoMover(p.pedido, e.key)}
                          disabled={aqui}
                          className={cn('text-[13px]', aqui ? 'font-bold' : 'hover:underline')}
                        >
                          {e.nome}
                        </button>
                        {ev && <span className="text-muted-foreground font-mono text-[11px]">{ev.data}</span>}
                        {aqui && atrasado && (
                          <span className="text-destructive text-[11px] font-semibold">
                            parado há {diasNaEtapa(p, hoje)} dias
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                        <b>Sai daqui quando:</b> {e.saida}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
            <p className="text-muted-foreground border-info bg-secondary mt-1 rounded-r-2xl border-l-[3px] px-3.5 py-2.5 text-[11.5px]">
              As datas são <b>derivadas</b>, contadas para trás a partir de hoje, enquanto o <code>.ft</code> não
              guardar o histórico de verdade. O importador troca isto por datas reais sem mexer na tela.
            </p>
          </section>

          {/* layouts do orçamento */}
          <section>
            <Titulo>
              <Layers className="size-3.5" /> Layouts ({p.layouts.length})
            </Titulo>
            <div className="flex flex-col gap-3">
              {p.layouts.map((l, i) => {
                const linhas = ordenarTamanhos(l.tamanhos)
                return (
                  <article key={i} className="overflow-hidden rounded-2xl border">
                    <div className="flex flex-wrap items-center gap-2 border-b px-3.5 py-2.5">
                      <span className="font-mono text-[12px] font-bold">{rotuloLayout(i)}</span>
                      <span className="text-[13px] font-semibold">{l.ref}</span>
                      <span className="text-muted-foreground text-[12px]">· {l.cor}</span>
                      <span className="ml-auto flex gap-1">
                        {l.tecnicas.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[9.5px] font-bold text-(--cat-foreground)"
                            style={{ background: TECNICAS[t].cor }}
                          >
                            {TECNICAS[t].rotulo}
                          </span>
                        ))}
                      </span>
                    </div>
                    <GradeTamanhos linhas={linhas} grade={gradeProvavel(linhas)} />
                  </article>
                )
              })}
              {!p.layouts.length && <p className="text-muted-foreground text-[12px]">Nenhum layout ainda.</p>}
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-(--ft-card-pad) py-3.5">
          <Button variant="outline" size="sm" onClick={aoCliente}>
            <User /> Ficha do cliente
          </Button>
          <span className="flex-1" />
          <Button variant="outline" size="sm" onClick={aoEditor}>
            <PencilRuler /> Abrir no Editor
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-muted-foreground mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase">
      {children}
    </h3>
  )
}

function Micro({ rotulo, valor, alerta }: { rotulo: string; valor: string; alerta?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.06em] uppercase">{rotulo}</span>
      <b className={alerta ? 'text-destructive' : 'text-foreground'}>{valor || '—'}</b>
    </span>
  )
}
