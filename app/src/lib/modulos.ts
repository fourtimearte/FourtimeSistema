import {
  AlertTriangle, BookMarked, Boxes, Building2, CalendarClock, Check, Columns3, DollarSign,
  Factory, FileText, Handshake, LayoutDashboard, LayoutList, ListChecks, LogIn, Package, Palette,
  PenTool, Printer, Scissors, ShieldCheck, Split, ThumbsDown, TrendingUp, UserPlus, UserRound,
  Users, Wallet, type LucideIcon,
} from 'lucide-react'

/* =====================================================================
   O MAPA DA NAVEGAÇÃO
   ---------------------------------------------------------------------
   Três níveis, e a razão de cada um:

   1. GRUPO   — o setor da empresa (Comercial, Produção, Estoque…). É o
                nível que o Henrique enxerga primeiro, então é ele que
                abre e fecha. Não é um rótulo decorativo: é o pai.
   2. PÁGINA  — a tela em si. Navega.
   3. ATALHO  — a mesma tela já filtrada, por âncora (`/clientes#pj`).

   A hierarquia anterior tinha o grupo como enfeite e a página como pai.
   Funcionava enquanto havia duas páginas por setor; com Estoque tendo
   quatro e Financeiro três, o rail virava uma lista corrida.
   ===================================================================== */

export interface Atalho {
  /** rota completa, com a âncora que a tela lê para já abrir filtrada */
  rota: string
  nome: string
  icone: LucideIcon
}

export interface Pagina {
  rota: string
  nome: string
  icone: LucideIcon
  cor?: string
  /** atalhos — o terceiro nível */
  itens?: Atalho[]
}

export interface GrupoNav {
  nome: string
  icone: LucideIcon
  paginas: Pagina[]
}

/** O Dashboard fica fora dos grupos, no topo. Ele não pertence a um setor
 *  — lê de todos. Enfiá-lo num grupo "Visão" com um item só seria uma
 *  pasta com um arquivo dentro. */
export const INICIO: Pagina = { rota: '/', nome: 'Dashboard', icone: LayoutDashboard }

