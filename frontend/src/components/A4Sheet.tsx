import type { CSSProperties, ReactNode } from 'react'
import { TECNICAS, ordemTamanhos, isInfantil, pedTotais, money, codigoHex, generoClasse, type Pedido, type Layout, type Anotacao, type DesignTag } from '../store/model'
import { cvar } from './ui'
import Logo from './Logo'

/* =====================================================================
   Corpo do documento A4 — visual portado do editor de arquivo único
   (v3.294), o "beta" deste CRM. NÃO é cópia: o HTML/CSS de lá foi lido,
   entendido e reescrito aqui em JSX sobre o modelo Pedido/Layout.

   O que veio de lá (e por quê):
   · CABEÇALHO "variante C" — grade 4 col × 3 fileiras iguais, com gap de
     1px sobre fundo cinza: AS LINHAS SÃO O GAP, não bordas de célula.
     É isso que deixa o `borderRadius` + `overflow:hidden` funcionar sem
     nunca cortar a borda de uma célula. A ordem dos filhos É o layout
     (fluxo automático); só a logo tem posição fixa (col 1, 2 fileiras).
   · CONTATO saiu do cabeçalho visível (segue no modelo, contrato .ft).
   · WARN-BAR de contorno (não faixa cheia) — faixa cheia competia com o
     vermelho do Pedido Nº e do Total.
   · MÓDULO DE LAYOUT na escala 0,70 do cartão do CRM (42px → 29,4px).
   · TABELA MINI com `border-collapse:separate` — é a única forma do
     radius de thead/tfoot funcionar; cada célula desenha só top+left.
   · RODAPÉ com linha, pino, dados da empresa e os totais à direita.

   Cores fixas claras (o documento não segue o tema do app). Estilos
   inline são intencionais aqui: esta é a folha do Editor, exceção à
   regra de "nada de aparência inline" que vale para as páginas.
   ===================================================================== */

/* ---- paleta do papel (hexes do Design Kit v5, congelados) ---- */
const BD = '#E4E8ED'          // --border
const RED = '#C6161B'         // --red-600 / vermelho Fourtime
const RED_SOFT = '#FCE8E9'    // vermelho suave
const RED_BD = '#F4C7C9'
const TXT = '#161A20'         // --text
const MED = '#5D6775'         // --text-muted
const SUT = '#68727E'         // --text-subtle
const MUTED = '#EEF1F4'       // --bg-muted
const SURF2 = '#FBFCFD'       // --bg-surface-2
const ADU_BG = '#E3EEFB', ADU_BD = '#BBD3F5', ADU_TXT = '#12213F'
const WARN = '#B45309'
const F_UI = "'IBM Plex Sans',sans-serif"
const F_MONO = "'IBM Plex Mono',monospace"
const F_DOC = "'Roboto',sans-serif"

/* tintas de gênero do campo Referência (mesma paleta do index.css) */
const GEN: Record<string, { bg: string; bd: string; tx: string }> = {
  'gen-masc': { bg: '#E3EEFB', bd: '#BBD3F5', tx: '#12213F' },
  'gen-fem': { bg: '#FCE7F1', bd: '#F5C6DE', tx: '#7A123F' },
  'gen-inf': { bg: '#E4F3EC', bd: '#BFE3D2', tx: '#0F5138' },
}

