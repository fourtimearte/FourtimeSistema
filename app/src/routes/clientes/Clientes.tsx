import { useMemo, useState } from 'react'
import {
  AlertTriangle, Building2, Calendar, ChevronLeft, ChevronRight, Download,
  Mail, MessageCircle, MapPin, Phone, Plus, Search, Users, UserRound, X,
} from 'lucide-react'
import { CLIENTES_BLING } from '@/data/clientesBling'
import {
  calcularKpis, cidadeUf, contarPor, ehPJ, filtrar, idsDuplicados, incompleto,
  ordenar, temDoc, tituloPt, FILTROS_VAZIOS, SEM_VALOR,
  type ChaveOrdem, type FiltroCadastro, type Filtros,
} from '@/lib/clientes/regras'
import { linkWhats } from '@/lib/br'
import type { Cliente } from '@/lib/clientes/tipos'
import { Badge, KpiFiltro, Vazio } from '@/components/fourtime/primitivos'
import { Dropdown } from '@/components/fourtime/Dropdown'
import { Ficha } from './Ficha'
import { cn } from '@/lib/utils'

const HOJE = new Date()

const ROTULO_CADASTRO: Record<string, string> = {
  contato: 'Com contato', semcontato: 'Sem contato', wa: 'Com WhatsApp',
  doc: 'Com CPF/CNPJ', endereco: 'Com endereço', incompleto: 'Cadastro incompleto',
  duplicado: 'Possíveis duplicados', novo30: 'Novos em 30 dias',
}
const ROTULO_PERIODO: Record<string, string> = { mes: 'Este mês', '90': 'Últimos 90 dias' }

