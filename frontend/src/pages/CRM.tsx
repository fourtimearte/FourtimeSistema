import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, Phone, Mail, MapPin, Repeat, Pencil, Trash2, MessageCircle, X, UserRound, Building2 } from 'lucide-react'
import { useApp } from '../store/useApp'
import { pedTotais, money, VENDEDORES, SEGMENTOS, type Cliente } from '../store/model'
import { PageHead, Btn, Panel, Drawer, Badge, Kpi, kpiGrid, thStyle, tdStyle, drawerH4 } from '../components/ui'
import { maskDoc, maskFone, maskCep, validaDoc, validaEmail, linkWhats } from '../lib/br'

/* =====================================================================
   CRM / Clientes — fonte da verdade sobre quem compra (PESQUISA §4).
   Cadastro completo (novo/editar), ficha com histórico e "pedir de novo".
   O Editor consome esta lista no autocomplete do campo Cliente.
   ===================================================================== */

export default function CRM() {
  const { pedidos, clientes, criarPedidoDe, deleteCliente, toast } = useApp()
  const [q, setQ] = useState('')
  const [fSeg, setFSeg] = useState('')
  const [fVend, setFVend] = useState('')
  const [selId, setSelId] = useState<number | null>(null)
  const [modal, setModal] = useState<'novo' | Cliente | null>(null)
  const [confirmaDel, setConfirmaDel] = useState(false)

  const sel = clientes.find(c => c.id === selId) ?? null
  const pedidosDe = (cid: number) => pedidos.filter(p => p.clienteId === cid)

  const list = useMemo(() => clientes.filter(c => {
    if (fSeg && c.segmento !== fSeg) return false
    if (fVend && c.vendedor !== fVend) return false
    const alvo = (c.nome + ' ' + c.doc + ' ' + c.vendedor + ' ' + c.segmento + ' ' + (c.cidade ?? '') + ' ' + (c.email ?? '') + ' ' + c.contato).toLowerCase()
    return alvo.includes(q.toLowerCase())
  }), [clientes, q, fSeg, fVend])

  const kpis = useMemo(() => {
    const comPedido = clientes.filter(c => pedidosDe(c.id).length).length
    const totPed = pedidos.filter(p => p.clienteId != null).length
    const receita = pedidos.reduce((s, p) => s + (p.clienteId != null ? pedTotais(p).valor : 0), 0)
    return { total: clientes.length, comPedido, totPed, receita }
  }, [clientes, pedidos])

  return (
    <div>
      <PageHead crumb="Atendimento · CRM" title="Clientes"
        desc='Cadastro, histórico e "pedir de novo". É a fonte que o Editor consome no autocomplete do campo Cliente. Clique numa linha para abrir a ficha.'
        actions={<Btn size="sm" variant="primary" onClick={() => setModal('novo')}><Plus size={16} />Novo cliente</Btn>} />

      <div style={kpiGrid}>
        <Kpi label="Clientes cadastrados" value={String(kpis.total)} color="var(--set-comercial)" bar={100} />
        <Kpi label="Com pedidos" value={String(kpis.comPedido)} delta={`${kpis.total ? Math.round(kpis.comPedido / kpis.total * 100) : 0}% da base`} bar={kpis.total ? kpis.comPedido / kpis.total * 100 : 0} />
        <Kpi label="Pedidos vinculados" value={String(kpis.totPed)} bar={62} />
        <Kpi label="Receita da base" value={'R$ ' + money(kpis.receita)} bar={74} />
      </div>

      <Panel>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 10px', height: 36, minWidth: 260, flex: 1, maxWidth: 380 }}>
            <Search size={15} style={{ color: 'var(--text-subtle)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, CNPJ, cidade, vendedor…" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 13, width: '100%' }} />
          </div>
          <select value={fSeg} onChange={e => setFSeg(e.target.value)} style={selSt}>
            <option value="">Segmento (todos)</option>
            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fVend} onChange={e => setFVend(e.target.value)} style={selSt}>
            <option value="">Vendedor (todos)</option>
            {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Cliente', 'Segmento', 'Contato', 'Cidade', 'Vendedor', 'Pedidos', 'Total'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {list.map(c => {
                const ps = pedidosDe(c.id); const tot = ps.reduce((s, p) => s + pedTotais(p).valor, 0)
                return (
                  <tr key={c.id} onClick={() => { setSelId(c.id); setConfirmaDel(false) }} style={{ cursor: 'pointer', opacity: c.ativo === false ? .5 : 1 }} className="row-hover">
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: 'var(--text-subtle)' }}>{c.tipo === 'PF' ? <UserRound size={14} /> : <Building2 size={14} />}</span>
                        <div><b>{c.nome}</b>{c.ativo === false && <span style={{ marginLeft: 6 }}><Badge kind="neutral">inativo</Badge></span>}
                          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.doc}</div></div>
                      </div>
                    </td>
                    <td style={tdStyle}>{c.segmento}</td>
                    <td style={tdStyle}><span className="mono" style={{ fontSize: 12 }}>{c.contato}</span>{c.email ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div> : null}</td>
                    <td style={tdStyle}>{c.cidade ?? '—'}</td>
                    <td style={tdStyle}>{c.vendedor}</td>
                    <td className="mono" style={tdStyle}>{ps.length}</td>
                    <td className="mono" style={tdStyle}>R$ {money(tot)}</td>
                  </tr>
                )
              })}
              {!list.length && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-subtle)', padding: 28 }}>Nenhum cliente encontrado. <button onClick={() => setModal('novo')} style={linkBtn}>Cadastrar novo cliente</button></td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---------------- Ficha do cliente ---------------- */}
      <Drawer open={!!sel} onClose={() => setSelId(null)} accent="var(--set-comercial)"
        title={sel?.nome} sub={sel ? `${sel.doc} · ${sel.segmento}${sel.tipo ? ' · ' + (sel.tipo === 'PF' ? 'Pessoa física' : 'Pessoa jurídica') : ''}` : ''}>
        {sel && (() => {
          const ps = pedidosDe(sel.id)
          const wa = linkWhats(sel.contato)
          return <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn size="sm" onClick={() => setModal(sel)}><Pencil size={14} />Editar</Btn>
              {wa && <Btn size="sm" onClick={() => window.open(wa, '_blank')}><MessageCircle size={14} />WhatsApp</Btn>}
              {sel.email && <Btn size="sm" onClick={() => window.open('mailto:' + sel.email)}><Mail size={14} />E-mail</Btn>}
              {!confirmaDel
                ? <Btn size="sm" onClick={() => setConfirmaDel(true)} style={{ color: 'var(--danger-fg)' }}><Trash2 size={14} />Excluir</Btn>
                : <Btn size="sm" onClick={() => { deleteCliente(sel.id); setSelId(null); setConfirmaDel(false) }} style={{ background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderColor: 'color-mix(in srgb,var(--danger) 40%,transparent)' }}><Trash2 size={14} />Confirmar exclusão?</Btn>}
            </div>

            <h4 style={drawerH4}>Contato</h4>
            <div style={fichaRow}><Phone size={14} /><span className="mono">{sel.contato || '—'}</span></div>
            {sel.email && <div style={fichaRow}><Mail size={14} /><span>{sel.email}</span></div>}
            <div style={fichaRow}><MapPin size={14} /><span>{[sel.endereco, sel.cidade, sel.cep].filter(Boolean).join(' · ') || '—'}</span></div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
              Vendedor responsável: <b style={{ color: 'var(--text)' }}>{sel.vendedor}</b>
              {sel.criadoEm && <> · cliente desde {new Date(sel.criadoEm).toLocaleDateString('pt-BR')}</>}
            </div>
            {sel.obs && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>{sel.obs}</div>}

            <h4 style={drawerH4}>Histórico de pedidos ({ps.length})</h4>
            {ps.length ? ps.map(p => { const t = pedTotais(p); return (
              <div key={p.pedido} onClick={() => { setSelId(null); criarPedidoDe(p) }} style={histRow} title="Abrir como novo orçamento">
                <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.pedido}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.entrega} · {t.pecas} pçs</span>
                <Badge kind={p.status === 'producao' ? 'info' : p.status === 'aprovado' ? 'success' : 'neutral'}>{p.status}</Badge>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 12 }}>R$ {money(t.valor)}</span>
              </div>
            ) }) : <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: 12 }}>Sem pedidos ainda.</div>}
            <div style={{ marginTop: 18 }}>
              <Btn variant="primary" size="lg" onClick={() => { const base = ps[0]; setSelId(null); if (base) criarPedidoDe(base, sel); else toast('Cliente sem pedido base — crie um novo orçamento no Editor') }}>
                <Repeat size={16} />Pedir de novo (novo orçamento)
              </Btn>
            </div>
          </>
        })()}
      </Drawer>

      {modal && <ClienteModal editar={modal === 'novo' ? null : modal} onClose={() => setModal(null)} />}
      <style>{`.row-hover:hover{background:var(--bg-hover)}`}</style>
    </div>
  )
}

