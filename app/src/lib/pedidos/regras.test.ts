import { describe, expect, it } from 'vitest'
import { PEDIDOS_SEED } from '@/data/pedidosSeed'
import { CLIENTES_BLING } from '@/data/clientesBling'
import {
  atrasado, dataBr, diasDeAtraso, gargalos, giroPorTecnica, kpis,
  maisAtrasados, moedaCurta, noMes, tecnicas, totais,
} from './regras'
import type { Pedido } from './tipos'

const HOJE = new Date('2026-08-05T12:00:00')
const P = (o: Partial<Pedido>): Pedido => ({
  pedido: 'PD000001', clienteId: null, cliente: 'X', vendedor: 'Y',
  entrega: '10/08/2026', status: 'producao', layouts: [], ...o,
})

describe('dataBr', () => {
  it('lê dd/mm/aaaa', () => expect(dataBr('05/08/2026')?.getMonth()).toBe(7))
  it('devolve null em vez de NaN silencioso', () => {
    expect(dataBr('')).toBeNull()
    expect(dataBr('2026-08-05')).toBeNull()
    /* regressão: o new Date do JS TRANSBORDA em vez de rejeitar —
       new Date(9999, 98, 99) vira o ano 10007 e passaria por prazo válido */
    expect(dataBr('99/99/9999')).toBeNull()
    expect(dataBr('32/01/2026')).toBeNull()
    expect(dataBr('30/02/2026')).toBeNull()
    expect(dataBr('29/02/2024')).not.toBeNull()   // bissexto é válido
  })
})

describe('totais', () => {
  it('soma peças e valor de todos os layouts', () => {
    const p = P({ layouts: [
      { ref: 'a', cor: 'Preto', tecnicas: ['DTF'], tamanhos: { M: { qtd: 10, uni: 50 }, G: { qtd: 5, uni: 50 } } },
      { ref: 'b', cor: 'Branco', tecnicas: ['Silk'], tamanhos: { P: { qtd: 2, uni: 100 } } },
    ] })
    expect(totais(p)).toEqual({ pecas: 17, valor: 950 })
  })
  it('pedido sem layout não quebra', () => expect(totais(P({}))).toEqual({ pecas: 0, valor: 0 }))
})

describe('tecnicas', () => {
  it('deduplica e respeita a ordem fixa do Design', () => {
    const p = P({ layouts: [
      { ref: 'a', cor: '', tecnicas: ['Silk', 'DTF'], tamanhos: {} },
      { ref: 'b', cor: '', tecnicas: ['DTF', 'Bordado'], tamanhos: {} },
    ] })
    expect(tecnicas(p)).toEqual(['DTF', 'Silk', 'Bordado'])
  })
})

describe('atrasado', () => {
  it('prazo vencido e em produção = atrasado', () =>
    expect(atrasado(P({ entrega: '01/08/2026' }), new Date(HOJE))).toBe(true))
  it('entregue NUNCA é atraso, mesmo com prazo vencido', () =>
    expect(atrasado(P({ entrega: '01/08/2026', status: 'entregue' }), new Date(HOJE))).toBe(false))
  it('rascunho não conta — ainda não foi prometido', () =>
    expect(atrasado(P({ entrega: '01/08/2026', status: 'rascunho' }), new Date(HOJE))).toBe(false))
  it('prazo futuro não é atraso', () =>
    expect(atrasado(P({ entrega: '20/08/2026' }), new Date(HOJE))).toBe(false))
  it('entrega HOJE ainda não é atraso', () =>
    expect(atrasado(P({ entrega: '05/08/2026' }), new Date(HOJE))).toBe(false))
  it('conta os dias certos', () =>
    expect(diasDeAtraso(P({ entrega: '01/08/2026' }), HOJE)).toBe(4))
})

describe('noMes', () => {
  it('agosto/2026 entra', () => expect(noMes(P({ entrega: '30/08/2026' }), HOJE)).toBe(true))
  it('julho/2026 não entra', () => expect(noMes(P({ entrega: '30/07/2026' }), HOJE)).toBe(false))
  it('agosto de outro ano não entra', () => expect(noMes(P({ entrega: '30/08/2025' }), HOJE)).toBe(false))
})

describe('kpis sobre o seed', () => {
  const k = kpis(PEDIDOS_SEED, HOJE)
  it('conta os pedidos em produção', () =>
    expect(k.emProducao).toBe(PEDIDOS_SEED.filter((p) => p.status === 'producao').length))
  it('rascunho não entra no a receber', () => {
    const soRascunho = kpis(PEDIDOS_SEED.filter((p) => p.status === 'rascunho'), HOJE)
    expect(soRascunho.aReceber).toBe(0)
  })
  it('valores não são negativos', () => {
    expect(k.aReceber).toBeGreaterThanOrEqual(0)
    expect(k.faturadoMes).toBeGreaterThanOrEqual(0)
    expect(k.ticketMedio).toBeGreaterThanOrEqual(0)
  })
  it('lista vazia devolve zeros, não NaN', () => {
    const z = kpis([], HOJE)
    expect(Object.values(z).every((v) => Number.isFinite(v))).toBe(true)
    expect(z.ticketMedio).toBe(0)
  })
})

describe('gargalos', () => {
  const g = gargalos(PEDIDOS_SEED)
  it('vem ordenado do maior para o menor', () =>
    expect(g.map((x) => x.n)).toEqual([...g.map((x) => x.n)].sort((a, b) => b - a)))
  it('só conta quem está em produção', () => {
    const total = g.reduce((s, x) => s + x.n, 0)
    expect(total).toBeLessThanOrEqual(PEDIDOS_SEED.filter((p) => p.status === 'producao').length)
  })
  it('traduz o id da estação para nome legível', () =>
    expect(g.every((x) => x.nome !== '—')).toBe(true))
})

describe('giroPorTecnica', () => {
  const gi = giroPorTecnica(PEDIDOS_SEED)
  it('percentuais somam ~100', () =>
    expect(Math.round(gi.reduce((s, x) => s + x.pct, 0))).toBe(100))
  it('cada técnica traz a cor da paleta categórica, não da rampa', () =>
    expect(gi.every((x) => x.cor.startsWith('var(--cat-'))).toBe(true))
})

describe('drill-down', () => {
  it('todo pedido do seed aponta para um cliente que existe na base', () => {
    const ids = new Set(CLIENTES_BLING.map((c) => c.id))
    expect(PEDIDOS_SEED.every((p) => p.clienteId != null && ids.has(p.clienteId))).toBe(true)
  })
  it('maisAtrasados vem do pior para o menos pior', () => {
    const m = maisAtrasados(PEDIDOS_SEED, HOJE)
    const d = m.map((p) => diasDeAtraso(p, HOJE))
    expect(d).toEqual([...d].sort((a, b) => b - a))
  })
})

describe('moedaCurta', () => {
  it('encurta milhares', () => expect(moedaCurta(96400)).toBe('96,4k'))
  it('mantém valores pequenos por extenso', () => expect(moedaCurta(842.5)).toBe('842,50'))
})
