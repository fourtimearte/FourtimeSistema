import { useState } from 'react'
import { Plus, Search, Phone, Repeat } from 'lucide-react'
import { useApp } from '../store/useApp'
import { CLIENTES, pedTotais, money, type Cliente } from '../store/model'
import { PageHead, Btn, Panel, Drawer, thStyle, tdStyle, drawerH4 } from '../components/ui'

export default function CRM() {
  const { pedidos, criarPedidoDe, toast } = useApp()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Cliente | null>(null)

  const pedidosDe = (cid: number) => pedidos.filter(p => p.clienteId === cid)
  const list = CLIENTES.filter(c => (c.nome + c.doc + c.vendedor + c.segmento).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHead crumb="Atendimento · CRM" title="Clientes"
        desc='Cadastro, histórico e "pedir de novo". É a fonte que o Editor consome no autocomplete do campo Cliente. Clique numa linha para abrir a ficha.'
        actions={<Btn size="sm" variant="primary" onClick={() => toast('Novo cliente (protótipo)')}><Plus size={16} />Novo cliente</Btn>} />
      <Panel>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 10px', height: 36, minWidth: 260 }}>
            <Search size={15} style={{ color: 'var(--text-subtle)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, CNPJ, vendedor…" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 13, width: '100%' }} />
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Cliente', 'Segmento', 'Contato', 'Vendedor', 'Pedidos', 'Total'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {list.map(c => {
                const ps = pedidosDe(c.id); const tot = ps.reduce((s, p) => s + pedTotais(p).valor, 0)
                return (
                  <tr key={c.id} onClick={() => setSel(c)} style={{ cursor: 'pointer' }} className="row-hover">
                    <td style={tdStyle}><b>{c.nome}</b><div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.doc}</div></td>
                    <td style={tdStyle}>{c.segmento}</td>
                    <td style={tdStyle}>{c.contato}</td>
                    <td style={tdStyle}>{c.vendedor}</td>
                    <td className="mono" style={tdStyle}>{ps.length}</td>
                    <td className="mono" style={tdStyle}>R$ {money(tot)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={!!sel} onClose={() => setSel(null)} accent="var(--set-comercial)"
        title={sel?.nome} sub={sel ? sel.doc + ' · ' + sel.segmento : ''}>
        {sel && (() => {
          const ps = pedidosDe(sel.id)
          return <>
            <h4 style={drawerH4}>Contato</h4>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /><span className="mono">{sel.contato}</span></div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{sel.endereco} · vendedor {sel.vendedor}</div>
            <h4 style={drawerH4}>Histórico de pedidos ({ps.length})</h4>
            {ps.length ? ps.map(p => { const t = pedTotais(p); return (
              <div key={p.pedido} onClick={() => { setSel(null); criarPedidoDe(p) }} style={histRow}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.pedido}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.entrega} · {t.pecas} pçs</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 12 }}>R$ {money(t.valor)}</span>
              </div>
            ) }) : <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: 12 }}>Sem pedidos ainda.</div>}
            <div style={{ marginTop: 18 }}>
              <Btn variant="primary" size="lg" onClick={() => { const base = ps[0]; setSel(null); if (base) criarPedidoDe(base, sel); else toast('Cliente sem pedido base') }}>
                <Repeat size={16} />Pedir de novo (novo orçamento)
              </Btn>
            </div>
          </>
        })()}
      </Drawer>
      <style>{`.row-hover:hover{background:var(--bg-hover)}`}</style>
    </div>
  )
}
const histRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', marginBottom: 6 }
