import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Save, Printer, Check, Trash2, Copy, X, ImagePlus, Search, Undo2, Redo2, FolderOpen, ClipboardPaste, Code2, PenTool, User, Baby, Clock, Eraser, Palette } from 'lucide-react'
import { useApp } from '../store/useApp'
import { toFt, fromFt, ehFt, nomeFt } from '../lib/ft'
import { exportarHtml } from '../lib/exportHtml'
import AnotarModal from '../components/AnotarModal'
import {
  REFERENCIAS, TECNICAS, DESIGN_ORDER, CORES, TECIDOS, corHexPorNome, generoClasse, GENEROS,
  VENDEDORES, DEPARTAMENTOS, EMBALAGENS, PAGAMENTOS, validarPedido,
  DTF_CORES, SB_CORES, codigoHex, isInfantil, ordemTamanhos, OBS_TAGS,
  pedTotais, money, type Pedido, type Layout, type TecnicaKey,
} from '../store/model'
import { PageHead, Btn, Badge, TecTag, cvar } from '../components/ui'
import Combo from '../components/Combo'

function Inp({ value, onChange, list, placeholder, mono }: { value: string; onChange: (v: string) => void; list?: string; placeholder?: string; mono?: boolean }) {
  return <input value={value} list={list} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none', fontFamily: mono ? 'var(--font-mono)' : undefined }} />
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={fieldLbl}>{label}</label>{children}</div>
}
function toISO(br: string) { const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : '' }
function fromISO(iso: string) { const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : iso }

