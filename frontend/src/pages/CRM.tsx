import { useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Search, Phone, Mail, MapPin, Repeat, Pencil, Trash2, MessageCircle, X,
  UserRound, Building2, Truck, Copy, Check, Calendar, Users, Package,
} from 'lucide-react'
import { useApp } from '../store/useApp'
import { pedTotais, money, cidadeUf, VENDEDORES, SEGMENTOS, type Cliente } from '../store/model'
import { PageHead, Btn, Panel, Drawer, Badge, kpiGrid, thStyle, tdStyle, drawerH4 } from '../components/ui'
import { maskDoc, maskFone, maskCep, validaDoc, validaEmail, linkWhats, consultaCnpj } from '../lib/br'
import {
  transportadorasPara, FONTE_LABEL, calcularFrete, pacotePorPecas, consultaCep,
  type FreteOpcao,
} from '../lib/frete'

/* =====================================================================
   CRM / Clientes v4 — porte da página "Clientes cadastrados v4" para o
   sistema React, ligado ao store (clientes/pedidos). KPIs, busca, filtros
   (tipo/UF/cidade/período), ordenação, paginação, avatares, ficha com
   histórico, "pedir de novo" e ENVIO/FRETE por CEP (transportadoras +
   estimativa de valores). Cadastro com auto-preenchimento por CEP e CNPJ.
   ===================================================================== */

const AV = ['--set-comercial', '--set-arte', '--set-dtf', '--set-sublimacao', '--set-silk', '--set-corte', '--set-bordado', '--set-costura', '--set-embalagem', '--set-estoque', '--set-financeiro']
const avColor = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return `var(${AV[h % AV.length]})` }
const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const tsCriado = (c: Cliente) => (c.criadoEm ? new Date(c.criadoEm).getTime() : 0)
const temContato = (c: Cliente) => !!(c.contato || c.email)
const incompleto = (c: Cliente) => !(c.doc && c.doc !== '—') && !temContato(c)
const HOJE = new Date('2026-08-04')
const novo30 = (c: Cliente) => c.criadoEm ? (HOJE.getTime() - tsCriado(c)) / 864e5 <= 30 : false

