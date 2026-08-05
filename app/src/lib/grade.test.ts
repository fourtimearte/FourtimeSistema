import { describe, expect, it } from 'vitest'
import { ehInfantil, foraDaGrade, gradeProvavel, subtotal, totaisGrade } from './grade'

describe('tamanho infantil', () => {
  it('reconhece o padrão <n>A', () => {
    for (const t of ['2A', '10A', '16A']) expect(ehInfantil(t)).toBe(true)
  })
  it('aceita caixa baixa e espaço em volta', () => expect(ehInfantil(' 10a ')).toBe(true))
  it('não confunde tamanho adulto', () => {
    for (const t of ['PP', 'M', 'GG', 'XGG']) expect(ehInfantil(t)).toBe(false)
  })
  /* a fábrica inventa tamanho novo sem avisar o sistema: 18A tem de passar
     por infantil mesmo não estando em lista nenhuma */
  it('aceita tamanho infantil que ninguém cadastrou ainda', () => expect(ehInfantil('18A')).toBe(true))
  it('não estoura com vazio', () => expect(ehInfantil('')).toBe(false))
})

describe('sinal de tamanho fora da grade', () => {
  it('infantil na grade adulta', () => expect(foraDaGrade('10A', 'adulta')).toBe('infantil'))
  it('adulto na grade infantil', () => expect(foraDaGrade('GG', 'infantil')).toBe('adulto'))
  it('não sinaliza o que está na grade certa', () => {
    expect(foraDaGrade('M', 'adulta')).toBe(null)
    expect(foraDaGrade('10A', 'infantil')).toBe(null)
  })
})

describe('totais', () => {
  const linhas = [
    { tamanho: 'PP', qtd: 4, uni: 89.9 },
    { tamanho: 'M', qtd: 10, uni: 89.9 },
    { tamanho: 'G', qtd: 8, uni: 89.9 },
    { tamanho: 'GG', qtd: 2, uni: 94.9 },
  ]

  it('soma peças', () => expect(totaisGrade(linhas).pecas).toBe(24))
  it('soma valor', () => expect(totaisGrade(linhas).valor).toBeCloseTo(2167.6, 2))
  it('subtotal é quantidade × unitário', () => expect(subtotal(linhas[1])).toBeCloseTo(899, 2))

  /* o motivo de a média ser ponderada: a média simples dos unitários daria
     91,15 e erraria em quase 3 reais na peça */
  it('média é ponderada, não média dos unitários', () => {
    const m = totaisGrade(linhas).medio
    expect(m).toBeCloseTo(90.32, 2)
    const simples = linhas.reduce((s, l) => s + l.uni, 0) / linhas.length
    expect(Math.abs(simples - m)).toBeGreaterThan(0.5)
  })

  it('grade vazia não divide por zero', () => expect(totaisGrade([])).toEqual({ pecas: 0, valor: 0, medio: 0 }))
})

describe('grade provável', () => {
  it('maioria infantil → infantil', () =>
    expect(gradeProvavel([{ tamanho: '10A', qtd: 1, uni: 1 }, { tamanho: '12A', qtd: 1, uni: 1 }, { tamanho: 'M', qtd: 1, uni: 1 }])).toBe('infantil'))
  it('empate cai em adulta', () =>
    expect(gradeProvavel([{ tamanho: '10A', qtd: 1, uni: 1 }, { tamanho: 'M', qtd: 1, uni: 1 }])).toBe('adulta'))
  it('lista vazia não estoura', () => expect(gradeProvavel([])).toBe('adulta'))
})
