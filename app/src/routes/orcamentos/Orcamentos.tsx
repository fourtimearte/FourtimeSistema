import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CalendarDays, FileText, Layers, Plus, Search, ThumbsDown, ThumbsUp, TrendingUp, Wallet,
} from 'lucide-react'
import { ORCAMENTOS_SEED } from '@/data/orcamentosSeed'
import { ETAPAS, ETAPAS_FUNIL, corEtapa, nomeEtapa, type EtapaKey } from '@/lib/orcamentos/tipos'
import {
  diasNaEtapa, etapaDe, FILTROS_ORCAMENTO_VAZIO, filtrarOrcamentos, kpisComercial, moverEtapa,
  ordenarOrcamentos, parado, pecasDe, porEtapa, valorDe, vendedoresDe,
  type ColunaArquivo, type FiltrosOrcamento,
} from '@/lib/orcamentos/regras'
import { moeda, moedaCurta } from '@/lib/pedidos/regras'
import type { Pedido } from '@/lib/pedidos/tipos'
import { CabecalhoPagina, Nota } from '@/components/fourtime/pagina'
import { KpiFiltro, Vazio } from '@/components/fourtime/primitivos'
import { Abas, PainelAba } from '@/components/fourtime/Abas'
import { Dropdown } from '@/components/fourtime/Dropdown'
import { cardSuperficie } from '@/components/fourtime/superficie'
import { useToast } from '@/components/fourtime/Toast'
import { Button } from '@/components/ui/button'
import { PontoTecnica } from '@/components/fourtime/TagTecnica'
import { FichaOrcamento } from './FichaOrcamento'
import { cn } from '@/lib/utils'

const HOJE = new Date()

/** Orçamentos — o arquivo de tudo que já foi orçado, e o funil do que
 *  ainda está sendo decidido.
 *
 *  O Kanban de Produção começa no orçamento APROVADO. Tudo que acontece
 *  antes — o contato, o briefing, o envio, a negociação — não morava em
 *  lugar nenhum: estava no WhatsApp de quem atendeu. É por isso que
 *  ninguém sabia responder quantos orçamentos estavam parados esperando o
 *  cliente, nem quantos a gente perde e por quê. */
