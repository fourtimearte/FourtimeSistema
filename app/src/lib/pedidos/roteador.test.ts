import { describe, expect, it } from 'vitest'
import { PEDIDOS_SEED } from '@/data/pedidosSeed'
import { ESTACOES, ROTAS, type Pedido, type TecnicaKey } from './tipos'
import { meiaNoite, venceu } from './regras'
import {
  aguardaIrmao, alternarTag, avancar, cardAtrasado, FILTROS_KANBAN_VAZIO, fila, filtrarCards,
  mover, porEstacao, proximaEstacao, rotear, rotuloLayout, travada, vendedores,
} from './roteador'

const HOJE = new Date(2026, 7, 5)

const P = (o: Partial<Pedido> = {}): Pedido => ({
  pedido: 'PD000001', clienteId: 1, cliente: 'Teste', vendedor: 'Ana',
  entrega: '20/08/2026', status: 'producao', estacao: 'separacao',
  layouts: [{ ref: 'R1', cor: 'Preto', tecnicas: ['DTF'], tamanhos: { M: { qtd: 10, uni: 50 } } }],
  ...o,
})

describe('roteamento', () => {
  it('não roteia rascunho — ainda não é produção', () =>
    expect(rotear([P({ status: 'rascunho' })])).toHaveLength(0))

  it('não roteia entregue — vira histórico, não coluna', () =>
    expect(rotear([P({ status: 'entregue' })])).toHaveLength(0))

  it('fatia o pedido: um card por TÉCNICA, não por layout', () => {
    const cards = rotear([
      P({
        layouts: [
          { ref: 'A', cor: 'Preto', tecnicas: ['DTF', 'Bordado'], tamanhos: {} },
          { ref: 'B', cor: 'Branco', tecnicas: ['Subli'], tamanhos: {} },
        ],
      }),
    ])
    expect(cards).toHaveLength(3)
    expect(cards.map((c) => c.tecnica)).toEqual(['DTF', 'Bordado', 'Subli'])
  })

  /* o ponto do reagrupamento: três layouts com DTF viajam num card só, e o
     operador da prensa vê "L-01 · L-02 · L-03" em vez de três cards iguais */
  it('junta num card só os layouts que levam a mesma técnica', () => {
    const cards = rotear([
      P({
        layouts: [
          { ref: 'A', cor: 'Preto', tecnicas: ['DTF'], tamanhos: { M: { qtd: 5, uni: 10 } } },
          { ref: 'B', cor: 'Branco', tecnicas: ['Silk'], tamanhos: { M: { qtd: 3, uni: 10 } } },
          { ref: 'C', cor: 'Azul', tecnicas: ['DTF'], tamanhos: { M: { qtd: 2, uni: 10 } } },
        ],
      }),
    ])
    const dtf = cards.find((c) => c.tecnica === 'DTF')!
    expect(cards).toHaveLength(2)
    expect(dtf.layouts).toEqual([0, 2])
    expect(dtf.rotulosLayout).toEqual(['L-01', 'L-03'])
    expect(dtf.refs).toEqual(['A', 'C'])
    /* soma só os layouts DESTA fatia: 5 + 2, nunca os 3 do Silk */
    expect(dtf.pecas).toBe(7)
    expect(dtf.valor).toBe(70)
    expect(dtf.anexos).toBe(2)
  })

  it('o id da fatia identifica pedido e técnica', () =>
    expect(rotear([P()])[0].id).toBe('PD000001-DTF'))

  it('a fatia nasce sem etiqueta', () => expect(rotear([P()])[0].tags).toEqual([]))

  it('aprovado entra na Separação, não no meio da faixa', () =>
    expect(rotear([P({ status: 'aprovado', estacao: 'costura' })])[0].estacao).toBe('separacao'))

  it('cada fatia cai numa estação que pertence à SUA rota', () => {
    for (const c of rotear(PEDIDOS_SEED)) expect(ROTAS[c.tecnica]).toContain(c.estacao)
  })

  it('nenhuma fatia nasce em ENTREGUE — lá não há coluna', () =>
    expect(rotear(PEDIDOS_SEED).some((c) => c.estacao === 'entregue')).toBe(false))

  it('é determinístico: dois roteamentos dão o mesmo quadro', () =>
    expect(rotear(PEDIDOS_SEED).map((c) => c.estacao)).toEqual(rotear(PEDIDOS_SEED).map((c) => c.estacao)))

  it('a sublimação não passa pelo corte manual — vem de tecido cru', () =>
    expect(ROTAS.Subli).not.toContain('corte'))

  it('toda rota reconverge na CD Costura', () => {
    for (const r of Object.values(ROTAS)) expect(r).toContain('costura')
  })

  it('toda estação de toda rota existe no cadastro de estações', () => {
    const ids = new Set(ESTACOES.map((e) => e.id))
    for (const r of Object.values(ROTAS)) for (const id of r) expect(ids.has(id)).toBe(true)
  })
})

