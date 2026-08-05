import { describe, expect, it } from 'vitest'
import { CLIENTES_BLING } from '@/data/clientesBling'
import {
  calcularKpis, cidadeUf, contarPor, filtrar, idsDuplicados, incompleto,
  normaliza, ordenar, tituloPt, FILTROS_VAZIOS, SEM_VALOR,
} from './regras'
import type { Cliente } from './tipos'

const HOJE = new Date('2026-08-04T12:00:00Z')
const dups = idsDuplicados(CLIENTES_BLING)

/* Estes números vieram do relatório de leitura do banco rodado em 04/08/2026
   contra o servidor real. Se algum mudar sem que a base tenha mudado, a
   portabilidade quebrou em algum lugar. */
describe('base real do Bling', () => {
  it('tem 1.901 clientes', () => expect(CLIENTES_BLING).toHaveLength(1901))
  it('bate os KPIs do relatório', () => {
    const k = calcularKpis(CLIENTES_BLING, dups, HOJE)
    expect(k).toMatchObject({ total: 1901, pf: 1491, pj: 410, comContato: 373, incompletos: 1124 })
  })
  it('encontra 30 possíveis duplicados', () => expect(dups.size).toBe(30))
  it('todos têm id — o risco de migração que já estava resolvido', () => {
    expect(CLIENTES_BLING.every((c) => Number.isFinite(c.id))).toBe(true)
    expect(new Set(CLIENTES_BLING.map((c) => c.id)).size).toBe(1901)
  })
})

describe('cidadeUf', () => {
  it('usa a coluna quando existe', () =>
    expect(cidadeUf({ cidade: 'Goiânia', uf: 'GO' } as Cliente)).toEqual({ cidade: 'Goiânia', uf: 'GO' }))
  it('extrai a UF do fim do texto quando não veio em coluna', () =>
    expect(cidadeUf({ cidade: 'Goiânia - GO' } as Cliente)).toEqual({ cidade: 'Goiânia', uf: 'GO' }))
  it('devolve UF vazia sem inventar', () =>
    expect(cidadeUf({ cidade: 'Goiânia' } as Cliente)).toEqual({ cidade: 'Goiânia', uf: '' }))
})

describe('normaliza e tituloPt', () => {
  it('ignora acento e caixa', () => expect(normaliza('JOÃO')).toBe(normaliza('joao')))
  it('mantém preposições minúsculas', () =>
    expect(tituloPt('joão da silva moura')).toBe('João da Silva Moura'))
  /* regressão: o \b do JS não conhece letra acentuada e quebrava "joão" em
     "JoÃO". Estava assim no v5; o teste pegou na portabilidade. */
  it('não quebra em letra acentuada', () => {
    expect(tituloPt('joão')).toBe('João')
    expect(tituloPt('conceição')).toBe('Conceição')
    expect(tituloPt('ANDRÉ LUÍS')).toBe('André Luís')
  })
})

describe('filtrar', () => {
  const ctx = { duplicados: dups, hoje: HOJE }
  it('sem filtro devolve a base inteira', () =>
    expect(filtrar(CLIENTES_BLING, FILTROS_VAZIOS, ctx)).toHaveLength(1901))
  it('PJ bate com o KPI', () =>
    expect(filtrar(CLIENTES_BLING, { ...FILTROS_VAZIOS, tipo: 'PJ' }, ctx)).toHaveLength(410))
  it('incompleto bate com o KPI', () =>
    expect(filtrar(CLIENTES_BLING, { ...FILTROS_VAZIOS, cadastro: 'incompleto' }, ctx)).toHaveLength(1124))
  it('busca ignora acento', () => {
    const a = filtrar(CLIENTES_BLING, { ...FILTROS_VAZIOS, busca: 'goiania' }, ctx)
    const b = filtrar(CLIENTES_BLING, { ...FILTROS_VAZIOS, busca: 'Goiânia' }, ctx)
    expect(a.length).toBe(b.length)
    expect(a.length).toBeGreaterThan(0)
  })
  it('SEM_VALOR pega quem não tem UF', () => {
    const r = filtrar(CLIENTES_BLING, { ...FILTROS_VAZIOS, uf: SEM_VALOR }, ctx)
    expect(r.every((c) => !cidadeUf(c).uf)).toBe(true)
  })
  it('filtros se combinam', () => {
    const r = filtrar(CLIENTES_BLING, { ...FILTROS_VAZIOS, tipo: 'PJ', cadastro: 'incompleto' }, ctx)
    expect(r.every((c) => (c.tipo ?? 'PJ') === 'PJ' && incompleto(c))).toBe(true)
  })
})

describe('ordenar', () => {
  it('não perde nem duplica registro', () =>
    expect(ordenar(CLIENTES_BLING, 'nome', 1)).toHaveLength(1901))
  it('inverte de verdade', () => {
    const a = ordenar(CLIENTES_BLING, 'nome', 1)[0]
    const z = ordenar(CLIENTES_BLING, 'nome', -1)[0]
    expect(a.id).not.toBe(z.id)
  })
  it('não muta o array original', () => {
    const antes = CLIENTES_BLING[0].id
    ordenar(CLIENTES_BLING, 'desde', -1)
    expect(CLIENTES_BLING[0].id).toBe(antes)
  })
})

describe('contarPor — alimenta os dropdowns', () => {
  it('GO é a UF mais comum, com 407', () => {
    const ufs = contarPor(CLIENTES_BLING, (c) => cidadeUf(c).uf)
    expect(ufs.find(([u]) => u === 'GO')?.[1]).toBe(407)
  })
  it('achado do relatório: Goiânia e GOIANIA aparecem separadas', () => {
    const cid = contarPor(CLIENTES_BLING, (c) => cidadeUf(c).cidade).map(([c]) => c)
    expect(cid).toContain('Goiânia')
    expect(cid).toContain('GOIANIA')
  })
})