export default function CRM() {
  const { pedidos, clientes, criarPedidoDe, deleteCliente, toast } = useApp()
  const [q, setQ] = useState('')
  const [fTipo, setFTipo] = useState('')   // '', 'PF', 'PJ'
  const [fUf, setFUf] = useState('')
  const [fCad, setFCad] = useState('')     // '', 'contato', 'novo30', 'incompleto'
  const [sort, setSort] = useState<{ k: 'nome' | 'cidade' | 'data'; dir: 1 | -1 }>({ k: 'data', dir: -1 })
  const [page, setPage] = useState(1)
  const per = 25
  const [selId, setSelId] = useState<number | null>(null)
  const [modal, setModal] = useState<'novo' | Cliente | null>(null)
  const [transpDe, setTranspDe] = useState<Cliente | null>(null)

  const sel = clientes.find(c => c.id === selId) ?? null
  const pedidosDe = (cid: number) => pedidos.filter(p => p.clienteId === cid)

  const ufs = useMemo(() => [...new Set(clientes.map(c => cidadeUf(c).uf).filter(Boolean))].sort(), [clientes])

  const list = useMemo(() => {
    let l = clientes.filter(c => {
      if (fTipo && (c.tipo ?? 'PJ') !== fTipo) return false
      if (fUf && cidadeUf(c).uf !== fUf) return false
      if (fCad === 'contato' && !temContato(c)) return false
      if (fCad === 'novo30' && !novo30(c)) return false
      if (fCad === 'incompleto' && !incompleto(c)) return false
      if (q) {
        const alvo = norm(c.nome + ' ' + c.doc + ' ' + (c.fantasia ?? '') + ' ' + c.vendedor + ' ' + c.segmento + ' ' + (c.cidade ?? '') + ' ' + (c.email ?? '') + ' ' + c.contato)
        if (!alvo.includes(norm(q))) return false
      }
      return true
    })
    const dir = sort.dir
    l = [...l].sort((a, b) => {
      if (sort.k === 'nome') return dir * a.nome.localeCompare(b.nome)
      if (sort.k === 'cidade') return dir * (cidadeUf(a).cidade || '~').localeCompare(cidadeUf(b).cidade || '~')
      return dir * (tsCriado(a) - tsCriado(b))
    })
    return l
  }, [clientes, q, fTipo, fUf, fCad, sort])

  const pages = Math.max(1, Math.ceil(list.length / per))
  const pageSafe = Math.min(page, pages)
  const slice = list.slice((pageSafe - 1) * per, pageSafe * per)

  const kpis = useMemo(() => {
    const tot = clientes.length
    const pf = clientes.filter(c => (c.tipo ?? 'PJ') === 'PF').length
    return {
      tot, pf, pj: tot - pf,
      contato: clientes.filter(temContato).length,
      novos: clientes.filter(novo30).length,
      inc: clientes.filter(incompleto).length,
    }
  }, [clientes])

  const chips: { t: string; x: () => void }[] = []
  if (fTipo) chips.push({ t: fTipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica', x: () => setFTipo('') })
  if (fUf) chips.push({ t: 'UF: ' + fUf, x: () => setFUf('') })
  if (fCad) chips.push({ t: ({ contato: 'Com contato', novo30: 'Novos 30 dias', incompleto: 'Cadastro incompleto' } as Record<string, string>)[fCad], x: () => setFCad('') })
  if (q) chips.push({ t: '“' + q + '”', x: () => setQ('') })
  const limpar = () => { setQ(''); setFTipo(''); setFUf(''); setFCad(''); setPage(1) }

  return (
    <div>
      <PageHead crumb="Atendimento · CRM" title="Clientes"
        desc="Base de clientes: cadastro, histórico, e envio (frete por CEP). Clique numa linha para abrir a ficha; clique na cidade para ver as transportadoras."
        actions={<Btn size="sm" variant="primary" onClick={() => setModal('novo')}><Plus size={16} />Novo cliente</Btn>} />

      <div style={kpiGrid}>
        <KpiClik on={!fTipo && !fCad} label="Total de clientes" value={kpis.tot} icon={<Users size={15} />} delta="base cadastrada" bar={100} onClick={limpar} />
        <KpiClik on={fTipo === 'PF'} label="Pessoa Física" value={kpis.pf} icon={<UserRound size={15} />} delta={pct(kpis.pf, kpis.tot)} bar={kpis.tot ? kpis.pf / kpis.tot * 100 : 0} onClick={() => { setFTipo(fTipo === 'PF' ? '' : 'PF'); setPage(1) }} />
        <KpiClik on={fTipo === 'PJ'} label="Pessoa Jurídica" value={kpis.pj} icon={<Building2 size={15} />} delta={pct(kpis.pj, kpis.tot)} bar={kpis.tot ? kpis.pj / kpis.tot * 100 : 0} onClick={() => { setFTipo(fTipo === 'PJ' ? '' : 'PJ'); setPage(1) }} />
        <KpiClik on={fCad === 'contato'} label="Com contato" value={kpis.contato} icon={<Phone size={15} />} delta="fone ou e-mail" bar={kpis.tot ? kpis.contato / kpis.tot * 100 : 0} onClick={() => { setFCad(fCad === 'contato' ? '' : 'contato'); setPage(1) }} />
        <KpiClik on={fCad === 'novo30'} label="Novos · 30 dias" value={kpis.novos} icon={<Calendar size={15} />} delta="cadastros recentes" bar={kpis.tot ? Math.min(100, kpis.novos / kpis.tot * 400) : 0} onClick={() => { setFCad(fCad === 'novo30' ? '' : 'novo30'); setPage(1) }} />
        <KpiClik on={fCad === 'incompleto'} label="Cad. incompleto" value={kpis.inc} icon={<Package size={15} />} delta="sem doc e contato" bar={kpis.tot ? kpis.inc / kpis.tot * 100 : 0} cor="var(--warning)" onClick={() => { setFCad(fCad === 'incompleto' ? '' : 'incompleto'); setPage(1) }} />
      </div>

      <Panel>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 10px', height: 36, minWidth: 240, flex: 1, maxWidth: 360 }}>
            <Search size={15} style={{ color: 'var(--text-subtle)' }} />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Buscar por nome, CNPJ, cidade, e-mail…" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 13, width: '100%' }} />
          </div>
          <select value={fUf} onChange={e => { setFUf(e.target.value); setPage(1) }} style={selSt}>
            <option value="">UF (todas)</option>
            {ufs.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={sort.k + sort.dir} onChange={e => { const v = e.target.value; setSort({ k: v.slice(0, -2) as any, dir: +v.slice(-2) as 1 | -1 }) }} style={selSt}>
            <option value="data-1">Mais recentes</option>
            <option value="data1">Mais antigos</option>
            <option value="nome1">Nome A–Z</option>
            <option value="nome-1">Nome Z–A</option>
            <option value="cidade1">Cidade A–Z</option>
          </select>
        </div>

        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <b style={{ color: 'var(--text)' }}>{list.length}</b> de {clientes.length}
            {chips.map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 999, padding: '2px 6px 2px 10px', fontSize: 12 }}>
                {c.t}<button onClick={() => { c.x(); setPage(1) }} style={{ display: 'grid', placeItems: 'center', width: 16, height: 16, borderRadius: 99, border: 'none', background: 'var(--bg-muted)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={11} /></button>
              </span>
            ))}
            <button onClick={limpar} style={{ background: 'none', border: 'none', color: 'var(--set-comercial)', cursor: 'pointer', font: 'inherit', fontSize: 12, textDecoration: 'underline' }}>limpar tudo</button>
          </div>
        )}

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Cliente', 'CPF / CNPJ', 'Contato', 'Cidade · frete', 'Tipo', 'Desde'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {slice.map(c => {
                const { cidade, uf } = cidadeUf(c)
                const nT = (c.cep || uf) ? transportadorasPara(c.cep ?? '', uf).length : 0
                return (
                  <tr key={c.id} onClick={() => setSelId(c.id)} style={{ cursor: 'pointer', opacity: c.ativo === false ? .5 : 1 }} className="row-hover">
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 30, height: 30, flex: '0 0 auto', borderRadius: 8, background: avColor(c.nome), color: '#fff', display: 'grid', placeItems: 'center' }}>{(c.tipo ?? 'PJ') === 'PJ' ? <Building2 size={15} /> : <UserRound size={15} />}</span>
                        <div style={{ minWidth: 0 }}>
                          <b style={{ display: 'block' }}>{c.nome}{c.ativo === false && <span style={{ marginLeft: 6 }}><Badge kind="neutral">inativo</Badge></span>}{incompleto(c) && <span style={{ marginLeft: 6 }}><Badge kind="warning">INC</Badge></span>}</b>
                          {c.fantasia && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.fantasia}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>{c.doc && c.doc !== '—' ? <CopyBtn v={c.doc} lb={c.tipo === 'PF' ? 'CPF' : 'CNPJ'} mono /> : <span style={{ color: 'var(--text-subtle)' }}>—</span>}</td>
                    <td style={tdStyle}>
                      {c.contato ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} style={{ color: 'var(--text-subtle)' }} /><CopyBtn v={c.contato} lb="Telefone" mono /></div> : null}
                      {c.email ? <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190 }}>{c.email}</div> : null}
                      {!c.contato && !c.email ? <span style={{ color: 'var(--text-subtle)' }}>—</span> : null}
                    </td>
                    <td style={tdStyle}>
                      {cidade ? (
                        <button onClick={e => { e.stopPropagation(); setTranspDe(c) }} title="Ver transportadoras" style={cityBtn}>
                          <MapPin size={12} />{cidade}{uf ? <span style={{ color: 'var(--text-muted)' }}> · {uf}</span> : null}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 4, color: 'var(--set-expedicao)', fontWeight: 600 }}><Truck size={12} />{nT}</span>
                        </button>
                      ) : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={tdStyle}>{(c.tipo ?? 'PJ') === 'PJ' ? <Badge kind="info">PJ</Badge> : <Badge kind="neutral">PF</Badge>}</td>
                    <td className="mono" style={{ ...tdStyle, fontSize: 12, color: 'var(--text-muted)' }}>{c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                )
              })}
              {!slice.length && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-subtle)', padding: 28 }}>Nenhum cliente encontrado. <button onClick={() => setModal('novo')} style={linkBtn}>Cadastrar novo cliente</button></td></tr>}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Mostrando <b>{(pageSafe - 1) * per + 1}–{Math.min(list.length, pageSafe * per)}</b> de <b>{list.length}</b></span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1} style={pgBtn(pageSafe <= 1)}>‹</button>
              {Array.from({ length: pages }, (_, i) => i + 1).filter(p => p <= 2 || p > pages - 2 || Math.abs(p - pageSafe) <= 1).map((p, idx, arr) => (
                <span key={p} style={{ display: 'inline-flex' }}>{idx > 0 && p - arr[idx - 1] > 1 ? <span style={{ padding: '0 4px' }}>…</span> : null}<button onClick={() => setPage(p)} style={{ ...pgBtn(false), ...(p === pageSafe ? { background: 'var(--set-comercial)', color: '#fff', borderColor: 'transparent' } : {}) }}>{p}</button></span>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={pageSafe >= pages} style={pgBtn(pageSafe >= pages)}>›</button>
            </span>
          </div>
        )}
      </Panel>

      {/* ---------------- Ficha do cliente ---------------- */}
      <Drawer open={!!sel} onClose={() => setSelId(null)} accent="var(--set-comercial)"
        title={sel ? <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 32, height: 32, borderRadius: 8, background: avColor(sel.nome), color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>{(sel.tipo ?? 'PJ') === 'PJ' ? <Building2 size={16} /> : <UserRound size={16} />}</span>{sel.nome}</span> : ''}
        sub={sel ? `${(sel.tipo ?? 'PJ') === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'} · ${sel.segmento}` : ''}>
        {sel && <Ficha c={sel} pedidos={pedidosDe(sel.id)} onEdit={() => setModal(sel)} onDel={() => { deleteCliente(sel.id); setSelId(null) }}
          onRepetir={base => { setSelId(null); criarPedidoDe(base, sel) }}
          onNovo={() => { const base = pedidosDe(sel.id)[0]; setSelId(null); if (base) criarPedidoDe(base, sel); else toast('Cliente sem pedido base — crie um novo orçamento no Editor') }} />}
      </Drawer>

      {transpDe && <TranspModal c={transpDe} onClose={() => setTranspDe(null)} />}
      {modal && <ClienteModal editar={modal === 'novo' ? null : modal} onClose={() => setModal(null)} />}
      <style>{`.row-hover:hover{background:var(--bg-hover)}`}</style>
    </div>
  )
}