export function Orcamentos() {
  const ir = useNavigate()
  const avisar = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>(ORCAMENTOS_SEED)
  const [aba, setAba] = useState('funil')
  const [f, setF] = useState<FiltrosOrcamento>(FILTROS_ORCAMENTO_VAZIO)
  const [aberto, setAberto] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<Pedido | null>(null)
  const [coluna, setColuna] = useState<ColunaArquivo>('entrega')
  const [desc, setDesc] = useState(true)

  const visiveis = useMemo(() => filtrarOrcamentos(pedidos, f, HOJE), [pedidos, f])
  const colunas = useMemo(() => porEtapa(visiveis), [visiveis])
  const k = useMemo(() => kpisComercial(pedidos, HOJE), [pedidos])
  const listaVend = useMemo(() => vendedoresDe(pedidos), [pedidos])
  const ordenados = useMemo(() => ordenarOrcamentos(visiveis, coluna, desc), [visiveis, coluna, desc])

  const mover = useCallback(
    (numero: string, destino: EtapaKey) => {
      setPedidos((atuais) => moverEtapa(atuais, numero, destino))
      avisar(`${numero} → ${nomeEtapa(destino)}`)
    },
    [avisar],
  )

  const filtrarPor = (etapa: EtapaKey | null) => {
    setF({ ...f, etapa: f.etapa === etapa ? null : etapa })
    setAba('arquivo')
  }

  const pedidoAberto = pedidos.find((p) => p.pedido === aberto) ?? null

  return (
    <>
      <CabecalhoPagina
        titulo="Orçamentos"
        descricao="O arquivo de tudo que já foi orçado e o funil do que ainda está sendo decidido. A produção começa onde esta tela termina: no aprovado."
      >
        {k.parados > 0 && (
          <button
            onClick={() => {
              setF({ ...FILTROS_ORCAMENTO_VAZIO, soParados: true })
              setAba('arquivo')
            }}
            className="border-warning text-warning flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-3xl border px-3 text-xs font-semibold whitespace-nowrap"
          >
            <AlertTriangle className="size-3.5" /> {k.parados} parados
          </button>
        )}
        <Button size="sm">
          <Plus /> Novo orçamento
        </Button>
      </CabecalhoPagina>

      <div className="grid gap-(--ft-gap) [grid-template-columns:repeat(auto-fit,minmax(178px,1fr))]">
        <KpiFiltro
          rotulo="Em aberto" valor={k.emAberto} nota={`R$ ${moedaCurta(k.valorEmAberto)} em jogo`}
          proporcao={pct(k.emAberto, pedidos.length)} ativo={false}
          onClick={() => { setF(FILTROS_ORCAMENTO_VAZIO); setAba('funil') }}
          icone={<FileText className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="Parados" valor={k.parados} nota="passaram do prazo da etapa"
          proporcao={pct(k.parados, pedidos.length)} ativo={f.soParados}
          onClick={() => { setF({ ...FILTROS_ORCAMENTO_VAZIO, soParados: !f.soParados }); setAba('arquivo') }}
          icone={<AlertTriangle className="size-3.5" />} cor="var(--warning)"
        />
        <KpiFiltro
          rotulo="Conversão" valor={`${(k.conversao * 100).toFixed(0)}%`} nota={`${k.ganhos} ganhos · ${k.perdidos} perdidos`}
          proporcao={k.conversao * 100} ativo={false}
          onClick={() => filtrarPor('perdido')} icone={<TrendingUp className="size-3.5" />}
          cor="var(--success)"
        />
        <KpiFiltro
          rotulo="Ganhos" valor={k.ganhos} nota="aprovado, em produção ou entregue"
          proporcao={pct(k.ganhos, pedidos.length)} ativo={false}
          onClick={() => filtrarPor('aprovado')} icone={<ThumbsUp className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="Perdidos" valor={k.perdidos} nota="com motivo registrado"
          proporcao={pct(k.perdidos, pedidos.length)} ativo={f.etapa === 'perdido'}
          onClick={() => filtrarPor('perdido')} icone={<ThumbsDown className="size-3.5" />}
          cor="var(--destructive)"
        />
        <KpiFiltro
          rotulo="Ticket médio" valor={`R$ ${moedaCurta(k.ticketMedio)}`} nota="só dos orçamentos ganhos"
          proporcao={62} ativo={false} onClick={() => setAba('arquivo')} icone={<Wallet className="size-3.5" />}
        />
      </div>

      {/* -------- filtros -------- */}
      <div className={cn(cardSuperficie, 'flex flex-wrap items-center gap-2 p-(--ft-pad-y) px-(--ft-card-pad)')}>
        <div className="relative min-w-[200px] flex-1 sm:max-w-[300px]">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-[14px] -translate-y-1/2" />
          <input
            value={f.busca}
            onChange={(e) => setF({ ...f, busca: e.target.value })}
            placeholder="Pedido, cliente ou vendedor…"
            className="bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30 h-(--ft-control-h-sm) w-full rounded-3xl border border-transparent pl-9 text-xs outline-none focus-visible:ring-[3px]"
          />
        </div>
        <Dropdown
          rotulo="Etapa" largura={172}
          valor={f.etapa ?? ''}
          onEscolher={(v) => setF({ ...f, etapa: (v || null) as EtapaKey | null })}
          opcoes={[
            { valor: '', texto: 'Todas' },
            ...ETAPAS.map((e) => ({
              valor: e.key,
              texto: e.nome,
              contagem: pedidos.filter((p) => etapaDe(p) === e.key).length,
            })),
          ]}
        />
        <Dropdown
          rotulo="Vendedor"
          valor={f.vendedor ?? ''}
          onEscolher={(v) => setF({ ...f, vendedor: v || null })}
          opcoes={[
            { valor: '', texto: 'Todos' },
            ...listaVend.map((v) => ({ valor: v, texto: v, contagem: pedidos.filter((p) => p.vendedor === v).length })),
          ]}
        />
        <button
          onClick={() => setF({ ...f, soParados: !f.soParados })}
          aria-pressed={f.soParados}
          className={cn(
            'flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-3xl border px-3 text-xs font-medium transition-colors',
            f.soParados ? 'border-warning text-warning font-semibold' : 'hover:bg-accent',
          )}
        >
          <AlertTriangle className="size-3.5" /> Só parados
        </button>
        <span className="text-muted-foreground text-xs">
          {visiveis.length === pedidos.length
            ? `${pedidos.length} orçamentos`
            : `${visiveis.length} de ${pedidos.length}`}
        </span>
      </div>

      <Abas
        abas={[
          { id: 'funil', rotulo: 'Funil', contagem: k.emAberto },
          { id: 'arquivo', rotulo: 'Arquivo', contagem: pedidos.length },
        ]}
        ativa={aba}
        aoTrocar={setAba}
      />

      <PainelAba id="funil" ativa={aba}>
        <Funil
          colunas={colunas}
          arrastando={arrastando}
          onArrasta={setArrastando}
          onSolta={mover}
          onAbrir={setAberto}
        />
        <div className="mt-(--ft-gap) grid gap-(--ft-gap) lg:grid-cols-2">
          <Nota>
            <b>O funil para no aprovado.</b> Dali em diante quem manda é a rota de produção — duas telas mandando no
            mesmo pedido é como se perde o rastro dele.
          </Nota>
          <Nota tom="aviso">
            Aqui <b>não há rota fixa</b>, ao contrário da produção. O comercial volta atrás, pula o briefing quando o
            cliente já sabe o que quer, e às vezes um perdido volta a viver. Travar isso atrapalharia mais que ajudaria.
          </Nota>
        </div>
      </PainelAba>

      <PainelAba id="arquivo" ativa={aba}>
        <Arquivo
          pedidos={ordenados}
          coluna={coluna}
          desc={desc}
          onOrdenar={(c) => {
            if (c === coluna) setDesc(!desc)
            else {
              setColuna(c)
              setDesc(false)
            }
          }}
          onAbrir={setAberto}
          onLimpar={() => setF(FILTROS_ORCAMENTO_VAZIO)}
        />
      </PainelAba>

      {pedidoAberto && (
        <FichaOrcamento
          p={pedidoAberto}
          hoje={HOJE}
          aoFechar={() => setAberto(null)}
          aoMover={mover}
          aoCliente={() => ir('/clientes')}
          aoEditor={() => avisar('O Editor ainda não existe no V6 — entra junto com o importador de .ft.', 'erro')}
        />
      )}
    </>
  )
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

/* ------------------------------------------------------------------ funil */

function Funil({
  colunas, arrastando, onArrasta, onSolta, onAbrir,
}: {
  colunas: Record<EtapaKey, Pedido[]>
  arrastando: Pedido | null
  onArrasta: (p: Pedido | null) => void
  onSolta: (numero: string, destino: EtapaKey) => void
  onAbrir: (numero: string) => void
}) {
  return (
    <div className="-mx-(--ft-gap) overflow-x-auto px-(--ft-gap) pb-3">
      <div className="flex min-w-max gap-3">
        {ETAPAS_FUNIL.map((e) => (
          <ColunaFunil
            key={e.key}
            etapa={e.key}
            nome={e.nome}
            cor={e.cor}
            saida={e.saida}
            pedidos={colunas[e.key] ?? []}
            arrastando={arrastando}
            onArrasta={onArrasta}
            onSolta={onSolta}
            onAbrir={onAbrir}
          />
        ))}
      </div>
    </div>
  )
}

function ColunaFunil({
  etapa, nome, cor, saida, pedidos, arrastando, onArrasta, onSolta, onAbrir,
}: {
  etapa: EtapaKey; nome: string; cor: string; saida: string; pedidos: Pedido[]
  arrastando: Pedido | null
  onArrasta: (p: Pedido | null) => void
  onSolta: (numero: string, destino: EtapaKey) => void
  onAbrir: (numero: string) => void
}) {
  const [sobre, setSobre] = useState(false)
  const valor = pedidos.reduce((s, p) => s + valorDe(p), 0)

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault()
        setSobre(true)
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault()
        setSobre(false)
        const n = e.dataTransfer.getData('text/plain')
        if (n) onSolta(n, etapa)
      }}
      className={cn(
        'bg-secondary flex max-h-[64vh] min-h-[240px] w-[260px] shrink-0 flex-col overflow-hidden rounded-3xl transition-shadow',
        sobre && 'ring-primary ring-2',
        arrastando && 'opacity-100',
      )}
    >
      <div className="h-[3px] shrink-0" style={{ background: cor }} />
      <div className="shrink-0 border-b px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-heading truncate text-[12.5px] font-semibold">{nome}</span>
          <span className="bg-card text-muted-foreground ml-auto shrink-0 rounded-full px-2 py-0.5 font-mono text-[10.5px] tabular-nums">
            {pedidos.length}
          </span>
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-baseline gap-2 text-[10.5px]">
          <span className="font-mono tabular-nums">R$ {moedaCurta(valor)}</span>
          <span className="truncate" title={saida}>
            · {saida}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto p-2.5">
        {pedidos.map((p) => (
          <CardOrcamento key={p.pedido} p={p} onAbrir={() => onAbrir(p.pedido)} onArrasta={onArrasta} />
        ))}
        {!pedidos.length && (
          <span className="text-muted-foreground/60 px-1 py-4 text-center text-[10.5px]">vazia</span>
        )}
      </div>
    </section>
  )
}

