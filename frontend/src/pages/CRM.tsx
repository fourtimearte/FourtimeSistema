import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, X, Phone, Mail, MapPin, Truck, Building2, UserRound, Calendar, AlertTriangle,
  MessageCircle, Check, Download, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Users, Pencil, Trash2,
} from 'lucide-react'
import { useApp } from '../store/useApp'
import { pedTotais, money, cidadeUf, VENDEDORES, SEGMENTOS, type Cliente } from '../store/model'
import { maskDoc, maskFone, maskCep, validaDoc, validaEmail, linkWhats, consultaCnpj } from '../lib/br'
import { transportadorasPara, FONTE_LABEL, calcularFrete, pacotePorPecas, consultaCep, type FreteOpcao } from '../lib/frete'
// CSS do kit v5 agora é global (styles/kit.css) — importado em styles/index.css

/* =====================================================================
   CRM / Clientes v4 — porte FIEL de fourtimeclientesv4.html para o React,
   ligado ao store. Mesma marcação e o mesmo CSS (crm.v4.css). KPIs,
   filtros (tipo/UF/cidade/período/cadastro), ordenação, paginação,
   ficha (drawer) e transportadoras/frete por CEP.
   ===================================================================== */

const dig = (s: string) => (s ?? '').replace(/\D/g, '')
const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
function tCase(s: string) { return (s ?? '').toLowerCase().replace(/\b([a-zà-ú])/g, m => m.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, m => m.toLowerCase()) }
const HOJE = new Date('2026-08-04')
const dkOf = (c: Cliente) => { if (!c.criadoEm) return 0; const d = new Date(c.criadoEm); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() }
const temContato = (c: Cliente) => !!(c.contato || c.email)
const temDoc = (c: Cliente) => !!(c.doc && c.doc !== '—')
const incompleto = (c: Cliente) => !temDoc(c) && !temContato(c)
const novo30 = (c: Cliente) => c.criadoEm ? (HOJE.getTime() - new Date(c.criadoEm).getTime()) / 864e5 <= 30 : false