/* ---------------- KPI clicável ---------------- */
function KpiClik({ label, value, icon, delta, bar, cor, on, onClick }: { label: string; value: number; icon: React.ReactNode; delta: string; bar: number; cor?: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid ' + (on ? 'color-mix(in srgb,var(--set-comercial) 50%,transparent)' : 'var(--border)'), background: on ? 'color-mix(in srgb,var(--set-comercial) 7%,var(--bg-surface))' : 'var(--bg-surface)', borderRadius: 12, padding: '14px 16px', font: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', fontWeight: 600 }}>{icon}{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, margin: '6px 0 2px', color: cor }}>{value.toLocaleString('pt-BR')}</div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{delta}</div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'var(--bg-muted)', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: bar + '%', background: cor ?? 'var(--set-comercial)' }} /></div>
    </button>
  )
}

/* ---------------- botão copiar ---------------- */
function CopyBtn({ v, lb, mono }: { v: string; lb: string; mono?: boolean }) {
  const [ok, setOk] = useState(false)
  return (
    <button className={mono ? 'mono' : ''} onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(v).then(() => { setOk(true); setTimeout(() => setOk(false), 1200) }) }}
      title={'Copiar ' + lb} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text)', font: 'inherit', fontSize: mono ? 12 : 13 }}>
      {v}{ok ? <Check size={12} style={{ color: 'var(--success-fg)' }} /> : <Copy size={11} style={{ color: 'var(--text-subtle)' }} />}
    </button>
  )
}

