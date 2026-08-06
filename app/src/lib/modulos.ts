import {
  AlertTriangle, BookMarked, Boxes, Building2, CalendarClock, Check, Columns3, DollarSign,
  FileText, Factory, LayoutDashboard, LayoutList, ListChecks, LogIn, Package, Palette, PenTool,
  Printer, Scissors, ShieldCheck, Split, ThumbsDown, TrendingUp, UserPlus, UserRound, Users,
  type LucideIcon,
} from 'lucide-react'

export type Grupo = 'Visão' | 'Comercial' | 'Produção' | 'Sistema'

export interface SubItem {
  /** rota completa, com a âncora que a tela lê para já abrir filtrada */
  rota: string
  nome: string
  icone: LucideIcon
}

export interface Modulo {
  rota: string
  nome: string
  icone: LucideIcon
  grupo: Grupo
  cor?: string
  /** submenu. Aberto por padrão quando a rota do módulo está ativa. */
  itens?: SubItem[]
}

/** Um ícone por conceito, nomeado pelo conceito e não pelo desenho.
 *  Sem isto, cada tela escolhe o seu e o sistema fica com três "editar".
 *
 *  Os subitens carregam a âncora (`#parados`, `#pj`) que a tela lê ao abrir:
 *  submenu que leva à mesma tela sem aplicar nada é enfeite, e o usuário
 *  aprende rápido a não clicar. */
export const MODULOS: Modulo[] = [
  { rota: '/', nome: 'Dashboard', icone: LayoutDashboard, grupo: 'Visão' },

  {
    rota: '/clientes', nome: 'Clientes', icone: Users, grupo: 'Comercial', cor: 'var(--cat-6)',
    itens: [
      { rota: '/clientes', nome: 'Todos', icone: LayoutList },
      { rota: '/clientes#pf', nome: 'Pessoa física', icone: UserRound },
      { rota: '/clientes#pj', nome: 'Pessoa jurídica', icone: Building2 },
      { rota: '/clientes#novos', nome: 'Novos · 30 dias', icone: UserPlus },
      { rota: '/clientes#incompletos', nome: 'Cadastro incompleto', icone: AlertTriangle },
    ],
  },
  {
    rota: '/orcamentos', nome: 'Orçamentos', icone: FileText, grupo: 'Comercial', cor: 'var(--cat-6)',
    itens: [
      { rota: '/orcamentos', nome: 'Funil completo', icone: TrendingUp },
      { rota: '/orcamentos#parados', nome: 'Parados', icone: CalendarClock },
      { rota: '/orcamentos#aprovacao', nome: 'Aguardando aprovação', icone: Check },
      { rota: '/orcamentos#producao', nome: 'Em produção', icone: Factory },
      { rota: '/orcamentos#perdidos', nome: 'Perdidos', icone: ThumbsDown },
    ],
  },
  {
    rota: '/editor', nome: 'Editor', icone: PenTool, grupo: 'Comercial', cor: 'var(--cat-6)',
    itens: [
      { rota: '/editor', nome: 'Novo orçamento', icone: FileText },
      { rota: '/editor#rascunhos', nome: 'Rascunhos salvos', icone: LayoutList },
    ],
  },
  { rota: '/a4', nome: 'Folha A4', icone: Printer, grupo: 'Comercial', cor: 'var(--cat-6)' },
  {
    rota: '/financeiro', nome: 'Financeiro', icone: DollarSign, grupo: 'Comercial', cor: 'var(--cat-4)',
    itens: [
      { rota: '/financeiro', nome: 'A receber', icone: TrendingUp },
      { rota: '/financeiro#recebidos', nome: 'Recebidos', icone: Check },
      { rota: '/financeiro#inadimplencia', nome: 'Inadimplência', icone: AlertTriangle },
    ],
  },

  {
    rota: '/kanban', nome: 'Kanban', icone: Columns3, grupo: 'Produção', cor: 'var(--cat-1)',
    itens: [
      { rota: '/kanban', nome: 'Quadro completo', icone: Columns3 },
      { rota: '/kanban#atrasados', nome: 'Só atrasados', icone: AlertTriangle },
      { rota: '/kanban#problema', nome: 'Com problema', icone: AlertTriangle },
      { rota: '/kanban#pausado', nome: 'Pausados', icone: CalendarClock },
      { rota: '/kanban#externo', nome: 'Na facção', icone: Split },
    ],
  },
  {
    rota: '/referencias', nome: 'Referências · BOM', icone: BookMarked, grupo: 'Produção', cor: 'var(--cat-7)',
    itens: [
      { rota: '/referencias', nome: 'Peças', icone: Scissors },
      { rota: '/referencias#fichas', nome: 'Fichas técnicas', icone: ListChecks },
      { rota: '/referencias#tecidos', nome: 'Tecidos e cores', icone: Palette },
    ],
  },
  {
    rota: '/estoque', nome: 'Estoque', icone: Boxes, grupo: 'Produção', cor: 'var(--cat-7)',
    itens: [
      { rota: '/estoque', nome: 'Insumos', icone: Package },
      { rota: '/estoque#pecas', nome: 'Peças lisas', icone: Scissors },
      { rota: '/estoque#separacao', nome: 'Separação', icone: ListChecks },
      { rota: '/estoque#critico', nome: 'Estoque crítico', icone: AlertTriangle },
    ],
  },

  {
    rota: '/kit', nome: '/kit', icone: Palette, grupo: 'Sistema',
    itens: [
      { rota: '/kit#cores', nome: 'Fundamentos', icone: Palette },
      { rota: '/kit#botoes', nome: 'Componentes', icone: LayoutList },
      { rota: '/kit#composicao', nome: 'Arranjos de módulo', icone: LayoutDashboard },
      { rota: '/kit#tecnicas', nome: 'Fourtime', icone: Factory },
    ],
  },
  {
    rota: '/login', nome: 'Login & perfis', icone: LogIn, grupo: 'Sistema',
    itens: [
      { rota: '/login', nome: 'Usuários', icone: Users },
      { rota: '/login#permissoes', nome: 'Permissões', icone: ShieldCheck },
    ],
  },
]

export const GRUPOS = ['Visão', 'Comercial', 'Produção', 'Sistema'] as const

/** O módulo dono de uma rota — usado pela trilha do cabeçalho. */
export const moduloDaRota = (caminho: string) =>
  MODULOS.find((m) => m.rota === caminho) ??
  MODULOS.find((m) => m.rota !== '/' && caminho.startsWith(m.rota))
