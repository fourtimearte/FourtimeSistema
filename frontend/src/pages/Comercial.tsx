import { useState, type CSSProperties } from 'react'
import { Plus, Save, Printer, Check, Trash2, FileText, Copy, X, ImagePlus, Search } from 'lucide-react'
import { useApp } from '../store/useApp'
import {
  REFERENCIAS, CLIENTES, TECNICAS, DESIGN_ORDER, TEM_CODIGO, CORES, corHexPorNome,
  DTF_CORES, SB_CORES, codigoHex, TAM_ADULTO, TAM_INFANTIL, isInfantil, ordemTamanhos, OBS_TAGS,
  pedTotais, money, type Pedido, type Layout, type TecnicaKey,
} from '../store/model'
import { PageHead, Btn, Badge, cvar } from '../components/ui'

function Inp({ value, onChange, list, placeholder, mono }: { value: string; onChange: (v: string) => void; list?: string; placeholder?: string; mono?: boolean }) {
  return <input value={value} list={list} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none', fontFamily: mono ? 'var(--font-mono)' : undefined }} />
}
function Field({ label, children, hint, full }: { label: string; children: React.ReactNode; hint?: string; full?: boolean }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>{children}
    {hint && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{hint}</span>}
  </div>
}

export default function Comercial() {
  const { pedidos, curPed, setCurPed, novoOrcamento, updateHeader, patchPedido, aprovarPedido, toggleDinheiro, semDinheiro, toast } = useApp()
  const p: Pedido | undefined = pedidos[curPed]
  const [viewImg, setViewImg] = useState<string | null>(null)

  function onCliente(v: string) {
    const m = CLIENTES.find(c => c.nome.toLowerCase() === v.trim().toLowerCase())
    if (m) patchPedido(curPed, { cliente: m.nome, clienteId: m.id, cpf: m.doc, contato: m.contato, vendedor: m.vendedor })
    else updateHeader(curPed, 'cliente', v)
  }
  function aprovar() {
    if (!p) return
    if (!p.cliente) { toast('Preencha o cliente antes de aprovar'); return }
    const tecs = aprovarPedido(p.pedido)
    if (!tecs) { toast('Adicione ao menos uma técnica que roteia'); return }
    toast('Aprovado — rota: ' + tecs.map(t => TECNICAS[t].label).join(' + ') + ' → Kanban')
  }
  const tot = p ? pedTotais(p) : { pecas: 0, valor: 0 }

  return (
    <div>
      <datalist id="dl-clientes">{CLIENTES.map(c => <option key={c.id} value={c.nome} />)}</datalist>
      <datalist id="dl-refs">{REFERENCIAS.map(r => <option key={r.cod} value={r.nome}>{r.cod}</option>)}</datalist>

      <PageHead crumb="Atendimento · Editor" title="Comercial"
        desc="Editor de orçamento nativo — eficiente no celular e no desktop, com todas as funções do editor. O documento A4 sai fiel na impressão/PDF."
        actions={<Btn size="sm" variant="primary" onClick={novoOrcamento}><Plus size={16} />Novo orçamento</Btn>} />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {pedidos.map((o, i) => (
          <button key={o.pedido} onClick={() => setCurPed(i)} style={{ ...pill, ...(i === curPed ? pillOn : {}) }}>
            <FileText size={13} />{o.cliente || '(novo)'}<span className="mono" style={{ opacity: .7, fontSize: 10 }}>{o.pedido.slice(-4)}</span>
          </button>
        ))}
      </div>

      {!p ? <div style={card}><div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: 20 }}>Nenhum orçamento. Clique em “Novo orçamento”.</div></div> : <>
        <div style={actionBar}>
          <span className="mono" style={{ fontWeight: 600 }}>{p.pedido}</span>
          {p.aprovado ? <Badge kind="info">em produção</Badge> : <Badge kind="neutral">rascunho</Badge>}
          <span style={{ marginLeft: 'auto' }} />
          <Btn size="sm" onClick={toggleDinheiro}>{semDinheiro ? 'Mostrar R$' : 'Ocultar R$'}</Btn>
          <Btn size="sm" onClick={() => toast('Salvo (.ft) — protótipo')}><Save size={14} />Salvar</Btn>
          <Btn size="sm" onClick={() => window.print()}><Printer size={14} />PDF</Btn>
          {!p.aprovado && <Btn size="sm" variant="primary" onClick={aprovar}><Check size={14} />Aprovar</Btn>}
        </div>

        <div style={card}>
          <h3 style={cardH}>Dados do pedido</h3>
          <div style={grid}>
            <Field label="Cliente" hint="digite para buscar no CRM"><Inp value={p.cliente} onChange={onCliente} list="dl-clientes" placeholder="Ex.: Escola João XXIII" /></Field>
            <Field label="CPF / CNPJ"><Inp value={p.cpf} onChange={v => updateHeader(curPed, 'cpf', v)} mono /></Field>
            <Field label="Departamento"><Inp value={p.depto} onChange={v => updateHeader(curPed, 'depto', v)} /></Field>
            <Field label="Embalagem"><Inp value={p.embalagem} onChange={v => updateHeader(curPed, 'embalagem', v)} /></Field>
            <Field label="Vendedor"><Inp value={p.vendedor} onChange={v => updateHeader(curPed, 'vendedor', v)} /></Field>
            <Field label="Contato"><Inp value={p.contato} onChange={v => updateHeader(curPed, 'contato', v)} mono /></Field>
            <Field label="Entrega"><Inp value={p.entrega} onChange={v => updateHeader(curPed, 'entrega', v)} placeholder="dd/mm/aaaa" /></Field>
            <Field label="Envio"><input type="date" value={toISO(p.envio)} onChange={e => updateHeader(curPed, 'envio', fromISO(e.target.value))} style={dateInp} /></Field>
            <Field label="Pagamento"><Inp value={p.pagamento} onChange={v => updateHeader(curPed, 'pagamento', v)} /></Field>
            <Field label="Observações do pedido" full><textarea value={p.obs} onChange={e => updateHeader(curPed, 'obs', e.target.value)} rows={2} style={ta} /></Field>
          </div>
        </div>

        {p.layouts.map((l, li) => <LayoutCard key={li} pIdx={curPed} lIdx={li} layout={l} canDelete={p.layouts.length > 1} semDinheiro={semDinheiro} onView={setViewImg} />)}

        <Btn onClick={() => useApp.getState().addLayout(curPed)} style={{ margin: '4px auto 20px', display: 'flex' }}><Plus size={16} />Adicionar layout</Btn>

        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total do orçamento</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{tot.pecas} pçs{semDinheiro ? '' : ` · R$ ${money(tot.valor)}`}</span>
        </div>
      </>}

      {viewImg && <div onClick={() => setViewImg(null)} style={imgModal}><img src={viewImg} style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 8 }} /></div>}
    </div>
  )
}

