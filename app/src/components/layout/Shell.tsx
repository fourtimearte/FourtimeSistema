import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { ChevronRight, Moon, Rows3, Rows4, Search, Sun } from 'lucide-react'
import { INICIO, NAV, grupoDaRota, paginaDaRota, type GrupoNav, type Pagina } from '@/lib/modulos'
import { usePrefs } from '@/lib/prefs'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader,
  SidebarGroupContent, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

/** O esqueleto do sistema: rail à esquerda, cabeçalho grudado no topo.
 *
 *  Assenta no `Sidebar` do shadcn (bloco `sidebar-07`), e não num rail
 *  escrito à mão como antes. O que se ganha com isso não é aparência: é o
 *  estado recolhido em cookie, o atalho ⌘B, a gaveta no celular, o
 *  `SidebarRail` que arrasta a borda, e o tooltip que aparece sozinho
 *  quando o rail está em modo ícone — tudo coisa que a versão à mão não
 *  tinha e que eu teria de reescrever pior. */
export function Shell() {
  return (
    <SidebarProvider>
      <RailFourtime />
      <SidebarInset className="min-w-0 overflow-x-clip">
        <CabecalhoFixo />
        <main className="flex flex-col gap-(--ft-gap) p-(--ft-gap) pb-12">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

/* ------------------------------------------------------------------- rail */

function RailFourtime() {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to="/" />}>
              <div className="bg-chart-3 grid aspect-square size-8 shrink-0 place-items-center rounded-xl font-heading text-[14px] font-bold text-white">
                F
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="font-heading truncate text-[13px] font-semibold">Fourtime</span>
                <span className="text-muted-foreground truncate text-[11px]">CRM · ERP · MARK42</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* o Dashboard fica fora dos grupos: ele lê de todos os setores */}
        <SidebarGroup className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={INICIO.nome}
                isActive={pathname === '/'}
                render={<NavLink to={INICIO.rota} />}
              >
                <INICIO.icone />
                <span>{INICIO.nome}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {NAV.map((g) => (
          <GrupoDobravel key={g.nome} g={g} pathname={pathname} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-secondary grid aspect-square size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
                HF
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[12.5px] font-semibold">Henrique</span>
                <span className="text-muted-foreground truncate text-[11px]">Administração</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* a borda arrastável: recolhe e abre sem precisar mirar no botão */}
      <SidebarRail />
    </Sidebar>
  )
}

/** O GRUPO é o pai que abre e fecha. O rótulo inteiro é o gatilho — não
 *  só a setinha: mirar num alvo de 20px para abrir uma pasta é o tipo de
 *  atrito que faz todo mundo desistir do menu e usar só o histórico do
 *  navegador. */
function GrupoDobravel({ g, pathname }: { g: GrupoNav; pathname: string }) {
  const dentro = g.paginas.some((p) => pathname.startsWith(p.rota))
  const [aberto, setAberto] = useState(dentro)
  useEffect(() => {
    if (dentro) setAberto(true)
  }, [dentro])

  return (
    <Collapsible open={aberto} onOpenChange={setAberto} className="group/grupo" render={<SidebarGroup />}>
      <>
        <CollapsibleTrigger
          className={cn(
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            'flex h-7 w-full shrink-0 items-center gap-2 rounded-md px-2 text-[10.5px] font-semibold',
            'tracking-[0.08em] uppercase transition-colors outline-none',
            'focus-visible:ring-sidebar-ring focus-visible:ring-2',
            'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
          )}
        >
          <g.icone className="size-3.5 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">{g.nome}</span>
          <ChevronRight
            /* Base UI marca o estado com `data-open`/`data-closed` — não com
               `data-state="open"` do Radix. Escrito errado, a seta ficava
               apontando para o lado com o grupo aberto: o menu dizia uma
               coisa e mostrava outra. */
            className="ml-auto size-3.5 shrink-0 transition-transform group-data-open/grupo:rotate-90 group-data-[collapsible=icon]:hidden"
            aria-hidden
          />
        </CollapsibleTrigger>

        {/* no modo ícone o grupo fica sempre aberto: escondê-lo deixaria o
            rail com cinco ícones de pasta e nenhuma página */}
        <CollapsibleContent className="group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!overflow-visible">
          <SidebarGroupContent>
            <SidebarMenu>
              {g.paginas.map((p) => (
                <ItemPagina key={p.rota} p={p} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </>
    </Collapsible>
  )
}

/** A PÁGINA navega, e acabou. Sem terceiro nível: menu de três andares
 *  obriga a caçar em profundidade o que deveria estar na tela. Filtro é
 *  assunto da tela — e ela já tem os KPIs clicáveis para isso. */
function ItemPagina({ p, pathname }: { p: Pagina; pathname: string }) {
  const naRota = pathname.startsWith(p.rota)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={p.nome} isActive={naRota} render={<NavLink to={p.rota} />}>
        <p.icone />
        <span>{p.nome}</span>
        {p.cor && <PontoModulo cor={p.cor} />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const PontoModulo = ({ cor }: { cor: string }) => (
  <span
    className="ml-auto size-[7px] shrink-0 rounded-full group-data-[collapsible=icon]:hidden"
    style={{ background: cor }}
    aria-hidden
  />
)

/* -------------------------------------------------------------- cabeçalho */

function CabecalhoFixo() {
  const { theme, setTheme } = useTheme()
  const { densidade, setDensidade } = usePrefs()
  const { pathname } = useLocation()
  const ir = useNavigate()
  const escuro = theme === 'dark'
  const compacta = densidade === 'compacta'

  const pagina = paginaDaRota(pathname)
  const grupo = grupoDaRota(pathname)

  return (
    <header className="bg-card sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 transition-[width,height] ease-linear">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<NavLink to="/" />}>Fourtime</BreadcrumbLink>
          </BreadcrumbItem>
          {grupo && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-muted-foreground hidden md:block">{grupo.nome}</BreadcrumbItem>
            </>
          )}
          {pagina && pagina.rota !== '/' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pagina.nome}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative ml-auto max-w-[300px] flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2" />
        <input
          aria-label="Busca global"
          placeholder="Buscar PD####, cliente…"
          onKeyDown={(e) => e.key === 'Enter' && ir('/orcamentos')}
          className="bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30 h-(--ft-control-h) w-full rounded-3xl border border-transparent pl-9 text-[13px] outline-none focus-visible:ring-[3px]"
        />
      </div>

      <span className="text-muted-foreground hidden items-center gap-1.5 text-xs lg:flex">
        <span className="bg-success size-[7px] rounded-full" /> sincronizado
      </span>
      <BotaoTopo
        onClick={() => setDensidade(compacta ? 'confortavel' : 'compacta')}
        icone={compacta ? <Rows4 className="size-[15px]" /> : <Rows3 className="size-[15px]" />}
        rotulo={compacta ? 'Compacta' : 'Confortável'}
      />
      <BotaoTopo
        onClick={() => setTheme(escuro ? 'light' : 'dark')}
        icone={escuro ? <Moon className="size-[15px]" /> : <Sun className="size-[15px]" />}
        rotulo={escuro ? 'Escuro' : 'Claro'}
      />
    </header>
  )
}

function BotaoTopo({ onClick, icone, rotulo }: { onClick: () => void; icone: React.ReactNode; rotulo: string }) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex h-(--ft-control-h) shrink-0 items-center gap-1.5 rounded-3xl border px-3 text-xs font-medium transition-colors"
    >
      {icone}
      <span className="hidden md:inline">{rotulo}</span>
    </button>
  )
}