export default function A4Sheet({ p, semDinheiro, children }: { p: Pedido; semDinheiro: boolean; children?: ReactNode }) {
  const tot = pedTotais(p)
  return (
    <div style={{ position: 'relative', fontFamily: F_DOC, color: TXT, background: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ================= CABEÇALHO (variante C) =================
          [LOGO ] | CLIENTE  | CPF/CNPJ     | PEDIDO Nº | ENVIO
          [LOGO ] | VENDEDOR | DEPARTAMENTO | ENTREGA
          STATUS  | EMBALAGEM| PAGAMENTO    | TOTAL
          Reordenar os filhos MOVE o campo na folha. */}
      <div style={hdGrid}>
        <div style={logoBox}><Logo variant="dark" height={22} /></div>

        <Campo label="Cliente" v={p.cliente} />
        <Campo label="CPF/CNPJ" v={p.cpf} mono />
        <div style={{ ...campo, flexDirection: 'row', padding: 0, gap: 0 }}>
          {/* o Nº é o campo mais consultado: fica com a fatia maior */}
          <Meia label="Pedido Nº" v={p.pedido} flex={1.2} destaque />
          <Meia label="Envio" v={p.envio} flex={1.15} mono borda />
        </div>

        <Campo label="Vendedor" v={p.vendedor} />
        <Campo label="Departamento" v={p.depto} />
        <Campo label="Entrega" v={p.entrega} mono />

        {/* STATUS — sem rótulo e sem placeholder (v3.294) */}
        <div style={{ ...campo, justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', minHeight: 15 }}>
            {(p.obsTags ?? []).map(t => (
              <span key={t} style={{ ...tagOut, color: t === 'URGENTE' ? RED : WARN, borderColor: t === 'URGENTE' ? RED : WARN }}>{t}</span>
            ))}
          </div>
        </div>
        <Campo label="Embalagem" v={p.embalagem} />
        <Campo label="Pagamento" v={p.pagamento} />
        <div style={campo}>
          <span style={hdLabel}>Total</span>
          <div style={{ width: '100%', display: 'flex', alignItems: 'baseline', gap: '0 4px', minWidth: 0, flexWrap: 'wrap' }}>
            <span style={{ minWidth: '4ch', textAlign: 'right', fontWeight: 700, fontSize: 11, color: TXT, fontFamily: F_MONO, fontVariantNumeric: 'tabular-nums' }}>{tot.pecas}</span>
            <span style={{ fontSize: 9, color: SUT, fontFamily: F_UI }}>pç</span>
            {!semDinheiro && <>
              <span style={{ width: 1, height: 12, background: BD, margin: '0 1px' }} />
              <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 11, color: RED, fontFamily: F_MONO, fontVariantNumeric: 'tabular-nums' }}>R$ {money(tot.valor)}</span>
            </>}
          </div>
        </div>
      </div>

      {/* ============ AVISO — contorno, não faixa cheia ============ */}
      <div style={warnBar}>
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, flexShrink: 0, stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{semDinheiro ? 'Leia atentamente o pedido para evitar possíveis falhas de atenção' : 'Não nos responsabilizamos por erros em orçamento após aprovação do cliente'}</span>
      </div>

      {p.obs && <div style={obsGeral}>{p.obs}</div>}

      {/* ==================== MÓDULOS DE LAYOUT ==================== */}
      {p.layouts.map((l, li) => <LayModulo key={li} l={l} n={li + 1} semDinheiro={semDinheiro} />)}

      {/* ======================== RODAPÉ ========================== */}
      <footer style={{ marginTop: 'auto', paddingTop: 9 }}>
        <div style={{ borderTop: `1px solid ${BD}`, marginBottom: 6 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={rodEnd}>
            <svg viewBox="0 0 24 24" style={{ width: 10.5, height: 10.5, flexShrink: 0, stroke: SUT, fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
            </svg>
            <b style={{ fontWeight: 600, color: TXT }}>Fourtime Ltda</b>
            <span style={rodSep} />
            <span>Trecho 5, n° 150 · Quadra 4 · Lote 12 · Goiânia 2</span>
            <span style={rodSep} />
            <span>CNPJ 25.260.940/0001-40</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            <div style={rodTot}><span style={rodLbl}>Peças</span><span style={rodVal}>{tot.pecas}</span></div>
            {!semDinheiro && <div style={rodTot}><span style={rodLbl}>Total</span><span style={{ ...rodVal, color: RED, fontWeight: 700 }}>R$ {money(tot.valor)}</span></div>}
          </div>
        </div>
      </footer>

      {children}
    </div>
  )
}

/* ---------------- cabeçalho: células ---------------- */
function Campo({ label, v, mono }: { label: string; v: string; mono?: boolean }) {
  return (
    <div style={campo}>
      <span style={hdLabel}>{label}</span>
      <div style={{ ...hdVal, fontFamily: mono ? F_MONO : F_UI }}>{v || '—'}</div>
    </div>
  )
}
function Meia({ label, v, flex, mono, borda, destaque }: { label: string; v: string; flex: number; mono?: boolean; borda?: boolean; destaque?: boolean }) {
  return (
    <div style={{ flex, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, padding: '4px 6px', borderLeft: borda ? `1px solid ${BD}` : undefined }}>
      <span style={hdLabel}>{label}</span>
      <div style={{ ...hdVal, fontFamily: mono || destaque ? F_MONO : F_UI, ...(destaque ? { color: RED, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.02em' } : null) }}>{v || '—'}</div>
    </div>
  )
}

/* ---------------- módulo de layout ---------------- */
function LayModulo({ l, n, semDinheiro }: { l: Layout; n: number; semDinheiro: boolean }) {
  const g = GEN[generoClasse(l.genero) ?? ''] ?? null
  const tecidos = l.tecidos.filter(t => t && t.trim())
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: 12, marginTop: 11, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, marginBottom: 7 }}>
          <span style={selo}>L-{String(n).padStart(2, '0')}</span>
          <div style={{ ...caixa, flex: 1, minWidth: 0, ...(g ? { background: g.bg, borderColor: g.bd } : null) }}>
            <span style={{ ...valUp, fontSize: 9.8, textTransform: 'none', color: g ? g.tx : TXT, fontWeight: 500 }}>{l.ref || 'Referência'}</span>
          </div>
        </div>
        <div style={l.img ? imgCheia : imgVazia}>
          {l.img
            ? <img src={l.img} alt="" style={{ width: '100%', height: 'auto', maxHeight: 393, objectFit: 'contain', objectPosition: 'center top', display: 'block' }} />
            : <span className="lay-img-txt" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: SUT }}>sem imagem</span>}
        </div>
        {l.obs && <div style={layArea} dangerouslySetInnerHTML={{ __html: l.obs }} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9.8 }}>
        {(tecidos.length ? tecidos : ['—']).map((t, i) => (
          <div key={i} style={caixa}>
            {i === 0 && <span style={rotulo}>Tecido</span>}
            <span style={valUp}>{t}</span>
          </div>
        ))}
        <div style={caixa}>
          <span style={rotulo}>Cor</span>
          <span style={{ ...valUp, flex: 1 }}>{l.cor || '—'}</span>
          <span style={{ width: 17, height: 17, flexShrink: 0, borderRadius: 6, border: `1px solid ${BD}`, background: l.corHex || 'transparent' }} />
        </div>
        <div style={{ ...caixa, alignItems: 'flex-start', padding: '5px 6px 5px 8px' }}>
          <span style={{ ...rotulo, paddingTop: 3 }}>Design</span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3.5 }}>
            {l.design.length ? l.design.map(d => <Pill key={d.tag} d={d} />) : <span style={{ ...valUp, color: SUT }}>—</span>}
          </div>
        </div>
        <SizeTable l={l} semDinheiro={semDinheiro} />
      </div>
    </div>
  )
}

/* pílula de design: a tag se solda à bandeja de cores dentro de UMA
   moldura só; sem cores, ela fica redonda e solta. */
function Pill({ d }: { d: DesignTag }) {
  const cor = cvar(TECNICAS[d.tag].cor)
  const tag = (
    <span style={{ display: 'inline-flex', alignItems: 'center', flex: '0 0 auto', height: 15.4, padding: '0 6.3px', borderRadius: d.cores.length ? '999px 0 0 999px' : 999, background: cor, color: '#fff', fontFamily: F_UI, fontSize: 7.7, fontWeight: 700, lineHeight: 1, letterSpacing: '.02em', order: d.cores.length ? undefined : 2 }}>{TECNICAS[d.tag].label}</span>
  )
  if (!d.cores.length) return tag
  /* com cores a peça ocupa a fileira inteira e sobe (order 1) — as tags
     soltas se juntam embaixo, como no v294. */
  return (
    <span style={{ display: 'inline-flex', alignItems: 'stretch', order: 1, flexBasis: '100%', maxWidth: '100%', minWidth: 0, borderRadius: 999, overflow: 'hidden', background: '#fff', border: `1px solid ${BD}` }}>
      {tag}
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 3.5, rowGap: 2, padding: '0 5.6px', minWidth: 0 }}>
        {d.cores.map(c => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: F_MONO, fontSize: 7.7, fontWeight: 600, color: TXT, fontVariantNumeric: 'tabular-nums' }}>
            <i style={{ width: 9.8, height: 9.8, borderRadius: 2.8, border: '1px solid rgba(17,18,20,.15)', background: codigoHex(d.tag, c), display: 'inline-block' }} />{c}
          </span>
        ))}
      </span>
    </span>
  )
}