/* ---------------- ficha (conteúdo do drawer) ---------------- */
function Ficha({ c, pedidos, onEdit, onDel, onRepetir, onNovo }: { c: Cliente; pedidos: any[]; onEdit: () => void; onDel: () => void; onRepetir: (p: any) => void; onNovo: () => void }) {
  const [confirmaDel, setConfirmaDel] = useState(false)
  const wa = linkWhats(c.contato)
  const { cidade, uf } = cidadeUf(c)
  const endParts = [c.endereco, c.complemento, c.bairro, cidade + (uf ? ' - ' + uf : ''), c.cep ? 'CEP ' + c.cep : ''].filter(Boolean)
  return <>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Btn size="sm" onClick={onEdit}><Pencil size={14} />Editar</Btn>
      {wa && <Btn size="sm" onClick={() => window.open(wa, '_blank')}><MessageCircle size={14} />WhatsApp</Btn>}
      {c.email && <Btn size="sm" onClick={() => window.open('mailto:' + c.email)}><Mail size={14} />E-mail</Btn>}
      {!confirmaDel
        ? <Btn size="sm" onClick={() => setConfirmaDel(true)} style={{ color: 'var(--danger-fg)' }}><Trash2 size={14} />Excluir</Btn>
        : <Btn size="sm" onClick={onDel} style={{ background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderColor: 'color-mix(in srgb,var(--danger) 40%,transparent)' }}><Trash2 size={14} />Confirmar?</Btn>}
    </div>

    <h4 style={drawerH4}>Identificação</h4>
    <FRow lb={c.tipo === 'PF' ? 'CPF' : 'CNPJ'} vl={c.doc && c.doc !== '—' ? <CopyBtn v={c.doc} lb="doc" mono /> : '—'} />
    {c.ie && <FRow lb={c.tipo === 'PF' ? 'RG' : 'Inscrição Estadual'} vl={<span className="mono">{c.ie}</span>} />}
    {c.fantasia && <FRow lb="Nome fantasia" vl={c.fantasia} />}
    <FRow lb="Vendedor" vl={<b>{c.vendedor}</b>} />
    <FRow lb="Segmento" vl={c.segmento} />
    {c.criadoEm && <FRow lb="Cliente desde" vl={<span className="mono">{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</span>} />}

    <h4 style={drawerH4}>Contato</h4>
    <FRow lb="Telefone / WhatsApp" vl={c.contato ? <CopyBtn v={c.contato} lb="tel" mono /> : '—'} />
    {c.email && <FRow lb="E-mail" vl={<CopyBtn v={c.email} lb="email" />} />}

    <h4 style={drawerH4}>Endereço</h4>
    <div style={{ fontSize: 13, display: 'flex', gap: 8 }}><MapPin size={14} style={{ marginTop: 2, color: 'var(--text-subtle)', flex: '0 0 auto' }} /><span>{endParts.length ? endParts.join(' · ') : <span style={{ color: 'var(--text-subtle)' }}>Sem endereço cadastrado</span>}</span></div>

    {/* ENVIO / FRETE */}
    <FreteFicha c={c} pecas={pedidos.length ? Math.max(...pedidos.map(p => pedTotais(p).pecas)) : 0} />

    <h4 style={drawerH4}>Histórico de pedidos ({pedidos.length})</h4>
    {pedidos.length ? pedidos.map(p => { const t = pedTotais(p); return (
      <div key={p.pedido} onClick={() => onRepetir(p)} style={histRow} title="Abrir como novo orçamento">
        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.pedido}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.entrega} · {t.pecas} pçs</span>
        <Badge kind={p.status === 'producao' ? 'info' : p.status === 'aprovado' ? 'success' : 'neutral'}>{p.status}</Badge>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 12 }}>R$ {money(t.valor)}</span>
      </div>
    ) }) : <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: 12 }}>Sem pedidos ainda.</div>}
    {c.obs && <><h4 style={drawerH4}>Observações</h4><div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>{c.obs}</div></>}

    <div style={{ marginTop: 18 }}>
      <Btn variant="primary" size="lg" onClick={onNovo}><Repeat size={16} />Pedir de novo (novo orçamento)</Btn>
    </div>
  </>
}

