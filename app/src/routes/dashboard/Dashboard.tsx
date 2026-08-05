import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Boxes, FileText, Factory, TrendingUp, Wallet,
} from 'lucide-react'
import { PEDIDOS_SEED } from '@/data/pedidosSeed'
import { CLIENTES_BLING } from '@/data/clientesBling'
import {
  diasDeAtraso, gargalos, giroPorTecnica, kpis, maisAtrasados, moeda, moedaCurta, tecnicas, totais,
} from '@/lib/pedidos/regras'
import { TECNICAS, nomeEstacao } from '@/lib/pedidos/tipos'
import { Badge, KpiFiltro, Vazio } from '@/components/fourtime/primitivos'

const HOJE = new Date()

/** O Dashboard LÊ de todas as páginas e não escreve em nenhuma.
 *  Todo número leva à origem — KPI que não leva a lugar nenhum é decoração. */
export function Dashboard() {
  const ir = useNavigate()
  const k = useMemo(() => kpis(PEDIDOS_SEED, HOJE), [])
  const gar = useMemo(() => gargalos(PEDIDOS_SEED), [])
  const giro = useMemo(() => giroPorTecnica(PEDIDOS_SEED), [])
  const atrasados = useMemo(() => maisAtrasados(PEDIDOS_SEED, HOJE), [])
  const maxGargalo = gar[0]?.n ?? 1

  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 max-w-[74ch] text-[12.5px]">
            Lê de todas as páginas, não escreve em nenhuma. Todo número é clicável até a origem.
          </p>
        </div>
        <div className="flex-1" />
        <span className="text-muted-foreground border-warning bg-secondary rounded-lg border-l-[3px] px-3 py-1.5 text-[11.5px]">
          Pedidos são <b className="text-foreground">seed</b> até o importador de <code>.ft</code> existir.
          Os <b className="text-foreground">1.901 clientes</b> são reais.
        </span>
      </div>

      <div className="grid gap-(--ft-gap) [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <KpiFiltro
          rotulo="Em produção" valor={k.emProducao} nota={`R$ ${moedaCurta(k.valorEmProducao)} · vem do Kanban`}
          proporcao={pct(k.emProducao, PEDIDOS_SEED.length)} ativo={false}
          onClick={() => ir('/kanban')} icone={<Factory className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="Atrasados" valor={k.atrasados} nota="prazo estourado"
          proporcao={pct(k.atrasados, PEDIDOS_SEED.length)} ativo={false}
          onClick={() => ir('/kanban')} icone={<AlertTriangle className="size-3.5" />}
          cor="var(--destructive)"
        />
        <KpiFiltro
          rotulo="Faturado no mês" valor={`R$ ${moedaCurta(k.faturadoMes)}`} nota="pedidos entregues"
          proporcao={70} ativo={false} onClick={() => ir('/financeiro')} icone={<TrendingUp className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="A receber" valor={`R$ ${moedaCurta(k.aReceber)}`} nota="aprovado e em produção"
          proporcao={85} ativo={false} onClick={() => ir('/financeiro')} icone={<Wallet className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="Ticket médio" valor={`R$ ${moedaCurta(k.ticketMedio)}`} nota={`${k.pedidosMes} pedidos no mês`}
          proporcao={55} ativo={false} onClick={() => ir('/orcamentos')} icone={<FileText className="size-3.5" />}
        />
        <KpiFiltro
          rotulo="Clientes" valor={CLIENTES_BLING.length} nota="base real do Bling"
          proporcao={100} ativo={false} onClick={() => ir('/clientes')} icone={<Boxes className="size-3.5" />}
        />
      </div>

      <div className="grid gap-(--ft-gap) lg:grid-cols-2">
        {/* UMA grandeza variando intensidade → rampa SEQUENCIAL */}
        <Painel titulo="Gargalos por estação" nota="cards parados" aoVer={() => ir('/kanban')}>
          {gar.length ? (
            <>
              <ul className="flex flex-col gap-2.5">
                {gar.map((g, i) => (
                  <li key={g.estacao} className="grid grid-cols-[128px_1fr_36px] items-center gap-2.5 text-xs">
                    <span className="truncate">{g.nome}</span>
                    <span className="bg-secondary h-2 overflow-hidden rounded-full">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(g.n / maxGargalo) * 100}%`, background: `var(--chart-${Math.min(5, i + 1)})` }}
                      />
                    </span>
                    <span className="text-right font-mono tabular-nums">{g.n}</span>
                  </li>
                ))}
              </ul>
              <Nota>
                Uma grandeza só, variando intensidade → <b>rampa sequencial</b> <code>--chart-*</code>.
              </Nota>
            </>
          ) : (
            <Vazio titulo="Nada parado" descricao="Nenhum pedido em produção no momento." />
          )}
        </Painel>

        {/* CATEGORIAS distintas → paleta CATEGÓRICA */}
        <Painel titulo="Giro por técnica" nota="agrega as tags de Design" aoVer={() => ir('/kanban')}>
          {giro.length ? (
            <>
              <ul className="flex flex-col gap-2.5">
                {giro.map((g) => (
                  <li key={g.tecnica} className="grid grid-cols-[128px_1fr_44px] items-center gap-2.5 text-xs">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: g.cor }} />
                      {g.rotulo}
                    </span>
                    <span className="bg-secondary h-2 overflow-hidden rounded-full">
                      <span className="block h-full rounded-full" style={{ width: `${g.pct}%`, background: g.cor }} />
                    </span>
                    <span className="text-right font-mono tabular-nums">{g.pct.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
              <Nota>
                Categorias distintas → <b>paleta categórica</b> <code>--cat-*</code>. Com a rampa vermelha, cinco
                técnicas se distinguiriam só por claridade — some em P&amp;B e falha em baixa visão.
              </Nota>
            </>
          ) : (
            <Vazio titulo="Sem técnicas" descricao="As tags de Design aparecem quando houver pedido aprovado." />
          )}
        </Painel>
      </div>

      <Painel titulo="Pedidos atrasados" nota={`${k.atrasados} no total`} aoVer={() => ir('/kanban')} semPadding>
        {atrasados.length ? (
          <div className="overflow-x-auto" data-density="compacta">
            <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  {['Pedido', 'Cliente', 'Técnicas', 'Estação', 'Atraso', 'Valor'].map((t, i) => (
                    <th
                      key={t}
                      className={`font-heading text-muted-foreground border-b px-(--ft-pad-x) py-(--ft-pad-y) text-[11px] font-semibold tracking-[0.03em] uppercase ${i === 5 ? 'text-right' : 'text-left'}`}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atrasados.map((p) => {
                  const t = totais(p)
                  const dias = diasDeAtraso(p.entrega, HOJE)
                  return (
                    <tr
                      key={p.pedido}
                      onClick={() => ir('/kanban')}
                      className="hover:bg-accent cursor-pointer transition-colors last:[&>td]:border-b-0"
                    >
                      <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) font-mono whitespace-nowrap">{p.pedido}</td>
                      <td className="h-(--ft-row-h) max-w-[220px] truncate border-b px-(--ft-pad-x)">{p.cliente}</td>
                      <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) whitespace-nowrap">
                        <span className="flex gap-1">
                          {tecnicas(p).map((tc) => (
                            <span
                              key={tc}
                              className="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold text-(--cat-foreground)"
                              style={{ background: TECNICAS[tc].cor }}
                            >
                              {TECNICAS[tc].rotulo}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="text-muted-foreground h-(--ft-row-h) border-b px-(--ft-pad-x) whitespace-nowrap">
                        {nomeEstacao(p.estacao)}
                      </td>
                      <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) whitespace-nowrap">
                        {/* alerta é SEMPRE contorno, nunca preenchido */}
                        <Badge tom="alerta">{dias} {dias === 1 ? 'DIA' : 'DIAS'}</Badge>
                      </td>
                      <td className="h-(--ft-row-h) border-b px-(--ft-pad-x) text-right font-mono tabular-nums">
                        {moeda(t.valor)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-(--ft-card-pad)">
            <Vazio titulo="Nenhum pedido atrasado" descricao="Todos os prazos em dia — nada a fazer aqui." />
          </div>
        )}
      </Painel>
    </>
  )
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function Painel({
  titulo, nota, aoVer, semPadding, children,
}: {
  titulo: string; nota?: string; aoVer?: () => void; semPadding?: boolean; children: React.ReactNode
}) {
  return (
    <section className="bg-card rounded-lg border">
      <div className="flex items-center gap-2 border-b px-(--ft-pad-x) py-(--ft-pad-y)">
        <h2 className="font-heading text-[13px] font-semibold">{titulo}</h2>
        <span className="flex-1" />
        {nota && <span className="text-muted-foreground text-[11px]">{nota}</span>}
        {aoVer && (
          <button
            onClick={aoVer}
            className="hover:bg-accent flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
          >
            ver <ArrowRight className="size-3" />
          </button>
        )}
      </div>
      <div className={semPadding ? '' : 'flex flex-col gap-3 p-(--ft-card-pad)'}>{children}</div>
    </section>
  )
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground border-info bg-secondary mt-1 rounded-r-lg border-l-[3px] px-3 py-2 text-[11.5px]">
      {children}
    </p>
  )
}
