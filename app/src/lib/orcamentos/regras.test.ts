import { describe, expect, it } from 'vitest'
import { ORCAMENTOS_SEED as PEDIDOS_SEED } from '@/data/orcamentosSeed'
import type { Pedido } from '@/lib/pedidos/tipos'
import { ETAPAS, ETAPAS_FUNIL, ORDEM_ETAPAS } from './tipos'
import {
  diasNaEtapa, etapaDe, FILTROS_ORCAMENTO_VAZIO, filtrarOrcamentos, ganho, historico, kpisComercial,
  motivoPerda, moverEtapa, ordenarOrcamentos, ordemEtapa, parado, porEtapa, valorDe, vendedoresDe,
} from './regras'

const HOJE = new Date(2026, 7, 5)

const P = (o: Partial<Pedido> = {}): Pedido => ({
  pedido: 'PD000001', clienteId: 1, cliente: 'Teste', vendedor: 'Ana',
  entrega: '20/08/2026', status: 'rascunho',
  layouts: [{ ref: 'R1', cor: 'Preto', tecnicas: ['DTF'], tamanhos: { M: { qtd: 10, uni: 50 } } }],
  ...o,
})

describe('etapa comercial', () => {
  it('entregue, produção e aprovado vêm do status', () => {
    expect(etapaDe(P({ status: 'entregue' }))).toBe('entregue')
    expect(etapaDe(P({ status: 'producao' }))).toBe('producao')
    expect(etapaDe(P({ status: 'aprovado' }))).toBe('aprovado')
  })

  /* o campo explícito tem de ganhar da derivação, senão mover no funil não
     surtiria efeito nenhum — a tela voltaria o card para onde ele estava */
  it('o campo `etapa` ganha da derivação', () =>
    expect(etapaDe(P({ status: 'rascunho', etapa: 'negociacao' }))).toBe('negociacao'))

  it('etapa inválida no dado cai na derivação em vez de quebrar', () =>
    expect(ORDEM_ETAPAS).toContain(etapaDe(P({ etapa: 'inventada' }))))

  it('é determinístico: duas leituras dão a mesma etapa', () =>
    expect(PEDIDOS_SEED.map(etapaDe)).toEqual(PEDIDOS_SEED.map(etapaDe)))

  it('toda etapa derivada existe no cadastro', () => {
    for (const p of PEDIDOS_SEED) expect(ORDEM_ETAPAS).toContain(etapaDe(p))
  })

  it('o funil tem sete colunas e para no aprovado', () => {
    expect(ETAPAS_FUNIL).toHaveLength(7)
    expect(ETAPAS_FUNIL.at(-1)!.key).toBe('aprovado')
  })

  it('produção, entregue e perdido não viram coluna do funil', () => {
    for (const k of ['producao', 'entregue', 'perdido'] as const)
      expect(ETAPAS_FUNIL.some((e) => e.key === k)).toBe(false)
  })
})

describe('mover de etapa', () => {
  const lista = [P(), P({ pedido: 'PD000002' })]

  it('move só o pedido pedido', () => {
    const r = moverEtapa(lista, 'PD000001', 'enviado')
    expect(etapaDe(r[0])).toBe('enviado')
    expect(r[1]).toBe(lista[1])
  })

  it('não muta a lista original', () => {
    moverEtapa(lista, 'PD000001', 'enviado')
    expect(lista[0].etapa).toBeUndefined()
  })

  /* o comercial não tem rota fixa: volta atrás, pula etapa, ressuscita
     perdido. Travar isso atrapalharia mais do que ajudaria. */
  it('aceita voltar atrás e ressuscitar um perdido', () => {
    const perdido = moverEtapa(lista, 'PD000001', 'perdido')
    expect(etapaDe(moverEtapa(perdido, 'PD000001', 'contato')[0])).toBe('contato')
  })

  it('número inexistente não estoura', () => expect(moverEtapa(lista, 'nao-existe', 'enviado')).toHaveLength(2))
})

