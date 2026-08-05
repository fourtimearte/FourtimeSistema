import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft, ArrowRight, Check, FileText, ImageOff, Layers, Paperclip, PencilRuler, Split, Tag, X,
} from 'lucide-react'
import {
  ESTACOES, ORDEM_TAGS, TAGS_CARD, TECNICAS, corEstacao, nomeCheio, nomeEstacao,
  type Pedido, type TagKey,
} from '@/lib/pedidos/tipos'
import { moeda } from '@/lib/pedidos/regras'
import {
  aguardaIrmao, cardAtrasado, diasCard, estacaoAnterior, proximaEstacao, rotuloLayout, type KCard,
} from '@/lib/pedidos/roteador'
import { gradeProvavel, ordenarTamanhos } from '@/lib/grade'
import { GradeTamanhos } from '@/components/fourtime/GradeTamanhos'
import { TarjaCard } from '@/components/fourtime/CardFatia'
import { Badge } from '@/components/fourtime/primitivos'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** O cartão aberto — modal NO CENTRO da tela, não gaveta lateral.
 *
 *  A estrutura é a do v5, que estava certa: cabeçalho fixo com quem/quando e
 *  o seletor de estação; corpo rolável com o cabeçalho do orçamento, as
 *  etiquetas, os anexos e os módulos de layout DESTA fatia. O que o V6
 *  acrescenta é a rota da técnica — a única coisa que o Trello nunca soube
 *  responder.
 *
 *  Centro e não lateral porque aqui o conteúdo é largo: a grade de tamanhos
 *  de três layouts não cabe em 440px sem virar rolagem horizontal. */