export function Clientes() {
  const [f, setF] = useState<Filtros>(FILTROS_VAZIOS)
  const [ordem, setOrdem] = useState<{ k: ChaveOrdem; dir: 1 | -1 }>({ k: 'desde', dir: -1 })
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [aberto, setAberto] = useState<number | null>(null)

  const duplicados = useMemo(() => idsDuplicados(CLIENTES_BLING), [])
  const kpis = useMemo(() => calcularKpis(CLIENTES_BLING, duplicados, HOJE), [duplicados])
  const ufs = useMemo(() => contarPor(CLIENTES_BLING, (c) => cidadeUf(c).uf), [])
  const cidades = useMemo(() => contarPor(CLIENTES_BLING, (c) => cidadeUf(c).cidade), [])
  const anos = useMemo(
    () => [...new Set(CLIENTES_BLING.map((c) => c.criadoEm?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse(),
    [],
  )

  const filtrada = useMemo(
    () => ordenar(filtrar(CLIENTES_BLING, f, { duplicados, hoje: HOJE }), ordem.k, ordem.dir),
    [f, ordem, duplicados],
  )

  const paginas = Math.max(1, Math.ceil(filtrada.length / porPagina))
  const pg = Math.min(pagina, paginas)
  const ini = (pg - 1) * porPagina
  const fatia = filtrada.slice(ini, ini + porPagina)
  const selecionado = aberto != null ? CLIENTES_BLING.find((c) => c.id === aberto) : undefined

  const mudar = (p: Partial<Filtros>) => {
    setF((v) => ({ ...v, ...p }))
    setPagina(1)
  }
  const alternar = <K extends keyof Filtros>(k: K, v: Filtros[K]) => mudar({ [k]: f[k] === v ? '' : v } as Partial<Filtros>)
  const limpar = () => {
    setF(FILTROS_VAZIOS)
    setPagina(1)
  }

  const ativos: { texto: string; remover: () => void }[] = []
  if (f.tipo) ativos.push({ texto: f.tipo === 'PF' ? 'Pessoa física' : 'Pessoa jurídica', remover: () => mudar({ tipo: '' }) })
  if (f.uf) ativos.push({ texto: f.uf === SEM_VALOR ? 'Sem UF' : `UF: ${f.uf}`, remover: () => mudar({ uf: '' }) })
  if (f.cidade) ativos.push({ texto: f.cidade === SEM_VALOR ? 'Sem cidade' : `Cidade: ${f.cidade}`, remover: () => mudar({ cidade: '' }) })
  if (f.periodo) ativos.push({ texto: ROTULO_PERIODO[f.periodo] ?? `Em ${f.periodo}`, remover: () => mudar({ periodo: '' }) })
  if (f.cadastro) ativos.push({ texto: ROTULO_CADASTRO[f.cadastro], remover: () => mudar({ cadastro: '' }) })
  if (f.busca) ativos.push({ texto: `“${f.busca}”`, remover: () => mudar({ busca: '' }) })

  const pct = (n: number) => (kpis.total ? Math.round((n / kpis.total) * 100) : 0)

  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Clientes cadastrados</h1>
          <p className="text-muted-foreground mt-0.5 max-w-[74ch] text-[12.5px]">
            Base real importada do Bling · <span className="font-mono">{kpis.total.toLocaleString('pt-BR')}</span> contatos.
            Os 223 do editor estão desatualizados e entram como complemento, não como fonte.
          </p>
        </div>
        <div className="flex-1" />
        <button className="hover:bg-accent flex h-(--ft-control-h) items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-medium">
          <Download className="size-4" /> Exportar filtro
        </button>
        <button className="bg-primary text-primary-foreground flex h-(--ft-control-h) items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium hover:opacity-90">
          <Plus className="size-4" /> Novo cliente
        </button>
      </div>

      {/* O KPI é o filtro — o número deixa de ser enfeite e vira ação */}
      <div className="grid gap-(--ft-gap) [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <KpiFiltro rotulo="Total de clientes" valor={kpis.total} nota="base Bling" proporcao={100}
          ativo={!f.tipo && !f.cadastro} onClick={limpar} icone={<Users className="size-3.5" />} />
        <KpiFiltro rotulo="Pessoa física" valor={kpis.pf} nota={`${pct(kpis.pf)}% da base`} proporcao={pct(kpis.pf)}
          ativo={f.tipo === 'PF'} onClick={() => alternar('tipo', 'PF')} icone={<UserRound className="size-3.5" />} />
        <KpiFiltro rotulo="Pessoa jurídica" valor={kpis.pj} nota={`${pct(kpis.pj)}% da base`} proporcao={pct(kpis.pj)}
          ativo={f.tipo === 'PJ'} onClick={() => alternar('tipo', 'PJ')} icone={<Building2 className="size-3.5" />} />
        <KpiFiltro rotulo="Com contato" valor={kpis.comContato} nota="fone ou e-mail" proporcao={pct(kpis.comContato)}
          ativo={f.cadastro === 'contato'} onClick={() => alternar('cadastro', 'contato' as FiltroCadastro)} icone={<Phone className="size-3.5" />} />
        <KpiFiltro rotulo="Novos · 30 dias" valor={kpis.novos30} nota="cadastro recente" proporcao={Math.min(100, pct(kpis.novos30) * 4)}
          ativo={f.cadastro === 'novo30'} onClick={() => alternar('cadastro', 'novo30' as FiltroCadastro)} icone={<Calendar className="size-3.5" />} />
        <KpiFiltro rotulo="Cadastro incompleto" valor={kpis.incompletos} nota="sem doc e sem contato" proporcao={pct(kpis.incompletos)}
          ativo={f.cadastro === 'incompleto'} onClick={() => alternar('cadastro', 'incompleto' as FiltroCadastro)}
          icone={<AlertTriangle className="size-3.5" />} cor="var(--warning)" />
      </div>

      <div className="bg-card flex flex-wrap items-center gap-2 rounded-lg border p-(--ft-pad-y) px-(--ft-pad-x)">
        <div className="relative max-w-[340px] min-w-[220px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <input
            value={f.busca}
            onChange={(e) => mudar({ busca: e.target.value })}
            placeholder="Nome, fantasia, CPF/CNPJ, e-mail, telefone, cidade…"
            className="border-input bg-background focus-visible:ring-ring h-(--ft-control-h-sm) w-full rounded-lg border pl-8 text-xs outline-none focus-visible:ring-2"
          />
        </div>
        <Dropdown rotulo="Tipo" valor={f.tipo} largura={116} onEscolher={(v) => mudar({ tipo: v as Filtros['tipo'] })}
          opcoes={[{ valor: '', texto: 'Todos' }, { valor: 'PF', texto: 'Pessoa física', contagem: kpis.pf }, { valor: 'PJ', texto: 'Pessoa jurídica', contagem: kpis.pj }]} />
        <Dropdown rotulo="UF" valor={f.uf} largura={104} onEscolher={(v) => mudar({ uf: v })}
          opcoes={[{ valor: '', texto: 'Todas' }, ...ufs.map(([u, n]) => ({ valor: u, texto: u, contagem: n })), { valor: SEM_VALOR, texto: 'Sem UF' }]} />
        <Dropdown rotulo="Cidade" valor={f.cidade} largura={158} buscavel onEscolher={(v) => mudar({ cidade: v })}
          opcoes={[{ valor: '', texto: 'Todas' }, ...cidades.map(([c, n]) => ({ valor: c, texto: c, contagem: n })), { valor: SEM_VALOR, texto: 'Sem cidade' }]} />
        <Dropdown rotulo="Período" valor={f.periodo} largura={158} onEscolher={(v) => mudar({ periodo: v })}
          opcoes={[{ valor: '', texto: 'Qualquer data' }, { valor: 'mes', texto: 'Este mês' }, { valor: '90', texto: 'Últimos 90 dias' }, ...anos.map((a) => ({ valor: a, texto: `Em ${a}` }))]} />
        <Dropdown rotulo="Cadastro" valor={f.cadastro} largura={172} onEscolher={(v) => mudar({ cadastro: v as FiltroCadastro })}
          opcoes={[
            { valor: '', texto: 'Todos' },
            { valor: 'contato', texto: 'Com contato', contagem: kpis.comContato },
            { valor: 'semcontato', texto: 'Sem contato' },
            { valor: 'wa', texto: 'Com WhatsApp' },
            { valor: 'doc', texto: 'Com CPF/CNPJ' },
            { valor: 'endereco', texto: 'Com endereço' },
            { valor: 'incompleto', texto: 'Cadastro incompleto', contagem: kpis.incompletos },
            { valor: 'duplicado', texto: 'Possíveis duplicados', contagem: kpis.duplicados },
            { valor: 'novo30', texto: 'Novos em 30 dias', contagem: kpis.novos30 },
          ]} />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[12.5px]">
        <span>
          <b className="text-foreground">{filtrada.length.toLocaleString('pt-BR')}</b> cliente{filtrada.length === 1 ? '' : 's'}
          {filtrada.length !== kpis.total && <> de <b className="text-foreground">{kpis.total.toLocaleString('pt-BR')}</b></>}
        </span>
        {ativos.map((a, i) => (
          <span key={i} className="bg-card text-foreground inline-flex h-[22px] items-center gap-1.5 rounded-full border pr-1.5 pl-2.5 text-[11.5px]">
            {a.texto}
            <button onClick={a.remover} aria-label={`Remover filtro ${a.texto}`} className="hover:bg-secondary grid size-4 place-items-center rounded-full">
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        {ativos.length > 0 && (
          <button onClick={limpar} className="text-[11.5px] underline underline-offset-2">limpar tudo</button>
        )}
      </div>

      <div className="bg-card rounded-lg border" data-density="compacta">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                <Th chave="nome" ordem={ordem} setOrdem={setOrdem}>Cliente</Th>
                <Th>Documento</Th>
                <Th>Contato</Th>
                <Th chave="cidade" ordem={ordem} setOrdem={setOrdem}>Cidade / UF</Th>
                <Th>Tipo</Th>
                <Th chave="desde" ordem={ordem} setOrdem={setOrdem}>Cliente desde</Th>
              </tr>
            </thead>
            <tbody>
              {fatia.map((c) => (
                <Linha key={c.id} c={c} duplicado={duplicados.has(c.id)} onAbrir={() => setAberto(c.id)} />
              ))}
            </tbody>
          </table>
          {!fatia.length && (
            <div className="p-(--ft-card-pad)">
              <Vazio
                titulo="Nenhum cliente encontrado"
                descricao="Ajuste a busca ou limpe os filtros para ver a base completa."
                acao={<button onClick={limpar} className="hover:bg-accent h-(--ft-control-h-sm) rounded-lg border px-3 text-xs font-medium">Limpar filtros</button>}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t px-(--ft-pad-x) py-(--ft-pad-y)">
          <span className="text-muted-foreground text-xs">
            Mostrando <b className="text-foreground">{filtrada.length ? ini + 1 : 0}–{Math.min(filtrada.length, ini + porPagina)}</b> de{' '}
            <b className="text-foreground">{filtrada.length.toLocaleString('pt-BR')}</b>
          </span>
          <span className="flex-1" />
          <Dropdown rotulo="Por pág." valor={String(porPagina)} largura={120}
            onEscolher={(v) => { setPorPagina(+v); setPagina(1) }}
            opcoes={[25, 50, 100].map((n) => ({ valor: String(n), texto: `${n} por página` }))} />
          <BotaoPag onClick={() => setPagina((p) => Math.max(1, p - 1))} desabilitado={pg <= 1}><ChevronLeft className="size-3.5" /></BotaoPag>
          {paginasVisiveis(pg, paginas).map((p, i, arr) => (
            <span key={p} className="flex items-center">
              {i > 0 && p - arr[i - 1] > 1 && <span className="text-muted-foreground px-1">…</span>}
              <BotaoPag onClick={() => setPagina(p)} ativo={p === pg}>{p}</BotaoPag>
            </span>
          ))}
          <BotaoPag onClick={() => setPagina((p) => Math.min(paginas, p + 1))} desabilitado={pg >= paginas}><ChevronRight className="size-3.5" /></BotaoPag>
        </div>
      </div>

      {selecionado && <Ficha cliente={selecionado} duplicado={duplicados.has(selecionado.id)} onFechar={() => setAberto(null)} />}
    </>
  )
}

function paginasVisiveis(atual: number, total: number) {
  const ns: number[] = []
  for (let p = 1; p <= total; p++) if (p <= 2 || p > total - 2 || Math.abs(p - atual) <= 1) ns.push(p)
  return ns
}

function Th({
  children, chave, ordem, setOrdem,
}: {
  children: React.ReactNode; chave?: ChaveOrdem
  ordem?: { k: ChaveOrdem; dir: 1 | -1 }
  setOrdem?: (o: { k: ChaveOrdem; dir: 1 | -1 }) => void
}) {
  const ativo = chave && ordem?.k === chave
  return (
    <th
      onClick={chave && setOrdem ? () => setOrdem({ k: chave, dir: ativo && ordem!.dir === 1 ? -1 : 1 }) : undefined}
      aria-sort={ativo ? (ordem!.dir === 1 ? 'ascending' : 'descending') : undefined}
      className={cn(
        'font-heading text-muted-foreground bg-card sticky top-0 border-b px-(--ft-pad-x) py-(--ft-pad-y) text-left text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap uppercase',
        chave && 'cursor-pointer select-none',
      )}
    >
      {children}
      {ativo && <span className="ml-1 opacity-70">{ordem!.dir === 1 ? '▲' : '▼'}</span>}
    </th>
  )
}

function Linha({ c, duplicado, onAbrir }: { c: Cliente; duplicado: boolean; onAbrir: () => void }) {
  const pj = ehPJ(c)
  const nome = pj ? c.nome : tituloPt(c.nome)
  const { cidade, uf } = cidadeUf(c)
  const wa = linkWhats(c.contato)
  const td = 'h-(--ft-row-h) border-b px-(--ft-pad-x) whitespace-nowrap'
  return (
    <tr onClick={onAbrir} className="hover:bg-accent cursor-pointer transition-colors last:[&>td]:border-b-0">
      <td className={td}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={cn('grid size-[26px] shrink-0 place-items-center rounded-[7px]', pj ? 'bg-cat-6/15 text-cat-6' : 'bg-cat-5/15 text-cat-5')}>
            {pj ? <Building2 className="size-[15px]" /> : <UserRound className="size-[15px]" />}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-medium">{nome}</span>
              {duplicado && <Badge tom="aviso">DUP</Badge>}
              {incompleto(c) && <Badge tom="neutro">INC</Badge>}
            </span>
            {c.fantasia && <span className="text-muted-foreground block truncate text-[11px]">{c.fantasia}</span>}
          </span>
        </span>
      </td>
      <td className={cn(td, 'font-mono text-[11.5px]')}>{temDoc(c) ? c.doc : <span className="text-muted-foreground">—</span>}</td>
      <td className={td}>
        {c.contato || c.email ? (
          <span className="text-muted-foreground flex flex-col gap-0.5 text-[11.5px]">
            {c.contato && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3 shrink-0" />
                <span className="font-mono">{c.contato}</span>
                {wa && (
                  <a href={wa} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} aria-label="Abrir WhatsApp"
                    className="bg-whatsapp/20 text-whatsapp grid size-[19px] place-items-center rounded">
                    <MessageCircle className="size-3" />
                  </a>
                )}
              </span>
            )}
            {c.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3 shrink-0" />
                <span className="max-w-[190px] truncate">{c.email.toLowerCase()}</span>
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className={td}>
        {cidade ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="text-muted-foreground size-3" />
            {cidade}
            {uf && <span className="text-muted-foreground">· {uf}</span>}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className={td}><Badge tom={pj ? 'pj' : 'pf'}>{pj ? 'PJ' : 'PF'}</Badge></td>
      <td className={cn(td, 'font-mono text-[11.5px]')}>
        {c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}
      </td>
    </tr>
  )
}

function BotaoPag({ children, onClick, ativo, desabilitado }: { children: React.ReactNode; onClick: () => void; ativo?: boolean; desabilitado?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      className={cn(
        'inline-flex h-(--ft-control-h-sm) min-w-(--ft-control-h-sm) items-center justify-center rounded-lg border px-2 text-xs',
        ativo ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent',
        desabilitado && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}
