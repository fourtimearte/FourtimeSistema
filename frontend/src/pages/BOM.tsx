import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import { useApp } from '../store/useApp'
import { REFERENCIAS, INSUMOS, bomCusto, money, type Referencia } from '../store/model'
import { PageHead, Btn, Panel, Drawer, TecTag, thStyle, tdStyle, drawerH4 } from '../components/ui'

export default function BOM() {
  const toast = useApp(s => s.toast)
  const [sel, setSel] = useState<Referencia | null>(null)
  return (
    <div>
      <PageHead crumb="Produção · Editor/ERP" title="Ficha Técnica (BOM)"
        desc="Catálogo de referências e a lista de materiais de cada peça. É a ponte entre o que foi vendido e o que sai do estoque. Clique numa referência para ver a receita de insumos."
        actions={<Btn size="sm" variant="primary" onClick={() => toast('Nova referência (protótipo)')}><Plus size={16} />Nova referência</Btn>} />
      <Panel>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Código', 'Peça', 'Gênero', 'Design típico', 'BOM', 'Custo/peça'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {REFERENCIAS.map(r => (
                <tr key={r.cod} onClick={() => setSel(r)} style={{ cursor: 'pointer' }} className="row-hover">
                  <td className="mono" style={tdStyle}>{r.cod}</td>
                  <td style={tdStyle}><b>{r.nome}</b></td>
                  <td style={tdStyle}>{r.genero}</td>
                  <td style={tdStyle}><div style={{ display: 'flex', gap: 5 }}>{r.design.map(d => <TecTag key={d} tec={d} />)}</div></td>
                  <td className="mono" style={tdStyle}>{r.bom.length} itens</td>
                  <td className="mono" style={tdStyle}>R$ {money(bomCusto(r))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={!!sel} onClose={() => setSel(null)} accent="var(--set-estoque)"
        title={sel?.nome} sub={sel ? sel.cod + ' · ' + sel.genero : ''}>
        {sel && <>
          <h4 style={drawerH4}>Design típico</h4>
          <div style={{ display: 'flex', gap: 6 }}>{sel.design.map(d => <TecTag key={d} tec={d} />)}</div>
          <h4 style={drawerH4}>Lista de materiais (por peça)</h4>
          {sel.bom.map((b, i) => { const ins = INSUMOS.find(x => x.id === b.insumoId); const custo = ins ? ins.custo * b.qtd : 0
            return <div key={i} style={sepItem}><span style={{ flex: 1 }}>{ins?.nome}</span><span className="mono" style={{ color: 'var(--text-muted)' }}>{b.qtd} {b.un}</span><span className="mono" style={{ minWidth: 64, textAlign: 'right' }}>R$ {money(custo)}</span></div>
          })}
          <div style={{ ...sepItem, background: 'var(--bg-surface-2)', fontWeight: 700 }}><span style={{ flex: 1 }}>Custo total / peça</span><span className="mono">R$ {money(bomCusto(sel))}</span></div>
          <div style={{ marginTop: 14, border: '1px solid var(--border)', borderLeft: '3px solid var(--set-estoque)', borderRadius: 8, padding: '10px 12px', background: 'var(--bg-surface-2)', fontSize: 12, color: 'var(--text-muted)' }}>
            Esta receita alimenta a <b style={{ color: 'var(--text)' }}>Separação de Items</b> no Estoque e a baixa automática de insumos.
          </div>
        </>}
      </Drawer>
      <style>{`.row-hover:hover{background:var(--bg-hover)}`}</style>
    </div>
  )
}
const sepItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 7, fontSize: 13 }