describe('mover fatia', () => {
  const cards = rotear([P()])

  it('avançar leva à próxima estação da rota', () => {
    const r = avancar(cards, cards[0].id)
    expect(r.ok).toBe(true)
    expect(r.destino).toBe('corte')
    expect(r.cards[0].estacao).toBe('corte')
  })

  it('avançar não muta a lista original', () => {
    avancar(cards, cards[0].id)
    expect(cards[0].estacao).toBe('separacao')
  })

  /* o ponto da rota ser dado e não memória: o quadro RECUSA o destino errado */
  it('recusa destino fora da rota da técnica', () => {
    const r = mover(cards, cards[0].id, 'silk_tela')
    expect(r.ok).toBe(false)
    expect(r.cards).toBe(cards)
  })

  it('recusa mover para a estação onde já está', () =>
    expect(mover(cards, cards[0].id, 'separacao').ok).toBe(false))

  it('recusa id inexistente em vez de estourar', () =>
    expect(mover(cards, 'nao-existe', 'corte').ok).toBe(false))

  it('no fim da rota não há próxima estação', () => {
    const fim = { ...cards[0], estacao: 'entregue' }
    expect(proximaEstacao(fim)).toBe(null)
  })
})

describe('aguarda irmão', () => {
  const misto = P({
    layouts: [
      { ref: 'A', cor: 'Preto', tecnicas: ['DTF'], tamanhos: {} },
      { ref: 'B', cor: 'Preto', tecnicas: ['Bordado'], tamanhos: {} },
    ],
  })

  it('avisa quando uma fatia chega à costura e a outra ficou atrás', () => {
    const cards = rotear([misto]).map((c) =>
      c.tecnica === 'DTF' ? { ...c, estacao: 'costura' } : { ...c, estacao: 'bordado_ext' },
    )
    expect(aguardaIrmao(cards[0], cards)).toBe(true)
    expect(aguardaIrmao(cards[1], cards)).toBe(false)
  })

  it('não avisa quando as duas já chegaram', () => {
    const cards = rotear([misto]).map((c) => ({ ...c, estacao: 'costura' }))
    expect(cards.every((c) => !aguardaIrmao(c, cards))).toBe(true)
  })

  it('fatia única nunca aguarda irmão', () => {
    const cards = rotear([P()]).map((c) => ({ ...c, estacao: 'costura' }))
    expect(aguardaIrmao(cards[0], cards)).toBe(false)
  })
})

describe('etiquetas do card', () => {
  const cards = rotear([P()])

  it('liga uma etiqueta', () => expect(alternarTag(cards, cards[0].id, 'pausado')[0].tags).toEqual(['pausado']))

  it('clicar de novo desliga', () => {
    const ligada = alternarTag(cards, cards[0].id, 'pausado')
    expect(alternarTag(ligada, cards[0].id, 'pausado')[0].tags).toEqual([])
  })

  it('não muta a lista original', () => {
    alternarTag(cards, cards[0].id, 'urgente')
    expect(cards[0].tags).toEqual([])
  })

  it('id inexistente não estoura nem muda nada', () =>
    expect(alternarTag(cards, 'nao-existe', 'urgente')[0].tags).toEqual([]))

  it('problema e pausado travam a fatia; urgente não', () => {
    expect(travada({ ...cards[0], tags: ['problema'] })).toBe(true)
    expect(travada({ ...cards[0], tags: ['pausado'] })).toBe(true)
    expect(travada({ ...cards[0], tags: ['urgente'] })).toBe(false)
  })

  it('filtra por etiqueta', () => {
    const com = alternarTag(cards, cards[0].id, 'urgente')
    expect(filtrarCards(com, { ...FILTROS_KANBAN_VAZIO, tag: 'urgente' }, HOJE)).toHaveLength(1)
    expect(filtrarCards(com, { ...FILTROS_KANBAN_VAZIO, tag: 'pausado' }, HOJE)).toHaveLength(0)
  })
})

