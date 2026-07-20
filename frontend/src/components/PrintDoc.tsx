import type { CSSProperties } from 'react'
import { useApp } from '../store/useApp'
import { TECNICAS, pedTotais, money } from '../store/model'
import { cvar } from './ui'

/**
 * Documento A4 para impressão / PDF.
 * Fica fora do shell (renderizado em App) e só aparece em @media print.
 * Cores fixas (claras) e fonte Roboto — o impresso não segue o tema do app.
 */
export default function PrintDoc() {
  const { pedidos, curPed } = useApp()
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
        {([['Cliente', p.cliente], ['Vendedor', p.vendedor], ['Entrega', p.entrega], ['Departamento', p.depto], ['Contato', p.contato], ['Pagamento', p.pagamento]] as [string, string][]).map(([lbl, v]) => (
          <div key={lbl} style={{ padding: '5px 0' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: '#98A3B0', fontWeight: 700 }}>{lbl}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{v || '—'}</div>
          </div>
        ))}
      </div>

      {p.layouts.map((l, li) => {
        let sub = 0
        return (
          <div key={li} style={lay}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div>
                <span style={lnum}>L-{String(li + 1).padStart(2, '0')}</span>
                <div style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 10px' }}>{l.ref}</div>
                <div style={img}>imagem do produto</div>
              </div>
              <div>
                <Grp label="Tecido"><div style={{ fontSize: 12, color: '#39424E' }}>{l.tecido || '—'}</div></Grp>
                <Grp label="Cor"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}><i style={{ width: 13, height: 13, borderRadius: 4, border: '1px solid #D6DCE3', background: l.corHex, display: 'inline-block' }} />{l.cor || '—'}</span></Grp>
                <Grp label="Design">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {l.design.map(d => <span key={d} style={{ background: cvar(TECNICAS[d].cor), color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 8px' }}>{TECNICAS[d].label}</span>)}
                  </div>
                </Grp>
                <table style={tbl}>
                  <thead><tr><th style={{ ...th, textAlign: 'left' }}>Tam</th><th style={th}>Qtd</th><th style={th}>Uni</th><th style={th}>Total</th></tr></thead>
                  <tbody>
                    {l.tamanhos.map((t, ti) => { const tt = t.qtd * t.uni; sub += tt; return (
                      <tr key={ti}>
                        <td style={{ ...td, textAlign: 'left', fontFamily: "'Roboto',sans-serif", fontWeight: 500 }}>{t.tam}{t.inf ? ' · inf' : ''}</td>
                        <td style={{ ...td, ...(t.inf ? infTd : {}) }}>{t.qtd}</td>
                        <td style={{ ...td, ...(t.inf ? infTd : {}) }}>{money(t.uni)}</td>
                        <td style={{ ...td, ...(t.inf ? infTd : {}) }}>{money(tt)}</td>
                      </tr>
                    ) })}
                  </tbody>
                  <tfoot><tr><td style={{ ...td, textAlign: 'left', background: '#F6F8FA', fontWeight: 700 }}>Total</td><td style={{ ...td, background: '#F6F8FA', fontWeight: 700 }}>{l.tamanhos.reduce((s, t) => s + t.qtd, 0)}</td><td style={{ ...td, background: '#F6F8FA' }}>—</td><td style={{ ...td, background: '#F6F8FA', fontWeight: 700 }}>{money(sub)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      <div style={foot}>
        <span>Fourtime · CNPJ 00.000.000/0001-00 · Goiânia-GO</span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, color: '#161A20', fontSize: 13 }}>{tot.pecas} pçs · R$ {money(tot.valor)}</span>
      </div>
    </div>
  )
}

function Grp({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 9 }}><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: '#98A3B0', fontWeight: 700, marginBottom: 3 }}>{label}</div>{children}</div>
}

const head: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '2px solid #C6161B', marginBottom: 12 }
const logo: CSSProperties = { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#E5484D,#9E0E13)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }
const fields: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 20px', paddingBottom: 12, borderBottom: '1px solid #E4E8ED', marginBottom: 4 }
const lay: CSSProperties = { padding: '14px 0', borderBottom: '1px solid #EEF1F4', breakInside: 'avoid' }
const lnum: CSSProperties = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: '#fff', background: '#2563EB', borderRadius: 999, padding: '2px 9px' }
const img: CSSProperties = { height: 150, borderRadius: 8, background: 'linear-gradient(135deg,#EEF1F4,#D6DCE3)', display: 'grid', placeItems: 'center', color: '#98A3B0', border: '1px solid #E4E8ED', fontSize: 11 }
const tbl: CSSProperties = { borderCollapse: 'collapse', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, width: '100%', marginTop: 2 }
const th: CSSProperties = { border: '1px solid #E4E8ED', padding: '4px 6px', textAlign: 'center', background: '#F6F8FA', color: '#6A7686', fontWeight: 600, fontSize: 10 }
const td: CSSProperties = { border: '1px solid #E4E8ED', padding: '4px 6px', textAlign: 'center' }
const infTd: CSSProperties = { background: '#FCE8E9', color: '#C6161B', fontWeight: 600 }
const foot: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, fontSize: 11, color: '#6A7686' }