/* ---------- Layout card ---------- */
function LayoutCard({ pIdx, lIdx, layout, canDelete, semDinheiro, onView }: { pIdx: number; lIdx: number; layout: Layout; canDelete: boolean; semDinheiro: boolean; onView: (s: string) => void }) {
  const s = useApp()
  const l = layout
  function onRef(v: string) {
    const m = REFERENCIAS.find(r => r.cod.toLowerCase() === v.trim().toLowerCase() || r.nome.toLowerCase() === v.trim().toLowerCase())
    if (m) s.patchLayout(pIdx, lIdx, { refCod: m.cod, ref: m.nome, design: m.design.map(t => ({ tag: t, cores: [] })) })
    else s.patchLayout(pIdx, lIdx, { ref: v })
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => s.setImg(pIdx, lIdx, String(r.result)); r.readAsDataURL(f)
  }
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={lnum}>L-{String(lIdx + 1).padStart(2, '0')}</span>
        <div style={{ flex: 1, minWidth: 160 }}><Inp value={l.ref} onChange={onRef} list="dl-refs" placeholder="Referência da peça" /></div>
        <div style={seg}>
          {(['adulto', 'infantil'] as const).map(g => <button key={g} onClick={() => s.setGrade(pIdx, lIdx, g)} style={{ ...segB, ...(l.grade === g ? segBOn : {}) }}>{g === 'adulto' ? 'Adulto' : 'Infantil'}</button>)}
        </div>
        <button onClick={() => s.duplicateLayout(pIdx, lIdx)} title="Duplicar layout" style={iconBtn}><Copy size={15} /></button>
        {canDelete && <button onClick={() => s.deleteLayout(pIdx, lIdx)} title="Excluir layout" style={iconBtn}><Trash2 size={15} /></button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,1fr) 2fr', gap: 16 }} className="lay-grid">
        {/* imagem */}
        <div>
          <label style={fieldLbl}>Imagem do produto</label>
          <div style={{ marginTop: 5 }}>
            {l.img
              ? <div style={{ position: 'relative' }}>
                  <img src={l.img} onClick={() => onView(l.img!)} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                  <button onClick={() => s.setImg(pIdx, lIdx, null)} style={{ ...iconBtn, position: 'absolute', top: 6, right: 6, background: 'var(--bg-surface)' }}><X size={14} /></button>
                </div>
              : <label style={imgDrop}><ImagePlus size={22} /><span style={{ fontSize: 12, marginTop: 4 }}>Enviar imagem</span><input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} /></label>}
          </div>
        </div>

        {/* ficha */}
        <div>
          <label style={fieldLbl}>Tecido(s)</label>
          {l.tecidos.map((t, ti) => (
            <div key={ti} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1 }}><Inp value={t} onChange={v => s.setTecido(pIdx, lIdx, ti, v)} placeholder="Ex.: Dry-fit PET" /></div>
              {l.tecidos.length > 1 && <button onClick={() => s.removeTecido(pIdx, lIdx, ti)} style={iconBtn}><X size={14} /></button>}
            </div>
          ))}
          <button onClick={() => s.addTecido(pIdx, lIdx)} style={linkBtn}>+ tecido</button>

          <label style={{ ...fieldLbl, marginTop: 12 }}>Cor</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: l.corHex, flex: '0 0 auto' }} />
            <Inp value={l.cor} onChange={v => s.patchLayout(pIdx, lIdx, { cor: v, corHex: corHexPorNome(v) })} placeholder="Cor" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {CORES.map(c => <button key={c.hex} title={c.nome} onClick={() => s.patchLayout(pIdx, lIdx, { cor: c.nome, corHex: c.hex })} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-strong)', background: c.hex, cursor: 'pointer' }} />)}
          </div>

          <DesignEditor pIdx={pIdx} lIdx={lIdx} layout={l} />
        </div>
      </div>

      <SizeTable pIdx={pIdx} lIdx={lIdx} layout={l} semDinheiro={semDinheiro} />

      <label style={{ ...fieldLbl, marginTop: 14 }}>Observações do layout</label>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 6 }}>
        {OBS_TAGS.map(o => { const on = l.obsTags.includes(o.tag); return <button key={o.tag} onClick={() => s.toggleObsTag(pIdx, lIdx, o.tag)} style={{ height: 26, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: on ? 'none' : '1.5px solid var(--border-strong)', background: on ? o.cor : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{o.tag}</button> })}
      </div>
      <textarea value={l.obs} onChange={e => s.setObs(pIdx, lIdx, e.target.value)} rows={2} placeholder="Observações desta peça…" style={ta} />
    </div>
  )
}

