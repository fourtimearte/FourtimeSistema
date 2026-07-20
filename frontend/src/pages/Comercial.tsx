import { FileText, Plus, Save, Printer, Check, Trash2, Image as ImageIcon } from 'lucide-react'
import { useApp } from '../store/useApp'
import { DESIGN_ORDER, TECNICAS, pedTotais, money, type Pedido, type TecnicaKey } from '../store/model'
import { PageHead, Btn, Badge, cvar } from '../components/ui'

function Editable({ value, onCommit, style, className }: { value: string; onCommit: (v: string) => void; style?: React.CSSProperties; className?: string }) {
  return <div contentEditable suppressContentEditableWarning className={className} style={style}
    onBlur={e => { const v = e.currentTarget.textContent?.trim() ?? ''; if (v !== value) onCommit(v) }}>{value || '—'}</div>
}

export default function Comercial() {
  const { pedidos, curPed, setCurPed, novoOrcamento, updateHeader, updateLayout, updateSize, addLayout, deleteLayout, toggleDesign, aprovarPedido, toast } = useApp()
  const p: Pedido | undefined = pedidos[curPed]

  function aprovar() {
    if (!p) return
    if (!p.cliente) { toast('Preencha o cliente antes de aprovar'); return }
    const tecs = aprovarPedido(p.pedido)
    if (!tecs) { toast('Adicione ao menos uma técnica que roteia (DTF/Silk/Subli/Patch/Bordado)'); return }
    toast('Aprovado — rota: ' + tecs.map(t => TECNICAS[t].label).join(' + ') + ' → Kanban')
  }

  return (
    <div>
      <PageHead crumb="Atendimento · Editor" title="Comercial"
        desc="Pedidos e o editor de orçamento. Edite os campos direto na folha A4. As tags de Design de cada layout definem a rota — clique nelas e depois em Aprovar para o pedido entrar no Kanban."
        actions={<>
          <Btn size="sm" onClick={() => toast('Abrir .ft (protótipo)')}><FileText size={16} />Abrir</Btn>
          <Btn size="sm" variant="primary" onClick={novoOrcamento}><Plus size={16} />Novo orçamento</Btn>
        </>} />

      <div style={wrap} className="ed-wrap">
        <aside style={orclist}>
          <div style={orclistH}>Orçamentos</div>
          {pedidos.map((o, i) => (
            <div key={o.pedido} onClick={() => setCurPed(i)} style={{ ...orcitem, ...(i === curPed ? orcitemOn : {}) }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{o.cliente || '(sem cliente)'}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                {o.pedido} · R$ {money(pedTotais(o).valor)}
                {o.aprovado ? <Badge kind="info">produção</Badge> : <Badge kind="neutral">rascunho</Badge>}
              </span>
            </div>
          ))}
        </aside>

        <section style={stage}>
          {!p ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-subtle)' }}>Nenhum orçamento. Clique em “Novo orçamento”.</div> : <>
            <div style={toolbar}>
              <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
                {pedidos.slice(0, 4).map((x, i) => (
                  <div key={x.pedido} onClick={() => setCurPed(i)} style={{ ...etab, ...(i === curPed ? etabOn : {}) }}><FileText size={13} />{(x.cliente || x.pedido).slice(0, 16)}</div>
                ))}
              </div>
              <Btn size="sm" onClick={() => toast('Modo com/sem dinheiro (protótipo)')}>R$</Btn>
              <Btn size="sm" onClick={() => toast('Salvo no Drive (protótipo)')}><Save size={14} />Salvar</Btn>
              {p.aprovado
                ? <Btn size="sm" onClick={() => toast('Gerando PDF (protótipo)')}><Printer size={14} />PDF</Btn>
                : <Btn size="sm" variant="primary" onClick={aprovar}><Check size={14} />Aprovar → Kanban</Btn>}
            </div>

            <div className="a4">
              <div className="a4-head">
                <div className="a4-logo"><div className="lg">F</div><div>FOURTIME<small>Personalização esportiva</small></div></div>
                <div className="a4-code">Pedido Nº<b>{p.pedido}</b></div>
              </div>
              <div className="a4-fields">
                {([['Cliente', 'cliente'], ['Vendedor', 'vendedor'], ['Entrega', 'entrega'], ['Departamento', 'depto'], ['Contato', 'contato'], ['Pagamento', 'pagamento']] as [string, keyof Pedido][]).map(([lbl, f]) => (
                  <div className="a4-f" key={f}><label>{lbl}</label><Editable className="v" value={String(p[f] ?? '')} onCommit={v => updateHeader(curPed, f, v)} /></div>
                ))}
              </div>
              <div className="a4-warn">{p.aprovado ? '✔ Orçamento aprovado · em produção — rota gerada pelas tags de Design' : '⚠ Rascunho · aprove para gerar a rota de produção'}</div>

              {p.layouts.map((l, li) => {
                let sub = 0
                return (
                  <div className="lay" key={li}>
                    {p.layouts.length > 1 && <button className="lay-del" onClick={() => deleteLayout(curPed, li)}><Trash2 size={13} /></button>}
                    <div className="lay-l">
                      <span className="lnum">L-{String(li + 1).padStart(2, '0')}</span>
                      <Editable className="ref" value={l.ref} onCommit={v => updateLayout(curPed, li, 'ref', v)} />
                      <div className="lay-img"><ImageIcon size={34} /></div>
                    </div>
                    <div className="lay-r">
                      <div className="grp-lbl">Tecido</div><Editable className="row" value={l.tecido} onCommit={v => updateLayout(curPed, li, 'tecido', v)} />
                      <div className="grp-lbl">Cor</div>
                      <div className="row"><span className="corline"><i style={{ background: l.corHex }} /><Editable value={l.cor} onCommit={v => updateLayout(curPed, li, 'cor', v)} style={{ display: 'inline' }} /></span></div>
                      <div className="grp-lbl">Design (define a rota)</div>
                      <div className="desgn">
                        {DESIGN_ORDER.map(tag => {
                          const on = l.design.includes(tag)
                          return <span key={tag} onClick={() => toggleDesign(curPed, li, tag)} className="dtag" style={on ? { background: cvar(TECNICAS[tag].cor), color: '#fff' } : { background: '#EEF1F4', color: '#98A3B0', border: '1.5px solid #E4E8ED' }}>{TECNICAS[tag].label}</span>
                        })}
                      </div>
                      <table className="sizetbl">
                        <thead><tr><th style={{ textAlign: 'left' }}>Tam</th><th>Qtd</th><th>Uni</th><th>Total</th></tr></thead>
                        <tbody>
                          {l.tamanhos.map((t, ti) => { const tot = t.qtd * t.uni; sub += tot; return (
                            <tr key={ti}>
                              <td className="lbl">{t.tam}{t.inf ? ' · inf' : ''}</td>
                              <td className={t.inf ? 'inf' : ''} contentEditable suppressContentEditableWarning onBlur={e => updateSize(curPed, li, ti, 'qtd', parseFloat(e.currentTarget.textContent!.replace(',', '.')) || 0)}>{t.qtd}</td>
                              <td className={t.inf ? 'inf' : ''} contentEditable suppressContentEditableWarning onBlur={e => updateSize(curPed, li, ti, 'uni', parseFloat(e.currentTarget.textContent!.replace(/\./g, '').replace(',', '.')) || 0)}>{money(t.uni)}</td>
                              <td className={t.inf ? 'inf' : ''}>{money(tot)}</td>
                            </tr>
                          ) })}
                        </tbody>
                        <tfoot><tr><td className="lbl">Total</td><td>{l.tamanhos.reduce((s, t) => s + t.qtd, 0)}</td><td>—</td><td>{money(sub)}</td></tr></tfoot>
                      </table>
                    </div>
                  </div>
                )
              })}

              <button className="a4-addlay" onClick={() => addLayout(curPed)}><Plus size={14} style={{ verticalAlign: -2 }} /> Adicionar layout</button>
              <div className="a4-foot"><span>Fourtime · CNPJ 00.000.000/0001-00 · Goiânia-GO</span><span className="tot">{pedTotais(p).pecas} pçs · R$ {money(pedTotais(p).valor)}</span></div>
            </div>
          </>}
        </section>
      </div>
      <style>{A4CSS}</style>
    </div>
  )
}

