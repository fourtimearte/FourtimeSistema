/* =====================================================================
   Frete / Envio — estimador embutido (Correios PAC/SEDEX + transportadora)
   a partir do CEP de destino, peso e dimensões. Cálculo determinístico e
   offline, pensado para o protótipo.

   ▸ TROCA PELA API REAL DO MELHOR ENVIO (quando houver backend + token):
     substituir `calcularFrete` por uma chamada ao seu backend, que faz o
     POST autenticado para https://.../api/v2/me/shipment/calculate
     (Bearer token). O backend é obrigatório: a API do Melhor Envio não
     permite chamada direta do navegador (CORS + segredo do token).
     A forma de `FreteOpcao[]` já espelha a resposta do Melhor Envio
     (name, company, price, delivery_time), então a UI não muda.
   ===================================================================== */

export const ORIGEM_CEP = '74215-020' // Fourtime · Goiânia-GO (origem dos envios)

export interface Pacote { pesoKg: number; comprimento: number; largura: number; altura: number } // cm
export interface FreteOpcao {
  id: string
  servico: string          // ex.: 'PAC', 'SEDEX', '.Package'
  transportadora: string   // ex.: 'Correios', 'Jadlog'
  cor: string              // token de cor p/ o selo
  preco: number            // R$
  prazoDias: number        // dias úteis
  estimado: boolean        // true = estimativa local (não é cotação oficial)
}

const soDig = (s: string) => (s ?? '').replace(/\D/g, '')

/** zona de frete relativa a Goiânia (origem), derivada do prefixo do CEP.
 * 1 = local/GO · 2 = Centro-Oeste/Sudeste próximo · 3 = Sul/capitais ·
 * 4 = Norte/Nordeste distante. */
export function cepZona(cep: string): number {
  const d = soDig(cep)
  if (d.length < 3) return 3
  const p = parseInt(d.slice(0, 5), 10)          // 5 primeiros dígitos
  const uf2 = parseInt(d.slice(0, 2), 10)        // faixa macro
  // GO/DF (72xxx–76xxx) — mesma região da fábrica
  if (p >= 72000 && p <= 76999) return 1
  // Sudeste próximo (SP 01–19, MG 30–39, RJ 20–28, ES 29) + MT/MS (78–79)
  if ((uf2 >= 1 && uf2 <= 39) || uf2 === 78 || uf2 === 79) return 2
  // Sul (PR 80–87, SC 88–89, RS 90–99) + BA/SE (40–49)
  if ((uf2 >= 80 && uf2 <= 99) || (uf2 >= 40 && uf2 <= 49)) return 3
  // Norte/Nordeste distante (50–69, 70–71) e demais
  return 4
}

/** peso cubado (volumétrico) — Correios: (C×L×A)/6000 */
export function pesoCubado(p: Pacote): number {
  return (p.comprimento * p.largura * p.altura) / 6000
}

/** pacote padrão a partir da quantidade de peças (≈0,25 kg/peça, caixa cresce) */
export function pacotePorPecas(pecas: number): Pacote {
  const n = Math.max(1, pecas)
  return {
    pesoKg: +(n * 0.25).toFixed(2),
    comprimento: 30,
    largura: 24,
    altura: Math.min(60, 4 + Math.ceil(n / 6) * 3),
  }
}

/**
 * Estima o frete localmente. Origem fixa (Fourtime), destino pelo CEP.
 * Retorna as opções ordenadas do mais barato ao mais caro.
 * — substituível pela cotação real do Melhor Envio (ver topo do arquivo).
 */