export default function CRM() {
  const { pedidos, clientes, criarPedidoDe, deleteCliente, toast } = useApp()
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')     // '', 'PF', 'PJ'
  const [uf, setUf] = useState('')         // '', UF, '__vazio__'
  const [cid, setCid] = useState('')       // '', cidade, '__vazio__'
  const [per, setPer] = useState('')       // '', 'mes','90','2026'...
  const [cad, setCad] = useState('')       // '', 'contato'...
  const [sort, setSort] = useState<{ k: 'nome' | 'cid' | 'ds'; dir: 1 | -1 }>({ k: 'ds', dir: -1 })
  const [page, setPage] = useState(1)
  const [porPag, setPorPag] = useState(25)
  const [selId, setSelId] = useState<number | null>(null)
  const [transpDe, setTranspDe] = useState<Cliente | null>(null)
  const [modal, setModal] = useState<'novo' | Cliente | null>(null)

  const sel = clientes.find(c => c.id === selId) ?? null

  /* índices p/ duplicados (mesmo doc ou nome) */
  const dupSet = useMemo(() => {
    const docs: Record<string, number> = {}, nomes: Record<string, number> = {}
    clientes.forEach(c => { if (temDoc(c)) docs[dig(c.doc)] = (docs[dig(c.doc)] || 0) + 1; nomes[norm(c.nome)] = (nomes[norm(c.nome)] || 0) + 1 })
    return new Set(clientes.filter(c => (temDoc(c) && docs[dig(c.doc)] > 1) || nomes[norm(c.nome)] > 1).map(c => c.id))
  }, [clientes])

  const total = clientes.length
  const kpis = useMemo(() => ({
    total, pf: clientes.filter(c => (c.tipo ?? 'PJ') === 'PF').length,
    pj: clientes.filter(c => (c.tipo ?? 'PJ') === 'PJ').length,
    contato: clientes.filter(temContato).length, novos: clientes.filter(novo30).length,
    inc: clientes.filter(incompleto).length,
  }), [clientes, total])

  const ufOpts = useMemo(() => {
    const m: Record<string, number> = {}
    clientes.forEach(c => { const u = cidadeUf(c).uf; if (u) m[u] = (m[u] || 0) + 1 })
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))
  }, [clientes])
  const cidOpts = useMemo(() => {
    const m: Record<string, number> = {}
    clientes.forEach(c => { const ci = cidadeUf(c).cidade; if (ci) m[ci] = (m[ci] || 0) + 1 })
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))
  }, [clientes])

  const filtrada = useMemo(() => {
    let l = clientes.filter(c => {
      const cu = cidadeUf(c)
      if (tipo && (c.tipo ?? 'PJ') !== tipo) return false
      if (uf) { if (uf === '__vazio__') { if (cu.uf) return false } else if (cu.uf !== uf) return false }
      if (cid) { if (cid === '__vazio__') { if (cu.cidade) return false } else if (cu.cidade !== cid) return false }
      if (per) { const dk = dkOf(c); if (per === 'mes') { if (dk < 20260801) return false } else if (per === '90') { if (!c.criadoEm || (HOJE.getTime() - new Date(c.criadoEm).getTime()) / 864e5 > 90) return false } else if (Math.floor(dk / 10000) !== +per) return false }
      if (cad) {
        if (cad === 'contato' && !temContato(c)) return false
        if (cad === 'semcontato' && temContato(c)) return false
        if (cad === 'wa' && !linkWhats(c.contato)) return false
        if (cad === 'doc' && !temDoc(c)) return false
        if (cad === 'end' && !(c.endereco || c.cep)) return false
        if (cad === 'incompleto' && !incompleto(c)) return false
        if (cad === 'dup' && !dupSet.has(c.id)) return false
        if (cad === 'novo30' && !novo30(c)) return false
        if (cad === 'fornecedor' && !/fornecedor/i.test(c.tipoContato ?? '')) return false
        if (cad === 'funcionario' && !/funcion/i.test(c.tipoContato ?? '')) return false
      }
      if (q) {
        const alvo = norm(c.nome + ' ' + (c.fantasia ?? '') + ' ' + c.doc + ' ' + (c.email ?? '') + ' ' + c.contato + ' ' + (c.cidade ?? '') + ' ' + (c.uf ?? ''))
        if (!alvo.includes(norm(q))) return false
      }
      return true
    })
    const d = sort.dir
    l = [...l].sort((a, b) => {
      if (sort.k === 'nome') return d * a.nome.localeCompare(b.nome)
      if (sort.k === 'cid') return d * (cidadeUf(a).cidade || '~').localeCompare(cidadeUf(b).cidade || '~')
      return d * (dkOf(a) - dkOf(b))
    })
    return l
  }, [clientes, q, tipo, uf, cid, per, cad, sort, dupSet])

  const pages = Math.max(1, Math.ceil(filtrada.length / porPag))
  const pageSafe = Math.min(page, pages)
  const ini = (pageSafe - 1) * porPag, fim = Math.min(filtrada.length, ini + porPag)
  const slice = filtrada.slice(ini, fim)
  useEffect(() => { setPage(1) }, [q, tipo, uf, cid, per, cad])

  /* chips de filtros ativos */
  const CAD_LBL: Record<string, string> = { contato: 'Com contato', semcontato: 'Sem contato', wa: 'Com WhatsApp', doc: 'Com CPF/CNPJ', end: 'Com endereço', incompleto: 'Cadastro incompleto', dup: 'Possíveis duplicados', novo30: 'Novos 30 dias', fornecedor: 'Também fornecedor', funcionario: 'Também funcionário' }
  const PER_LBL: Record<string, string> = { mes: 'Este mês', '90': 'Últimos 90 dias', '2026': 'Em 2026', '2025': 'Em 2025', '2024': 'Em 2024', '2023': 'Em 2023', '2022': 'Em 2022' }
  const chips: { t: string; x: () => void }[] = []
  if (tipo) chips.push({ t: tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica', x: () => setTipo('') })
  if (uf) chips.push({ t: uf === '__vazio__' ? 'Sem UF' : 'UF: ' + uf, x: () => setUf('') })
  if (cid) chips.push({ t: cid === '__vazio__' ? 'Sem cidade' : 'Cidade: ' + cid, x: () => setCid('') })
  if (per) chips.push({ t: PER_LBL[per] ?? per, x: () => setPer('') })
  if (cad) chips.push({ t: CAD_LBL[cad] ?? cad, x: () => setCad('') })
  if (q) chips.push({ t: '“' + q + '”', x: () => setQ('') })
  const limpar = () => { setQ(''); setTipo(''); setUf(''); setCid(''); setPer(''); setCad(''); setPage(1) }

  const anos = [...new Set(clientes.map(c => Math.floor(dkOf(c) / 10000)).filter(Boolean))].sort((a, b) => b - a)

  const pageNums = (() => { const ns: number[] = []; for (let p = 1; p <= pages; p++) if (p <= 2 || p > pages - 2 || Math.abs(p - pageSafe) <= 1) ns.push(p); return ns })()

  return (
    <div>
      <div className="pagehead reveal in">
        <div className="tt">
          <h1><span className="n">CRM</span> Clientes cadastrados</h1>
          <p>Base importada do Bling · <span className="mono">{total.toLocaleString('pt-BR')}</span> contatos · clique na cidade para ver as transportadoras</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => toast('Exportar filtro (protótipo)')}><Download size={16} />Exportar filtro</button>
          <button className="btn btn-primary" onClick={() => setModal('novo')}><Plus size={16} />Novo cliente</button>
        </div>
      </div>

      <div className="kpis reveal in">
        <Kpi on={!tipo && !cad} icon={<Users size={13} />} lbl="Total de clientes" val={kpis.total} delta="base Bling" w={100} onClick={limpar} />
        <Kpi on={tipo === 'PF'} icon={<UserRound size={13} />} lbl="Pessoa Física" val={kpis.pf} delta={pct(kpis.pf, total)} w={total ? kpis.pf / total * 100 : 0} onClick={() => setTipo(tipo === 'PF' ? '' : 'PF')} />
        <Kpi on={tipo === 'PJ'} icon={<Building2 size={13} />} lbl="Pessoa Jurídica" val={kpis.pj} delta={pct(kpis.pj, total)} w={total ? kpis.pj / total * 100 : 0} onClick={() => setTipo(tipo === 'PJ' ? '' : 'PJ')} />
        <Kpi on={cad === 'contato'} icon={<Phone size={13} />} lbl="Com contato" val={kpis.contato} delta="fone ou e-mail" w={total ? kpis.contato / total * 100 : 0} onClick={() => setCad(cad === 'contato' ? '' : 'contato')} />
        <Kpi on={cad === 'novo30'} icon={<Calendar size={13} />} lbl="Novos · 30 dias" val={kpis.novos} delta="até 04/08/2026" w={total ? Math.min(100, kpis.novos / total * 400) : 0} onClick={() => setCad(cad === 'novo30' ? '' : 'novo30')} />
        <Kpi on={cad === 'incompleto'} icon={<AlertTriangle size={13} />} lbl="Cad. incompleto" val={kpis.inc} delta="sem doc e contato" w={total ? kpis.inc / total * 100 : 0} cor="var(--warning)" onClick={() => setCad(cad === 'incompleto' ? '' : 'incompleto')} />
      </div>

      <div className="toolbar reveal in">
        <div className="searchwrap">
          <Search size={16} />
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, fantasia, CPF/CNPJ, e-mail, telefone, cidade…" />
          <span className="kbd">/</span>
        </div>
        <Dd style={{ minWidth: 108 }} label="Tipo" value={tipo} onPick={setTipo}
          opts={[{ v: '', t: 'Todos' }, { v: 'PF', t: 'Pessoa Física', c: kpis.pf }, { v: 'PJ', t: 'Pessoa Jurídica', c: kpis.pj }]} />
        <Dd style={{ minWidth: 96 }} label="UF" value={uf} onPick={setUf}
          opts={[{ v: '', t: 'Todas' }, ...ufOpts.map(([u, c]) => ({ v: u, t: u, c })), { v: '__vazio__', t: 'Sem UF' }]} />
        <Dd style={{ minWidth: 150 }} label="Cidade" value={cid} onPick={setCid} searchable
          opts={[{ v: '', t: 'Todas' }, ...cidOpts.map(([ci, c]) => ({ v: ci, t: ci, c })), { v: '__vazio__', t: 'Sem cidade' }]} />
        <Dd style={{ minWidth: 158 }} label="Período" value={per} onPick={setPer}
          opts={[{ v: '', t: 'Qualquer data' }, { v: 'mes', t: 'Este mês' }, { v: '90', t: 'Últimos 90 dias' }, ...anos.map(a => ({ v: String(a), t: 'Em ' + a }))]} />
        <Dd style={{ minWidth: 148 }} label="Cadastro" value={cad} onPick={setCad}
          opts={[{ v: '', t: 'Todos' }, { v: 'contato', t: 'Com contato', c: kpis.contato }, { v: 'semcontato', t: 'Sem contato' }, { v: 'wa', t: 'Com WhatsApp' }, { v: 'doc', t: 'Com CPF/CNPJ' }, { v: 'end', t: 'Com endereço' }, { v: 'incompleto', t: 'Cadastro incompleto', c: kpis.inc }, { v: 'dup', t: 'Possíveis duplicados', c: dupSet.size }, { v: 'novo30', t: 'Novos 30 dias', c: kpis.novos }]} />
        <button className="iconbtn" title="Limpar filtros" onClick={limpar}><Trash2 size={17} /></button>
      </div>

      <div className="resline">
        <span><b>{filtrada.length.toLocaleString('pt-BR')}</b> cliente{filtrada.length === 1 ? '' : 's'}{filtrada.length !== total ? <> de <b>{total.toLocaleString('pt-BR')}</b></> : null}</span>
        {chips.map((c, i) => <span key={i} className="fchip">{c.t}<button title="Remover" onClick={c.x}><X size={11} /></button></span>)}
        {chips.length > 0 && <button className="linkbtn" onClick={limpar}>limpar tudo</button>}
      </div>

      <div className="tablecard reveal in">
        <div className="tscroll">
          <table className="clientes">
            <thead>
              <tr>
                <th className="sort" onClick={() => setSort(s => ({ k: 'nome', dir: s.k === 'nome' ? (s.dir === 1 ? -1 : 1) : 1 }))}>Cliente<span className="ar">{sort.k === 'nome' ? (sort.dir === 1 ? '▲' : '▼') : ''}</span></th>
                <th>Documento</th>
                <th>Contato</th>
                <th className="sort" onClick={() => setSort(s => ({ k: 'cid', dir: s.k === 'cid' ? (s.dir === 1 ? -1 : 1) : 1 }))}>Cidade / UF<span className="ar">{sort.k === 'cid' ? (sort.dir === 1 ? '▲' : '▼') : ''}</span></th>
                <th>Tipo</th>
                <th className="sort" onClick={() => setSort(s => ({ k: 'ds', dir: s.k === 'ds' ? (s.dir === 1 ? -1 : 1) : 1 }))}>Cliente desde<span className="ar">{sort.k === 'ds' ? (sort.dir === 1 ? '▲' : '▼') : ''}</span></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((c, i) => <Row key={c.id} c={c} i={i} dup={dupSet.has(c.id)} onOpen={() => setSelId(c.id)} onCity={() => setTranspDe(c)} onCopy={(v, l) => copiar(v, l, toast)} />)}
            </tbody>
          </table>
          {!slice.length && <div className="empty"><Search size={38} /><b>Nenhum cliente encontrado</b>Ajuste a busca ou limpe os filtros para ver a base completa.</div>}
        </div>
        <div className="pager">
          <span className="info">Mostrando <b>{filtrada.length ? ini + 1 : 0}–{fim}</b> de <b>{filtrada.length.toLocaleString('pt-BR')}</b></span>
          <span className="spacer" />
          <Dd style={{ minWidth: 118 }} label="Por pág." value={String(porPag)} onPick={v => { setPorPag(+v); setPage(1) }}
            opts={[{ v: '25', t: '25 por página' }, { v: '50', t: '50 por página' }, { v: '100', t: '100 por página' }]} up />
          <button className="pgbtn" disabled={pageSafe <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={15} /></button>
          {pageNums.map((p, idx) => <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>{idx > 0 && p - pageNums[idx - 1] > 1 ? <span className="pgdots">…</span> : null}<button className={'pgbtn' + (p === pageSafe ? ' on' : '')} onClick={() => setPage(p)}>{p}</button></span>)}
          <button className="pgbtn" disabled={pageSafe >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* ficha (drawer) */}
      <div className={'scrim' + (sel ? ' show' : '')} onClick={() => setSelId(null)} />
      <aside className={'drawer' + (sel ? ' show' : '')} aria-hidden={!sel}>
        {sel && <Ficha c={sel} pedidos={pedidos.filter(p => p.clienteId === sel.id)} dup={dupSet.has(sel.id)}
          onClose={() => setSelId(null)} onCopy={(v, l) => copiar(v, l, toast)} onEdit={() => setModal(sel)}
          onDel={() => { deleteCliente(sel.id); setSelId(null) }}
          onRepetir={base => { setSelId(null); criarPedidoDe(base, sel) }}
          onNovo={() => { const b = pedidos.filter(p => p.clienteId === sel.id)[0]; setSelId(null); if (b) criarPedidoDe(b, sel); else toast('Cliente sem pedido base — crie um orçamento no Editor') }} />}
      </aside>

      {transpDe && <TranspModal c={transpDe} onClose={() => setTranspDe(null)} />}
      {modal && <ClienteModal editar={modal === 'novo' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  )
}

/* ---------- KPI ---------- */
function Kpi({ on, icon, lbl, val, delta, w, cor, onClick }: { on: boolean; icon: React.ReactNode; lbl: string; val: number; delta: string; w: number; cor?: string; onClick: () => void }) {
  return (
    <div className={'kpi' + (on ? ' on' : '')} onClick={onClick}>
      <div className="k-lbl">{icon}{lbl}</div>
      <div className="k-val" style={cor ? { color: cor } : undefined}>{val.toLocaleString('pt-BR')}</div>
      <div className="k-delta">{delta}</div>
      <div className="k-bar"><i style={{ width: w + '%', ...(cor ? { background: cor } : {}) }} /></div>
    </div>
  )
}

/* ---------- dropdown custom (igual v4) ---------- */
function Dd({ label, value, opts, onPick, searchable, style, up }: { label: string; value: string; opts: { v: string; t: string; c?: number }[]; onPick: (v: string) => void; searchable?: boolean; style?: React.CSSProperties; up?: boolean }) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [open])
  const cur = opts.find(o => o.v === value)
  const isFiltro = !!value && opts.some(o => o.v === '')
  const vis = searchable && busca ? opts.filter(o => o.v === '' || norm(o.t).includes(norm(busca))) : opts
  return (
    <div className={'dd' + (open ? ' open' : '')} ref={ref} style={style}>
      <button className={'dd-btn' + (isFiltro ? ' filtered' : '')} type="button" title={label} onClick={() => setOpen(o => !o)}>
        <span className="cur">{isFiltro ? <span className="v" style={{ fontWeight: 600, color: 'var(--primary)' }}>{cur?.t ?? value}</span> : <><span className="lb">{label}:</span> <span className="v">{cur?.t ?? 'Todos'}</span></>}</span>
        <ChevronDown size={16} />
      </button>
      <div className="dd-menu" role="listbox" style={up ? { top: 'auto', bottom: 'calc(100% + 6px)' } : undefined}>
        {searchable && <div className="dd-sw"><input className="input" placeholder="Digitar para filtrar…" value={busca} onChange={e => setBusca(e.target.value)} autoFocus /></div>}
        {vis.map(o => (
          <div key={o.v} className={'dd-opt' + (o.v === value ? ' on' : '')} onClick={() => { onPick(o.v); setOpen(false); setBusca('') }}>
            {o.t}{o.c != null ? <span className="ct">{o.c}</span> : null}<span className="ck"><Check size={15} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- linha da tabela ---------- */
function Row({ c, i, dup, onOpen, onCity, onCopy }: { c: Cliente; i: number; dup: boolean; onOpen: () => void; onCity: () => void; onCopy: (v: string, l: string) => void }) {
  const pj = (c.tipo ?? 'PJ') === 'PJ'
  const nome = pj ? c.nome : tCase(c.nome)
  const { cidade, uf } = cidadeUf(c)
  const tel = c.contato
  const wa = linkWhats(tel)
  const nT = (c.cep || uf) ? transportadorasPara(c.cep ?? '', uf).length : 0
  return (
    <tr onClick={onOpen} style={{ animationDelay: Math.min(i * 18, 320) + 'ms' }}>
      <td>
        <div className="cell-cli">
          <span className={'avatar ' + (pj ? 'pj' : 'pf')} title={pj ? 'Pessoa Jurídica' : 'Pessoa Física'}>{pj ? <Building2 size={17} /> : <UserRound size={17} />}</span>
          <div>
            <div className="nm">{nome}{dup && <span className="badge badge-dup" title="Mesmo documento ou nome de outro cadastro">DUP</span>}{incompleto(c) && <span className="badge badge-inc" title="Sem documento e sem contato">INC</span>}</div>
            {c.fantasia && <div className="fan">{c.fantasia}</div>}
          </div>
        </div>
      </td>
      <td>{temDoc(c) ? <button className="copy" onClick={e => { e.stopPropagation(); onCopy(c.doc, pj ? 'CNPJ' : 'CPF') }}>{c.doc}</button> : <span className="muted">—</span>}</td>
      <td>
        {(tel || c.email) ? <div className="contactcell">
          {tel && <span className="row"><Phone size={12} /><button className="copy" onClick={e => { e.stopPropagation(); onCopy(tel, 'Telefone') }}>{tel}</button>{wa && <a className="wabtn" title="Abrir WhatsApp" target="_blank" rel="noopener" href={wa} onClick={e => e.stopPropagation()}><MessageCircle size={14} /></a>}</span>}
          {c.email && <span className="row"><Mail size={12} /><button className="copy" onClick={e => { e.stopPropagation(); onCopy(c.email!, 'E-mail') }} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email.toLowerCase()}</button></span>}
        </div> : <span className="muted">—</span>}
      </td>
      <td>{cidade ? <button className="citybtn" title={'Ver transportadoras para ' + cidade} onClick={e => { e.stopPropagation(); onCity() }}><MapPin size={13} />{cidade}{uf ? <span className="muted"> · {uf}</span> : null}<span className="tct"><Truck size={11} />{nT}</span></button> : <span className="muted">—</span>}</td>
      <td>{pj ? <span className="badge badge-pj">PJ</span> : <span className="badge badge-pf">PF</span>}</td>
      <td className="mono" style={{ fontSize: 'var(--fs-12)' }}>{c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}</td>
    </tr>
  )
}

/* ---------- item de transportadora ---------- */
function TpItem({ nome, obs, prazo, cor, fonte }: { nome: string; obs: string; prazo: string; cor: string; fonte: 'cep' | 'uf' }) {
  return (
    <div className="tp-item">
      <span className="tico" style={{ background: `var(${cor})` }}><Truck size={16} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="nm">{nome}<span className={'tp-src ' + fonte}>{FONTE_LABEL[fonte]}</span></div>
        <div className="ds">{obs}</div>
      </div>
      <span className="prazo">{prazo}</span>
    </div>
  )
}

/* ---------- ficha (conteúdo do drawer) ---------- */
function Ficha({ c, pedidos, dup, onClose, onCopy, onEdit, onDel, onRepetir, onNovo }: { c: Cliente; pedidos: any[]; dup: boolean; onClose: () => void; onCopy: (v: string, l: string) => void; onEdit: () => void; onDel: () => void; onRepetir: (p: any) => void; onNovo: () => void }) {
  const pj = (c.tipo ?? 'PJ') === 'PJ'
  const nome = pj ? c.nome : tCase(c.nome)
  const { cidade, uf } = cidadeUf(c)
  const wa = linkWhats(c.contato)
  const endParts = [c.endereco, c.complemento, c.bairro, cidade ? cidade + (uf ? ' - ' + uf : '') : '', c.cep ? 'CEP ' + c.cep : ''].filter(Boolean)
  const transp = (c.cep || uf) ? transportadorasPara(c.cep ?? '', uf) : []
  const [confirmaDel, setConfirmaDel] = useState(false)
  const cp = (v: string, l: string) => <button className="copy" onClick={() => onCopy(v, l)}>{v}</button>
  return <>
    <div className="dw-head">
      <span className={'avatar ' + (pj ? 'pj' : 'pf')}>{pj ? <Building2 size={23} /> : <UserRound size={23} />}</span>
      <div>
        <h3>{nome}</h3>
        <div className="sub">
          {pj ? <span className="badge badge-pj">Pessoa Jurídica</span> : <span className="badge badge-pf">Pessoa Física</span>}
          {c.ativo !== false && <span className="badge badge-success"><span className="d" />Ativo</span>}
          {dup && <span className="badge badge-dup">Possível duplicado</span>}
          {incompleto(c) && <span className="badge badge-inc">Cadastro incompleto</span>}
        </div>
      </div>
      <button className="iconbtn close" onClick={onClose}><X size={17} /></button>
    </div>
    <div className="dw-body">
      <div className="dw-sec">Identificação</div>
      {c.blingId && <Dw lb="ID Bling" vl={cp(c.blingId, 'ID')} />}
      <Dw lb={pj ? 'CNPJ' : 'CPF'} vl={temDoc(c) ? cp(c.doc, pj ? 'CNPJ' : 'CPF') : <span className="muted">—</span>} />
      {c.ie && <Dw lb={pj ? 'Inscrição Estadual' : 'RG'} vl={c.ie} />}
      {c.fantasia && <Dw lb="Nome fantasia" vl={c.fantasia} />}
      <Dw lb="Cliente desde" vl={<span className="mono">{c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}</span>} />

      <div className="dw-sec">Contato</div>
      {c.contato ? <Dw lb="Telefone / WhatsApp" vl={cp(c.contato, 'Telefone')} /> : null}
      {c.email ? <Dw lb="E-mail" vl={cp(c.email.toLowerCase(), 'E-mail')} /> : null}
      {!c.contato && !c.email ? <Dw lb="—" vl={<span className="muted">Nenhum contato cadastrado</span>} /> : null}

      <div className="dw-sec">Endereço</div>
      {endParts.length ? <Dw lb="Endereço" vl={endParts.join(' · ')} /> : <Dw lb="—" vl={<span className="muted">Sem endereço cadastrado</span>} />}

      <div className="dw-sec">Entrega · transportadoras</div>
      {transp.length ? transp.map(({ t, hit }) => <TpItem key={t.nome} nome={t.nome} obs={t.obs} prazo={t.prazo} cor={t.cor} fonte={hit} />) : <div className="tp-empty" style={{ padding: '10px 0', textAlign: 'left' }}>Sem cidade/CEP no cadastro — nenhuma cobertura calculada.</div>}
      <FreteEstimativa c={c} pecas={pedidos.length ? Math.max(...pedidos.map(p => pedTotais(p).pecas)) : 0} />

      {pedidos.length > 0 && <>
        <div className="dw-sec">Histórico de pedidos ({pedidos.length})</div>
        {pedidos.map(p => { const t = pedTotais(p); return (
          <div key={p.pedido} className="dw-row" style={{ cursor: 'pointer' }} onClick={() => onRepetir(p)}>
            <span className="lb mono">{p.pedido}</span>
            <span className="vl">{p.entrega} · {t.pecas} pçs<span className="mono" style={{ marginLeft: 'auto' }}>R$ {money(t.valor)}</span></span>
          </div>
        ) })}
      </>}
      {c.obs && <><div className="dw-sec">Observações</div><Dw lb="Obs." vl={c.obs} /></>}
    </div>
    <div className="dw-foot">
      {wa && <a className="btn btn-secondary" target="_blank" rel="noopener" href={wa}><MessageCircle size={16} />WhatsApp</a>}
      {c.email && <a className="btn btn-secondary" href={'mailto:' + c.email}><Mail size={16} />E-mail</a>}
      {!confirmaDel ? <button className="btn btn-secondary" onClick={() => setConfirmaDel(true)} style={{ color: 'var(--danger-fg)' }}><Trash2 size={16} />Excluir</button>
        : <button className="btn btn-secondary" onClick={onDel} style={{ background: 'var(--danger-bg)', color: 'var(--danger-fg)' }}><Trash2 size={16} />Confirmar?</button>}
      <button className="btn btn-primary" onClick={onEdit}><Pencil size={16} />Editar</button>
    </div>
  </>
}
function Dw({ lb, vl }: { lb: string; vl: React.ReactNode }) { return <div className="dw-row"><span className="lb">{lb}</span><span className="vl">{vl}</span></div> }

/* ---------- estimativa de frete (valor) ---------- */
function FreteEstimativa({ c, pecas }: { c: Cliente; pecas: number }) {
  const [pesoKg, setPesoKg] = useState(() => pacotePorPecas(pecas || 4).pesoKg)
  const [opcoes, setOpcoes] = useState<FreteOpcao[] | null>(null)
  async function calcular() { const p = pacotePorPecas(pecas || 4); p.pesoKg = pesoKg; setOpcoes(calcularFrete(c.cep ?? '', p)); await consultaCep(c.cep ?? '') }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', marginTop: 10, background: 'var(--bg-surface-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>Estimar valor · <span className="mono" style={{ color: 'var(--text)' }}>{c.cep || 'sem CEP'}</span></span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-12)', marginLeft: 'auto' }}>Peso<input className="input" type="number" min={0.3} step={0.1} value={pesoKg} onChange={e => setPesoKg(+e.target.value || 0.3)} style={{ width: 64, height: 'var(--control-h-sm)' }} />kg</label>
        <button className="btn btn-primary sm" onClick={calcular} disabled={!c.cep}><Truck size={14} />Calcular</button>
      </div>
      {opcoes && <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {opcoes.map(o => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-13)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: `var(${o.cor})` }} /><b>{o.transportadora}</b><span className="muted">{o.servico}</span>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>{o.prazoDias} dias</span><b className="mono">R$ {money(o.preco)}</b>
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Estimativa local — trocar pela cotação real do Melhor Envio quando o backend estiver pronto.</div>
      </div>}
    </div>
  )
}

/* ---------- modal transportadoras ---------- */
function TranspModal({ c, onClose }: { c: Cliente; onClose: () => void }) {
  const { cidade, uf } = cidadeUf(c)
  const list = (c.cep || uf) ? transportadorasPara(c.cep ?? '', uf) : []
  return createPortal(
    <div className="tp-overlay show" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tp-box">
        <div className="tp-head">
          <span className="tico"><Truck size={18} /></span>
          <div><h3>Transportadoras · {cidade}{uf ? ' - ' + uf : ''}</h3><div className="sub">{(c.tipo ?? 'PJ') === 'PJ' ? c.nome : tCase(c.nome)} · {c.cep ? 'CEP ' + c.cep : 'sem CEP — estimado pela UF'}</div></div>
          <button className="iconbtn close" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="tp-body">
          {list.length ? list.map(({ t, hit }) => <TpItem key={t.nome} nome={t.nome} obs={t.obs} prazo={t.prazo} cor={t.cor} fonte={hit} />) : <div className="tp-empty">Nenhuma transportadora cobre esta região na tabela atual.</div>}
        </div>
        <div className="tp-foot">Cobertura por <b>faixa de CEP</b> (editável em <span className="mono">lib/frete.ts</span>). Troque os nomes de exemplo pelos parceiros reais da Fourtime.</div>
      </div>
    </div>,
    document.body,
  )
}

/* ---------- cadastro/edição (com auto-preenchimento CNPJ/CEP) ---------- */
function ClienteModal({ editar, onClose }: { editar: Cliente | null; onClose: () => void }) {
  const { clientes, addCliente, updateCliente, toast } = useApp()
  const [f, setF] = useState<Omit<Cliente, 'id' | 'criadoEm'>>(() => editar ? { ...editar } : ({ nome: '', tipo: 'PJ', doc: '', fantasia: '', ie: '', contato: '', email: '', endereco: '', bairro: '', complemento: '', cidade: '', uf: '', cep: '', vendedor: VENDEDORES[0], segmento: SEGMENTOS[0], obs: '', ativo: true }))
  const [tentou, setTentou] = useState(false)
  const [busca, setBusca] = useState('')
  const idRef = useRef(0)
  const set = (k: keyof Cliente, v: any) => setF(prev => ({ ...prev, [k]: v }))
  const tipo = (f.tipo ?? 'PJ') as 'PF' | 'PJ'
  const docOk = validaDoc(f.doc, tipo), mailOk = validaEmail(f.email ?? ''), nomeOk = !!f.nome.trim()

  async function onBlurCep() { const via = await consultaCep(f.cep ?? ''); if (via) setF(p => ({ ...p, endereco: p.endereco || via.logradouro || '', bairro: p.bairro || via.bairro || '', cidade: via.localidade, uf: via.uf })) }
  async function onBlurCnpj() {
    if (tipo !== 'PJ') return
    const my = ++idRef.current; setBusca('Buscando CNPJ…')
    const d = await consultaCnpj(f.doc); if (my !== idRef.current) return; setBusca('')
    if (!d) { toast('CNPJ não encontrado na base pública'); return }
    setF(p => ({ ...p, nome: p.nome.trim() || d.razao, fantasia: p.fantasia || d.fantasia, cep: p.cep || (d.cep ? maskCep(d.cep) : ''), endereco: p.endereco || [d.logradouro, d.numero].filter(Boolean).join(', '), bairro: p.bairro || d.bairro, cidade: d.cidade || p.cidade, uf: d.uf || p.uf, email: p.email || d.email, contato: p.contato || (d.telefone ? maskFone(d.telefone) : '') }))
    toast('Dados do CNPJ preenchidos')
  }
  function salvar() {
    setTentou(true)
    if (!nomeOk) return toast('Informe o nome do cliente')
    if (!docOk) return toast(tipo === 'PF' ? 'CPF inválido' : 'CNPJ inválido')
    if (!mailOk) return toast('E-mail inválido')
    const nomeTrim = f.nome.trim()
    const dono = clientes.find(c => c.nome.toLowerCase() === nomeTrim.toLowerCase())
    if (dono && (!editar || dono.id !== editar.id)) return toast('Já existe um cliente com esse nome')
    const dados = { ...f, nome: nomeTrim, doc: f.doc.trim() || '—' }
    if (editar) updateCliente(editar.id, dados); else addCliente(dados)
    onClose()
  }
  return createPortal(
    <div className="tp-overlay show" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tp-box" style={{ width: 'min(640px,96vw)', maxHeight: '92vh' }}>
        <div className="tp-head">
          <span className="tico" style={{ background: 'var(--info-bg)', color: 'var(--info-fg)' }}>{tipo === 'PJ' ? <Building2 size={18} /> : <UserRound size={18} />}</span>
          <div><h3>{editar ? 'Editar cliente' : 'Novo cliente'}</h3><div className="sub">{editar ? 'Alterações valem para novos orçamentos.' : 'CNPJ e CEP preenchem o cadastro automaticamente.'}</div></div>
          <button className="iconbtn close" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="tp-body" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {(['PJ', 'PF'] as const).map(t => <button key={t} className="btn btn-secondary sm" onClick={() => set('tipo', t)} style={tipo === t ? { borderColor: 'var(--primary)', color: 'var(--primary)', boxShadow: 'inset 0 0 0 1px var(--primary)' } : undefined}>{t === 'PJ' ? <Building2 size={15} /> : <UserRound size={15} />}{t === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
            <Campo lb={tipo === 'PJ' ? 'CNPJ (busca automática)' : 'CPF'} err={!docOk ? 'inválido' : busca}><input className="input mono" value={f.doc === '—' ? '' : f.doc} onChange={e => set('doc', maskDoc(e.target.value, tipo))} onBlur={onBlurCnpj} placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} /></Campo>
            <Campo lb={tipo === 'PJ' ? 'Inscrição Estadual' : 'RG'}><input className="input mono" value={f.ie ?? ''} onChange={e => set('ie', e.target.value)} placeholder="opcional" /></Campo>
            <Campo lb={tipo === 'PJ' ? 'Razão social *' : 'Nome completo *'} span2 err={tentou && !nomeOk ? 'obrigatório' : ''}><input className="input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder={tipo === 'PJ' ? 'Ex.: Academia Pulse LTDA' : 'Ex.: João da Silva'} autoFocus /></Campo>
            {tipo === 'PJ' && <Campo lb="Nome fantasia" span2><input className="input" value={f.fantasia ?? ''} onChange={e => set('fantasia', e.target.value)} /></Campo>}
            <Campo lb="WhatsApp / telefone"><input className="input mono" value={f.contato} onChange={e => set('contato', maskFone(e.target.value))} placeholder="(62) 90000-0000" /></Campo>
            <Campo lb="E-mail" err={!mailOk ? 'inválido' : ''}><input className="input" value={f.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com.br" /></Campo>
            <Campo lb="CEP (busca endereço)"><input className="input mono" value={f.cep ?? ''} onChange={e => set('cep', maskCep(e.target.value))} onBlur={onBlurCep} placeholder="74000-000" /></Campo>
            <Campo lb="Endereço"><input className="input" value={f.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, nº" /></Campo>
            <Campo lb="Bairro"><input className="input" value={f.bairro ?? ''} onChange={e => set('bairro', e.target.value)} /></Campo>
            <Campo lb="Cidade"><input className="input" value={f.cidade ?? ''} onChange={e => set('cidade', e.target.value)} placeholder="Goiânia" /></Campo>
            <Campo lb="UF"><input className="input" value={f.uf ?? ''} onChange={e => set('uf', e.target.value.toUpperCase().slice(0, 2))} placeholder="GO" /></Campo>
            <Campo lb="Segmento"><select className="input" value={f.segmento} onChange={e => set('segmento', e.target.value)}>{SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}</select></Campo>
            <Campo lb="Vendedor"><select className="input" value={f.vendedor} onChange={e => set('vendedor', e.target.value)}>{VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}</select></Campo>
            <Campo lb="Observações" span2><textarea className="input" value={f.obs ?? ''} onChange={e => set('obs', e.target.value)} style={{ height: 54, paddingTop: 8, resize: 'vertical' }} /></Campo>
          </div>
        </div>
        <div className="dw-foot">
          {editar && <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--fs-13)', color: 'var(--text-muted)', flex: 'none' }}><input type="checkbox" checked={f.ativo !== false} onChange={e => set('ativo', e.target.checked)} />Ativo</label>}
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar}><Plus size={16} />{editar ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
function Campo({ lb, children, span2, err }: { lb: string; children: React.ReactNode; span2?: boolean; err?: string }) {
  return <label style={{ display: 'block', gridColumn: span2 ? '1 / -1' : undefined }}><div style={{ fontSize: 'var(--fs-11)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 4, display: 'flex', gap: 8 }}>{lb}{err && <span style={{ color: err.includes('Buscando') ? 'var(--primary)' : 'var(--danger-fg)', textTransform: 'none', letterSpacing: 0 }}>{err}</span>}</div>{children}</label>
}

function copiar(v: string, l: string, toast: (m: string) => void) { navigator.clipboard?.writeText(v).then(() => toast(l + ' copiado')).catch(() => toast('Não foi possível copiar')) }
const pct = (a: number, b: number) => (b ? Math.round(a / b * 100) : 0) + '% da base'
