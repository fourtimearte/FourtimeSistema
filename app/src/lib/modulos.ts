import {
  AlertTriangle, BookMarked, Boxes, Check, Columns3, DollarSign, Factory, Handshake, LayoutDashboard, LogIn, Package, Palette, PenTool, Scissors, ShieldCheck, TrendingUp, Users, Wallet, type LucideIcon,
} from 'lucide-react'

/* =====================================================================
   O MAPA DA NAVEGAÇÃO
   ---------------------------------------------------------------------
   DOIS níveis, e só dois:

   1. GRUPO   — o setor da empresa (Comercial, Produção, Estoque…). É o
                nível que o Henrique enxerga primeiro, então é ele que
                abre e fecha. Não é um rótulo decorativo: é o pai.
   2. PÁGINA  — a tela em si. Navega, e acabou.

   Houve um terceiro nível — atalhos para a mesma tela já filtrada. Foi
   removido: menu de três andares obriga a caçar em profundidade o que
   deveria estar na tela. Filtro é assunto da tela, não do menu, e a tela
   já tem os KPIs clicáveis para isso.

   As âncoras (`/clientes#pj`, `/kanban#problema`) continuam funcionando —
   dá para guardar e compartilhar o link de uma visão filtrada. O que saiu
   foi o menu que as listava.
   ===================================================================== */

export interface Pagina {
  rota: string
  nome: string
  icone: LucideIcon
  cor?: string
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
      },
      {
        /* "Vendas" é o nome do setor; "orçamento" continua sendo o nome do
           documento. A rota fica `/orcamentos` porque é o que o dado é. */
        rota: '/orcamentos', nome: 'Vendas', icone: TrendingUp, cor: 'var(--cat-6)',
      },
      {
        rota: '/editor', nome: 'Editor', icone: PenTool, cor: 'var(--cat-6)',
      },
    ],
  },
  {
    nome: 'Produção',
    icone: Factory,
    paginas: [
      {
        rota: '/kanban', nome: 'Quadro Kanban', icone: Columns3, cor: 'var(--cat-1)',
      },
    ],
  },
  {
    nome: 'Estoque',
    icone: Boxes,
    paginas: [
      {
        rota: '/referencias', nome: 'Referências', icone: BookMarked, cor: 'var(--cat-7)',
      },
      {
        rota: '/estoque', nome: 'Insumos', icone: Package, cor: 'var(--cat-7)',
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