const wrap: React.CSSProperties = { display: 'grid', gridTemplateColumns: '230px 1fr', gap: 24, alignItems: 'start' }
const orclist: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', overflow: 'hidden' }
const orclistH: React.CSSProperties = { padding: '11px 13px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)' }
const orcitem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 13px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderLeft: '3px solid transparent' }
const orcitemOn: React.CSSProperties = { background: 'color-mix(in srgb,var(--set-comercial) 8%,transparent)', borderLeftColor: 'var(--set-comercial)' }
const stage: React.CSSProperties = { background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }
const toolbar: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }
const etab: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, padding: '0 13px', height: 32, border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '6px 6px 0 0', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
const etabOn: React.CSSProperties = { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }

const A4CSS = `
@media(max-width:900px){.ed-wrap{grid-template-columns:1fr!important}}
.a4{background:#fff;color:#161A20;width:100%;max-width:760px;margin:0 auto;border-radius:6px;box-shadow:var(--sh-3);font-family:var(--font-doc);overflow:hidden}
.a4-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:2px solid #C6161B}
.a4-logo{display:flex;align-items:center;gap:9px;font-family:var(--font-ui);font-weight:700;color:#161A20}
.a4-logo .lg{width:34px;height:34px;border-radius:8px;background:var(--grad-brand);color:#fff;display:grid;place-items:center;font-weight:700}
.a4-logo small{display:block;font-weight:500;font-size:10px;color:#6A7686}
.a4-code{font-family:var(--font-mono);font-size:12px;color:#6A7686;text-align:right}
.a4-code b{display:block;color:#161A20;font-size:14px}
.a4-fields{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px 20px;padding:14px 20px;border-bottom:1px solid #E4E8ED;font-family:var(--font-ui)}
@media(max-width:560px){.a4-fields{grid-template-columns:1fr 1fr}}
.a4-f{display:flex;flex-direction:column;padding:5px 0}
.a4-f label{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#98A3B0;font-weight:700}
.a4-f .v{font-size:13px;color:#161A20;font-weight:500;min-height:18px;outline:none;border-bottom:1px dashed transparent}
.a4-f .v:focus{border-bottom-color:#C6161B;background:#FEF2F2}
.a4-warn{background:#FBF0DF;color:#7C3A06;font-family:var(--font-ui);font-size:11px;font-weight:600;padding:5px 20px;border-bottom:1px solid #E4E8ED}
.lay{display:grid;grid-template-columns:2fr 1fr;gap:16px;padding:16px 20px;border-bottom:1px solid #EEF1F4;position:relative}
@media(max-width:560px){.lay{grid-template-columns:1fr}}
.lay-l .lnum{font-family:var(--font-mono);font-size:11px;font-weight:700;color:#fff;background:var(--set-comercial);border-radius:999px;padding:2px 9px;display:inline-block;margin-bottom:8px}
.lay-l .ref{font-family:var(--font-ui);font-size:15px;font-weight:600;color:#161A20;margin-bottom:10px;outline:none}
.lay-l .ref:focus{background:#FEF2F2}
.lay-img{height:180px;border-radius:8px;background:linear-gradient(135deg,#EEF1F4,#D6DCE3);display:grid;place-items:center;color:#98A3B0;border:1px solid #E4E8ED}
.lay-del{position:absolute;top:12px;right:14px;width:24px;height:24px;border-radius:6px;border:1px solid #E4E8ED;background:#fff;color:#98A3B0;cursor:pointer;display:grid;place-items:center}
.lay-del:hover{color:#C6161B;border-color:#F49A9E}
.lay-r{font-family:var(--font-ui)}
.lay-r .grp-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#98A3B0;font-weight:700;margin:0 0 4px}
.lay-r .row{font-size:12px;color:#39424E;margin-bottom:9px;outline:none}
.lay-r .row:focus{background:#FEF2F2}
.lay-r .corline{display:inline-flex;align-items:center;gap:6px;font-size:12px}
.lay-r .corline i{width:13px;height:13px;border-radius:4px;border:1px solid #D6DCE3}
.desgn{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.dtag{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:10px;font-weight:700;cursor:pointer;user-select:none;box-sizing:border-box}
.sizetbl{border-collapse:collapse;font-family:var(--font-mono);font-size:11px;width:100%;margin-top:2px}
.sizetbl th,.sizetbl td{border:1px solid #E4E8ED;padding:4px 6px;text-align:center}
.sizetbl thead th{background:#F6F8FA;color:#6A7686;font-weight:600;font-size:10px}
.sizetbl td.lbl{text-align:left;font-family:var(--font-ui);color:#161A20;font-weight:500}
.sizetbl td.inf{background:#FCE8E9;color:#C6161B;font-weight:600}
.sizetbl td[contenteditable]:focus{background:#FEF2F2;outline:none}
.sizetbl tfoot td{background:#F6F8FA;font-weight:700;color:#161A20}
.a4-addlay{margin:12px auto;display:block;background:var(--bg-surface);border:1px solid var(--border-strong);color:var(--text);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-ui)}
.a4-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;font-family:var(--font-ui);font-size:11px;color:#6A7686}
.a4-foot .tot{font-family:var(--font-mono);font-weight:700;color:#161A20;font-size:13px}
`