export const NAV: GrupoNav[] = [
  {
    nome: 'Comercial',
    icone: Handshake,
    paginas: [
      {
        rota: '/clientes', nome: 'Clientes', icone: Users, cor: 'var(--cat-6)',
        itens: [
          { rota: '/clientes', nome: 'Todos', icone: LayoutList },
          { rota: '/clientes#pf', nome: 'Pessoa física', icone: UserRound },
          { rota: '/clientes#pj', nome: 'Pessoa jurídica', icone: Building2 },
          { rota: '/clientes#novos', nome: 'Novos · 30 dias', icone: UserPlus },
          { rota: '/clientes#incompletos', nome: 'Cadastro incompleto', icone: AlertTriangle },
        ],
      },
      {
        /* "Vendas" é o nome do setor; "orçamento" continua sendo o nome do
           documento. A rota fica `/orcamentos` porque é o que o dado é. */
        rota: '/orcamentos', nome: 'Vendas', icone: TrendingUp, cor: 'var(--cat-6)',
        itens: [
          { rota: '/orcamentos', nome: 'Funil completo', icone: TrendingUp },
          { rota: '/orcamentos#parados', nome: 'Parados', icone: CalendarClock },
          { rota: '/orcamentos#aprovacao', nome: 'Aguardando aprovação', icone: Check },
          { rota: '/orcamentos#producao', nome: 'Em produção', icone: Factory },
          { rota: '/orcamentos#perdidos', nome: 'Perdidos', icone: ThumbsDown },
        ],
      },
      {
        rota: '/editor', nome: 'Editor', icone: PenTool, cor: 'var(--cat-6)',
        itens: [
          { rota: '/editor', nome: 'Novo orçamento', icone: FileText },
          { rota: '/editor#rascunhos', nome: 'Rascunhos salvos', icone: LayoutList },
          /* a folha A4 é a saída do editor, não um módulo à parte */
          { rota: '/a4', nome: 'Folha A4', icone: Printer },
        ],
      },
    ],
  },
  {
    nome: 'Produção',
    icone: Factory,
    paginas: [
      {
        rota: '/kanban', nome: 'Quadro Kanban', icone: Columns3, cor: 'var(--cat-1)',
        itens: [
          { rota: '/kanban', nome: 'Quadro completo', icone: Columns3 },
          { rota: '/kanban#atrasados', nome: 'Só atrasados', icone: AlertTriangle },
          { rota: '/kanban#problema', nome: 'Com problema', icone: AlertTriangle },
          { rota: '/kanban#pausado', nome: 'Pausados', icone: CalendarClock },
          { rota: '/kanban#externo', nome: 'Na facção', icone: Split },
        ],
      },
    ],
  },
  {
    nome: 'Estoque',
    icone: Boxes,
    paginas: [
      {
        rota: '/referencias', nome: 'Referências', icone: BookMarked, cor: 'var(--cat-7)',
        itens: [
          { rota: '/referencias', nome: 'Peças', icone: Scissors },
          { rota: '/referencias#fichas', nome: 'Fichas técnicas · BOM', icone: ListChecks },
          { rota: '/referencias#tecidos', nome: 'Tecidos e cores', icone: Palette },
        ],
      },
      {
        rota: '/estoque', nome: 'Insumos', icone: Package, cor: 'var(--cat-7)',
        itens: [
          { rota: '/estoque', nome: 'Todos os insumos', icone: Package },
          { rota: '/estoque#critico', nome: 'Estoque crítico', icone: AlertTriangle },
          { rota: '/estoque#separacao', nome: 'Separação', icone: ListChecks },
        ],
      },
      { rota: '/estoque/aviamentos', nome: 'Aviamentos', icone: Scissors, cor: 'var(--cat-7)' },
      { rota: '/estoque/pecas', nome: 'Peças em estoque', icone: Boxes, cor: 'var(--cat-7)' },
    ],
  },
  {
    nome: 'Financeiro',
    icone: DollarSign,
    paginas: [
      { rota: '/financeiro', nome: 'A receber', icone: Wallet, cor: 'var(--cat-4)' },
      { rota: '/financeiro/recebidos', nome: 'Recebidos', icone: Check, cor: 'var(--cat-4)' },
      { rota: '/financeiro/inadimplencia', nome: 'Inadimplência', icone: AlertTriangle, cor: 'var(--cat-4)' },
    ],
  },
  {
    nome: 'Sistema',
    icone: ShieldCheck,
    paginas: [
      { rota: '/login', nome: 'Login & perfis', icone: LogIn },
      { rota: '/login/permissoes', nome: 'Permissões', icone: ShieldCheck },
      {
        rota: '/kit', nome: 'Kit', icone: Palette,
        itens: [
          { rota: '/kit#cores', nome: 'Fundamentos', icone: Palette },
          { rota: '/kit#botoes', nome: 'Componentes', icone: LayoutList },
          { rota: '/kit#composicao', nome: 'Arranjos de módulo', icone: LayoutDashboard },
          { rota: '/kit#tecnicas', nome: 'Fourtime', icone: Factory },
        ],
      },
    ],
  },
]

/** Toda página navegável, achatada. É daqui que as rotas do app saem —
 *  ter duas listas (uma para o menu, outra para o roteador) é como o
 *  sistema ganha uma tela que existe e ninguém alcança. */
export const PAGINAS: Pagina[] = [INICIO, ...NAV.flatMap((g) => g.paginas)]

export const paginaDaRota = (caminho: string) =>
  PAGINAS.find((p) => p.rota === caminho) ??
  [...PAGINAS].sort((a, b) => b.rota.length - a.rota.length).find((p) => p.rota !== '/' && caminho.startsWith(p.rota))

export const grupoDaRota = (caminho: string) =>
  NAV.find((g) => g.paginas.some((p) => p.rota === paginaDaRota(caminho)?.rota))
