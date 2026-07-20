import { useState, type CSSProperties } from 'react'
import { Plus, Save, Printer, Check, Trash2, Copy, X, ImagePlus, Search } from 'lucide-react'
import { useApp } from '../store/useApp'
import {
  REFERENCIAS, CLIENTES, TECNICAS, DESIGN_ORDER, TEM_CODIGO, CORES, TECIDOS, corHexPorNome,
  DTF_CORES, SB_CORES, codigoHex, TAM_ADULTO, TAM_INFANTIL, isInfantil, ordemTamanhos, OBS_TAGS,
  pedTotais, money, type Pedido, type Layout, type TecnicaKey,
} from '../store/model'
import { PageHead, Btn, Badge, cvar } from '../components/ui'
import Combo from '../components/Combo'

function Inp({ value, onChange, list, placeholder, mono }: { value: string; onChange: (v: string) => void; list?: string; placeholder?: string; mono?: boolean }) {
  return <input value={value} list={list} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none', fontFamily: mono ? 'var(--font-mono)' : undefined }} />
}
function Field({ label, children, hint, full }: { label: string; children: React.ReactNode; hint?: string; full?: boolean }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
    <label style={fieldLbl}>{label}</label>{children}{hint && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{hint}</span>}
  </div>
}
function toISO(br: string) { const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : '' }
function fromISO(iso: string) { const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : iso }

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

      <PageHead crumb="Atendimento · Editor" title="Comercial"
        desc="Editor de orçamento nativo — eficiente no celular e no desktop, com as funções do v172. O documento A4 sai fiel na impressão/PDF."
        actions={<Btn size="sm" variant="primary" onClick={novoOrcamento}><Plus size={16} />Novo orçamento</Btn>} />

      {/* abas de documento (estilo kit: ativa vermelha) */}
      <div style={tabbar}>
        {pedidos.map((o, i) => (
          <button key={o.pedido} onClick={() => setCurPed(i)} style={{ ...tab, ...(i === curPed ? tabOn : {}) }}>
            {o.cliente || '(novo)'} <span className="mono" style={{ opacity: .7, fontSize: 10 }}>{o.pedido.slice(-4)}</span>
          </button>
        ))}
        <button onClick={novoOrcamento} style={tabNew} title="Novo orçamento">+</button>
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

        {/* DADOS DO PEDIDO — mantido */}
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
      <style>{'@media(max-width:820px){.lay-grid{grid-template-columns:1fr!important}}'}</style>
    </div>
  )
}

