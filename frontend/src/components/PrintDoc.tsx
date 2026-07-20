import type { CSSProperties } from 'react'
import { useApp } from '../store/useApp'
import { TECNICAS, ordemTamanhos, isInfantil, pedTotais, money } from '../store/model'
import { cvar } from './ui'

/** Documento A4 para impressão / PDF — fiel ao v172. Fora do shell, só em @media print. */
export default function PrintDoc() {
  const { pedidos, curPed, semDinheiro } = useApp()
  const p = pedidos[curPed]
  if (!p) return <div className="print-doc" />
  const tot = pedTotais(p)
  return (
    <div className="print-doc" style={{ fontFamily: "'Roboto',sans-serif", color: '#161A20', background: '#fff' }}>
      <div style={head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={logo}>F</div>
          <div style={{ fontWeight: 700 }}>FOURTIME<div style={{ fontWeight: 500, fontSize: 10, color: '#6A7686' }}>Personalização esportiva</div></div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#6A7686', textAlign: 'right' }}>
          Pedido Nº<div style={{ color: '#161A20', fontSize: 15, fontWeight: 600 }}>{p.pedido}</div>
        </div>
      </div>

      <div style={fields}>
        {([['Cliente', p.cliente], ['CPF/CNPJ', p.cpf], ['Departamento', p.depto], ['Vendedor', p.vendedor], ['Contato', p.contato], ['Embalagem', p.embalagem], ['Entrega', p.entrega], ['Envio', p.envio], ['Pagamento', p.pagamento]] as [string, string][]).map(([lbl, v]) => (
          <div key={lbl} style={{ padding: '4px 0' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: '#98A3B0', fontWeight: 700 }}>{lbl}</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{v || '—'}</div>
          </div>
        ))}
      </div>
      {((p.obsTags && p.obsTags.length) || p.obs) && (
        <div style={{ fontSize: 11, color: '#7C3A06', background: '#FBF0DF', padding: '5px 8px', borderRadius: 4, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {(p.obsTags ?? []).map(t => <b key={t} style={{ color: t === 'URGENTE' ? '#C6161B' : '#B45309' }}>{t}</b>)}
          {p.obs && <span>{p.obs}</span>}
        </div>
      )}

      {p.layouts.map((l, li) => (
        <div key={li} style={lay}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div>
              <span style={lnum}>L-{String(li + 1).padStart(2, '0')}</span>
              <div style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 10px' }}>{l.ref}</div>
              {l.img ? <img src={l.img} style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, border: '1px solid #E4E8ED' }} />
                : <div style={img}>sem imagem</div>}
              {l.obs && <div style={{ fontSize: 11, color: '#39424E', marginTop: 4 }}>{l.obs}</div>}
            </div>
            <div>
              <Grp label="Tecido">{l.tecidos.filter(Boolean).map((t, i) => <div key={i} style={{ fontSize: 12, color: '#39424E' }}>{t}</div>)}</Grp>
              <Grp label="Cor"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}><i style={{ width: 13, height: 13, borderRadius: 4, border: '1px solid #D6DCE3', background: l.corHex, display: 'inline-block' }} />{l.cor || '—'}</span></Grp>
              <Grp label="Design">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {l.design.map(d => <span key={d.tag} style={{ background: cvar(TECNICAS[d.tag].cor), color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 8px' }}>{TECNICAS[d.tag].label}{d.cores.length ? ' ' + d.cores.join(',') : ''}</span>)}
                </div>
              </Grp>
              <SizeTable l={l} semDinheiro={semDinheiro} />
            </div>
          </div>
        </div>
      ))}

      <div style={foot}>
        <span>Fourtime · CNPJ 00.000.000/0001-00 · Goiânia-GO</span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, color: '#161A20', fontSize: 13 }}>{tot.pecas} pçs{semDinheiro ? '' : ` · R$ ${money(tot.valor)}`}</span>
      </div>
    </div>
  )
}

function SizeTable({ l, semDinheiro }: { l: import('../store/model').Layout; semDinheiro: boolean }) {
  const linhas = ordemTamanhos(l); let q = 0, v = 0
  return (
    <table style={tbl}>
      <thead><tr><th style={{ ...th, textAlign: 'left' }}>Tam</th><th style={th}>Qtd</th>{!semDinheiro && <th style={th}>Uni</th>}{!semDinheiro && <th style={th}>Total</th>}</tr></thead>
      <tbody>
        {linhas.map(tam => {
          const t = l.tamanhos[tam] ?? { qtd: 0, uni: 0 }; q += t.qtd; v += t.qtd * t.uni
          const cross = (l.grade === 'adulto' && isInfantil(tam)) || (l.grade === 'infantil' && !isInfantil(tam))
          const cs: CSSProperties = cross ? (l.grade === 'adulto' ? { background: '#FCE8E9', color: '#C6161B', fontWeight: 600 } : { background: '#E3EEFB', color: '#12213F', fontWeight: 600 }) : {}
          return (
            <tr key={tam}>
              <td style={{ ...td, textAlign: 'left', fontFamily: "'Roboto',sans-serif", ...cs }}>{tam}</td>
              <td style={{ ...td, ...cs }}>{t.qtd}</td>
              {!semDinheiro && <td style={{ ...td, ...cs }}>{money(t.uni)}</td>}
              {!semDinheiro && <td style={{ ...td, ...cs }}>{money(t.qtd * t.uni)}</td>}
            </tr>
          )
        })}
      </tbody>
      <tfoot><tr><td style={{ ...td, textAlign: 'left', background: '#F6F8FA', fontWeight: 700 }}>Total</td><td style={{ ...td, background: '#F6F8FA', fontWeight: 700 }}>{q}</td>{!semDinheiro && <td style={{ ...td, background: '#F6F8FA' }}>—</td>}{!semDinheiro && <td style={{ ...td, background: '#F6F8FA', fontWeight: 700 }}>{money(v)}</td>}</tr></tfoot>
    </table>
  )
}
function Grp({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 9 }}><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: '#98A3B0', fontWeight: 700, marginBottom: 3 }}>{label}</div>{children}</div>
}

const head: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '2px solid #C6161B', marginBottom: 12 }
const logo: CSSProperties = { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#E5484D,#9E0E13)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }
const fields: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 20px', paddingBottom: 12, borderBottom: '1px solid #E4E8ED', marginBottom: 8 }
const lay: CSSProperties = { padding: '14px 0', borderBottom: '1px solid #EEF1F4', breakInside: 'avoid' }
const lnum: CSSProperties = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: '#fff', background: '#2563EB', borderRadius: 999, padding: '2px 9px' }
const img: CSSProperties = { height: 150, borderRadius: 8, background: 'linear-gradient(135deg,#EEF1F4,#D6DCE3)', display: 'grid', placeItems: 'center', color: '#98A3B0', border: '1px solid #E4E8ED', fontSize: 11 }
const tbl: CSSProperties = { borderCollapse: 'collapse', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, width: '100%', marginTop: 2 }
const th: CSSProperties = { border: '1px solid #E4E8ED', padding: '4px 6px', textAlign: 'center', background: '#F6F8FA', color: '#6A7686', fontWeight: 600, fontSize: 10 }
const td: CSSProperties = { border: '1px solid #E4E8ED', padding: '4px 6px', textAlign: 'center' }
const foot: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, fontSize: 11, color: '#6A7686' }