/* ---------------- painel de frete na ficha ---------------- */
function FreteFicha({ c, pecas }: { c: Cliente; pecas: number }) {
  const { uf } = cidadeUf(c)
  const [pesoKg, setPesoKg] = useState(() => pacotePorPecas(pecas || 4).pesoKg)
  const [opcoes, setOpcoes] = useState<FreteOpcao[] | null>(null)
  const [cidadeCep, setCidadeCep] = useState<string>('')
  const transp = (c.cep || uf) ? transportadorasPara(c.cep ?? '', uf) : []

  async function calcular() {
    const pac = pacotePorPecas(pecas || 4); pac.pesoKg = pesoKg
    setOpcoes(calcularFrete(c.cep ?? '', pac))
    const via = await consultaCep(c.cep ?? '')
    if (via) setCidadeCep(`${via.localidade} - ${via.uf}`)
  }

  return <>
    <h4 style={drawerH4}><Truck size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Envio · frete</h4>
    {/* transportadoras que cobrem (por CEP/UF) */}
    {transp.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
      {transp.map(({ t, hit }) => (
        <div key={t.nome} style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px' }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, flex: '0 0 auto', background: `var(${t.cor})`, color: '#fff', display: 'grid', placeItems: 'center' }}><Truck size={14} /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{t.nome}<span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: hit === 'cep' ? 'var(--success-fg)' : 'var(--text-muted)', background: hit === 'cep' ? 'var(--success-bg)' : 'var(--bg-muted)', borderRadius: 999, padding: '1px 7px' }}>{FONTE_LABEL[hit]}</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.obs}</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.prazo}</span>
        </div>
      ))}
    </div> : <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 10 }}>Sem CEP/UF no cadastro — nenhuma cobertura calculada.</div>}

    {/* estimativa de valores */}
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', background: 'var(--bg-surface-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: opcoes ? 10 : 0 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Estimar valor para <b className="mono" style={{ color: 'var(--text)' }}>{c.cep || 'sem CEP'}</b></span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, marginLeft: 'auto' }}>Peso
          <input type="number" min={0.3} step={0.1} value={pesoKg} onChange={e => setPesoKg(+e.target.value || 0.3)} style={{ width: 62, height: 30, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 12, padding: '0 8px' }} />kg
        </label>
        <Btn size="sm" variant="primary" onClick={calcular} disabled={!c.cep}><Truck size={14} />Calcular frete</Btn>
      </div>
      {opcoes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {cidadeCep && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Destino: {cidadeCep}</div>}
          {opcoes.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: `var(${o.cor})`, flex: '0 0 auto' }} />
              <b>{o.transportadora}</b><span style={{ color: 'var(--text-muted)' }}>{o.servico}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{o.prazoDias} dias úteis</span>
              <b className="mono" style={{ minWidth: 74, textAlign: 'right' }}>R$ {money(o.preco)}</b>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>Estimativa local — trocar pela cotação real do Melhor Envio quando o backend estiver pronto.</div>
        </div>
      )}
    </div>
  </>
}