export function calcularFrete(destinoCep: string, pacote: Pacote): FreteOpcao[] {
  const z = cepZona(destinoCep)
  const kg = Math.max(pacote.pesoKg, pesoCubado(pacote)) // o maior entre real e cubado
  const dim = (pacote.comprimento + pacote.largura + pacote.altura) / 100 // fator leve por volume

  const pac = 16 + z * 10 + kg * 2.2 + dim * 3
  const sedex = 28 + z * 17 + kg * 3.4 + dim * 4
  const jadlog = 14 + z * 8.5 + kg * 1.9 + dim * 2.5

  const round = (v: number) => Math.round(v * 100) / 100
  return [
    { id: 'jadlog', servico: '.Package', transportadora: 'Jadlog', cor: '--set-sublimacao', preco: round(jadlog), prazoDias: 3 + z * 2, estimado: true },
    { id: 'pac', servico: 'PAC', transportadora: 'Correios', cor: '--set-comercial', preco: round(pac), prazoDias: 4 + z * 2, estimado: true },
    { id: 'sedex', servico: 'SEDEX', transportadora: 'Correios', cor: '--set-dtf', preco: round(sedex), prazoDias: 1 + z, estimado: true },
  ].sort((a, b) => a.preco - b.preco)
}

/* =====================================================================
   Cobertura de transportadoras por faixa de CEP / UF (do clientes v4).
   Uma transportadora pode ter várias faixas; `ufs` é fallback estadual
   ('*' = Brasil todo). Troque os nomes "exemplo" pelos parceiros reais.
   ===================================================================== */
export interface Transportadora { nome: string; prazo: string; obs: string; cor: string; faixas?: [string, string][]; ufs?: string[] }
export const TRANSPORTADORAS: Transportadora[] = [
  { nome: 'Correios · PAC / SEDEX', prazo: '2–8 dias úteis', obs: 'Cobertura nacional — fallback padrão', ufs: ['*'], cor: '--set-comercial' },
  { nome: 'Motoboy Fourtime', prazo: 'mesmo dia', obs: 'Goiânia e Aparecida de Goiânia', faixas: [['74000000', '74999999']], cor: '--set-corte' },
  { nome: 'Jadlog', prazo: '1–3 dias úteis', obs: 'GO e DF', faixas: [['70000000', '73699999'], ['72800000', '76799999']], cor: '--set-estoque' },
  { nome: 'Braspress', prazo: '2–5 dias úteis', obs: 'Capitais SP e GO', faixas: [['01000000', '09999999'], ['74000000', '74899999']], cor: '--set-sublimacao' },
  { nome: 'Total Express', prazo: '1–4 dias úteis', obs: 'Estado de São Paulo', faixas: [['01000000', '19999999']], cor: '--set-silk' },
]
export type HitFonte = 'cep' | 'uf'
export const FONTE_LABEL: Record<HitFonte, string> = { cep: 'CEP do cliente', uf: 'cobertura estadual' }
const cepIn = (cep: string, faixas: [string, string][]) => faixas.some(([a, b]) => cep >= a && cep <= b)

/** transportadoras que cobrem o cliente, casando por faixa de CEP (mais
 * específico) ou por UF (fallback). Ordena: CEP antes de UF. */
export function transportadorasPara(cep: string, uf: string): { t: Transportadora; hit: HitFonte }[] {
  const d = soDig(cep)
  const res: { t: Transportadora; hit: HitFonte }[] = []
  for (const t of TRANSPORTADORAS) {
    let hit: HitFonte | '' = ''
    if (t.faixas && d.length === 8 && cepIn(d, t.faixas)) hit = 'cep'
    else if (!hit && t.ufs && (t.ufs.includes('*') || (uf && t.ufs.includes(uf)))) hit = 'uf'
    if (hit) res.push({ t, hit })
  }
  return res.sort((a, b) => (a.hit === 'cep' ? 0 : 1) - (b.hit === 'cep' ? 0 : 1))
}

/** Consulta ViaCEP (grátis, sem token, com CORS) para exibir cidade/UF do
 * destino — apenas informativo; o cálculo não depende disso. */
export async function consultaCep(cep: string): Promise<{ localidade: string; uf: string; bairro?: string; logradouro?: string } | null> {
  const d = soDig(cep)
  if (d.length !== 8) return null
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`)
    const j = await r.json()
    if (j?.erro) return null
    return { localidade: j.localidade, uf: j.uf, bairro: j.bairro, logradouro: j.logradouro }
  } catch { return null }
}