describe('rótulo de layout', () => {
  it('é o mesmo do editor e do A4', () => {
    expect(rotuloLayout(0)).toBe('L-01')
    expect(rotuloLayout(11)).toBe('L-12')
  })
})

describe('atraso do card', () => {
  it('prazo vencido é atraso', () =>
    expect(cardAtrasado(rotear([P({ entrega: '01/08/2026' })])[0], HOJE)).toBe(true))

  it('hoje ainda não é atraso', () =>
    expect(cardAtrasado(rotear([P({ entrega: '05/08/2026' })])[0], HOJE)).toBe(false))

  /* a versão anterior fazia hoje.setHours(0,0,0,0) e mudava o Date do
     chamador — o resultado dependia da ordem das chamadas */
  it('não muda o Date que recebeu', () => {
    const hoje = new Date(2026, 7, 5, 14, 30)
    venceu('01/08/2026', hoje)
    expect(hoje.getHours()).toBe(14)
    expect(meiaNoite(hoje)).toBe(new Date(2026, 7, 5).getTime())
  })
})

describe('filtros e fila', () => {
  const cards = rotear(PEDIDOS_SEED)

  it('sem filtro devolve tudo', () =>
    expect(filtrarCards(cards, FILTROS_KANBAN_VAZIO, HOJE)).toHaveLength(cards.length))

  it('filtra por técnica', () => {
    const r = filtrarCards(cards, { ...FILTROS_KANBAN_VAZIO, tecnica: 'Silk' as TecnicaKey }, HOJE)
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((c) => c.tecnica === 'Silk')).toBe(true)
  })

  it('busca ignora acento e caixa', () => {
    const alvo = cards.find((c) => /[áàâãéêíóôõúç]/i.test(c.cliente))
    if (!alvo) return
    const semAcento = alvo.cliente.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    expect(filtrarCards(cards, { ...FILTROS_KANBAN_VAZIO, busca: semAcento }, HOJE).length).toBeGreaterThan(0)
  })

  it('só atrasados devolve apenas prazo vencido', () =>
    expect(
      filtrarCards(cards, { ...FILTROS_KANBAN_VAZIO, soAtrasados: true }, HOJE).every((c) => cardAtrasado(c, HOJE)),
    ).toBe(true))

  it('vendedores vêm sem repetição e ordenados', () => {
    const v = vendedores(cards)
    expect(new Set(v).size).toBe(v.length)
    expect([...v].sort((a, b) => a.localeCompare(b, 'pt-BR'))).toEqual(v)
  })

  it('a fila vem em ordem de entrega, mais urgente primeiro', () => {
    const f = fila(PEDIDOS_SEED)
    const ts = f.map((p) => {
      const [d, m, a] = p.entrega.split('/').map(Number)
      return new Date(a, m - 1, d).getTime()
    })
    expect([...ts].sort((x, y) => x - y)).toEqual(ts)
  })

  it('a fila não traz rascunho nem entregue', () =>
    expect(fila(PEDIDOS_SEED).every((p) => p.status === 'aprovado' || p.status === 'producao')).toBe(true))

  it('porEstacao devolve chave para toda estação, mesmo vazia', () => {
    const m = porEstacao(rotear(PEDIDOS_SEED))
    for (const e of ESTACOES) expect(Array.isArray(m[e.id])).toBe(true)
  })

  it('porEstacao não perde nem duplica card', () => {
    const cs = rotear(PEDIDOS_SEED)
    expect(Object.values(porEstacao(cs)).reduce((s, l) => s + l.length, 0)).toBe(cs.length)
  })
})