/* ---------- Módulo de Layout: 2/3 imagem · 1/3 ficha ---------- */
function LayoutCard({ pIdx, lIdx, layout, canDelete, semDinheiro, onView }: { pIdx: number; lIdx: number; layout: Layout; canDelete: boolean; semDinheiro: boolean; onView: (s: string) => void }) {
  const s = useApp(); const l = layout
  function selRef(v: string, opt?: { sub?: string }) {
    const m = REFERENCIAS.find(r => r.cod === opt?.sub || r.nome.toLowerCase() === v.trim().toLowerCase())
    if (m) s.patchLayout(pIdx, lIdx, { refCod: m.cod, ref: m.nome, design: m.design.map(t => ({ tag: t, cores: [] })) })
    else s.patchLayout(pIdx, lIdx, { ref: v })
  }
  function readImg(f?: File) { if (!f) return; const r = new FileReader(); r.onload = () => s.setImg(pIdx, lIdx, String(r.result)); r.readAsDataURL(f) }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={lnum}>L-{String(lIdx + 1).padStart(2, '0')}</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Combo value={l.ref} onSelect={selRef} placeholder="Referência da peça" options={REFERENCIAS.map(r => ({ label: r.nome, value: r.nome, sub: r.cod }))} />
        </div>
        <div style={seg}>
          {(['adulto', 'infantil'] as const).map(g => <button key={g} onClick={() => s.setGrade(pIdx, lIdx, g)} style={{ ...segB, ...(l.grade === g ? segBOn : {}) }}>{g === 'adulto' ? 'Adulto' : 'Infantil'}</button>)}
        </div>
        <button onClick={() => s.duplicateLayout(pIdx, lIdx)} title="Duplicar layout" style={iconBtn}><Copy size={15} /></button>
        {canDelete && <button onClick={() => s.deleteLayout(pIdx, lIdx)} title="Excluir layout" style={iconBtn}><Trash2 size={15} /></button>}
      </div>

      <div className="lay-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* IMAGEM (2/3) — tamanho inteiro */}
        <div>
          <label style={fieldLbl}>Imagem do produto</label>
          {l.img
            ? <div style={{ position: 'relative', marginTop: 5 }}>
                <img src={l.img} onClick={() => onView(l.img!)} style={{ width: '100%', maxHeight: 460, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'zoom-in', display: 'block' }} />
                <button onClick={() => s.setImg(pIdx, lIdx, null)} title="Limpar imagem" style={{ ...iconBtn, position: 'absolute', top: 8, right: 8, background: 'var(--bg-surface)' }}><X size={14} /></button>
              </div>
            : <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); readImg(e.dataTransfer.files?.[0]) }} style={imgDrop}>
                <ImagePlus size={26} /><span style={{ fontSize: 13, marginTop: 6 }}>Enviar imagem</span>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>clique ou arraste o arquivo</span>
                <input type="file" accept="image/*" onChange={e => readImg(e.target.files?.[0] ?? undefined)} style={{ display: 'none' }} />
              </label>}
        </div>

        {/* FICHA (1/3): tecido · cor · design · tabela · obs */}
        <div>
          <label style={fieldLbl}>Tecido(s)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 5 }}>
            {l.tecidos.map((t, ti) => (
              <div key={ti} style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1 }}><Combo value={t} onSelect={v => s.setTecido(pIdx, lIdx, ti, v)} placeholder="Tecido" options={TECIDOS.map(x => ({ label: x, value: x }))} /></div>
                {l.tecidos.length > 1 && <button onClick={() => s.removeTecido(pIdx, lIdx, ti)} title="Remover tecido" style={iconBtn}><X size={14} /></button>}
              </div>
            ))}
          </div>
          <button onClick={() => s.addTecido(pIdx, lIdx)} style={addBtn}><Plus size={13} />Adicionar tecido</button>

          <label style={{ ...fieldLbl, marginTop: 14 }}>Cor</label>
          <div style={{ marginTop: 5 }}>
            <Combo value={l.cor} leftSwatch={l.corHex} placeholder="Cor" options={CORES.map(c => ({ label: c.nome, value: c.nome, hex: c.hex }))}
              onSelect={(v, opt) => s.patchLayout(pIdx, lIdx, { cor: v, corHex: opt?.hex ?? corHexPorNome(v) })} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {CORES.map(c => <button key={c.hex} title={c.nome} onClick={() => s.patchLayout(pIdx, lIdx, { cor: c.nome, corHex: c.hex })} style={{ width: 20, height: 20, borderRadius: 5, border: '1px solid var(--border-strong)', background: c.hex, cursor: 'pointer' }} />)}
          </div>

          <DesignEditor pIdx={pIdx} lIdx={lIdx} layout={l} />
          <SizeTable pIdx={pIdx} lIdx={lIdx} layout={l} semDinheiro={semDinheiro} />

          <label style={{ ...fieldLbl, marginTop: 14 }}>Observações</label>
          <div style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
            {OBS_TAGS.map(o => { const on = l.obsTags.includes(o.tag); return <button key={o.tag} onClick={() => s.toggleObsTag(pIdx, lIdx, o.tag)} style={{ height: 24, padding: '0 9px', borderRadius: 999, fontSize: 10, fontWeight: 800, cursor: 'pointer', border: on ? 'none' : '1.5px solid var(--border-strong)', background: on ? o.cor : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{o.tag}</button> })}
          </div>
          <textarea value={l.obs} onChange={e => s.setObs(pIdx, lIdx, e.target.value)} rows={2} placeholder="Observações desta peça…" style={ta} />
        </div>
      </div>
    </div>
  )
}