/* =====================================================================
   Modal de cadastro/edição de cliente — registro completo com máscara e
   validação de CPF/CNPJ, WhatsApp, e-mail e CEP.
   ===================================================================== */
function ClienteModal({ editar, onClose }: { editar: Cliente | null; onClose: () => void }) {
  const { addCliente, updateCliente, toast } = useApp()
  const [f, setF] = useState<Omit<Cliente, 'id' | 'criadoEm'>>(() => editar ? { ...editar } : ({
    nome: '', tipo: 'PJ', doc: '', contato: '', email: '', endereco: '', cidade: '', cep: '', vendedor: VENDEDORES[0], segmento: SEGMENTOS[0], obs: '', ativo: true,
  }))
  const [tentou, setTentou] = useState(false)
  const set = (k: keyof Cliente, v: any) => setF(prev => ({ ...prev, [k]: v }))

  const tipo = (f.tipo ?? 'PJ') as 'PF' | 'PJ'
  const docOk = validaDoc(f.doc, tipo)
  const mailOk = validaEmail(f.email ?? '')
  const nomeOk = !!f.nome.trim()

  function salvar() {
    setTentou(true)
    if (!nomeOk) { toast('Informe o nome do cliente'); return }
    if (!docOk) { toast(tipo === 'PF' ? 'CPF inválido — confira os dígitos' : 'CNPJ inválido — confira os dígitos'); return }
    if (!mailOk) { toast('E-mail inválido'); return }
    const dados = { ...f, nome: f.nome.trim(), doc: f.doc.trim() || '—' }
    if (editar) updateCliente(editar.id, dados)
    else addCliente(dados)
    onClose()
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,17,22,.5)' }} />
      <div style={{ position: 'relative', width: 620, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '4px solid var(--set-comercial)', borderRadius: 12, boxShadow: 'var(--sh-4)', padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18 }}>{editar ? 'Editar cliente' : 'Novo cliente'}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{editar ? 'Alterações valem para novos orçamentos deste cliente.' : 'O cliente entra na base e já aparece no autocomplete do Editor.'}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
        </div>

        {/* tipo de pessoa */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['PJ', 'PF'] as const).map(t => (
            <button key={t} onClick={() => set('tipo', t)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, font: 'inherit',
              border: '1px solid ' + (tipo === t ? 'color-mix(in srgb,var(--set-comercial) 45%,transparent)' : 'var(--border-strong)'),
              background: tipo === t ? 'color-mix(in srgb,var(--set-comercial) 12%,transparent)' : 'var(--bg-surface-2)',
              color: tipo === t ? 'var(--set-comercial)' : 'var(--text-muted)',
            }}>
              {t === 'PJ' ? <Building2 size={15} /> : <UserRound size={15} />}{t === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
          <Campo label={tipo === 'PJ' ? 'Razão social / nome fantasia *' : 'Nome completo *'} span2 erro={tentou && !nomeOk ? 'obrigatório' : ''}>
            <input style={inpSt(tentou && !nomeOk)} value={f.nome} onChange={e => set('nome', e.target.value)} placeholder={tipo === 'PJ' ? 'Ex.: Academia Pulse' : 'Ex.: João da Silva'} autoFocus />
          </Campo>
          <Campo label={tipo === 'PJ' ? 'CNPJ' : 'CPF'} erro={!docOk ? 'dígitos não conferem' : ''}>
            <input className="mono" style={inpSt(!docOk)} value={f.doc === '—' ? '' : f.doc} onChange={e => set('doc', maskDoc(e.target.value, tipo))} placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} inputMode="numeric" />
          </Campo>
          <Campo label="WhatsApp / telefone">
            <input className="mono" style={inpSt(false)} value={f.contato} onChange={e => set('contato', maskFone(e.target.value))} placeholder="(62) 90000-0000" inputMode="tel" />
          </Campo>
          <Campo label="E-mail" span2 erro={!mailOk ? 'formato inválido' : ''}>
            <input style={inpSt(!mailOk)} value={f.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com.br" inputMode="email" />
          </Campo>
          <Campo label="Endereço" span2>
            <input style={inpSt(false)} value={f.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, nº, bairro" />
          </Campo>
          <Campo label="Cidade / UF">
            <input style={inpSt(false)} value={f.cidade ?? ''} onChange={e => set('cidade', e.target.value)} placeholder="Goiânia-GO" />
          </Campo>
          <Campo label="CEP">
            <input className="mono" style={inpSt(false)} value={f.cep ?? ''} onChange={e => set('cep', maskCep(e.target.value))} placeholder="74000-000" inputMode="numeric" />
          </Campo>
          <Campo label="Segmento">
            <select style={inpSt(false)} value={f.segmento} onChange={e => set('segmento', e.target.value)}>
              {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Campo>
          <Campo label="Vendedor responsável">
            <select style={inpSt(false)} value={f.vendedor} onChange={e => set('vendedor', e.target.value)}>
              {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Observações" span2>
            <textarea style={{ ...inpSt(false), height: 64, resize: 'vertical', paddingTop: 8 }} value={f.obs ?? ''} onChange={e => set('obs', e.target.value)} placeholder="Preferências, condições combinadas, referência de indicação…" />
          </Campo>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          {editar && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={f.ativo !== false} onChange={e => set('ativo', e.target.checked)} />Cliente ativo
            </label>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn onClick={onClose}>Cancelar</Btn>
            <Btn variant="primary" onClick={salvar}><Plus size={15} />{editar ? 'Salvar alterações' : 'Cadastrar cliente'}</Btn>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Campo({ label, children, span2, erro }: { label: string; children: React.ReactNode; span2?: boolean; erro?: string }) {
  return (
    <label style={{ display: 'block', gridColumn: span2 ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 4, display: 'flex', gap: 8 }}>
        {label}{erro && <span style={{ color: 'var(--danger-fg)', textTransform: 'none', letterSpacing: 0 }}>{erro}</span>}
      </div>
      {children}
    </label>
  )
}
const inpSt = (erro: boolean): React.CSSProperties => ({
  width: '100%', height: 36, padding: '0 10px', borderRadius: 8, font: 'inherit', fontSize: 13,
  background: 'var(--bg-surface-2)', color: 'var(--text)', outline: 'none',
  border: '1px solid ' + (erro ? 'color-mix(in srgb,var(--danger) 55%,transparent)' : 'var(--border-strong)'),
})
const selSt: React.CSSProperties = { height: 36, padding: '0 10px', borderRadius: 8, font: 'inherit', fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border-strong)', cursor: 'pointer' }
const fichaRow: React.CSSProperties = { fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, color: 'var(--text)' }
const histRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', marginBottom: 6 }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--set-comercial)', cursor: 'pointer', font: 'inherit', fontSize: 13, textDecoration: 'underline', padding: 0 }