/* ---------- Design (tags + código de cor DTF/Subli) ---------- */
function DesignEditor({ pIdx, lIdx, layout }: { pIdx: number; lIdx: number; layout: Layout }) {
  const s = useApp()
  const [openTag, setOpenTag] = useState<TecnicaKey | null>(null)
  const [q, setQ] = useState('')
  return (
    <div style={{ marginTop: 12 }}>
      <label style={fieldLbl}>Design (define a rota de produção)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {DESIGN_ORDER.map(tag => {
          const on = layout.design.some(d => d.tag === tag)
          return <button key={tag} onClick={() => s.toggleDesign(pIdx, lIdx, tag)}
            style={{ height: 30, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: on ? '1.5px solid transparent' : '1.5px solid var(--border-strong)', background: on ? cvar(TECNICAS[tag].cor) : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{TECNICAS[tag].label}</button>
        })}
      </div>
      {/* tokens de código para DTF/Subli ativos */}
      {layout.design.filter(d => TEM_CODIGO.includes(d.tag)).map(d => (
        <div key={d.tag} style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cvar(TECNICAS[d.tag].cor) }}>{TECNICAS[d.tag].label} — códigos:</span>
            {d.cores.map(code => (
              <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 6px 0 4px', borderRadius: 999, background: 'var(--bg-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <i style={{ width: 14, height: 14, borderRadius: 4, background: codigoHex(d.tag, code) }} />{code}
                <button onClick={() => s.removeDesignCor(pIdx, lIdx, d.tag, code)} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </span>
            ))}
            <button onClick={() => { setOpenTag(openTag === d.tag ? null : d.tag); setQ('') }} style={linkBtn}>+ cor</button>
          </div>
          {openTag === d.tag && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Search size={13} style={{ color: 'var(--text-subtle)' }} />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="buscar código…" style={{ flex: 1, height: 30, padding: '0 8px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 12, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                {(d.tag === 'DTF' ? DTF_CORES : SB_CORES).filter(c => c.code.includes(q.toUpperCase())).slice(0, 120).map(c => (
                  <button key={c.code} title={c.code} onClick={() => s.addDesignCor(pIdx, lIdx, d.tag, c.code)}
                    style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-strong)', background: c.hex, cursor: 'pointer', fontSize: 8, color: '#fff', fontFamily: 'var(--font-mono)' }}>{c.code}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------- Tabela de tamanhos (adulto/infantil, auto-modificável) ---------- */
function SizeTable({ pIdx, lIdx, layout, semDinheiro }: { pIdx: number; lIdx: number; layout: Layout; semDinheiro: boolean }) {
  const s = useApp()
  const l = layout
  const linhas = ordemTamanhos(l)
  const outras = (l.grade === 'adulto' ? TAM_INFANTIL : TAM_ADULTO).filter(t => l.tamanhos[t] === undefined)
  const cols = semDinheiro ? '1fr 90px' : '1fr 80px 90px 1fr'
  let totQ = 0, totV = 0
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={fieldLbl}>Tabela de tamanhos · grade {l.grade}</label>
        {outras.length > 0 && <select value="" onChange={e => { if (e.target.value) s.setSize(pIdx, lIdx, e.target.value, 'qtd', 0) }} style={miniSel}>
          <option value="">+ tam. {l.grade === 'adulto' ? 'infantil' : 'adulto'}</option>
          {outras.map(t => <option key={t} value={t}>{t}</option>)}
        </select>}
      </div>
      <div style={{ ...sizeRow(cols), color: 'var(--text-subtle)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        <span>Tam</span><span>Qtd</span>{!semDinheiro && <span>Uni</span>}{!semDinheiro && <span style={{ textAlign: 'right' }}>Total</span>}
      </div>
      {linhas.map(tam => {
        const t = l.tamanhos[tam] ?? { qtd: 0, uni: 0 }; totQ += t.qtd; totV += t.qtd * t.uni
        const cross = (l.grade === 'adulto' && isInfantil(tam)) || (l.grade === 'infantil' && !isInfantil(tam))
        const crossStyle: CSSProperties = cross ? (l.grade === 'adulto' ? { background: 'var(--sig-inf-bg)', color: 'var(--sig-inf-fg)' } : { background: 'var(--sig-adu-bg)', color: 'var(--sig-adu-fg)' }) : {}
        return (
          <div key={tam} style={{ ...sizeRow(cols), ...crossStyle, borderRadius: 6, paddingLeft: cross ? 6 : 0 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{tam}{cross ? ' •' : ''}</span>
            <input type="number" inputMode="numeric" value={t.qtd || ''} onChange={e => s.setSize(pIdx, lIdx, tam, 'qtd', parseFloat(e.target.value) || 0)} style={numInp} />
            {!semDinheiro && <input type="number" inputMode="decimal" value={t.uni || ''} onChange={e => s.setSize(pIdx, lIdx, tam, 'uni', parseFloat(e.target.value) || 0)} style={numInp} />}
            {!semDinheiro && <span className="mono" style={{ textAlign: 'right', fontSize: 13, alignSelf: 'center' }}>{money(t.qtd * t.uni)}</span>}
          </div>
        )
      })}
      <div style={{ ...sizeRow(cols), borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, fontWeight: 700 }}>
        <span>Total</span><span className="mono">{totQ}</span>{!semDinheiro && <span>—</span>}{!semDinheiro && <span className="mono" style={{ textAlign: 'right' }}>{money(totV)}</span>}
      </div>
    </div>
  )
}

/* datas */
function toISO(br: string) { const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : '' }
function fromISO(iso: string) { const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : iso }

const card: CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', padding: 16, marginBottom: 12 }
const cardH: CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 12 }
const fieldLbl: CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }
const actionBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--sh-1)', position: 'sticky', top: 66, zIndex: 20 }
const pill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto' }
const pillOn: CSSProperties = { background: 'var(--set-comercial)', borderColor: 'var(--set-comercial)', color: '#fff' }
const lnum: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--set-comercial)', borderRadius: 999, padding: '3px 10px', flex: '0 0 auto' }
const iconBtn: CSSProperties = { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const linkBtn: CSSProperties = { border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: '4px 0' }
const seg: CSSProperties = { display: 'flex', background: 'var(--bg-muted)', borderRadius: 999, padding: 3, gap: 2 }
const segB: CSSProperties = { fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', color: 'var(--text-muted)', border: 'none', background: 'none' }
const segBOn: CSSProperties = { background: 'var(--bg-surface)', color: 'var(--text)', boxShadow: 'var(--sh-1)' }
const sizeRow = (cols: string): CSSProperties => ({ display: 'grid', gridTemplateColumns: cols, gap: 8, alignItems: 'center', padding: '4px 0' })
const numInp: CSSProperties = { height: 36, width: '100%', padding: '0 8px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', textAlign: 'center' }
const ta: CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }
const dateInp: CSSProperties = { height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none' }
const miniSel: CSSProperties = { height: 30, padding: '0 8px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 12, outline: 'none' }
const imgDrop: CSSProperties = { display: 'grid', placeItems: 'center', gap: 4, height: 150, border: '1.5px dashed var(--border-strong)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--bg-surface-2)' }
const imgModal: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 95, display: 'grid', placeItems: 'center', cursor: 'zoom-out' }