/* ---------------- tabela mini ----------------
   `separate` + cada célula desenhando só top/left é o que permite o
   radius nos cantos de thead/tfoot. O corpo fica aberto nas laterais;
   só a cabeça e o rodapé fecham a cápsula. */
function SizeTable({ l, semDinheiro }: { l: Layout; semDinheiro: boolean }) {
  const linhas = ordemTamanhos(l); let q = 0, v = 0
  const cols = semDinheiro ? 2 : 4
  return (
    <table style={tbl}>
      <thead>
        <tr>
          <th style={{ ...cabeca, borderLeft: `1px solid ${BD}`, borderTopLeftRadius: 6, fontFamily: F_UI }}>Tam</th>
          <th style={{ ...cabeca, ...(cols === 2 ? { borderRight: `1px solid ${BD}`, borderTopRightRadius: 6 } : null) }}>Qtd</th>
          {!semDinheiro && <th style={cabeca}>Uni (R$)</th>}
          {!semDinheiro && <th style={{ ...cabeca, borderRight: `1px solid ${BD}`, borderTopRightRadius: 6 }}>Total (R$)</th>}
        </tr>
      </thead>
      <tbody>
        {linhas.map(tam => {
          const t = l.tamanhos[tam] ?? { qtd: 0, uni: 0 }; q += t.qtd; v += t.qtd * t.uni
          const cross = (l.grade === 'adulto' && isInfantil(tam)) || (l.grade === 'infantil' && !isInfantil(tam))
          const tinta = !cross ? null
            : l.grade === 'adulto' ? { bg: RED_SOFT, fg: RED, bd: RED_BD }
              : { bg: ADU_BG, fg: ADU_TXT, bd: ADU_BD }
          const cs: CSSProperties = tinta
            ? { background: tinta.bg, color: tinta.fg, borderTopColor: tinta.bd, boxShadow: `inset 0 -1px 0 ${tinta.bd}` }
            : {}
          const bl = tinta ? { borderLeftColor: tinta.bd } : {}
          return (
            <tr key={tam}>
              <td style={{ ...cel, borderLeft: 'none', fontFamily: F_UI, fontWeight: 600, ...cs }}>{tam}</td>
              <td style={{ ...cel, ...cs, ...bl }}>{t.qtd || ''}</td>
              {!semDinheiro && <td style={{ ...cel, ...cs, ...bl }}>{t.uni > 0 ? money(t.uni) : ''}</td>}
              {!semDinheiro && <td style={{ ...cel, ...cs, ...bl }}>{t.qtd * t.uni > 0 ? money(t.qtd * t.uni) : ''}</td>}
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <td style={{ ...rodape, borderLeft: `1px solid ${BD}`, borderBottomLeftRadius: 6, fontFamily: F_UI }}>Total</td>
          <td style={{ ...rodape, ...(cols === 2 ? { borderRight: `1px solid ${BD}`, borderBottomRightRadius: 6 } : null) }}>{q}</td>
          {!semDinheiro && <td style={{ ...rodape, fontWeight: 400 }}>—</td>}
          {!semDinheiro && <td style={{ ...rodape, borderRight: `1px solid ${BD}`, borderBottomRightRadius: 6 }}>{money(v)}</td>}
        </tr>
      </tfoot>
    </table>
  )
}

/** SVG de anotações (fração 0..1 do documento). */
export function AnotSvg({ anots, visivel = true }: { anots: Anotacao[]; visivel?: boolean }) {
  if (!visivel) return null
  return (
    <svg viewBox="0 0 1000 1414" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>{anots.map(a => <marker key={'m' + a.id} id={'ah' + a.id} markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={a.cor} /></marker>)}</defs>
      {anots.map(a => <AnotShape key={a.id} a={a} />)}
    </svg>
  )
}
function AnotShape({ a }: { a: Anotacao }) {
  const X = a.x * 1000, Y = a.y * 1414, W = a.w * 1000, H = a.h * 1414
  const sw = 3
  if (a.tipo === 'circulo') return <ellipse cx={X + W / 2} cy={Y + H / 2} rx={Math.abs(W / 2)} ry={Math.abs(H / 2)} fill="none" stroke={a.cor} strokeWidth={sw} />
  if (a.tipo === 'retangulo') return <rect x={Math.min(X, X + W)} y={Math.min(Y, Y + H)} width={Math.abs(W)} height={Math.abs(H)} fill="none" stroke={a.cor} strokeWidth={sw} rx={4} />
  if (a.tipo === 'seta') return <line x1={X} y1={Y} x2={X + W} y2={Y + H} stroke={a.cor} strokeWidth={sw} markerEnd={`url(#ah${a.id})`} />
  if (a.tipo === 'texto') return <text x={X} y={Y} fill={a.cor} fontSize={26} fontWeight={700} fontFamily={F_UI}>{a.texto}</text>
  return null
}

/* ---------------- estilos ---------------- */
/* AS LINHAS DO CABEÇALHO SÃO O GAP sobre o fundo cinza — nunca bordas
   de célula. Por isso o radius + overflow nunca corta uma borda. */
const hdGrid: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: '1fr',
  gap: 1, background: BD, borderRadius: 6, overflow: 'hidden',
}
const logoBox: CSSProperties = { gridColumn: 1, gridRow: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 11px', background: '#fff' }
const campo: CSSProperties = { background: '#fff', padding: '4px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, minHeight: 30, overflow: 'hidden' }
const hdLabel: CSSProperties = { fontSize: 8.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: SUT, lineHeight: 1.15, flex: '0 0 auto', fontFamily: F_UI }
const hdVal: CSSProperties = { fontSize: 12, lineHeight: 1.25, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const tagOut: CSSProperties = { display: 'inline-flex', alignItems: 'center', height: 15, padding: '0 6.5px', borderRadius: 999, background: 'transparent', border: '1.2px solid', fontFamily: F_UI, fontSize: 7.7, fontWeight: 700, letterSpacing: '.05em', lineHeight: 1 }

const warnBar: CSSProperties = {
  marginTop: 9, background: RED_SOFT, color: RED,
  borderBottom: `1px solid ${RED}`, borderRadius: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  textAlign: 'center', fontFamily: F_UI, fontWeight: 700, letterSpacing: '.06em',
  fontSize: 9, padding: '6px 11px', textTransform: 'uppercase',
}
const obsGeral: CSSProperties = { marginTop: 7, fontSize: 10.5, lineHeight: 1.4, color: MED, fontFamily: F_UI, borderLeft: `2px solid ${BD}`, paddingLeft: 8 }

const selo: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
  background: RED_SOFT, border: `1px solid ${RED_BD}`, borderRadius: 5.6, color: RED,
  fontFamily: F_MONO, fontSize: 8.4, fontWeight: 700, letterSpacing: '.08em',
  padding: '0 8px', minHeight: 29, whiteSpace: 'nowrap',
}
const caixa: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5.6, minHeight: 29, padding: '0 6px 0 8px', border: `1px solid ${BD}`, borderRadius: 5.6, background: '#fff' }
const rotulo: CSSProperties = { flex: '0 0 auto', whiteSpace: 'nowrap', fontFamily: F_UI, fontSize: 8.4, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: SUT, lineHeight: 1.35 }
const valUp: CSSProperties = { fontFamily: F_UI, fontSize: 9, lineHeight: 1.35, textTransform: 'uppercase', color: TXT, overflow: 'hidden', textOverflow: 'ellipsis' }

const imgVazia: CSSProperties = { flex: 1, display: 'grid', placeItems: 'center', minHeight: 168, padding: 14, textAlign: 'center', border: `1px dashed ${BD}`, borderRadius: 7, background: SURF2, color: MED }
const imgCheia: CSSProperties = { flex: 1, display: 'grid', placeItems: 'center', border: `1px solid ${BD}`, borderRadius: 7, overflow: 'hidden', background: '#fff' }
const layArea: CSSProperties = { marginTop: 7, border: `1px solid ${BD}`, borderRadius: 6, background: `linear-gradient(180deg,#fff 0%,${SURF2} 100%)`, fontFamily: F_UI, fontSize: 10, lineHeight: 1.35, padding: '6px 10px', minHeight: 26, color: MED }

const tbl: CSSProperties = { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontFamily: F_MONO, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: TXT }
const celBase: CSSProperties = { border: 'none', borderTop: `1px solid ${BD}`, borderLeft: `1px solid ${BD}`, padding: '4.5px 7px', textAlign: 'center', lineHeight: 1.4 }
const cel: CSSProperties = { ...celBase }
const cabeca: CSSProperties = { ...celBase, borderLeft: `1px solid ${BD}`, background: 'transparent', fontFamily: F_MONO, fontSize: 10, fontWeight: 500, color: MED }
const rodape: CSSProperties = { ...celBase, borderBottom: `1px solid ${BD}`, background: MUTED, fontWeight: 700 }

const rodEnd: CSSProperties = { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 5px', color: MED, fontFamily: F_UI, fontSize: 7.5, fontWeight: 400, lineHeight: 1.4 }
const rodSep: CSSProperties = { width: 2, height: 2, borderRadius: '50%', background: SUT, flex: '0 0 auto' }
const rodTot: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 4 }
const rodLbl: CSSProperties = { fontFamily: F_UI, fontSize: 7.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: SUT }
const rodVal: CSSProperties = { fontFamily: F_MONO, fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 600, color: TXT, letterSpacing: '-.01em' }
