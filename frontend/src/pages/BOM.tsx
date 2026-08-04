import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../store/useApp'
import { REFERENCIAS, INSUMOS, bomCusto, money, type Referencia } from '../store/model'
import { PageHead, Btn, Panel, Drawer, TecTag, TableWrap, drawerH4 } from '../components/ui'

export default function BOM() {
  const toast = useApp(s => s.toast)
  const [sel, setSel] = useState<Referencia | null>(null)
  return (
    <div>
      <PageHead crumb="BOM" title="Ficha Técnica (BOM)"
        desc="Catálogo de referências e a lista de materiais de cada peça. É a ponte entre o que foi vendido e o que sai do estoque. Clique numa referência para ver a receita de insumos."
        actions={<Btn size="sm" variant="primary" onClick={() => toast('Nova referência (protótipo)')}><Plus size={16} />Nova referência</Btn>} />

      <Panel flush>
        <TableWrap minWidth={820}>
          <thead>
            <tr>
              <th>Código</th><th>Peça</th><th>Gênero</th><th>Design típico</th>
              <th className="num">BOM</th><th className="num">Custo/peça</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCIAS.map(r => (
              <tr key={r.cod} onClick={() => setSel(r)} style={{ cursor: 'pointer' }}>
                <td className="mono">{r.cod}</td>
                <td><b>{r.nome}</b></td>
                <td>{r.genero}</td>
                <td><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{r.design.map(d => <TecTag key={d} tec={d} />)}</div></td>
                <td className="num">{r.bom.length} itens</td>
                <td className="num">R$ {money(bomCusto(r))}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <Drawer open={!!sel} onClose={() => setSel(null)} accent="var(--set-estoque)"
        title={sel?.nome} sub={sel ? sel.cod + ' · ' + sel.genero : ''}>
        {sel && <>
          <h4 style={drawerH4}>Design típico</h4>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sel.design.map(d => <TecTag key={d} tec={d} />)}</div>
          <h4 style={drawerH4}>Lista de materiais (por peça)</h4>
          {sel.bom.map((b, i) => {
            const ins = INSUMOS.find(x => x.id === b.insumoId); const custo = ins ? ins.custo * b.qtd : 0
            return (
              <div key={i} className="listrow">
                <span className="lbl">{ins?.nome}</span>
                <span className="qt">{b.qtd} {b.un}</span>
                <span className="qt right">R$ {money(custo)}</span>
              </div>
            )
          })}
          <div className="listrow total">
            <span className="lbl">Custo total / peça</span>
            <span className="qt right">R$ {money(bomCusto(sel))}</span>
          </div>
          <div className="notecard" style={{ ['--acc' as string]: 'var(--set-estoque)' }}>
            Esta receita alimenta a <b>Separação de Items</b> no Estoque e a baixa automática de insumos.
          </div>
        </>}
      </Drawer>
    </div>
  )
}
