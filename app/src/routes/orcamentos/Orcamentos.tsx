import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, CalendarDays, FileText, Factory, Layers, PencilLine, Plus, Search,
  ThumbsDown, ThumbsUp, TrendingUp, Wallet,
} from 'lucide-react'
import { ORCAMENTOS_SEED } from '@/data/orcamentosSeed'
import { ETAPAS, ETAPAS_FUNIL, corEtapa, nomeEtapa, type EtapaKey } from '@/lib/orcamentos/tipos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  diasNaEtapa, etapaDe, FILTROS_ORCAMENTO_VAZIO, filtrarOrcamentos, kpisComercial, moverEtapa,
  parado, porEtapa, valorDe, vendedoresDe, type FiltrosOrcamento,
} from '@/lib/orcamentos/regras'
import { moedaCurta } from '@/lib/pedidos/regras'
import type { Pedido } from '@/lib/pedidos/tipos'
import { CabecalhoPagina, Nota } from '@/components/fourtime/pagina'
import { KpiFiltro } from '@/components/fourtime/primitivos'
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
  const [f, setF] = useState<FiltrosOrcamento>(FILTROS_ORCAMENTO_VAZIO)
  const [aberto, setAberto] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<Pedido | null>(null)

  const visiveis = useMemo(() => filtrarOrcamentos(pedidos, f, HOJE), [pedidos, f])
  const colunas = useMemo(() => porEtapa(visiveis), [visiveis])
  const k = useMemo(() => kpisComercial(pedidos, HOJE), [pedidos])
  const listaVend = useMemo(() => vendedoresDe(pedidos), [pedidos])

  const mover = useCallback(
    (numero: string, destino: EtapaKey) => {
      setPedidos((atuais) => moverEtapa(atuais, numero, destino))
      avisar(`${numero} → ${nomeEtapa(destino)}`)
    },
    [avisar],
  )

  const filtrarPor = (etapa: EtapaKey | null) => setF({ ...f, etapa: f.etapa === etapa ? null : etapa })

  const pedidoAberto = pedidos.find((p) => p.pedido === aberto) ?? null

  return (
    <>
      <CabecalhoPagina
        titulo="Orçamentos"
        descricao="O arquivo de tudo que já foi orçado e o funil do que ainda está sendo decidido. A produção começa onde esta tela termina: no aprovado."
      >
        {k.parados > 0 && (
          <button
            onClick={() => setF({ ...FILTROS_ORCAMENTO_VAZIO, soParados: true })}
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
          onClick={() => setF(FILTROS_ORCAMENTO_VAZIO)}
          icone={<FileText className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="Parados" valor={k.parados} nota="passaram do prazo da etapa"
          proporcao={pct(k.parados, pedidos.length)} ativo={f.soParados}
          onClick={() => setF({ ...FILTROS_ORCAMENTO_VAZIO, soParados: !f.soParados })}
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
          proporcao={62} ativo={false} onClick={() => filtrarPor('entregue')} icone={<Wallet className="size-3.5" />}
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

      <Funil
        colunas={colunas}
        pedidos={pedidos}
        etapaFiltrada={f.etapa}
        arrastando={arrastando}
        onArrasta={setArrastando}
        onSolta={mover}
        onAbrir={setAberto}
        onFiltrar={filtrarPor}
        onKanban={() => ir('/kanban')}
      />

      <div className="grid gap-(--ft-gap) lg:grid-cols-2">
        <Nota>
          <b>O funil para no aprovado.</b> Dali em diante quem manda é a rota de produção — duas telas mandando no
          mesmo pedido é como se perde o rastro dele.
        </Nota>
        <Nota tom="aviso">
          Aqui <b>não há rota fixa</b>, ao contrário da produção. O comercial volta atrás, pula o briefing quando o
          cliente já sabe o que quer, e às vezes um perdido volta a viver. Travar isso atrapalharia mais que ajudaria.
        </Nota>
      </div>

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

/** O quadro. A primeira coluna não é uma etapa: são os DOIS cartões que
 *  dividem o mundo em duas — o que ainda está sendo decidido e o que já
 *  passou para a produção.
 *
 *  Antes isso era uma aba "Arquivo" com tudo numa lista só. Aba esconde, e
 *  lista de 90 linhas não responde nada de relance. Os dois cartões ficam
 *  ao lado do funil, sempre à vista, e cada linha deles é um filtro. */
function Funil({
  colunas, pedidos, etapaFiltrada, arrastando, onArrasta, onSolta, onAbrir, onFiltrar, onKanban,
}: {
  colunas: Record<EtapaKey, Pedido[]>
  pedidos: Pedido[]
  etapaFiltrada: EtapaKey | null
  arrastando: Pedido | null
  onArrasta: (p: Pedido | null) => void
  onSolta: (numero: string, destino: EtapaKey) => void
  onAbrir: (numero: string) => void
  onFiltrar: (e: EtapaKey | null) => void
  onKanban: () => void
}) {
  const todas = porEtapa(pedidos)
  const conta = (ks: EtapaKey[]) => ks.reduce((s, k) => s + (todas[k]?.length ?? 0), 0)
  const soma = (ks: EtapaKey[]) => ks.reduce((s, k) => s + (todas[k] ?? []).reduce((a, p) => a + valorDe(p), 0), 0)

  const ABERTAS = ETAPAS_FUNIL.filter((e) => e.key !== 'aprovado').map((e) => e.key)
  const NA_PRODUCAO: EtapaKey[] = ['aprovado', 'producao', 'entregue']

  const nRascunho = conta(ABERTAS)
  const nProducao = conta(NA_PRODUCAO)
  const total = nRascunho + nProducao || 1
  const parados = pedidos.filter((p) => parado(p, HOJE)).length

  return (
    <div className="-mx-(--ft-gap) overflow-x-auto px-(--ft-gap) pb-3">
      <div className="flex min-w-max items-start gap-3">
        {/* ---- os dois cartões, antes do funil ---- */}
        <div className="flex w-[292px] shrink-0 flex-col gap-3">
          <CartaoEstado
            titulo="Rascunhos"
            descricao="Ainda sendo feitos e negociados — vivem no funil ao lado."
            icone={<PencilLine className="size-4" />}
            n={nRascunho}
            valor={soma(ABERTAS)}
            proporcao={(nRascunho / total) * 100}
            cor="var(--cat-6)"
            linhas={ETAPAS_FUNIL.filter((e) => e.key !== 'aprovado').map((e) => ({
              key: e.key,
              nome: e.nome,
              cor: e.cor,
              n: todas[e.key]?.length ?? 0,
              valor: (todas[e.key] ?? []).reduce((a, p) => a + valorDe(p), 0),
            }))}
            selecionada={etapaFiltrada}
            onLinha={onFiltrar}
            rodape={
              <div className="flex flex-wrap items-center gap-2">
                {parados > 0 && (
                  <span className="border-warning text-warning inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold">
                    <AlertTriangle className="size-3" /> {parados} PARADOS
                  </span>
                )}
                <button
                  onClick={() => onFiltrar('perdido')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-colors',
                    etapaFiltrada === 'perdido'
                      ? 'border-destructive text-destructive'
                      : 'text-muted-foreground hover:text-destructive hover:border-destructive',
                  )}
                >
                  <ThumbsDown className="size-3" /> {todas.perdido?.length ?? 0} PERDIDOS
                </button>
              </div>
            }
          />

          <CartaoEstado
            titulo="Em produção"
            descricao="Aprovados e enviados para o Kanban do MARK42."
            icone={<Factory className="size-4" />}
            n={nProducao}
            valor={soma(NA_PRODUCAO)}
            proporcao={(nProducao / total) * 100}
            cor="var(--cat-1)"
            linhas={NA_PRODUCAO.map((k) => ({
              key: k,
              nome: nomeEtapa(k),
              cor: corEtapa(k),
              n: todas[k]?.length ?? 0,
              valor: (todas[k] ?? []).reduce((a, p) => a + valorDe(p), 0),
            }))}
            selecionada={etapaFiltrada}
            onLinha={onFiltrar}
            rodape={
              <Button size="sm" variant="outline" className="w-full" onClick={onKanban}>
                Abrir o Kanban de produção <ArrowRight />
              </Button>
            }
          />
        </div>

        {/* ---- o funil ---- */}
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

interface LinhaEstado { key: EtapaKey; nome: string; cor: string; n: number; valor: number }

/** Um dos dois cartões. Segue o arranjo "métrica" do /kit: rótulo micro,
 *  número grande em mono, barra fina, e uma caixa interna com a divisão —
 *  cada linha clicável, porque um número que não leva a lugar nenhum é
 *  decoração. */
function CartaoEstado({
  titulo, descricao, icone, n, valor, proporcao, cor, linhas, selecionada, onLinha, rodape,
}: {
  titulo: string
  descricao: string
  icone: React.ReactNode
  n: number
  valor: number
  proporcao: number
  cor: string
  linhas: LinhaEstado[]
  selecionada: EtapaKey | null
  onLinha: (e: EtapaKey) => void
  rodape?: React.ReactNode
}) {
  return (
    <Card size="sm" className="gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <span className="grid size-7 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklch, ${cor} 18%, transparent)`, color: cor }}>
            {icone}
          </span>
          {titulo}
        </CardTitle>
        <CardDescription className="text-[11.5px]">{descricao}</CardDescription>
        <CardAction>
          <span className="font-mono text-2xl leading-none font-semibold tabular-nums">{n}</span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-[10.5px] font-semibold tracking-[0.06em] uppercase">
            Valor somado
          </span>
          <span className="font-mono text-[13px] font-semibold tabular-nums">R$ {moedaCurta(valor)}</span>
        </div>
        <Progress
          value={proporcao}
          className="[&_[data-slot=progress-track]]:h-1.5"
          style={{ ['--primary' as string]: cor }}
        />

        <div className="bg-secondary flex flex-col rounded-2xl p-1.5">
          {linhas.map((l) => {
            const on = selecionada === l.key
            return (
              <button
                key={l.key}
                onClick={() => onLinha(l.key)}
                aria-pressed={on}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[11.5px] transition-colors',
                  on ? 'bg-card font-semibold shadow-sm' : 'hover:bg-card/60',
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: l.cor }} />
                <span className="min-w-0 flex-1 truncate">{l.nome}</span>
                <span className="text-muted-foreground shrink-0 font-mono tabular-nums">
                  R$ {moedaCurta(l.valor)}
                </span>
                <span className="w-6 shrink-0 text-right font-mono font-semibold tabular-nums">{l.n}</span>
              </button>
            )
          })}
        </div>

        {rodape}
      </CardContent>
    </Card>
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