export default function Comercial() {
  const { pedidos, curPed, setCurPed, novoOrcamento, updateHeader, patchPedido, toggleHeaderObsTag, aprovarPedido, toggleDinheiro, semDinheiro, toast, undo, redo, past, future, pasteLayout, layoutClip, abrirPedido, fecharAba, clientes } = useApp()
  const p: Pedido | undefined = pedidos[curPed]
  const [viewImg, setViewImg] = useState<string | null>(null)
  const [anotar, setAnotar] = useState(false)
  const [stuck, setStuck] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current; if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: '-67px 0px 0px 0px', threshold: 0 })
    io.observe(el); return () => io.disconnect()
  }, [p?.pedido])

  function salvarFt() {
    if (!p) return
    const d = new Date()
    const blob = new Blob([JSON.stringify(toFt(p, d.toISOString()), null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeFt(p, d) + '.ft'; a.click(); URL.revokeObjectURL(a.href)
    toast('Salvo: ' + a.download)
  }
  function onOpenFt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { const obj = JSON.parse(String(r.result)); if (!ehFt(obj)) { toast('Arquivo .ft inválido'); return } abrirPedido(fromFt(obj)) } catch { toast('Não foi possível ler o .ft') } }
    r.readAsText(f); e.target.value = ''
  }
  function salvarHtml() {
    if (!p) return
    const blob = new Blob([exportarHtml(p)], { type: 'text/html' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeFt(p, new Date()) + '.html'; a.click(); URL.revokeObjectURL(a.href)
    toast('HTML exportado (sem valores)')
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [undo, redo])

  function onCliente(v: string) {
    const m = clientes.find(c => c.nome.toLowerCase() === v.trim().toLowerCase())
    if (m) patchPedido(curPed, { cliente: m.nome, clienteId: m.id, cpf: m.doc, contato: m.contato, vendedor: m.vendedor, endereco: [m.endereco, m.cidade].filter(Boolean).join(' — ') })
    else updateHeader(curPed, 'cliente', v)
  }
  function aprovar() {
    if (!p) return
    const faltas = validarPedido(p)
    if (faltas.length) { toast('Falta preencher: ' + faltas.slice(0, 3).join(' · ') + (faltas.length > 3 ? '…' : '')); return }
    const tecs = aprovarPedido(p.pedido)
    if (!tecs) { toast('Adicione ao menos uma técnica que roteia'); return }
    toast('Aprovado — rota: ' + tecs.map(t => TECNICAS[t].label).join(' + ') + ' → Kanban')
  }
  const tot = p ? pedTotais(p) : { pecas: 0, valor: 0 }

  return (
    <div>
      <datalist id="dl-clientes">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
      <datalist id="dl-vend">{VENDEDORES.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="dl-dep">{DEPARTAMENTOS.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="dl-emb">{EMBALAGENS.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="dl-pag">{PAGAMENTOS.map(v => <option key={v} value={v} />)}</datalist>

      <PageHead crumb="Atendimento · Editor" title="Comercial"
        desc="Editor de orçamento nativo — eficiente no celular e no desktop, com as funções do v172. O A4 sai fiel na impressão/PDF."
        actions={<Btn size="sm" variant="primary" onClick={novoOrcamento}><Plus size={16} />Novo orçamento</Btn>} />

      <div className="comercial-layout">
        <OrcamentosColuna onOpen={pd => { const i = pedidos.findIndex(x => x.pedido === pd.pedido); if (i >= 0) setCurPed(i); else abrirPedido(pd) }} />
        <div className="comercial-editor" style={{ minWidth: 0 }}>
      <div style={tabbar}>
        {pedidos.map((o, i) => {
          const on = i === curPed
          return (
            <div key={o.pedido} style={{ ...tab, ...(on ? tabOn : {}), paddingRight: 6 }}>
              <button onClick={() => setCurPed(i)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {o.cliente || '(novo)'} <span className="mono" style={{ opacity: .7, fontSize: 10 }}>{o.pedido.slice(-4)}</span>
              </button>
              {pedidos.length > 1 && <button onClick={() => fecharAba(i)} title="Fechar aba" style={{ ...tabClose, color: on ? 'var(--primary-fg)' : 'var(--text-subtle)' }}><X size={13} /></button>}
            </div>
          )
        })}
        <button onClick={novoOrcamento} style={tabNew} title="Novo orçamento">+</button>
      </div>

      {!p ? <div style={card}><div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: 20 }}>Nenhum orçamento. Clique em “Novo orçamento”.</div></div> : <>
        <div ref={sentinelRef} style={{ height: 1 }} />
        <div className={'editbar' + (stuck ? ' stuck' : '')} style={actionBar}>
          <span className="mono" style={{ fontWeight: 600 }}>{p.pedido}</span>
          {p.aprovado ? <Badge kind="info">em produção</Badge> : <Badge kind="neutral">rascunho</Badge>}
          <span style={{ marginLeft: 'auto' }} />
          <button onClick={undo} disabled={!past.length} title="Desfazer (Ctrl+Z)" style={{ ...undoBtn, opacity: past.length ? 1 : .4 }}><Undo2 size={15} /></button>
          <button onClick={redo} disabled={!future.length} title="Refazer (Ctrl+Shift+Z)" style={{ ...undoBtn, opacity: future.length ? 1 : .4 }}><Redo2 size={15} /></button>
          {layoutClip && <Btn size="sm" onClick={() => pasteLayout(curPed)}><ClipboardPaste size={14} />Colar layout</Btn>}
          <Btn size="sm" onClick={toggleDinheiro} style={semDinheiro
            ? { background: 'var(--success-bg)', color: 'var(--success-fg)', borderColor: 'color-mix(in srgb, var(--success) 40%, transparent)' }
            : { background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)' }}>
            {semDinheiro ? 'Mostrar R$' : 'Ocultar R$'}
          </Btn>
          <input ref={fileRef} type="file" accept=".ft,application/json" onChange={onOpenFt} style={{ display: 'none' }} />
          <Btn size="sm" onClick={() => fileRef.current?.click()}><FolderOpen size={14} />Abrir</Btn>
          <Btn size="sm" onClick={salvarFt}><Save size={14} />Salvar .ft</Btn>
          <Btn size="sm" onClick={salvarHtml}><Code2 size={14} />HTML</Btn>
          <Btn size="sm" onClick={() => setAnotar(true)}><PenTool size={14} />Anotar</Btn>
          <Btn size="sm" onClick={() => window.print()}><Printer size={14} />PDF</Btn>
          {!p.aprovado && <Btn size="sm" variant="primary" onClick={aprovar}><Check size={14} />Aprovar</Btn>}
        </div>

        <div style={card}>
          <h3 style={cardH}>Dados do pedido</h3>
          <div style={grid}>
            <Field label="Cliente"><Inp value={p.cliente} onChange={onCliente} list="dl-clientes" placeholder="Ex.: Escola João XXIII" /></Field>
            <Field label="CPF / CNPJ"><Inp value={p.cpf} onChange={v => updateHeader(curPed, 'cpf', v)} mono /></Field>
            <Field label="Departamento"><Inp value={p.depto} onChange={v => updateHeader(curPed, 'depto', v)} list="dl-dep" /></Field>
            <Field label="Embalagem"><Inp value={p.embalagem} onChange={v => updateHeader(curPed, 'embalagem', v)} list="dl-emb" /></Field>
            <Field label="Vendedor"><Inp value={p.vendedor} onChange={v => updateHeader(curPed, 'vendedor', v)} list="dl-vend" /></Field>
            <Field label="Contato"><Inp value={p.contato} onChange={v => updateHeader(curPed, 'contato', v)} mono /></Field>
            <Field label="Endereço"><Inp value={p.endereco ?? ''} onChange={v => updateHeader(curPed, 'endereco', v)} placeholder="Rua, nº, bairro — cidade/UF" /></Field>
            <Field label="Entrega"><Inp value={p.entrega} onChange={v => updateHeader(curPed, 'entrega', v)} placeholder="dd/mm/aaaa" /></Field>
            <Field label="Envio"><input type="date" value={toISO(p.envio)} onChange={e => updateHeader(curPed, 'envio', fromISO(e.target.value))} style={dateInp} /></Field>
            <Field label="Pagamento"><Inp value={p.pagamento} onChange={v => updateHeader(curPed, 'pagamento', v)} list="dl-pag" /></Field>
            <HeaderTagsBox p={p} idx={curPed} />
          </div>
        </div>

        {p.layouts.map((l, li) => <LayoutCard key={li} pIdx={curPed} lIdx={li} layout={l} canDelete={p.layouts.length > 1} semDinheiro={semDinheiro} onView={setViewImg} />)}

        <Btn onClick={() => useApp.getState().addLayout(curPed)} style={{ margin: '4px auto 20px', display: 'flex' }}><Plus size={16} />Adicionar layout</Btn>

        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total do orçamento</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{tot.pecas} pçs{semDinheiro ? '' : ` · R$ ${money(tot.valor)}`}</span>
        </div>
      </>}
        </div>
      </div>

      {viewImg && <ImgViewer src={viewImg} onClose={() => setViewImg(null)} />}
      {anotar && <AnotarModal onClose={() => setAnotar(false)} />}
      <style>{CSS}</style>
    </div>
  )
}

/* ---------- Coluna de Orçamentos (pasta de trabalho) ---------- */
function fmtDataEdicao(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso); if (isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date(); const hhmm = `${pad(d.getHours())}h${pad(d.getMinutes())}`
  const dias = Math.floor((now.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000)
  if (dias === 0) return `hoje ${hhmm}`
  if (dias === 1) return `ontem ${hhmm}`
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} ${hhmm}`
}

function OrcamentosColuna({ onOpen }: { onOpen: (p: Pedido) => void }) {
  const { pedidos, curPed } = useApp()
  const [q, setQ] = useState('')
  const atual = pedidos[curPed]?.pedido
  const list = pedidos
    .filter(p => (p.cliente + ' ' + p.pedido + ' ' + (p.criadoPor ?? '') + ' ' + (p.vendedor ?? '')).toLowerCase().includes(q.toLowerCase()))
    .slice().sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? ''))
  return (
    <aside className="orc-col">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Orçamentos</h3>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{list.length}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 10px', height: 36, marginBottom: 10 }}>
        <Search size={15} style={{ color: 'var(--text-subtle)', flex: '0 0 auto' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar orçamento…" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 13, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.length ? list.map(p => {
          const tot = pedTotais(p); const on = p.pedido === atual
          return (
            <button key={p.pedido} className="orc-card" onClick={() => onOpen(p)} title={`Abrir ${p.pedido} no editor`} style={{ ...orcCard, ...(on ? orcCardOn : {}) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--set-comercial)' }}>{p.pedido}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>R$ {money(tot.valor)}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: '3px 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.cliente || '(sem cliente)'}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}><User size={12} style={{ flex: '0 0 auto' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.criadoPor || p.vendedor || '—'}</span></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: '0 0 auto' }}><Clock size={12} />{fmtDataEdicao(p.atualizadoEm)}</span>
              </div>
            </button>
          )
        }) : <div style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '10px 4px' }}>Nenhum orçamento encontrado.</div>}
      </div>
    </aside>
  )
}

/* ---------- Módulo de Layout ---------- */
function LayoutCard({ pIdx, lIdx, layout, canDelete, semDinheiro, onView }: { pIdx: number; lIdx: number; layout: Layout; canDelete: boolean; semDinheiro: boolean; onView: (s: string) => void }) {
  const s = useApp(); const l = layout
  function selRef(v: string, opt?: { sub?: string }) {
    const m = REFERENCIAS.find(r => r.cod === opt?.sub || r.nome.toLowerCase() === v.trim().toLowerCase())
    if (m) s.patchLayout(pIdx, lIdx, { refCod: m.cod, ref: m.nome, design: m.design.map(t => ({ tag: t, cores: [] })), genero: l.genero ?? m.genero })
    else s.patchLayout(pIdx, lIdx, { ref: v })
  }
  const generoAtual = l.genero ?? REFERENCIAS.find(r => r.cod === l.refCod)?.genero ?? ''
  function readImg(f?: File) { if (!f) return; const r = new FileReader(); r.onload = () => s.setImg(pIdx, lIdx, String(r.result)); r.readAsDataURL(f) }

  return (
    <div style={card}>
      <div className="lay-grid" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: 18, alignItems: 'start' }}>
        {/* COLUNA ESQUERDA (1.7): Referência (topo) + imagem */}
        <div tabIndex={0} onPaste={e => { const it = [...e.clipboardData.items].find(i => i.type.startsWith('image/')); if (it) readImg(it.getAsFile() ?? undefined) }} style={{ outline: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="lay-badge" style={{ position: 'relative', flex: '0 0 auto' }}>
              <span style={lnum}>L-{String(lIdx + 1).padStart(2, '0')}</span>
              <div className="lay-badge-menu" style={layMenuWrap}>
                <div style={layMenuBox}>
                  <button onClick={() => s.copyLayout(pIdx, lIdx)} title="Copiar este layout" style={layMenuBtn}><Copy size={13} />Copiar</button>
                  <button onClick={() => s.pasteLayout(pIdx, lIdx)} disabled={!s.layoutClip} title="Colar sobre este layout" style={{ ...layMenuBtn, opacity: s.layoutClip ? 1 : .45, cursor: s.layoutClip ? 'pointer' : 'default' }}><ClipboardPaste size={13} />Colar</button>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}><Combo value={l.ref} onSelect={selRef} placeholder="Referência da peça" tintClass={generoClasse(generoAtual) ?? undefined}
              options={REFERENCIAS.map(r => ({ label: r.nome, value: r.nome, sub: r.cod }))}
              popoverTop={
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-subtle)', marginBottom: 5 }}>Gênero (cor do campo)</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {GENEROS.map(g => { const on = generoAtual.toLowerCase() === g.toLowerCase(); const cl = generoClasse(g); const dot = cl === 'gen-masc' ? '#2563EB' : cl === 'gen-fem' ? '#DB2777' : cl === 'gen-inf' ? '#0F766E' : 'var(--text-subtle)'
                      return <button key={g} onMouseDown={e => e.preventDefault()} onClick={() => s.setGenero(pIdx, lIdx, g)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: on ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)', background: on ? 'var(--bg-muted)' : 'var(--bg-surface)', color: 'var(--text)' }}>
                        <i style={{ width: 9, height: 9, borderRadius: '50%', background: dot }} />{g}
                      </button> })}
                  </div>
                </div>
              } /></div>
            <button onClick={() => s.duplicateLayout(pIdx, lIdx)} title="Duplicar layout" style={iconBtn}><Copy size={15} /></button>
            {canDelete && <button onClick={() => s.deleteLayout(pIdx, lIdx)} title="Excluir layout" style={iconBtn}><Trash2 size={15} /></button>}
          </div>
          {l.img
            ? <div style={{ position: 'relative' }}>
                <img src={l.img} onClick={() => onView(l.img!)} style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'zoom-in', display: 'block' }} />
                <button onClick={() => s.setImg(pIdx, lIdx, null)} title="Limpar imagem" style={{ ...iconBtn, position: 'absolute', top: 8, right: 8, background: 'var(--bg-surface)' }}><X size={14} /></button>
              </div>
            : <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); readImg(e.dataTransfer.files?.[0]) }} style={imgDrop}>
                <ImagePlus size={26} /><span style={{ fontSize: 13, marginTop: 6 }}>Enviar imagem</span>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>clique, arraste ou cole (Ctrl+V)</span>
                <input type="file" accept="image/*" onChange={e => readImg(e.target.files?.[0] ?? undefined)} style={{ display: 'none' }} />
              </label>}
        </div>

        {/* COLUNA DIREITA (1.3): ficha — vira grid no modo sem-dinheiro */}
        <div className={'ficha' + (semDinheiro ? ' sd' : '')}>
          {/* 1 · tecido — rótulo e botões (+/×) dentro da caixa (v172) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {l.tecidos.map((t, ti) => {
              const last = ti === l.tecidos.length - 1
              return (
                <Combo key={ti} value={t} rotulo="Tecido" upper placeholder="Tecido" onSelect={v => s.setTecido(pIdx, lIdx, ti, v)} options={TECIDOS.map(x => ({ label: x, value: x }))}
                  preAddon={last ? <button onClick={e => { e.stopPropagation(); s.addTecido(pIdx, lIdx) }} title="Adicionar tecido" style={{ ...inBoxBtn, color: 'var(--primary)', borderColor: 'var(--primary)' }}><Plus size={14} /></button> : undefined}
                  rightAddon={l.tecidos.length > 1 ? <button onClick={e => { e.stopPropagation(); s.removeTecido(pIdx, lIdx, ti) }} title="Remover tecido" style={inBoxBtn}><X size={13} /></button> : undefined} />
              )
            })}
          </div>
          {/* 2 · cor — rótulo e swatch dentro da caixa (v172) */}
          <div>
            <Combo value={l.cor} rotulo="Cor" upper placeholder="Cor" options={CORES.map(c => ({ label: c.nome, value: c.nome, hex: c.hex }))}
              onSelect={(v, opt) => s.patchLayout(pIdx, lIdx, { cor: v, corHex: opt?.hex ?? corHexPorNome(v) })}
              rightAddon={<span title="Cor" style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-strong)', flex: '0 0 auto', ...(l.cor ? { background: l.corHex } : { backgroundImage: 'repeating-linear-gradient(45deg,#EEE,#EEE 2px,#CFCFCF 2px,#CFCFCF 4px)' }) }} />} />
          </div>
          {/* 3 · design */}
          <DesignEditor pIdx={pIdx} lIdx={lIdx} layout={l} />
          {/* 4 · tabela */}
          <SizeTable pIdx={pIdx} lIdx={lIdx} layout={l} semDinheiro={semDinheiro} />
          {/* 5 · observações do layout — rich: códigos DTF/Subli + marca-texto */}
          <ObsEditor key={pIdx + '-' + lIdx} pIdx={pIdx} lIdx={lIdx} layout={l} />
        </div>
      </div>
    </div>
  )
}

/* ---------- Visualizador (zoom/pan) — portal no body, trava scroll do fundo ---------- */
function ImgViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const [z, setZ] = useState(1); const [tx, setTx] = useState(0); const [ty, setTy] = useState(0)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    // trava o scroll da página atrás (html + body) — a roda só dá zoom, não rola o fundo
    const de = document.documentElement
    const prevHtml = de.style.overflow, prevBody = document.body.style.overflow
    de.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); de.style.overflow = prevHtml; document.body.style.overflow = prevBody }
  }, [onClose])

  function onWheel(e: React.WheelEvent) {
    setZ(prev => { const nz = Math.min(6, Math.max(1, prev * (e.deltaY < 0 ? 1.2 : 0.83))); if (nz === 1) { setTx(0); setTy(0) } return nz })
  }
  // pan direto na imagem, com captura de ponteiro — move para qualquer canto, em qualquer zoom
  function imgDown(e: React.PointerEvent) {
    e.stopPropagation()
    drag.current = { x: e.clientX, y: e.clientY }
    try { imgRef.current?.setPointerCapture(e.pointerId) } catch { /* noop */ }
  }
  function imgMove(e: React.PointerEvent) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setTx(t => t + dx); setTy(t => t + dy)
  }
  function imgUp(e: React.PointerEvent) {
    if (!drag.current) return
    drag.current = null
    try { imgRef.current?.releasePointerCapture(e.pointerId) } catch { /* noop */ }
  }

  return createPortal(
    <div ref={overlayRef} style={imgModal} onWheel={onWheel} onPointerDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <img ref={imgRef} src={src} draggable={false} onDragStart={e => e.preventDefault()}
        onPointerDown={imgDown} onPointerMove={imgMove} onPointerUp={imgUp} onPointerCancel={imgUp}
        style={{ maxWidth: '94vw', maxHeight: '92vh', borderRadius: 8, transform: `translate(${tx}px,${ty}px) scale(${z})`, cursor: drag.current ? 'grabbing' : (z > 1 ? 'grab' : 'zoom-in'), transition: drag.current ? 'none' : 'transform .1s', userSelect: 'none', touchAction: 'none' }} />
      <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 12, opacity: .8, pointerEvents: 'none' }}>roda = zoom · arrastar = mover · Esc = fechar</div>
    </div>,
    document.body,
  )
}

/* ---------- Design ---------- */
function DesignEditor({ pIdx, lIdx, layout }: { pIdx: number; lIdx: number; layout: Layout }) {
  const s = useApp()
  const [pickOpen, setPickOpen] = useState(false)
  const pickRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pickOpen) return
    const h = (e: MouseEvent) => { if (pickRef.current && !pickRef.current.contains(e.target as Node)) setPickOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [pickOpen])
  return (
    <div>
      {/* caixa Design: rótulo dentro + tokens das técnicas + botão "+" (v172) */}
      <div style={designBox}>
        <span style={comboRotulo}>Design</span>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {layout.design.map(d => (
            <span key={d.tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 5px 0 9px', borderRadius: 999, background: cvar(TECNICAS[d.tag].cor), color: '#fff', fontSize: 11, fontWeight: 700 }}>
              {TECNICAS[d.tag].label}
              <button onClick={() => s.toggleDesign(pIdx, lIdx, d.tag)} title="Remover" style={{ border: 'none', background: 'rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', lineHeight: 1, borderRadius: 999, width: 15, height: 15, display: 'grid', placeItems: 'center', padding: 0 }}><X size={11} /></button>
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', flex: '0 0 auto' }} ref={pickRef}>
          <button onClick={() => setPickOpen(o => !o)} title="Adicionar técnica de impressão" style={{ ...inBoxBtn, color: 'var(--primary)', borderColor: 'var(--primary)' }}><Plus size={14} /></button>
          {pickOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--sh-4)', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, width: 240 }}>
              {DESIGN_ORDER.map(tag => {
                const on = layout.design.some(d => d.tag === tag)
                return <button key={tag} onClick={() => s.toggleDesign(pIdx, lIdx, tag)}
                  style={{ height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: on ? '1.5px solid transparent' : '1.5px solid var(--border-strong)', background: on ? cvar(TECNICAS[tag].cor) : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{TECNICAS[tag].label}</button>
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Marcadores do cabeçalho (URGENTE/ATRASADO) no estilo do Design ---------- */
function HeaderTagsBox({ p, idx }: { p: Pedido; idx: number }) {
  const toggle = useApp(s => s.toggleHeaderObsTag)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [open])
  const tags = p.obsTags ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={fieldLbl}>Marcadores</label>
      <div style={designBox}>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {tags.length ? tags.map(t => { const o = OBS_TAGS.find(x => x.tag === t); return (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 5px 0 9px', borderRadius: 999, background: o?.cor ?? 'var(--text-muted)', color: '#fff', fontSize: 11, fontWeight: 800 }}>
              {t}<button onClick={() => toggle(idx, t)} title="Remover" style={{ border: 'none', background: 'rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', borderRadius: 999, width: 15, height: 15, display: 'grid', placeItems: 'center', padding: 0 }}><X size={11} /></button>
            </span>
          ) }) : <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Sem marcadores</span>}
        </div>
        <div style={{ position: 'relative', flex: '0 0 auto' }} ref={ref}>
          <button onClick={() => setOpen(o => !o)} title="Adicionar marcador" style={{ ...inBoxBtn, color: 'var(--primary)', borderColor: 'var(--primary)' }}><Plus size={14} /></button>
          {open && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--sh-4)', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, width: 180 }}>
              {OBS_TAGS.map(o => { const on = tags.includes(o.tag); return (
                <button key={o.tag} onClick={() => toggle(idx, o.tag)} style={{ height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: on ? '1.5px solid transparent' : '1.5px solid var(--border-strong)', background: on ? o.cor : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>{o.tag}</button>
              ) })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Observação rich: códigos de cor (DTF/Subli) + marca-texto (v172) ---------- */
function txtContrast(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return '#111'
  const n = parseInt(m[1], 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#111' : '#fff'
}
const TEXTO_CORES = ['#C6161B', '#1F6FEB', '#0B7A3B', '#111214', '#E0218A']
const MARCA_CORES = ['#FFF27A', '#FF9EC7', '#B6F2C1']

function ObsEditor({ pIdx, lIdx, layout }: { pIdx: number; lIdx: number; layout: Layout }) {
  const s = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const selRef = useRef<Range | null>(null)
  const [tab, setTab] = useState<'DTF' | 'Subli'>('DTF')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(false)
  const [bar, setBar] = useState<{ x: number; y: number } | null>(null)
  const pickRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (ref.current) ref.current.innerHTML = layout.obs || '' }, [])
  useEffect(() => {
    if (!pick) return
    const h = (e: MouseEvent) => { if (pickRef.current && !pickRef.current.contains(e.target as Node)) setPick(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [pick])

  const save = () => { if (ref.current) s.setObs(pIdx, lIdx, ref.current.innerHTML) }
  const guardaSel = () => { const sel = window.getSelection(); if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) selRef.current = sel.getRangeAt(0).cloneRange() }
  const focaSel = () => { ref.current?.focus(); const sel = window.getSelection(); if (selRef.current && sel) { sel.removeAllRanges(); sel.addRange(selRef.current) } }
  /** mostra a barra flutuante acima da seleção (só quando há texto marcado) */
  const atualizaBar = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) { setBar(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (!rect.width && !rect.height) { setBar(null); return }
    guardaSel(); setBar({ x: rect.left + rect.width / 2, y: rect.top })
  }
  const cmd = (c: string, v?: string) => { focaSel(); document.execCommand('styleWithCSS', false, 'true'); document.execCommand(c, false, v); save(); atualizaBar() }
  const addCor = (tech: TecnicaKey, code: string) => { if (!layout.design.some(d => d.tag === tech)) s.toggleDesign(pIdx, lIdx, tech); s.addDesignCor(pIdx, lIdx, tech, code) }
  const lista = (tab === 'DTF' ? DTF_CORES : SB_CORES).filter(c => c.code.toUpperCase().includes(q.toUpperCase())).slice(0, 240)
  const codeRows = (['DTF', 'Subli'] as TecnicaKey[])
    .map(tech => { const d = layout.design.find(x => x.tag === tech); return d && d.cores.length ? { tech, cores: d.cores } : null })
    .filter(Boolean) as { tech: TecnicaKey; cores: string[] }[]

  return (
    <div style={obsBox}>
      {/* códigos de cor — agrupados por técnica (tag na frente), cada uma em sua linha */}
      {codeRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '10px 12px 0' }}>
          {codeRows.map(r => (
            <div key={r.tech} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <TecTag tec={r.tech} style={{ height: 22, fontSize: 10 }} />
              {r.cores.map(code => (
                <span key={code} style={codChip}>
                  <i style={{ width: 12, height: 12, borderRadius: 3, background: codigoHex(r.tech, code), border: '1px solid rgba(0,0,0,.15)', flex: '0 0 auto' }} />{code}
                  <button onClick={() => s.removeDesignCor(pIdx, lIdx, r.tech, code)} title="Remover" style={codChipX}><X size={11} /></button>
                </span>
              ))}
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', marginTop: 3 }} />
        </div>
      )}

      <div ref={ref} className="obsrich" contentEditable suppressContentEditableWarning
        data-ph="Observações da peça…"
        onInput={save} onBlur={() => { save(); setTimeout(() => setBar(null), 150) }}
        onMouseUp={atualizaBar} onKeyUp={atualizaBar}
        style={obsInner} />

      {/* ícone no canto inferior direito → inserir código de cor (DTF/Sublimação) */}
      <div ref={pickRef} style={{ position: 'absolute', right: 8, bottom: 8 }}>
        <button onClick={() => setPick(p => !p)} title="Inserir código de cor (DTF/Sublimação)" style={obsIcon}><Palette size={15} /></button>
        {pick && (
          <div style={{ ...codPop, top: 'auto', bottom: 'calc(100% + 6px)', right: 0 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {(['DTF', 'Subli'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ ...codTab, ...(tab === t ? codTabOn : {}) }}>{t === 'DTF' ? 'DTF' : 'Sublimação'}</button>)}
            </div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar número…" style={codBusca} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 190, overflowY: 'auto', marginTop: 6 }}>
              {lista.map(c => <button key={c.code} title={c.code} onClick={() => addCor(tab === 'DTF' ? 'DTF' : 'Subli', c.code)} style={{ width: 34, height: 26, borderRadius: 5, border: '1px solid var(--border-strong)', background: c.hex, cursor: 'pointer', fontSize: 8, color: txtContrast(c.hex), fontFamily: 'var(--font-mono)' }}>{c.code}</button>)}
            </div>
          </div>
        )}
      </div>

      {/* barra flutuante de formatação — só aparece com texto selecionado (v172) */}
      {bar && createPortal(
        <div style={{ position: 'fixed', left: bar.x, top: bar.y - 48, transform: 'translateX(-50%)', zIndex: 96, ...selBar }} onMouseDown={e => e.preventDefault()}>
          {TEXTO_CORES.map(c => <button key={c} title="Cor do texto" onClick={() => cmd('foreColor', c)} style={{ ...selSw, background: c }} />)}
          <span style={selSep} />
          {MARCA_CORES.map(c => <button key={c} title="Marca-texto" onClick={() => cmd('hiliteColor', c)} style={{ ...selSw, background: c, color: '#111', fontWeight: 800, fontSize: 11, lineHeight: 1 }}>A</button>)}
          <span style={selSep} />
          <button title="Limpar formatação" onClick={() => cmd('removeFormat')} style={selBtn}><Eraser size={13} /></button>
        </div>, document.body)}
    </div>
  )
}

/* ---------- Tabela de tamanhos (toggle adulto/infantil no cabeçalho Tam) ---------- */
function SizeTable({ pIdx, lIdx, layout, semDinheiro }: { pIdx: number; lIdx: number; layout: Layout; semDinheiro: boolean }) {
  const s = useApp(); const l = layout
  const linhas = ordemTamanhos(l)
  const inf = l.grade === 'infantil'
  let totQ = 0, totV = 0
  return (
    <div>
      <table className="sizetbl" style={{ ...stbl, width: semDinheiro ? 'auto' : '100%' }}>
        <thead><tr>
          <th style={{ ...stTh, textAlign: 'center', minWidth: 44 }}>
            <button className="gradebtn" onClick={() => s.setGrade(pIdx, lIdx, inf ? 'adulto' : 'infantil')} style={gradeBtn}
              title={inf ? 'Grade infantil — clique para adulto' : 'Grade adulto — clique para infantil'}>
              {inf ? <Baby size={16} /> : <User size={16} />}
            </button>
          </th>
          <th style={{ ...stTh, width: 50 }}>Qtd</th>{!semDinheiro && <th style={{ ...stTh, width: 60 }}>Uni (R$)</th>}{!semDinheiro && <th style={{ ...stTh, minWidth: 80 }}>Total (R$)</th>}
        </tr></thead>
        <tbody>
          {linhas.map(tam => {
            const t = l.tamanhos[tam] ?? { qtd: 0, uni: 0 }; totQ += t.qtd; totV += t.qtd * t.uni
            const cross = (l.grade === 'adulto' && isInfantil(tam)) || (l.grade === 'infantil' && !isInfantil(tam))
            const cs: CSSProperties = cross ? (l.grade === 'adulto' ? { background: 'var(--sig-inf-bg)', color: 'var(--sig-inf-fg)' } : { background: 'var(--sig-adu-bg)', color: 'var(--sig-adu-fg)' }) : {}
            return (
              <tr key={tam}>
                <td style={{ ...stTd, textAlign: 'center', fontFamily: 'var(--font-ui)', fontWeight: cross ? 700 : 600, ...cs }}>{tam}</td>
                <td style={{ ...stTd, ...cs, width: 50 }}><input type="number" inputMode="numeric" maxLength={4} value={t.qtd || ''} onChange={e => s.setSize(pIdx, lIdx, tam, 'qtd', parseFloat(e.target.value.slice(0, 4)) || 0)} style={{ ...cellInp, width: 42, minWidth: 0 }} /></td>
                {!semDinheiro && <td style={{ ...stTd, ...cs, width: 60 }}><input type="number" inputMode="decimal" value={t.uni || ''} onChange={e => s.setSize(pIdx, lIdx, tam, 'uni', parseFloat(e.target.value) || 0)} style={{ ...cellInp, width: 52, minWidth: 0 }} /></td>}
                {!semDinheiro && <td style={{ ...stTd, ...cs, minWidth: 80 }}>{t.qtd * t.uni > 0 ? money(t.qtd * t.uni) : ''}</td>}
              </tr>
            )
          })}
        </tbody>
        <tfoot><tr>
          <td style={{ ...stTd, textAlign: 'center', fontWeight: 700, background: 'var(--bg-muted)' }}>Total</td>
          <td style={{ ...stTd, fontWeight: 700, background: 'var(--bg-muted)' }}>{totQ}</td>
          {!semDinheiro && <td style={{ ...stTd, background: 'var(--bg-muted)' }}>—</td>}
          {!semDinheiro && <td style={{ ...stTd, fontWeight: 700, background: 'var(--bg-muted)', minWidth: 80 }}>{money(totV)}</td>}
        </tr></tfoot>
      </table>
    </div>
  )
}

const card: CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--sh-1)', padding: 16, marginBottom: 12 }
const cardH: CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 12 }
const fieldLbl: CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }
const actionBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', borderRadius: 12, padding: '10px 14px', position: 'sticky', top: 66, zIndex: 20, transition: 'background .2s var(--ease), color .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease)' }
const tabbar: CSSProperties = { display: 'flex', gap: 3, overflowX: 'auto', overflowY: 'hidden', borderBottom: '1px solid var(--border)', marginBottom: 12 }
const tab: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '8px 8px 0 0', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative', top: 1 }
const tabOn: CSSProperties = { background: 'var(--primary)', color: 'var(--primary-fg)', borderColor: 'var(--primary)', top: 0 }
const tabNew: CSSProperties = { width: 34, height: 34, borderRadius: '8px 8px 0 0', border: '1px solid var(--border)', borderBottom: 'none', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }
const lnum: CSSProperties = { display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: '.02em', color: 'var(--info-fg)', background: 'var(--info-bg)', border: '1px solid color-mix(in srgb, var(--set-comercial) 30%, transparent)', borderRadius: 8, cursor: 'default', userSelect: 'none' }
const iconBtn: CSSProperties = { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const miniBtn: CSSProperties = { width: 'var(--control-h-lg)', height: 'var(--control-h-lg)', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const undoBtn: CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const addBtnInline: CSSProperties = { border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }
const inBoxBtn: CSSProperties = { width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const designBox: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--control-h-lg)', padding: '5px 8px 5px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)' }
const comboRotulo: CSSProperties = { flex: '0 0 auto', fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)' }
const gradeBtn: CSSProperties = { display: 'inline-grid', placeItems: 'center', width: 26, height: 26, padding: 0, background: 'transparent', border: '1px solid transparent', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', margin: '0 auto' }
const stbl: CSSProperties = { borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 2 }
const stTh: CSSProperties = { padding: '3px 5px', textAlign: 'center', background: 'transparent', color: 'var(--text-muted)', fontWeight: 500, fontSize: 10 }
const stTd: CSSProperties = { padding: '2px 4px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }
const cellInp: CSSProperties = { width: '100%', minWidth: 42, height: 28, padding: '0 4px', border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', textAlign: 'center' }
const ta: CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }
const dateInp: CSSProperties = { height: 'var(--control-h-lg)', width: '100%', padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none' }
const miniSel: CSSProperties = { height: 22, padding: '0 4px', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 11, outline: 'none' }
const orcCard: CSSProperties = { textAlign: 'left', width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', boxShadow: 'var(--sh-1)', font: 'inherit', color: 'var(--text)', transition: 'border-color .12s var(--ease), box-shadow .12s var(--ease)' }
const orcCardOn: CSSProperties = { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' }
const imgDrop: CSSProperties = { display: 'grid', placeItems: 'center', gap: 2, minHeight: 240, border: '1.5px dashed var(--border-strong)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--bg-surface-2)', textAlign: 'center', padding: 20 }
const imgModal: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 120, display: 'grid', placeItems: 'center', cursor: 'zoom-out', touchAction: 'none', overscrollBehavior: 'contain' }
const tabClose: CSSProperties = { display: 'inline-grid', placeItems: 'center', width: 18, height: 18, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', flex: '0 0 auto', opacity: .75 }
// wrap = ponte de hover transparente (encostada no badge, sem gap); box = a caixa visível
const layMenuWrap: CSSProperties = { position: 'absolute', top: '100%', left: 0, zIndex: 30, paddingTop: 6, whiteSpace: 'nowrap' }
const layMenuBox: CSSProperties = { display: 'flex', gap: 4, padding: 5, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--sh-4)' }
const layMenuBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }
const obsBox: CSSProperties = { position: 'relative', width: '100%', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg-surface)' }
const obsInner: CSSProperties = { minHeight: 56, padding: '9px 12px', paddingRight: 42, paddingBottom: 14, color: 'var(--text)', font: 'inherit', fontSize: 13, lineHeight: 1.5, outline: 'none' }
const codChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 4px 0 6px', borderRadius: 999, background: 'var(--bg-muted)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }
const codChipX: CSSProperties = { border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, width: 14, height: 14 }
const obsIcon: CSSProperties = { width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--primary)', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: 'var(--sh-1)' }
const selBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', background: 'var(--n-900)', borderRadius: 10, boxShadow: 'var(--sh-4)' }
const selSw: CSSProperties = { width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,.28)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, flex: '0 0 auto' }
const selSep: CSSProperties = { width: 1, height: 18, background: 'rgba(255,255,255,.22)', margin: '0 2px' }
const selBtn: CSSProperties = { width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,.28)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const codPop: CSSProperties = { position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, width: 260, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--sh-4)', padding: 8 }
const codTab: CSSProperties = { flex: 1, height: 28, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }
const codTabOn: CSSProperties = { background: 'var(--primary)', color: 'var(--primary-fg)', borderColor: 'var(--primary)' }
const codBusca: CSSProperties = { width: '100%', height: 32, padding: '0 10px', border: '1px solid var(--border-strong)', borderRadius: 7, background: 'var(--bg-surface)', color: 'var(--text)', font: 'inherit', fontSize: 12, outline: 'none' }

const CSS = `
.lay-badge-menu{opacity:0;pointer-events:none;transform:translateY(-3px);transition:opacity .12s var(--ease),transform .12s var(--ease)}
.lay-badge:hover .lay-badge-menu,.lay-badge:focus-within .lay-badge-menu{opacity:1;pointer-events:auto;transform:none}
.obsrich .cod-chip{cursor:default}
.comercial-layout{display:grid;grid-template-columns:262px minmax(0,1fr);gap:18px;align-items:start}
.orc-col{position:sticky;top:66px;align-self:start;max-height:calc(100vh - 84px);overflow:auto;padding:3px 5px 12px}
.orc-card:hover{border-color:var(--border-strong);box-shadow:var(--sh-2)}
@media(max-width:1120px){.comercial-layout{grid-template-columns:1fr}.orc-col{position:static;max-height:none;order:2;max-height:420px}.comercial-editor{order:1}}
.ficha{display:flex;flex-direction:column;gap:14px}
@media(min-width:821px){
  .ficha.sd{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto auto 1fr;column-gap:14px;row-gap:12px;align-items:start}
  .ficha.sd>:nth-child(4){grid-column:1;grid-row:1 / span 4}
  .ficha.sd>:nth-child(1){grid-column:2;grid-row:1}
  .ficha.sd>:nth-child(2){grid-column:2;grid-row:2}
  .ficha.sd>:nth-child(3){grid-column:2;grid-row:3}
  .ficha.sd>:nth-child(5){grid-column:2;grid-row:4;align-self:stretch}
}
@media(max-width:820px){.lay-grid{grid-template-columns:1fr!important}}
/* barra de ações: no fluxo usa o esquema da página; grudada (stuck) inverte
   para contrastar — escura no tema claro, clara no tema dark. Sobrescreve os
   tokens localmente para que todos os botões/textos filhos reajam. */
.editbar{background:var(--bg-surface);border:1px solid var(--border);box-shadow:var(--sh-1)}
.editbar.stuck{
  background:var(--nav-bg);border-color:var(--nav-border);color:var(--nav-fg-strong);box-shadow:var(--sh-4);
  --bg-surface:rgba(255,255,255,.06);--bg-surface-2:rgba(255,255,255,.06);--bg-muted:rgba(255,255,255,.10);--bg-hover:rgba(255,255,255,.12);
  --border:var(--nav-border);--border-strong:rgba(255,255,255,.18);
  --text:var(--nav-fg-strong);--text-muted:var(--nav-fg);--text-subtle:var(--nav-group);
}
[data-theme="dark"] .editbar.stuck{
  background:#FFFFFF;border-color:#E4E8ED;color:#161A20;box-shadow:var(--sh-4);
  --bg-surface:#FFFFFF;--bg-surface-2:#FBFCFD;--bg-muted:#EEF1F4;--bg-hover:#EEF1F4;
  --border:#E4E8ED;--border-strong:#D6DCE3;
  --text:#161A20;--text-muted:#5D6775;--text-subtle:#68727E;
}
/* tabela de tamanhos: grade só com topo+esquerda; corpo sem borda externa vertical (v172) */
.sizetbl th,.sizetbl td{border:none;border-top:1px solid var(--border);border-left:1px solid var(--border)}
.sizetbl th:first-child,.sizetbl td:first-child{border-left:none}
.sizetbl tr:last-child td{border-bottom:1px solid var(--border)}
.sizetbl thead th:first-child{border-left:1px solid var(--border);border-top-left-radius:8px}
.sizetbl thead th:last-child{border-right:1px solid var(--border);border-top-right-radius:8px}
.sizetbl tfoot td:first-child{border-bottom-left-radius:8px}
.sizetbl tfoot td:last-child{border-bottom-right-radius:8px}
.sizetbl .gradebtn:hover{border-color:var(--primary);color:var(--primary)}
.sizetbl input[type=number]::-webkit-inner-spin-button,.sizetbl input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.sizetbl input[type=number]{-moz-appearance:textfield;appearance:textfield}
`
