import {
  ArrowRight, Boxes, BookMarked, Calendar, Check, ChevronDown, Clock, Columns3, Copy,
  DollarSign, Download, FileText, Factory, Filter, Info, LayoutDashboard, Loader2, Paperclip,
  Pencil, Plus, Printer, Save, Search, Settings, SlidersHorizontal, Split, TriangleAlert,
  Trash2, Upload, User, Users, X, type LucideIcon,
} from 'lucide-react'

/* =====================================================================
   VOCABULÁRIO DE ÍCONES
   Lucide tem mais de mil ícones. Se cada tela escolhe o seu, o sistema
   acaba com três desenhos diferentes para "editar" — e o funcionário novo
   aprende três vezes. Aqui é UM ícone por conceito, nomeado pelo conceito
   e não pelo desenho.

   Ícone sozinho, sem rótulo visível, exige `aria-label`. E emoji não é
   ícone: renderiza diferente em cada sistema, não herda a cor do texto e
   não escala com a tipografia.
   ===================================================================== */
export const ICONES: { conceito: string; icone: LucideIcon; nome: string }[] = [
  { conceito: 'novo', icone: Plus, nome: 'Plus' },
  { conceito: 'salvar', icone: Save, nome: 'Save' },
  { conceito: 'editar', icone: Pencil, nome: 'Pencil' },
  { conceito: 'excluir', icone: Trash2, nome: 'Trash2' },
  { conceito: 'duplicar', icone: Copy, nome: 'Copy' },
  { conceito: 'buscar', icone: Search, nome: 'Search' },
  { conceito: 'filtrar', icone: SlidersHorizontal, nome: 'SlidersHorizontal' },
  { conceito: 'ordenar', icone: Filter, nome: 'Filter' },
  { conceito: 'aprovar', icone: Check, nome: 'Check' },
  { conceito: 'recusar / fechar', icone: X, nome: 'X' },
  { conceito: 'atenção', icone: TriangleAlert, nome: 'TriangleAlert' },
  { conceito: 'informação', icone: Info, nome: 'Info' },
  { conceito: 'prazo', icone: Clock, nome: 'Clock' },
  { conceito: 'data', icone: Calendar, nome: 'Calendar' },
  { conceito: 'anexo', icone: Paperclip, nome: 'Paperclip' },
  { conceito: 'avançar', icone: ArrowRight, nome: 'ArrowRight' },
  { conceito: 'fatiar', icone: Split, nome: 'Split' },
  { conceito: 'carregando', icone: Loader2, nome: 'Loader2' },
  { conceito: 'importar', icone: Upload, nome: 'Upload' },
  { conceito: 'exportar', icone: Download, nome: 'Download' },
  { conceito: 'abrir lista', icone: ChevronDown, nome: 'ChevronDown' },
  { conceito: 'configurar', icone: Settings, nome: 'Settings' },
  /* módulos — os mesmos do rail, para o menu e a tela não divergirem */
  { conceito: 'dashboard', icone: LayoutDashboard, nome: 'LayoutDashboard' },
  { conceito: 'cliente', icone: User, nome: 'User' },
  { conceito: 'clientes', icone: Users, nome: 'Users' },
  { conceito: 'pedido / orçamento', icone: FileText, nome: 'FileText' },
  { conceito: 'impressão A4', icone: Printer, nome: 'Printer' },
  { conceito: 'financeiro', icone: DollarSign, nome: 'DollarSign' },
  { conceito: 'produção', icone: Factory, nome: 'Factory' },
  { conceito: 'kanban', icone: Columns3, nome: 'Columns3' },
  { conceito: 'referências · BOM', icone: BookMarked, nome: 'BookMarked' },
  { conceito: 'estoque', icone: Boxes, nome: 'Boxes' },
]
