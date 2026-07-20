import type { ReactNode } from 'react'
import { Briefcase, Users, Layers, Box, Wallet, ArrowRight } from 'lucide-react'
import { useApp, type PageId } from '../store/useApp'
import { PageHead, Btn } from '../components/ui'

const INFO: Record<string, { crumb: string; title: string; desc: string; icon: ReactNode; cor: string; fase2: string }> = {
  comercial: { crumb: 'Atendimento · Editor', title: 'Comercial', cor: '--set-comercial', icon: <Briefcase size={26} />, desc: 'Pedidos e o editor de orçamento (v172 real embutido como micro-frontend via iframe).', fase2: 'Fase 2: lista de pedidos + iframe do editor v172 + ponte postMessage para receber o .ft e aprovar → Kanban.' },
  crm: { crumb: 'Atendimento · CRM', title: 'Clientes', cor: '--set-comercial', icon: <Users size={26} />, desc: 'Cadastro, histórico e "pedir de novo". Fonte do autocomplete do editor.', fase2: 'Fase 2: TanStack Table com busca + ficha em drawer + "pedir de novo".' },
  ficha: { crumb: 'Produção · Editor/ERP', title: 'Ficha Técnica (BOM)', cor: '--set-estoque', icon: <Layers size={26} />, desc: 'Catálogo de referências e a lista de materiais de cada peça.', fase2: 'Fase 2: catálogo + editor de BOM versionada + custo por peça.' },
  estoque: { crumb: 'Materiais · ERP', title: 'Estoque + Separação', cor: '--set-estoque', icon: <Box size={26} />, desc: 'Saldo de insumos com alerta de mínimo e a Separação que lê a BOM do pedido.', fase2: 'Fase 2: tabela de insumos + painel de separação por pedido (BOM × saldo).' },
  financeiro: { crumb: 'Gestão · ERP', title: 'Financeiro', cor: '--set-financeiro', icon: <Wallet size={26} />, desc: 'Sinal e saldo de cada pedido; a entrega dispara a cobrança do saldo.', fase2: 'Fase 2: a-receber por pedido + baixa de pagamento + margem.' },
}

export default function Stub({ id }: { id: PageId }) {
  const goto = useApp(s => s.goto)
  const info = INFO[id]
  if (!info) return null
  return (
    <div>
      <PageHead crumb={info.crumb} title={info.title} desc={info.desc}
        actions={<Btn size="sm" onClick={() => goto('dashboard')}>Voltar ao dashboard</Btn>} />
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '40px 30px', textAlign: 'center', background: 'var(--bg-surface-2)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, display: 'grid', placeItems: 'center', margin: '0 auto 14px', color: '#fff', background: `var(${info.cor})` }}>{info.icon}</div>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}>{info.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: '56ch', margin: '0 auto 6px' }}>{info.desc}</p>
        <p style={{ color: 'var(--text-subtle)', fontSize: 12, maxWidth: '60ch', margin: '10px auto 0' }}>{info.fase2}</p>
        <div style={{ marginTop: 18 }}><Btn variant="primary" size="sm" onClick={() => goto('producao')}>Ver o Kanban funcional <ArrowRight size={15} /></Btn></div>
        <p style={{ color: 'var(--text-subtle)', fontSize: 11, marginTop: 18 }}>Esta tela já existe funcional no protótipo <b>fourtime-sistema-v1.html</b> — está sendo portada para React nesta fase.</p>
      </div>
    </div>
  )
}
