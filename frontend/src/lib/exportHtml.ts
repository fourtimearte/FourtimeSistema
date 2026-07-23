/* =====================================================================
   Export HTML (v172 §12.5) — documento limpo, standalone, responsivo,
   SEMPRE sem valores (R$). Self-contained (CSS inline, imagens base64).
   ===================================================================== */
import { TECNICAS, ordemTamanhos, isInfantil, pedTotais, type Pedido, type Layout } from '../store/model'

const esc = (s: string) => (s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
function corVar(name: string) {
  const map: Record<string, string> = { '--set-dtf': '#DB2777', '--set-sublimacao': '#0E7490', '--set-silk': '#047857', '--set-corte': '#C2410C', '--set-bordado': '#B45309', '--set-costura': '#4F46E5' }
  return map[name] ?? '#333'
}

function tabela(l: Layout) {
  const linhas = ordemTamanhos(l)
  let q = 0
  const rows = linhas.map(tam => {
    const t = l.tamanhos[tam] ?? { qtd: 0, uni: 0 }; q += t.qtd
    const cross = (l.grade === 'adulto' && isInfantil(tam)) || (l.grade === 'infantil' && !isInfantil(tam))
    const cls = cross ? (l.grade === 'adulto' ? ' class="inf"' : ' class="adu"') : ''
    return `<tr${cls}><td class="tam">${esc(tam)}</td><td>${t.qtd || ''}</td></tr>`
  }).join('')
  return `<table class="sz"><thead><tr><th>Tam</th><th>Qtd</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td class="tam">Total</td><td>${q}</td></tr></tfoot></table>`
}

function layoutHtml(l: Layout, i: number) {
  const tags = l.design.map(d => `<span class="tag" style="background:${corVar(TECNICAS[d.tag].cor)}">${esc(TECNICAS[d.tag].label)}${d.cores.length ? ' ' + esc(d.cores.join(',')) : ''}</span>`).join('')
  const tecidos = l.tecidos.filter(Boolean).map(t => `<div>${esc(t)}</div>`).join('') || '—'
  const img = l.img ? `<img class="prod" src="${l.img}" alt="produto">` : '<div class="noimg">sem imagem</div>'
  return `<section class="lay">
    <div class="lay-l"><span class="lnum">L-${String(i + 1).padStart(2, '0')}</span><div class="ref">${esc(l.ref)}</div>${img}${l.obs ? `<div class="obs">${l.obs}</div>` : ''}</div>
    <div class="lay-r">
      <div class="grp"><b>Tecido</b>${tecidos}</div>
      <div class="grp"><b>Cor</b><span class="cor"><i style="background:${esc(l.corHex)}"></i>${esc(l.cor) || '—'}</span></div>
      <div class="grp"><b>Design</b><div class="tags">${tags}</div></div>
      ${tabela(l)}
    </div>
  </section>`
}

export function exportarHtml(p: Pedido): string {
  const tot = pedTotais(p)
  const campos = ([['Cliente', p.cliente], ['CPF/CNPJ', p.cpf], ['Departamento', p.depto], ['Vendedor', p.vendedor], ['Contato', p.contato], ['Embalagem', p.embalagem], ['Entrega', p.entrega], ['Envio', p.envio], ['Pagamento', p.pagamento]] as [string, string][])
    .map(([k, v]) => `<div class="cp"><label>${esc(k)}</label><span>${esc(v) || '—'}</span></div>`).join('')
  const tagsHead = (p.obsTags ?? []).map(t => `<b style="color:${t === 'URGENTE' ? '#C6161B' : '#B45309'}">${esc(t)}</b>`).join(' ')
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc((p.cliente || 'Orçamento'))} · ${esc(p.pedido)}</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--red:#C6161B}
*{box-sizing:border-box}
body{margin:0;background:#EEF1F4;font-family:'Roboto',system-ui,sans-serif;color:#161A20;padding:16px}
.doc{max-width:820px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.1);padding:24px}
.head{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--red);padding-bottom:12px;margin-bottom:12px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700}
.brand .lg{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#E5484D,#9E0E13);color:#fff;display:grid;place-items:center}
.brand small{display:block;font-weight:500;font-size:10px;color:#6A7686}
.code{text-align:right;font-size:12px;color:#6A7686}.code b{display:block;color:#161A20;font-size:15px}
.campos{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px 18px;border-bottom:1px solid #E4E8ED;padding-bottom:12px;margin-bottom:8px}
.cp{padding:4px 0}.cp label{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#98A3B0;font-weight:700}.cp span{font-size:13px;font-weight:500}
.headobs{background:#FBF0DF;color:#7C3A06;font-size:11px;padding:5px 8px;border-radius:4px;margin-bottom:8px}
.lay{display:grid;grid-template-columns:1.7fr 1.3fr;gap:16px;padding:14px 0;border-bottom:1px solid #EEF1F4}
.lnum{display:inline-block;font-size:11px;font-weight:700;color:#fff;background:#2563EB;border-radius:999px;padding:2px 9px}
.ref{font-size:15px;font-weight:600;margin:8px 0 10px}
.prod{width:100%;max-height:420px;object-fit:contain;border:1px solid #E4E8ED;border-radius:8px}
.noimg{height:150px;border:1px solid #E4E8ED;border-radius:8px;display:grid;place-items:center;color:#98A3B0;font-size:12px;background:#F6F8FA}
.obs{font-size:12px;color:#39424E;margin-top:6px}
.cod-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 7px 1px 5px;margin:0 1px;border-radius:999px;border:1px solid #D6DCE3;background:#F1F3F6;font-family:ui-monospace,monospace;font-size:.82em;font-weight:600;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cod-chip::before{content:"";width:11px;height:11px;border-radius:3px;background:var(--c,#98A3B0);border:1px solid rgba(0,0,0,.18);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.grp{margin-bottom:9px;font-size:12px}.grp b{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#98A3B0;margin-bottom:3px}
.cor{display:inline-flex;align-items:center;gap:6px}.cor i{width:13px;height:13px;border-radius:4px;border:1px solid #D6DCE3}
.tags{display:flex;flex-wrap:wrap;gap:4px}.tag{color:#fff;font-size:10px;font-weight:700;border-radius:999px;padding:2px 8px}
.sz{border-collapse:collapse;font-family:ui-monospace,monospace;font-size:12px;width:100%;margin-top:4px}
.sz th,.sz td{border:1px solid #E4E8ED;padding:4px 6px;text-align:center}.sz .tam{text-align:left;font-family:'Roboto',sans-serif;font-weight:500}
.sz thead th{background:#F6F8FA;color:#6A7686;font-size:10px}.sz tfoot td{background:#F6F8FA;font-weight:700}
.sz tr.inf td{background:#FCE8E9;color:#C6161B;font-weight:600}.sz tr.adu td{background:#E3EEFB;color:#12213F;font-weight:600}
.foot{display:flex;justify-content:space-between;align-items:center;padding-top:12px;font-size:11px;color:#6A7686}
.foot b{font-family:ui-monospace,monospace;color:#161A20;font-size:14px}
/* 'screen' de propósito (lição do v188): sem ele, o viewport da impressão (A4 ≈ 794px)
   poderia cair no layout de celular e quebrar a arte. Mobile só na tela, nunca no papel. */
@media screen and (max-width:640px){.campos{grid-template-columns:1fr 1fr}.lay{grid-template-columns:1fr}}
</style></head><body><div class="doc">
<div class="head"><div class="brand"><div class="lg">F</div><div>FOURTIME<small>Personalização esportiva</small></div></div><div class="code">Pedido Nº<b>${esc(p.pedido)}</b></div></div>
<div class="campos">${campos}</div>
${(tagsHead || p.obs) ? `<div class="headobs">${tagsHead} ${esc(p.obs)}</div>` : ''}
${p.layouts.map(layoutHtml).join('')}
<div class="foot"><span>Fourtime · CNPJ 00.000.000/0001-00 · Goiânia-GO</span><b>${tot.pecas} peças</b></div>
</div></body></html>`
}
