import type { CSSProperties } from 'react'
import { Plus, Save, Printer, Check, Trash2, FileText } from 'lucide-react'
import { useApp } from '../store/useApp'
import {
  REFERENCIAS, CLIENTES, TECNICAS, DESIGN_ORDER, CORES, corHexPorNome,
  pedTotais, money, type Pedido, type TecnicaKey,
} from '../store/model'
import { PageHead, Btn, Badge, cvar } from '../components/ui'

/* input controlado, mobile-friendly */
function Inp({ value, onChange, list, placeholder, type, mono }: { value: string; onChange: (v: string) => void; list?: string; placeholder?: string; type?: string; mono?: boolean }) {
  return <input value={value} list={list} placeholder={placeholder} type={type || 'text'} inputMode={type === 'number' ? 'decimal' : undefined}
    onChange={e => onChange(e.target.value)}
    style={{ height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none', fontFamily: mono ? 'var(--font-mono)' : undefined }} />
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
    {children}{hint && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{hint}</span>}
  </div>
}

export default function Comercial() {
  const { pedidos, curPed, setCurPed, novoOrcamento, updateHeader, patchPedido, patchLayout, updateSize, addLayout, deleteLayout, toggleDesign, aprovarPedido, toast } = useApp()
  const p: Pedido | undefined = pedidos[curPed]

  function onCliente(v: string) {
    const match = CLIENTES.find(c => c.nome.toLowerCase() === v.trim().toLowerCase())
    if (match) patchPedido(curPed, { cliente: match.nome, clienteId: match.id, contato: match.contato, vendedor: match.vendedor })
    else updateHeader(curPed, 'cliente', v)
  }
  function onRef(li: number, v: string) {
    const match = REFERENCIAS.find(r => r.cod.toLowerCase() === v.trim().toLowerCase() || r.nome.toLowerCase() === v.trim().toLowerCase())
    if (match) patchLayout(curPed, li, { refCod: match.cod, ref: match.nome, design: [...match.design] })
    else patchLayout(curPed, li, { ref: v })
  }
  function aprovar() {
    if (!p) return
    if (!p.cliente) { toast('Preencha o cliente antes de aprovar'); return }
    const tecs = aprovarPedido(p.pedido)
    if (!tecs) { toast('Adicione ao menos uma técnica que roteia (DTF/Silk/Subli/Patch/Bordado)'); return }
    toast('Aprovado — rota: ' + tecs.map(t => TECNICAS[t].label).join(' + ') + ' → Kanban')
  }

  const tot = p ? pedTotais(p) : { pecas: 0, valor: 0 }

  return (
    <div>
      <datalist id="dl-clientes">{CLIENTES.map(c => <option key={c.id} value={c.nome} />)}</datalist>
      <datalist id="dl-refs">{REFERENCIAS.map(r => <option key={r.cod} value={r.nome}>{r.cod}</option>)}</datalist>

      <PageHead crumb="Atendimento · Editor" title="Comercial"
        desc="Editor de orçamento nativo — eficiente no celular e no desktop. Escolha um cliente/referência para autocompletar, ajuste os layouts e clique em PDF para o documento A4."
        actions={<Btn size="sm" variant="primary" onClick={novoOrcamento}><Plus size={16} />Novo orçamento</Btn>} />

      {/* seletor de pedidos (pills, rolagem horizontal) */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {pedidos.map((o, i) => (
          <button key={o.pedido} onClick={() => setCurPed(i)} style={{ ...pill, ...(i === curPed ? pillOn : {}) }}>
            <FileText size={13} />{o.cliente || '(novo)'}<span className="mono" style={{ opacity: .7, fontSize: 10 }}>{o.pedido.slice(-4)}</span>
          </button>
        ))}
      </div>

      {!p ? <div style={card}><div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: 20 }}>Nenhum orçamento. Clique em “Novo orçamento”.</div></div> : <>
        {/* barra de ação */}
        <div style={actionBar}>
          <span className="mono" style={{ fontWeight: 600 }}>{p.pedido}</span>
          {p.aprovado ? <Badge kind="info">em produção</Badge> : <Badge kind="neutral">rascunho</Badge>}
          <span style={{ marginLeft: 'auto' }} />
          <Btn size="sm" onClick={() => toast('Salvo (.ft) — protótipo')}><Save size={14} />Salvar</Btn>
          <Btn size="sm" onClick={() => window.print()}><Printer size={14} />PDF</Btn>
          {!p.aprovado && <Btn size="sm" variant="primary" onClick={aprovar}><Check size={14} />Aprovar</Btn>}
        </div>

        {/* dados do pedido */}
        <div style={card}>
          <h3 style={cardH}>Dados do pedido</h3>
          <div style={grid}>
            <Field label="Cliente" hint="digite para buscar no CRM"><Inp value={p.cliente} onChange={onCliente} list="dl-clientes" placeholder="Ex.: Escola João XXIII" /></Field>
            <Field label="Vendedor"><Inp value={p.vendedor} onChange={v => updateHeader(curPed, 'vendedor', v)} /></Field>
            <Field label="Contato"><Inp value={p.contato} onChange={v => updateHeader(curPed, 'contato', v)} mono /></Field>
            <Field label="Departamento"><Inp value={p.depto} onChange={v => updateHeader(curPed, 'depto', v)} /></Field>
            <Field label="Entrega"><Inp value={p.entrega} onChange={v => updateHeader(curPed, 'entrega', v)} placeholder="dd/mm/aaaa" /></Field>
            <Field label="Pagamento"><Inp value={p.pagamento} onChange={v => updateHeader(curPed, 'pagamento', v)} /></Field>
          </div>
        </div>

        {/* layouts */}
        {p.layouts.map((l, li) => (
          <div style={card} key={li}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={lnum}>L-{String(li + 1).padStart(2, '0')}</span>
              <div style={{ flex: 1 }}><Inp value={l.ref} onChange={v => onRef(li, v)} list="dl-refs" placeholder="Referência da peça" /></div>
              {p.layouts.length > 1 && <button onClick={() => deleteLayout(curPed, li)} style={delBtn}><Trash2 size={15} /></button>}
            </div>
            <div style={grid}>
              <Field label="Tecido"><Inp value={l.tecido} onChange={v => patchLayout(curPed, li, { tecido: v })} placeholder="Ex.: Dry-fit PET" /></Field>
              <Field label="Cor">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: l.corHex, flex: '0 0 auto' }} />
                  <Inp value={l.cor} onChange={v => patchLayout(curPed, li, { cor: v, corHex: corHexPorNome(v) })} placeholder="Cor" />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {CORES.map(c => <button key={c.hex} title={c.nome} onClick={() => patchLayout(curPed, li, { cor: c.nome, corHex: c.hex })} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-strong)', background: c.hex, cursor: 'pointer' }} />)}
                </div>
              </Field>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Design (define a rota de produção)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {DESIGN_ORDER.map(tag => {
                  const on = l.design.includes(tag)
                  return <button key={tag} onClick={() => toggleDesign(curPed, li, tag)}
                    style={{ height: 30, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: on ? '1.5px solid transparent' : '1.5px solid var(--border-strong)', background: on ? cvar(TECNICAS[tag].cor) : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{TECNICAS[tag].label}</button>
                })}
              </div>
            </div>

            {/* grade de tamanhos */}
            <div style={{ marginTop: 14 }}>
              <div style={{ ...sizeRow, color: 'var(--text-subtle)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                <span>Tam</span><span>Qtd</span><span>Uni (R$)</span><span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {l.tamanhos.map((t, ti) => (
                <div style={sizeRow} key={ti}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t.tam}{t.inf ? <span style={{ color: 'var(--danger)', fontSize: 10 }}> inf</span> : ''}</span>
                  <input type="number" inputMode="numeric" value={t.qtd || ''} onChange={e => updateSize(curPed, li, ti, 'qtd', parseFloat(e.target.value) || 0)} style={numInp} />
                  <input type="number" inputMode="decimal" value={t.uni || ''} onChange={e => updateSize(curPed, li, ti, 'uni', parseFloat(e.target.value) || 0)} style={numInp} />
                  <span className="mono" style={{ textAlign: 'right', fontSize: 13, alignSelf: 'center' }}>{money(t.qtd * t.uni)}</span>
                </div>
              ))}
              <div style={{ ...sizeRow, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, fontWeight: 700 }}>
                <span>Total</span><span className="mono">{l.tamanhos.reduce((s, t) => s + t.qtd, 0)}</span><span>—</span>
                <span className="mono" style={{ textAlign: 'right' }}>{money(l.tamanhos.reduce((s, t) => s + t.qtd * t.uni, 0))}</span>
              </div>
            </div>
          </div>
        ))}

        <Btn onClick={() => addLayout(curPed)} style={{ margin: '4px auto 20px', display: 'flex' }}><Plus size={16} />Adicionar layout</Btn>

        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total do orçamento</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{tot.pecas} pçs · R$ {money(tot.valor)}</span>
        </div>
      </>}
    </div>
  )
}

const card: CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', padding: 16, marginBottom: 12 }
const cardH: CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 12 }
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }
const actionBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--sh-1)', position: 'sticky', top: 66, zIndex: 20 }
const pill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto' }
const pillOn: CSSProperties = { background: 'var(--set-comercial)', borderColor: 'var(--set-comercial)', color: '#fff' }
const lnum: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--set-comercial)', borderRadius: 999, padding: '3px 10px', flex: '0 0 auto' }
const delBtn: CSSProperties = { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const sizeRow: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 80px 90px 1fr', gap: 8, alignItems: 'center', padding: '4px 0' }
const numInp: CSSProperties = { height: 36, width: '100%', padding: '0 8px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', textAlign: 'center' }