/* ---------------- modal de transportadoras (a partir da cidade) ---------------- */
function TranspModal({ c, onClose }: { c: Cliente; onClose: () => void }) {
  const { cidade, uf } = cidadeUf(c)
  const list = transportadorasPara(c.cep ?? '', uf)
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,17,22,.5)' }} />
      <div style={{ position: 'relative', width: 520, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '4px solid var(--set-expedicao)', borderRadius: 12, boxShadow: 'var(--sh-4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--set-expedicao)', color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Truck size={17} /></span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16 }}>Transportadoras · {cidade}{uf ? ' - ' + uf : ''}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.nome} · {c.cep ? 'CEP ' + c.cep : 'sem CEP — estimado pela UF'}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.length ? list.map(({ t, hit }) => (
            <div key={t.nome} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: `var(${t.cor})`, color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Truck size={16} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{t.nome}<span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: hit === 'cep' ? 'var(--success-fg)' : 'var(--text-muted)', background: hit === 'cep' ? 'var(--success-bg)' : 'var(--bg-muted)', borderRadius: 999, padding: '1px 7px' }}>{FONTE_LABEL[hit]}</span></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.obs}</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.prazo}</span>
            </div>
          )) : <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: 8 }}>Nenhuma transportadora cobre esta região na tabela atual.</div>}
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>Cobertura por faixa de CEP (editável em <span className="mono">lib/frete.ts → TRANSPORTADORAS</span>). Troque os nomes de exemplo pelos parceiros reais.</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* =====================================================================
   Modal de cadastro/edição — com auto-preenchimento por CEP (ViaCEP) e
   por CNPJ (BrasilAPI), máscaras e validação. Nome do cliente é único.
   ===================================================================== */
