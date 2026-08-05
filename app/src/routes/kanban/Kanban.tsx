import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Clock, Search, Split } from 'lucide-react'
import { PEDIDOS_SEED } from '@/data/pedidosSeed'
import { ESTACOES, ESTACAO_FINAL, FAIXAS, TECNICAS, ORDEM_TECNICAS, corEstacao, nomeEstacao, type Pedido, type TecnicaKey } from '@/lib/pedidos/tipos'
import { moedaCurta } from '@/lib/pedidos/regras'
import {
  aguardaIrmao, avancar, cardAtrasado, diasCard, FILTROS_KANBAN_VAZIO, fila, filtrarCards,
  mover, porEstacao, rotear, vendedores, type FiltrosKanban, type KCard,
} from '@/lib/pedidos/roteador'
import { Badge, Vazio } from '@/components/fourtime/primitivos'
import { Dropdown } from '@/components/fourtime/Dropdown'
import { FichaCard } from './FichaCard'

const HOJE = new Date()
/* ENTREGUE não vira coluna: no Trello atual são 2.082 cards que ninguém
   rola até o fim. Aqui é histórico consultável. */
const COLUNAS = ESTACOES.filter((e) => e.id !== ESTACAO_FINAL)

export function Kanban() {
  const [cards, setCards] = useState<KCard[]>(() => rotear(PEDIDOS_SEED))
  const [f, setF] = useState<FiltrosKanban>(FILTROS_KANBAN_VAZIO)
  const [aberta, setAberta] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<KCard | null>(null)
  const [destaque, setDestaque] = useState<string[]>([])
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean } | null>(null)
  const quadro = useRef<HTMLDivElement>(null)

  const visiveis = useMemo(() => filtrarCards(cards, f, HOJE), [cards, f])
  const colunas = useMemo(() => porEstacao(visiveis), [visiveis])
  const atrasados = useMemo(() => visiveis.filter((c) => cardAtrasado(c, HOJE)).length, [visiveis])
  const esperando = useMemo(() => visiveis.filter((c) => aguardaIrmao(c, cards)).length, [visiveis, cards])
  const listaVend = useMemo(() => vendedores(cards), [cards])
  const filaPedidos = useMemo(() => fila(PEDIDOS_SEED), [])
  const cardsPorPedido = useMemo(() => {
    const m: Record<string, KCard[]> = {}
    for (const c of cards) (m[c.pedido] ??= []).push(c)
    return m
  }, [cards])

  const toast = useCallback((texto: string, erro?: boolean) => setAviso({ texto, erro }), [])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 3200)
    return () => clearTimeout(t)
  }, [aviso])

  const moverCard = useCallback(
    (id: string, destino: string) => {
      setCards((atuais) => {
        const c = atuais.find((x) => x.id === id)
        if (!c) return atuais
        const r = mover(atuais, id, destino)
        if (!r.ok) toast(`${TECNICAS[c.tecnica].rotulo} não passa por ${nomeEstacao(destino)} — a rota não permite.`, true)
        else toast(`${c.pedido} · ${TECNICAS[c.tecnica].rotulo} → ${nomeEstacao(destino)}`)
        return r.cards
      })
    },
    [toast],
  )

  const avancarCard = useCallback(
    (id: string) => {
      setCards((atuais) => {
        const c = atuais.find((x) => x.id === id)
        const r = avancar(atuais, id)
        if (r.ok && c && r.destino) toast(`${c.pedido} · ${TECNICAS[c.tecnica].rotulo} → ${nomeEstacao(r.destino)}`)
        else toast('Esta fatia já está no fim da rota.', true)
        return r.cards
      })
    },
    [toast],
  )

  /** Clicar na fila localiza as fatias daquele pedido no quadro. Um pedido
   *  que se fatia em cinco some de vista; sem isto, achar "onde está o
   *  PD004143" vira caça ao tesouro em 22 colunas. */
  function localizar(pedido: string) {
    const alvo = cards.filter((c) => c.pedido === pedido)
    if (!alvo.length) return toast('Pedido ainda não roteado.', true)
    setDestaque(alvo.map((c) => c.id))
    setTimeout(
      () => document.getElementById(`kc-${alvo[0].id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }),
      40,
    )
    setTimeout(() => setDestaque([]), 3000)
    const onde = [...new Set(alvo.map((c) => nomeEstacao(c.estacao)))].join(' · ')
    toast(`${pedido}: ${alvo.length} fatia(s) em ${onde}`)
  }

  const cardAberto = cards.find((c) => c.id === aberta) ?? null
  const setDest = new Set(destaque)

  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Kanban de produção</h1>
          <p className="text-muted-foreground mt-0.5 max-w-[80ch] text-[12.5px]">
            As colunas são estações; as faixas são técnicas. Um pedido que mistura técnicas <b>se fatia</b> e as
            fatias reconvergem na CD Costura.
          </p>
        </div>
        <div className="flex-1" />
        {atrasados > 0 && (
          <span className="border-destructive text-destructive flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold whitespace-nowrap">
            <Clock className="size-3.5" /> {atrasados} atrasada(s)
          </span>
        )}
        {esperando > 0 && (
          <span className="border-warning text-warning flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold whitespace-nowrap">
            <Split className="size-3.5" /> {esperando} aguardando irmão
          </span>
        )}
      </div>

      {/* -------- filtros -------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-[280px]">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-[14px] -translate-y-1/2" />
          <input
            value={f.busca}
            onChange={(e) => setF({ ...f, busca: e.target.value })}
            placeholder="Pedido, cliente ou referência…"
            className="border-input bg-background focus-visible:ring-ring h-(--ft-control-h-sm) w-full rounded-lg border pl-8 text-xs outline-none focus-visible:ring-2"
          />
        </div>
        <Dropdown
          rotulo="Técnica"
          valor={f.tecnica ?? ''}
          onEscolher={(v) => setF({ ...f, tecnica: (v || null) as TecnicaKey | null })}
          opcoes={[
            { valor: '', texto: 'Todas' },
            ...ORDEM_TECNICAS.map((t) => ({
              valor: t,
              texto: TECNICAS[t].rotulo,
              contagem: cards.filter((c) => c.tecnica === t).length,
            })),
          ]}
        />
        <Dropdown
          rotulo="Vendedor"
          valor={f.vendedor ?? ''}
          onEscolher={(v) => setF({ ...f, vendedor: v || null })}
          opcoes={[
            { valor: '', texto: 'Todos' },
            ...listaVend.map((v) => ({ valor: v, texto: v, contagem: cards.filter((c) => c.vendedor === v).length })),
          ]}
        />
        <button
          onClick={() => setF({ ...f, soAtrasados: !f.soAtrasados })}
          aria-pressed={f.soAtrasados}
          className={`flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
            f.soAtrasados ? 'border-destructive text-destructive font-semibold' : 'hover:bg-accent'
          }`}
        >
          <AlertTriangle className="size-3.5" /> Só atrasados
        </button>
        <span className="text-muted-foreground text-xs">
          {visiveis.length === cards.length
            ? `${cards.length} fatias de ${new Set(cards.map((c) => c.pedido)).size} pedidos`
            : `${visiveis.length} de ${cards.length} fatias`}
        </span>
      </div>

      {/* -------- fila de pedidos -------- */}
      <section>
        <div className="mb-2 flex flex-wrap items-center gap-x-2">
          <h2 className="font-heading shrink-0 text-[13px] font-semibold">Fila de pedidos</h2>
          <span className="text-muted-foreground text-[11px]">
            ordem de entrega · clique localiza as fatias no quadro
          </span>
        </div>
        <div className="-mx-(--ft-gap) flex gap-2 overflow-x-auto px-(--ft-gap) pb-1.5">
          {filaPedidos.map((p) => (
            <CardPedido key={p.pedido} p={p} fatias={cardsPorPedido[p.pedido] ?? []} onClick={() => localizar(p.pedido)} />
          ))}
        </div>
      </section>

      {/* -------- quadro --------
          Densidade compacta é obrigatória aqui; em ponteiro grosso ela
          volta sozinha para confortável (44×44px de alvo de toque). */}
      <div ref={quadro} className="-mx-(--ft-gap) overflow-x-auto px-(--ft-gap) pb-2" data-density="compacta">
        <div className="flex min-w-max gap-5">
          {FAIXAS.map((faixa) => {
            const cols = COLUNAS.filter((e) => e.faixa === faixa.key)
            return (
              <div key={faixa.key} className="flex flex-col gap-2">
                <div className="font-heading flex items-center gap-2 pl-0.5 text-[11px] font-bold tracking-[0.06em] uppercase">
                  <span className="size-2 rounded-full" style={{ background: faixa.cor }} />
                  {faixa.nome}
                  <span className="text-muted-foreground font-mono font-normal tracking-normal">
                    {cols.reduce((s, e) => s + (colunas[e.id]?.length ?? 0), 0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {cols.map((e) => (
                    <Coluna
                      key={e.id}
                      id={e.id}
                      nome={e.nome}
                      cor={corEstacao(e.id)}
                      cards={colunas[e.id] ?? []}
                      arrastando={arrastando}
                      destaque={setDest}
                      todos={cards}
                      onSolta={(id) => moverCard(id, e.id)}
                      onAbrir={setAberta}
                      onAvancar={avancarCard}
                      onArrasta={setArrastando}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {visiveis.length === 0 && (
        <Vazio
          titulo="Nenhuma fatia com estes filtros"
          descricao="Limpe a busca ou desligue o filtro de atrasados para ver o quadro inteiro."
        />
      )}

      <div className="grid gap-(--ft-gap) lg:grid-cols-2">
        <Nota>
          <b>A rota é dado, não memória.</b> Ela sai das tags de Design do orçamento aprovado — por isso o quadro
          recusa mandar uma fatia de sublimação para a revelação de tela em vez de aceitar em silêncio.
        </Nota>
        <Nota>
          <b>Alerta é sempre contorno, nunca preenchido.</b> Com {atrasados} fatias atrasadas, o vermelho de fundo
          dominaria a tela e o operador pararia de enxergar o resto.
        </Nota>
      </div>

      {cardAberto && (
        <FichaCard
          card={cardAberto}
          todos={cards}
          hoje={HOJE}
          aoFechar={() => setAberta(null)}
          aoMover={(id, destino) => moverCard(id, destino)}
          aoIrPara={(pedido) => {
            setAberta(null)
            localizar(pedido)
          }}
        />
      )}

      {aviso && (
        <div
          role="status"
          className={`bg-card fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-lg border px-3.5 py-2 text-xs shadow-lg ${
            aviso.erro ? 'border-destructive text-destructive' : ''
          }`}
        >
          {aviso.texto}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ coluna */

function Coluna({
  id, nome, cor, cards, arrastando, destaque, todos, onSolta, onAbrir, onAvancar, onArrasta,
}: {
  id: string; nome: string; cor: string; cards: KCard[]
  arrastando: KCard | null; destaque: Set<string>; todos: KCard[]
  onSolta: (id: string) => void
  onAbrir: (id: string) => void
  onAvancar: (id: string) => void
  onArrasta: (c: KCard | null) => void
}) {
  const [sobre, setSobre] = useState(false)
  /* enquanto arrasta, o quadro mostra quais colunas a rota daquela técnica
     aceita — é a regra ficando visível em vez de só recusar depois */
  const aceita = !arrastando || arrastando.rota.includes(id)

  return (
    <section
      onDragOver={(e) => {
        if (!aceita) return
        e.preventDefault()
        setSobre(true)
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault()
        setSobre(false)
        const arrastado = e.dataTransfer.getData('text/plain')
        if (arrastado) onSolta(arrastado)
      }}
      className={`bg-secondary flex h-[430px] w-[188px] shrink-0 flex-col rounded-lg transition-opacity ${
        arrastando && !aceita ? 'opacity-35' : ''
      } ${sobre ? 'ring-primary ring-2' : ''}`}
    >
      <div className="h-[3px] rounded-t-lg" style={{ background: cor }} />
      <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
        <span className="font-heading truncate text-[11.5px] font-semibold">{nome}</span>
        <span className="text-muted-foreground ml-auto font-mono text-[11px] tabular-nums">{cards.length}</span>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto p-1.5">
        {cards.map((c) => (
          <Card
            key={c.id}
            c={c}
            espera={aguardaIrmao(c, todos)}
            realce={destaque.has(c.id)}
            onAbrir={() => onAbrir(c.id)}
            onAvancar={() => onAvancar(c.id)}
            onArrasta={onArrasta}
          />
        ))}
        {cards.length === 0 && (
          <span className="text-muted-foreground/60 px-1 py-3 text-center text-[10.5px]">vazia</span>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- card */

function Card({
  c, espera, realce, onAbrir, onAvancar, onArrasta,
}: {
  c: KCard; espera: boolean; realce: boolean
  onAbrir: () => void; onAvancar: () => void; onArrasta: (c: KCard | null) => void
}) {
  const atrasada = cardAtrasado(c, HOJE)
  return (
    <article
      id={`kc-${c.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', c.id)
        e.dataTransfer.effectAllowed = 'move'
        onArrasta(c)
      }}
      onDragEnd={() => onArrasta(null)}
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
              {diasCard(c, HOJE)} {diasCard(c, HOJE) === 1 ? 'DIA' : 'DIAS'}
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

/* ------------------------------------------------------------ fila do topo */

function CardPedido({ p, fatias, onClick }: { p: Pedido; fatias: KCard[]; onClick: () => void }) {
  const tecs = [...new Set(fatias.map((x) => x.tecnica))]
  const valor = fatias.reduce((s, x) => s + x.valor, 0)
  const atrasado = fatias.some((x) => cardAtrasado(x, HOJE))
  return (
    <button
      onClick={onClick}
      className={`bg-card flex w-[212px] shrink-0 flex-col gap-1 rounded-lg border p-2.5 text-left transition-colors ${
        atrasado ? 'border-destructive' : 'hover:border-ring'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-semibold">{p.pedido}</span>
        <span className="text-muted-foreground ml-auto font-mono text-[10.5px]">{p.entrega}</span>
      </div>
      <div className="truncate text-[12px] font-medium">{p.cliente}</div>
      <div className="flex items-center gap-1">
        {tecs.map((t) => (
          <span key={t} className="size-2 rounded-full" style={{ background: TECNICAS[t].cor }} title={TECNICAS[t].rotulo} />
        ))}
        <span className="text-muted-foreground text-[10px]">
          {fatias.length} fatia{fatias.length === 1 ? '' : 's'}
        </span>
        <span className="text-muted-foreground ml-auto font-mono text-[10.5px] tabular-nums">
          R$ {moedaCurta(valor)}
        </span>
      </div>
    </button>
  )
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground border-info bg-secondary rounded-r-lg border-l-[3px] px-3 py-2 text-[11.5px]">
      {children}
    </p>
  )
}
