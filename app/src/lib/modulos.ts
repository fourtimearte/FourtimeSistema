import {
  LayoutDashboard, Users, FileText, PenTool, Printer, DollarSign,
  Columns3, BookMarked, Boxes, Palette, LogIn, type LucideIcon,
} from 'lucide-react'

export type Modulo = {
  rota: string
  nome: string
  icone: LucideIcon
  grupo: 'Visão' | 'Comercial' | 'Produção' | 'Sistema'
  cor?: string
}

/** Um ícone por conceito, nomeado pelo conceito e não pelo desenho.
 *  Sem isto, cada tela escolhe o seu e o sistema fica com três "editar". */
export const MODULOS: Modulo[] = [
  { rota: '/', nome: 'Dashboard', icone: LayoutDashboard, grupo: 'Visão' },
  { rota: '/clientes', nome: 'Clientes', icone: Users, grupo: 'Comercial', cor: 'var(--cat-6)' },
  { rota: '/orcamentos', nome: 'Orçamentos', icone: FileText, grupo: 'Comercial', cor: 'var(--cat-6)' },
  { rota: '/editor', nome: 'Editor', icone: PenTool, grupo: 'Comercial', cor: 'var(--cat-6)' },
  { rota: '/a4', nome: 'Folha A4', icone: Printer, grupo: 'Comercial', cor: 'var(--cat-6)' },
  { rota: '/financeiro', nome: 'Financeiro', icone: DollarSign, grupo: 'Comercial', cor: 'var(--cat-4)' },
  { rota: '/kanban', nome: 'Kanban', icone: Columns3, grupo: 'Produção', cor: 'var(--cat-1)' },
  { rota: '/referencias', nome: 'Referências · BOM', icone: BookMarked, grupo: 'Produção', cor: 'var(--cat-7)' },
  { rota: '/estoque', nome: 'Estoque', icone: Boxes, grupo: 'Produção', cor: 'var(--cat-7)' },
  { rota: '/kit', nome: '/kit', icone: Palette, grupo: 'Sistema' },
  { rota: '/login', nome: 'Login & perfis', icone: LogIn, grupo: 'Sistema' },
]

export const GRUPOS = ['Visão', 'Comercial', 'Produção', 'Sistema'] as const