function ClienteModal({ editar, onClose }: { editar: Cliente | null; onClose: () => void }) {
  const { clientes, addCliente, updateCliente, toast } = useApp()
  const [f, setF] = useState<Omit<Cliente, 'id' | 'criadoEm'>>(() => editar ? { ...editar } : ({
    nome: '', tipo: 'PJ', doc: '', fantasia: '', ie: '', contato: '', email: '', endereco: '', bairro: '', complemento: '', cidade: '', uf: '', cep: '', vendedor: VENDEDORES[0], segmento: SEGMENTOS[0], obs: '', ativo: true,
  }))
  const [tentou, setTentou] = useState(false)
  const [busca, setBusca] = useState('')  // status de auto-preenchimento
  const set = (k: keyof Cliente, v: any) => setF(prev => ({ ...prev, [k]: v }))
  const idRef = useRef(0) // p/ guardar a última busca async (evita corrida)

  const tipo = (f.tipo ?? 'PJ') as 'PF' | 'PJ'
  const docOk = validaDoc(f.doc, tipo)
  const mailOk = validaEmail(f.email ?? '')
  const nomeOk = !!f.nome.trim()

  async function onBlurCep() {
    const via = await consultaCep(f.cep ?? '')
    if (via) setF(prev => ({ ...prev, endereco: prev.endereco || via.logradouro || '', bairro: prev.bairro || via.bairro || '', cidade: via.localidade, uf: via.uf }))
  }
  async function onBlurCnpj() {
    if (tipo !== 'PJ') return
    const my = ++idRef.current
    setBusca('Buscando CNPJ…')
    const d = await consultaCnpj(f.doc)
    if (my !== idRef.current) return // outra busca começou
    setBusca('')
    if (!d) { toast('CNPJ não encontrado na base pública'); return }
    setF(prev => ({
      ...prev,
      nome: prev.nome.trim() || d.razao, fantasia: prev.fantasia || d.fantasia,
      cep: prev.cep || (d.cep ? maskCep(d.cep) : ''), endereco: prev.endereco || [d.logradouro, d.numero].filter(Boolean).join(', '),
      bairro: prev.bairro || d.bairro, cidade: d.cidade || prev.cidade, uf: d.uf || prev.uf,
      email: prev.email || d.email, contato: prev.contato || (d.telefone ? maskFone(d.telefone) : ''),
    }))
    toast('Dados do CNPJ preenchidos')
  }

  function salvar() {
    setTentou(true)
    if (!nomeOk) { toast('Informe o nome do cliente'); return }
    if (!docOk) { toast(tipo === 'PF' ? 'CPF inválido' : 'CNPJ inválido'); return }
    if (!mailOk) { toast('E-mail inválido'); return }
    const nomeTrim = f.nome.trim()
    // nome é a identidade — não pode duplicar (regra DECISAO-IDENTIDADE-CLIENTE)
    const dono = clientes.find(c => c.nome.toLowerCase() === nomeTrim.toLowerCase())
    if (dono && (!editar || dono.id !== editar.id)) { toast('Já existe um cliente com esse nome'); return }
    const dados = { ...f, nome: nomeTrim, doc: f.doc.trim() || '—' }
    if (editar) updateCliente(editar.id, dados); else addCliente(dados)
    onClose()
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,17,22,.5)' }} />
      <div style={{ position: 'relative', width: 640, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '4px solid var(--set-comercial)', borderRadius: 12, boxShadow: 'var(--sh-4)', padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18 }}>{editar ? 'Editar cliente' : 'Novo cliente'}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{editar ? 'Alterações valem para novos orçamentos.' : 'CNPJ e CEP preenchem o cadastro automaticamente.'}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['PJ', 'PF'] as const).map(t => (
            <button key={t} onClick={() => set('tipo', t)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, font: 'inherit', border: '1px solid ' + (tipo === t ? 'color-mix(in srgb,var(--set-comercial) 45%,transparent)' : 'var(--border-strong)'), background: tipo === t ? 'color-mix(in srgb,var(--set-comercial) 12%,transparent)' : 'var(--bg-surface-2)', color: tipo === t ? 'var(--set-comercial)' : 'var(--text-muted)' }}>
              {t === 'PJ' ? <Building2 size={15} /> : <UserRound size={15} />}{t === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
          <Campo label={tipo === 'PJ' ? 'CNPJ (busca automática)' : 'CPF'} erro={!docOk ? 'inválido' : busca}>
            <input className="mono" style={inpSt(!docOk)} value={f.doc === '—' ? '' : f.doc} onChange={e => set('doc', maskDoc(e.target.value, tipo))} onBlur={onBlurCnpj} placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} inputMode="numeric" />
          </Campo>
          <Campo label={tipo === 'PJ' ? 'Inscrição Estadual' : 'RG'}>
            <input className="mono" style={inpSt(false)} value={f.ie ?? ''} onChange={e => set('ie', e.target.value)} placeholder="opcional" />
          </Campo>
          <Campo label={tipo === 'PJ' ? 'Razão social *' : 'Nome completo *'} span2 erro={tentou && !nomeOk ? 'obrigatório' : ''}>
            <input style={inpSt(tentou && !nomeOk)} value={f.nome} onChange={e => set('nome', e.target.value)} placeholder={tipo === 'PJ' ? 'Ex.: Academia Pulse LTDA' : 'Ex.: João da Silva'} autoFocus />
          </Campo>
          {tipo === 'PJ' && <Campo label="Nome fantasia" span2><input style={inpSt(false)} value={f.fantasia ?? ''} onChange={e => set('fantasia', e.target.value)} placeholder="Ex.: Pulse Fit" /></Campo>}
          <Campo label="WhatsApp / telefone"><input className="mono" style={inpSt(false)} value={f.contato} onChange={e => set('contato', maskFone(e.target.value))} placeholder="(62) 90000-0000" inputMode="tel" /></Campo>
          <Campo label="E-mail" erro={!mailOk ? 'inválido' : ''}><input style={inpSt(!mailOk)} value={f.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com.br" inputMode="email" /></Campo>
          <Campo label="CEP (busca endereço)"><input className="mono" style={inpSt(false)} value={f.cep ?? ''} onChange={e => set('cep', maskCep(e.target.value))} onBlur={onBlurCep} placeholder="74000-000" inputMode="numeric" /></Campo>
          <Campo label="Endereço"><input style={inpSt(false)} value={f.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, nº" /></Campo>
          <Campo label="Bairro"><input style={inpSt(false)} value={f.bairro ?? ''} onChange={e => set('bairro', e.target.value)} /></Campo>
          <Campo label="Complemento"><input style={inpSt(false)} value={f.complemento ?? ''} onChange={e => set('complemento', e.target.value)} placeholder="Sala, bloco…" /></Campo>
          <Campo label="Cidade"><input style={inpSt(false)} value={f.cidade ?? ''} onChange={e => set('cidade', e.target.value)} placeholder="Goiânia" /></Campo>
          <Campo label="UF"><input style={inpSt(false)} value={f.uf ?? ''} onChange={e => set('uf', e.target.value.toUpperCase().slice(0, 2))} placeholder="GO" /></Campo>
          <Campo label="Segmento"><select style={inpSt(false)} value={f.segmento} onChange={e => set('segmento', e.target.value)}>{SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}</select></Campo>
          <Campo label="Vendedor responsável"><select style={inpSt(false)} value={f.vendedor} onChange={e => set('vendedor', e.target.value)}>{VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}</select></Campo>
          <Campo label="Observações" span2><textarea style={{ ...inpSt(false), height: 56, resize: 'vertical', paddingTop: 8 }} value={f.obs ?? ''} onChange={e => set('obs', e.target.value)} placeholder="Preferências, condições combinadas…" /></Campo>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          {editar && <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}><input type="checkbox" checked={f.ativo !== false} onChange={e => set('ativo', e.target.checked)} />Cliente ativo</label>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn onClick={onClose}>Cancelar</Btn>
            <Btn variant="primary" onClick={salvar}><Plus size={15} />{editar ? 'Salvar' : 'Cadastrar cliente'}</Btn>
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
        {label}{erro && <span style={{ color: erro.includes('Buscando') ? 'var(--set-comercial)' : 'var(--danger-fg)', textTransform: 'none', letterSpacing: 0 }}>{erro}</span>}
      </div>
      {children}
    </label>
  )
}
function FRow({ lb, vl }: { lb: string; vl: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '3px 0', fontSize: 13 }}><span style={{ fontSize: 11, color: 'var(--text-subtle)', minWidth: 130, flex: '0 0 auto' }}>{lb}</span><span>{vl}</span></div>
}
const inpSt = (erro: boolean): React.CSSProperties => ({ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, font: 'inherit', fontSize: 13, background: 'var(--bg-surface-2)', color: 'var(--text)', outline: 'none', border: '1px solid ' + (erro ? 'color-mix(in srgb,var(--danger) 55%,transparent)' : 'var(--border-strong)') })
const selSt: React.CSSProperties = { height: 36, padding: '0 10px', borderRadius: 8, font: 'inherit', fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border-strong)', cursor: 'pointer' }
const cityBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', font: 'inherit', fontSize: 12, color: 'var(--text)' }
const histRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', marginBottom: 6 }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--set-comercial)', cursor: 'pointer', font: 'inherit', fontSize: 13, textDecoration: 'underline', padding: 0 }
const pgBtn = (dis: boolean): React.CSSProperties => ({ minWidth: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: dis ? 'var(--text-subtle)' : 'var(--text)', cursor: dis ? 'default' : 'pointer', font: 'inherit', fontSize: 12 })
const pct = (a: number, b: number) => (b ? Math.round(a / b * 100) : 0) + '% da base'