export function ModalFatia({
  card, pedido, todos, hoje, aoFechar, aoMover, aoAlternarTag, aoLocalizar, aoEditor,
}: {
  card: KCard
  pedido: Pedido | null
  todos: KCard[]
  hoje: Date
  aoFechar: () => void
  aoMover: (id: string, destino: string) => void
  aoAlternarTag: (id: string, tag: TagKey) => void
  aoLocalizar: (pedido: string) => void
  aoEditor: () => void
}) {
  const [abrindoTag, setAbrindoTag] = useState(false)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (abrindoTag ? setAbrindoTag(false) : aoFechar())
    document.addEventListener('keydown', esc)
    /* trava a rolagem do fundo: modal aberto e página rolando por baixo é
       o tipo de coisa que faz o usuário achar que clicou errado */
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = antes
    }
  }, [aoFechar, abrindoTag])

  const atual = card.rota.indexOf(card.estacao)
  const anterior = estacaoAnterior(card)
  const proxima = proximaEstacao(card)
  const irmas = todos.filter((c) => c.pedido === card.pedido && c.id !== card.id)
  const atrasada = cardAtrasado(card, hoje)
  const espera = aguardaIrmao(card, todos)
  const naFatia = new Set(card.layouts)

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center p-[2vh_2vw]">
      <div className="bg-background/60 absolute inset-0" onClick={aoFechar} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${card.cliente} · ${card.pedido}`}
        className="bg-card ring-foreground/10 mov-crescer relative flex h-[94vh] w-[min(1180px,96vw)] flex-col overflow-hidden rounded-4xl shadow-2xl ring-1"
      >
        {/* faixa da técnica: identifica a fatia antes de qualquer leitura */}
        <div className="h-1 shrink-0" style={{ background: card.corTecnica }} />

        {/* ---------------- cabeçalho fixo ---------------- */}
        <header className="flex shrink-0 flex-wrap items-start gap-3 border-b px-(--ft-card-pad) py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={aoEditor}
                title="Abrir o orçamento deste pedido"
                className="decoration-primary/40 flex min-w-0 items-center gap-2 underline underline-offset-4"
              >
                <FileText className="text-primary size-4 shrink-0" />
                <span className="truncate text-[15px] font-semibold">{card.cliente}</span>
                <span className="text-muted-foreground shrink-0 font-mono text-[13px]">· {card.pedido}</span>
              </button>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-(--cat-foreground)"
                style={{ background: card.corTecnica }}
              >
                {TECNICAS[card.tecnica].rotulo}
              </span>
              <span className="bg-secondary inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-semibold">
                <Layers className="size-3" />
                {card.rotulosLayout.join(' · ')}
              </span>
              {atrasada && <Badge tom="alerta">{diasCard(card, hoje)} DIAS</Badge>}
            </div>

            <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
              <Micro rotulo="Vendedor" valor={card.vendedor} />
              <Micro rotulo="Entrega" valor={card.entrega} alerta={atrasada} />
              <Micro rotulo="Peças" valor={String(card.pecas)} />
              <Micro rotulo="Valor" valor={moeda(card.valor)} />
              <span className="inline-flex items-center gap-1.5">
                <span style={{ color: corEstacao(card.estacao) }}>●</span>
                {nomeCheio(card.estacao)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label className="text-muted-foreground text-[10.5px] font-semibold tracking-[0.06em] uppercase">
              Mover
            </label>
            {/* select nativo de propósito: é o controle que o operador do
                galpão já sabe usar no celular, e a lista tem 22 itens */}
            <select
              value={card.estacao}
              onChange={(e) => aoMover(card.id, e.target.value)}
              className="bg-input/50 h-(--ft-control-h) max-w-[210px] rounded-3xl border border-transparent px-3 text-xs outline-none"
            >
              {ESTACOES.filter((e) => card.rota.includes(e.id)).map((e) => (
                <option key={e.id} value={e.id}>
                  {nomeCheio(e.id)}
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

        {/* ---------------- corpo rolável ---------------- */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-(--ft-card-pad) py-5">
          {espera && (
            <p className="text-muted-foreground border-warning bg-secondary rounded-r-2xl border-l-[3px] px-3.5 py-2.5 text-[12px]">
              Esta fatia chegou ao reencontro, mas <b className="text-foreground">uma irmã ainda está atrás</b>. A
              costura receberia meia peça.
            </p>
          )}

          {/* cabeçalho do orçamento */}
          <section>
            <Titulo icone={<FileText className="size-3.5" />}>Cabeçalho do orçamento</Titulo>
            <div className="bg-secondary grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-5 gap-y-3 rounded-2xl p-4">
              {(
                [
                  ['Cliente', pedido?.cliente],
                  ['CPF / CNPJ', pedido?.cpf],
                  ['Departamento', pedido?.departamento],
                  ['Vendedor', pedido?.vendedor],
                  ['Contato', pedido?.contato],
                  ['Embalagem', pedido?.embalagem],
                  ['Entrega', pedido?.entrega],
                  ['Envio', pedido?.envio],
                  ['Pagamento', pedido?.pagamento],
                ] as [string, string | undefined][]
              ).map(([k, v]) => (
                <div key={k}>
                  <div className="text-muted-foreground text-[10px] font-semibold tracking-[0.06em] uppercase">{k}</div>
                  <div className="mt-0.5 truncate text-[12.5px] font-medium">{v || '—'}</div>
                </div>
              ))}
            </div>
          </section>

          {/* etiquetas */}
          <section>
            <Titulo icone={<Tag className="size-3.5" />}>Etiquetas ({card.tags.length})</Titulo>
            <div className="flex flex-wrap items-center gap-1.5">
              {card.tags.map((t) => (
                <button key={t} onClick={() => aoAlternarTag(card.id, t)} title="Remover">
                  <TarjaCard cor={TAGS_CARD[t].cor}>{TAGS_CARD[t].rotulo} ×</TarjaCard>
                </button>
              ))}
              {!card.tags.length && <span className="text-muted-foreground text-[12px]">Nenhuma etiqueta.</span>}
            </div>
            <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(228px,1fr))] gap-1.5">
              {ORDEM_TAGS.map((t) => {
                const on = card.tags.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => aoAlternarTag(card.id, t)}
                    aria-pressed={on}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors',
                      on ? 'bg-secondary' : 'hover:bg-accent border-transparent',
                    )}
                    style={on ? { borderColor: TAGS_CARD[t].cor } : undefined}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: TAGS_CARD[t].cor }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] font-semibold">{TAGS_CARD[t].rotulo}</span>
                      <span className="text-muted-foreground block truncate text-[10.5px]">{TAGS_CARD[t].explica}</span>
                    </span>
                    {on && <Check className="size-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </section>

          {/* anexos */}
          <section>
            <Titulo icone={<Paperclip className="size-3.5" />}>Anexos ({pedido?.layouts.length ?? 0})</Titulo>
            {pedido?.layouts.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
                {pedido.layouts.map((l, i) => {
                  const daFatia = naFatia.has(i)
                  return (
                    <div
                      key={i}
                      className={cn(
                        'bg-secondary overflow-hidden rounded-2xl',
                        daFatia && 'ring-2',
                      )}
                      style={daFatia ? { boxShadow: `0 0 0 2px ${card.corTecnica}` } : undefined}
                    >
                      {/* o mockup mora no `.ft` em base64 e ainda não foi
                          importado — o lugar dele já está reservado */}
                      <div className="text-muted-foreground/60 grid h-[92px] place-items-center border-b border-dashed">
                        <ImageOff className="size-5" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-2 text-[11px]">
                        <span className="shrink-0 font-mono font-bold whitespace-nowrap">{rotuloLayout(i)}</span>
                        <span className="text-muted-foreground min-w-0 truncate">{l.ref}</span>
                        {daFatia && (
                          <span
                            className="ml-auto size-2 shrink-0 rounded-full"
                            style={{ background: card.corTecnica }}
                            title="layout desta fatia"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-[12px]">Nenhum layout neste pedido.</p>
            )}
          </section>

          {/* módulos de layout desta fatia */}
          <section>
            <Titulo icone={<Layers className="size-3.5" />}>
              Módulos de layout desta fatia ({card.layouts.length}) — {TECNICAS[card.tecnica].rotulo}
            </Titulo>
            <div className="flex flex-col gap-3">
              {card.layouts.map((i) => {
                const l = pedido?.layouts[i]
                if (!l) return null
                const linhas = ordenarTamanhos(l.tamanhos)
                return (
                  <article key={i} className="overflow-hidden rounded-2xl border">
                    <div
                      className="flex flex-wrap items-center gap-2 border-b px-3.5 py-2.5"
                      style={{ borderLeft: `3px solid ${card.corTecnica}` }}
                    >
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
              {!card.layouts.length && <p className="text-muted-foreground text-[12px]">Nenhum layout nesta fatia.</p>}
            </div>
          </section>

          {/* a rota — o que o Trello nunca soube responder */}
          <section>
            <Titulo icone={<ArrowRight className="size-3.5" />}>Rota da técnica</Titulo>
            <ol className="flex flex-wrap items-center gap-1.5">
              {card.rota.map((id, i) => {
                const feito = i < atual
                const aqui = i === atual
                return (
                  <li key={id} className="flex items-center gap-1.5">
                    <button
                      onClick={() => aoMover(card.id, id)}
                      disabled={aqui}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                        aqui && 'font-bold text-(--cat-foreground)',
                        feito && 'border-success text-success',
                        !aqui && !feito && 'text-muted-foreground hover:bg-accent',
                      )}
                      style={aqui ? { background: corEstacao(id), borderColor: corEstacao(id) } : undefined}
                    >
                      {nomeEstacao(id)}
                    </button>
                    {i < card.rota.length - 1 && <span className="text-muted-foreground/50 text-[10px]">›</span>}
                  </li>
                )
              })}
            </ol>
          </section>

          {irmas.length > 0 && (
            <section>
              <Titulo icone={<Split className="size-3.5" />}>Fatias irmãs deste pedido ({irmas.length})</Titulo>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-1.5">
                {irmas.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => aoLocalizar(o.pedido)}
                    className="bg-secondary hover:bg-accent flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-[11.5px]"
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: o.corTecnica }} />
                    <span className="font-semibold">{TECNICAS[o.tecnica].rotulo}</span>
                    <span className="text-muted-foreground truncate font-mono">{o.rotulosLayout.join(' · ')}</span>
                    <span className="ml-auto shrink-0" style={{ color: corEstacao(o.estacao) }}>
                      {nomeEstacao(o.estacao)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---------------- rodapé fixo ---------------- */}
        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-(--ft-card-pad) py-3.5">
          <Button variant="outline" size="sm" disabled={!anterior} onClick={() => anterior && aoMover(card.id, anterior)}>
            <ArrowLeft /> Voltar
          </Button>
          <Button size="sm" disabled={!proxima} onClick={() => proxima && aoMover(card.id, proxima)}>
            Avançar para {proxima ? nomeEstacao(proxima) : '—'} <ArrowRight />
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

function Titulo({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase">
      {icone}
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