/** O card do funil. Mais enxuto que o do Kanban de propósito: aqui o que
 *  importa é quem, quanto e há quanto tempo — o detalhe de produção ainda
 *  não existe. */
function CardOrcamento({
  p, onAbrir, onArrasta,
}: {
  p: Pedido
  onAbrir: () => void
  onArrasta: (p: Pedido | null) => void
}) {
  const preso = parado(p, HOJE)
  const dias = diasNaEtapa(p, HOJE)
  const tecnicas = [...new Set(p.layouts.flatMap((l) => l.tecnicas))]

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', p.pedido)
        e.dataTransfer.effectAllowed = 'move'
        onArrasta(p)
      }}
      onDragEnd={() => onArrasta(null)}
      className={cn(
        'bg-card ring-foreground/5 dark:ring-foreground/10 cursor-grab rounded-3xl shadow-sm ring-1 transition-shadow active:cursor-grabbing',
        preso ? 'ring-warning ring-2' : 'hover:shadow-md',
      )}
    >
      <button onClick={onAbrir} className="flex w-full flex-col gap-2.5 p-3.5 text-left">
        <span className="line-clamp-2 text-[13.5px] leading-snug font-semibold">{p.cliente}</span>
        <span className="text-muted-foreground -mt-1.5 font-mono text-[11.5px]">{p.pedido}</span>

        <div className="bg-secondary flex items-center gap-1.5 rounded-2xl px-2.5 py-2">
          <Layers className="text-muted-foreground size-3.5 shrink-0" />
          <span className="font-mono text-[11.5px] font-medium">
            {p.layouts.length} {p.layouts.length === 1 ? 'layout' : 'layouts'}
          </span>
          <span className="ml-auto flex shrink-0 gap-1">
            {tecnicas.map((t) => (
              <PontoTecnica key={t} tecnica={t} />
            ))}
          </span>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {p.entrega}
          </span>
          <span className={cn('font-mono tabular-nums', preso && 'text-warning font-semibold')}>
            {dias}d na etapa
          </span>
          <span className="ml-auto font-mono font-semibold tabular-nums">R$ {moedaCurta(valorDe(p))}</span>
        </div>
      </button>
    </article>
  )
}