describe('histórico', () => {
  it('vai do contato até a etapa atual, sem passar do fim', () => {
    const h = historico(P({ etapa: 'enviado' }), HOJE)
    expect(h[0].etapa).toBe('contato')
    expect(h.at(-1)!.etapa).toBe('enviado')
    expect(h.every((e) => ordemEtapa(e.etapa) <= ordemEtapa('enviado'))).toBe(true)
  })

  it('só inclui `perdido` quando o orçamento está perdido', () => {
    expect(historico(P({ etapa: 'enviado' }), HOJE).some((e) => e.etapa === 'perdido')).toBe(false)
    expect(historico(P({ etapa: 'perdido' }), HOJE).some((e) => e.etapa === 'perdido')).toBe(true)
  })

  it('as datas sobem — o histórico não anda para trás', () => {
    const h = historico(P({ etapa: 'negociacao' }), HOJE)
    const ts = h.map((e) => {
      const [d, m, a] = e.data.split('/').map(Number)
      return new Date(a, m - 1, d).getTime()
    })
    expect([...ts].sort((x, y) => x - y)).toEqual(ts)
  })

  it('entrega inválida devolve histórico vazio em vez de datas NaN', () =>
    expect(historico(P({ entrega: '99/99/9999' }), HOJE)).toEqual([]))

  /* a primeira versão ancorava na ENTREGA, que é futura: todo evento caía
     no futuro e "dias na etapa" dava zero para o quadro inteiro */
  it('nenhum evento acontece no futuro', () => {
    for (const e of historico(P({ etapa: 'negociacao' }), HOJE)) {
      const [d, m, a] = e.data.split('/').map(Number)
      expect(new Date(a, m - 1, d).getTime()).toBeLessThanOrEqual(HOJE.getTime())
    }
  })

  it('há orçamento com dias na etapa maiores que zero', () =>
    expect(PEDIDOS_SEED.some((p) => diasNaEtapa(p, HOJE) > 0)).toBe(true))
})

describe('parado', () => {
  it('etapa fechada nunca é parada', () => {
    for (const k of ['producao', 'entregue', 'perdido'] as const)
      expect(parado(P({ etapa: k }), HOJE)).toBe(false)
  })

  /* o limite é por etapa: dois dias sem responder um contato é ruim; dois
     dias esperando o cliente aprovar é normal */
  it('cada etapa do funil tem o seu próprio limite', () => {
    for (const e of ETAPAS_FUNIL) expect(e.alertaDias).toBeGreaterThan(0)
  })

  it('dias na etapa nunca é negativo', () => {
    for (const p of PEDIDOS_SEED) expect(diasNaEtapa(p, HOJE)).toBeGreaterThanOrEqual(0)
  })
})

describe('KPIs', () => {
  const k = kpisComercial(PEDIDOS_SEED, HOJE)

  it('a conversão fica entre 0 e 1', () => {
    expect(k.conversao).toBeGreaterThanOrEqual(0)
    expect(k.conversao).toBeLessThanOrEqual(1)
  })

  /* aberto NÃO entra na conversão: contá-lo como perdido derrubaria a taxa
     justamente na semana em que a equipe vendesse bem */
  it('a conversão só considera o que já foi decidido', () => {
    const so = kpisComercial(
      [P({ pedido: 'A', status: 'aprovado' }), P({ pedido: 'B', etapa: 'perdido' }), P({ pedido: 'C', etapa: 'enviado' })],
      HOJE,
    )
    expect(so.ganhos).toBe(1)
    expect(so.perdidos).toBe(1)
    expect(so.conversao).toBe(0.5)
  })

  it('sem nada decidido a conversão é 0 e não NaN', () =>
    expect(kpisComercial([P({ etapa: 'contato' })], HOJE).conversao).toBe(0))

  it('lista vazia não divide por zero', () => {
    const z = kpisComercial([], HOJE)
    expect(z.conversao).toBe(0)
    expect(z.ticketMedio).toBe(0)
  })

  it('aprovado conta como ganho, mas não como aberto', () => {
    const um = kpisComercial([P({ status: 'aprovado' })], HOJE)
    expect(um.ganhos).toBe(1)
    expect(um.emAberto).toBe(0)
  })

  it('há orçamento em toda etapa do funil no seed', () => {
    const m = porEtapa(PEDIDOS_SEED)
    for (const e of ETAPAS_FUNIL) expect(m[e.key].length).toBeGreaterThan(0)
  })

  it('porEtapa não perde nem duplica', () => {
    const total = Object.values(porEtapa(PEDIDOS_SEED)).reduce((s, l) => s + l.length, 0)
    expect(total).toBe(PEDIDOS_SEED.length)
  })
})