/* ---------- Design ---------- */
function DesignEditor({ pIdx, lIdx, layout }: { pIdx: number; lIdx: number; layout: Layout }) {
  const s = useApp()
  const [openTag, setOpenTag] = useState<TecnicaKey | null>(null)
  const [q, setQ] = useState('')
  return (
    <div style={{ marginTop: 14 }}>
      <label style={fieldLbl}>Design (define a rota de produção)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {DESIGN_ORDER.map(tag => {
          const on = layout.design.some(d => d.tag === tag)
          return <button key={tag} onClick={() => s.toggleDesign(pIdx, lIdx, tag)}
            style={{ height: 30, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: on ? '1.5px solid transparent' : '1.5px solid var(--border-strong)', background: on ? cvar(TECNICAS[tag].cor) : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{TECNICAS[tag].label}</button>
        })}
      </div>
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
            <button onClick={() => { setOpenTag(openTag === d.tag ? null : d.tag); setQ('') }} style={addBtnInline}>+ cor</button>
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

/* ---------- Tabela de tamanhos (compacta, adulto/infantil auto-modificável) ---------- */
function SizeTable({ pIdx, lIdx, layout, semDinheiro }: { pIdx: number; lIdx: number; layout: Layout; semDinheiro: boolean }) {
  const s = useApp(); const l = layout
  const linhas = ordemTamanhos(l)
  const outras = (l.grade === 'adulto' ? TAM_INFANTIL : TAM_ADULTO).filter(t => l.tamanhos[t] === undefined)
  let totQ = 0, totV = 0
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <label style={fieldLbl}>Tabela de tamanhos · {l.grade}</label>
        {outras.length > 0 && <select value="" onChange={e => { if (e.target.value) s.setSize(pIdx, lIdx, e.target.value, 'qtd', 0) }} style={miniSel}>
          <option value="">+ {l.grade === 'adulto' ? 'infantil' : 'adulto'}</option>
          {outras.map(t => <option key={t} value={t}>{t}</option>)}
        </select>}
      </div>
      <table style={stbl}>
        <thead><tr>
          <th style={{ ...stTh, textAlign: 'left' }}>Tam</th><th style={stTh}>Qtd</th>
          {!semDinheiro && <th style={stTh}>Uni</th>}{!semDinheiro && <th style={stTh}>Total</th>}
        </tr></thead>
        <tbody>
          {linhas.map(tam => {
            const t = l.tamanhos[tam] ?? { qtd: 0, uni: 0 }; totQ += t.qtd; totV += t.qtd * t.uni
            const cross = (l.grade === 'adulto' && isInfantil(tam)) || (l.grade === 'infantil' && !isInfantil(tam))
            const cs: CSSProperties = cross ? (l.grade === 'adulto' ? { background: 'var(--sig-inf-bg)', color: 'var(--sig-inf-fg)' } : { background: 'var(--sig-adu-bg)', color: 'var(--sig-adu-fg)' }) : {}
            return (
              <tr key={tam}>
                <td style={{ ...stTd, textAlign: 'left', fontFamily: 'var(--font-ui)', fontWeight: 600, ...cs }}>{tam}</td>
                <td style={{ ...stTd, ...cs }}><input type="number" inputMode="numeric" value={t.qtd || ''} onChange={e => s.setSize(pIdx, lIdx, tam, 'qtd', parseFloat(e.target.value) || 0)} style={cellInp} /></td>
                {!semDinheiro && <td style={{ ...stTd, ...cs }}><input type="number" inputMode="decimal" value={t.uni || ''} onChange={e => s.setSize(pIdx, lIdx, tam, 'uni', parseFloat(e.target.value) || 0)} style={cellInp} /></td>}
                {!semDinheiro && <td style={{ ...stTd, ...cs }}>{money(t.qtd * t.uni)}</td>}
              </tr>
            )
          })}
        </tbody>
        <tfoot><tr>
          <td style={{ ...stTd, textAlign: 'left', fontWeight: 700, background: 'var(--bg-muted)' }}>Total</td>
          <td style={{ ...stTd, fontWeight: 700, background: 'var(--bg-muted)' }}>{totQ}</td>
          {!semDinheiro && <td style={{ ...stTd, background: 'var(--bg-muted)' }}>—</td>}
          {!semDinheiro && <td style={{ ...stTd, fontWeight: 700, background: 'var(--bg-muted)' }}>{money(totV)}</td>}
        </tr></tfoot>
      </table>
    </div>
  )
}

const card: CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', padding: 16, marginBottom: 12 }
const cardH: CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 12 }
const fieldLbl: CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }
const actionBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--sh-1)', position: 'sticky', top: 66, zIndex: 20 }
/* tabs estilo kit */
const tabbar: CSSProperties = { display: 'flex', gap: 3, overflowX: 'auto', borderBottom: '1px solid var(--border)', marginBottom: 12, paddingBottom: 0 }
const tab: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '8px 8px 0 0', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative', top: 1 }
const tabOn: CSSProperties = { background: 'var(--primary)', color: 'var(--primary-fg)', borderColor: 'var(--primary)', top: 0 }
const tabNew: CSSProperties = { width: 34, height: 34, borderRadius: '8px 8px 0 0', border: '1px solid var(--border)', borderBottom: 'none', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }
const lnum: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--set-comercial)', borderRadius: 999, padding: '3px 10px', flex: '0 0 auto' }
const iconBtn: CSSProperties = { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const addBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, height: 32, padding: '0 12px', border: '1px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }
const addBtnInline: CSSProperties = { border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }
const seg: CSSProperties = { display: 'flex', background: 'var(--bg-muted)', borderRadius: 999, padding: 3, gap: 2 }
const segB: CSSProperties = { fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', color: 'var(--text-muted)', border: 'none', background: 'none' }
const segBOn: CSSProperties = { background: 'var(--bg-surface)', color: 'var(--text)', boxShadow: 'var(--sh-1)' }
const stbl: CSSProperties = { borderCollapse: 'collapse', width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 2 }
const stTh: CSSProperties = { border: '1px solid var(--border)', padding: '4px 5px', textAlign: 'center', background: 'var(--bg-muted)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10 }
const stTd: CSSProperties = { border: '1px solid var(--border)', padding: '2px 4px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }
const cellInp: CSSProperties = { width: '100%', minWidth: 40, height: 28, padding: '0 4px', border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', textAlign: 'center' }
const ta: CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }
const dateInp: CSSProperties = { height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none' }
const miniSel: CSSProperties = { height: 28, padding: '0 6px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 11, outline: 'none' }
const imgDrop: CSSProperties = { display: 'grid', placeItems: 'center', gap: 2, minHeight: 240, marginTop: 5, border: '1.5px dashed var(--border-strong)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--bg-surface-2)', textAlign: 'center', padding: 20 }
const imgModal: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 95, display: 'grid', placeItems: 'center', cursor: 'zoom-out' }