/* ---------------------------------------------------------------- arquivo */

function Arquivo({
  pedidos, coluna, desc, onOrdenar, onAbrir, onLimpar,
}: {
  pedidos: Pedido[]
  coluna: ColunaArquivo
  desc: boolean
  onOrdenar: (c: ColunaArquivo) => void
  onAbrir: (numero: string) => void
  onLimpar: () => void
}) {
  const cols: [ColunaArquivo, string, boolean][] = [
    ['pedido', 'Pedido', false],
    ['cliente', 'Cliente', false],
    ['etapa', 'Etapa', false],
    ['entrega', 'Entrega', false],
    ['pecas', 'Peças', true],
    ['valor', 'Valor', true],
  ]

  if (!pedidos.length)
    return (
      <Vazio
        titulo="Nenhum orçamento com estes filtros"
        descricao="Limpe a busca ou escolha outra etapa para ver o arquivo inteiro."
        acao={
          <Button size="sm" variant="outline" className="mt-1" onClick={onLimpar}>
            Limpar filtros
          </Button>
        }
      />
    )

  return (
    <div className={cn(cardSuperficie, 'rounded-4xl')} data-density="compacta">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
          <thead>
            <tr>
              {cols.map(([c, t, dir]) => (
                <th
                  key={c}
                  className={cn(
                    'font-heading text-muted-foreground bg-card sticky top-0 border-b px-(--ft-pad-x) py-(--ft-pad-y) text-[11px] font-semibold tracking-[0.03em] uppercase',
                    dir ? 'text-right' : 'text-left',
                  )}
                >
                  <button onClick={() => onOrdenar(c)} className="hover:text-foreground inline-flex items-center gap-1">
                    {t}
                    {coluna === c && <span aria-hidden>{desc ? '▾' : '▴'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const e = etapaDe(p)
              const preso = parado(p, HOJE)
              return (
                <tr
                  key={p.pedido}
                  onClick={() => onAbrir(p.pedido)}
                  className="hover:bg-accent cursor-pointer transition-colors last:[&>td]:border-b-0"
                >
                  <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) font-mono whitespace-nowrap">{p.pedido}</td>
                  <td className="h-(--ft-row-h) max-w-[280px] truncate border-b px-(--ft-pad-x)">{p.cliente}</td>
                  <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) whitespace-nowrap">
                    <span
                      className="inline-flex h-5 items-center rounded-full border px-2 text-[9.5px] font-bold"
                      style={{ borderColor: corEtapa(e), color: corEtapa(e) }}
                    >
                      {nomeEtapa(e).toUpperCase()}
                    </span>
                    {preso && <span className="text-warning ml-1.5 text-[10px] font-semibold">parado</span>}
                  </td>
                  <td className="text-muted-foreground h-(--ft-row-h) border-b px-(--ft-pad-x) font-mono whitespace-nowrap">
                    {p.entrega}
                  </td>
                  <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) text-right font-mono tabular-nums">
                    {pecasDe(p)}
                  </td>
                  <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) text-right font-mono tabular-nums">
                    {moeda(valorDe(p))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