describe('motivo da perda', () => {
  it('só existe para perdido', () => {
    expect(motivoPerda(P({ etapa: 'enviado' }))).toBe(null)
    expect(motivoPerda(P({ etapa: 'perdido' }))).not.toBe(null)
  })
})

describe('filtro e ordenação do arquivo', () => {
  it('sem filtro devolve tudo', () =>
    expect(filtrarOrcamentos(PEDIDOS_SEED, FILTROS_ORCAMENTO_VAZIO, HOJE)).toHaveLength(PEDIDOS_SEED.length))

  it('filtra por etapa', () => {
    const r = filtrarOrcamentos(PEDIDOS_SEED, { ...FILTROS_ORCAMENTO_VAZIO, etapa: 'producao' }, HOJE)
    expect(r.every((p) => etapaDe(p) === 'producao')).toBe(true)
  })

  it('busca ignora acento e caixa', () => {
    const alvo = PEDIDOS_SEED.find((p) => /[áàâãéêíóôõúç]/i.test(p.cliente))
    if (!alvo) return
    const sem = alvo.cliente.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    expect(filtrarOrcamentos(PEDIDOS_SEED, { ...FILTROS_ORCAMENTO_VAZIO, busca: sem }, HOJE).length).toBeGreaterThan(0)
  })

  /* data ordena por TEMPO: alfabeticamente "01/12" viria antes de "02/01" */
  it('ordena entrega por tempo, não por texto', () => {
    const r = ordenarOrcamentos(PEDIDOS_SEED, 'entrega', false)
    const ts = r.map((p) => {
      const [d, m, a] = p.entrega.split('/').map(Number)
      return new Date(a, m - 1, d).getTime()
    })
    expect([...ts].sort((x, y) => x - y)).toEqual(ts)
  })

  it('ordena valor de baixo para cima e inverte com desc', () => {
    const asc = ordenarOrcamentos(PEDIDOS_SEED, 'valor', false).map(valorDe)
    expect([...asc].sort((a, b) => a - b)).toEqual(asc)
    expect(ordenarOrcamentos(PEDIDOS_SEED, 'valor', true).map(valorDe)).toEqual([...asc].reverse())
  })

  it('ordenar não muta a lista original', () => {
    const antes = PEDIDOS_SEED.map((p) => p.pedido)
    ordenarOrcamentos(PEDIDOS_SEED, 'valor', true)
    expect(PEDIDOS_SEED.map((p) => p.pedido)).toEqual(antes)
  })

  it('vendedores vêm sem repetição e ordenados', () => {
    const v = vendedoresDe(PEDIDOS_SEED)
    expect(new Set(v).size).toBe(v.length)
    expect([...v].sort((a, b) => a.localeCompare(b, 'pt-BR'))).toEqual(v)
  })
})

describe('cadastro de etapas', () => {
  it('toda etapa diz o que precisa acontecer para sair dela', () => {
    for (const e of ETAPAS) expect(e.saida.length).toBeGreaterThan(10)
  })
  it('ganho é aprovado, produção ou entregue', () => {
    expect((['aprovado', 'producao', 'entregue'] as const).every((k) => ganho(k))).toBe(true)
    expect(ganho('perdido')).toBe(false)
  })
})
