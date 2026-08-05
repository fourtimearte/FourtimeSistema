/* =====================================================================
   Regras do cadastro de clientes — FUNÇÕES PURAS.
   Portadas de frontend/src/pages/CRM.tsx (v5). Nenhuma toca o DOM:
   entra dado, sai dado. É isso que permite testá-las em Node.
   ===================================================================== */
import type { Cliente } from './tipos'

export const digitos = (s: string) => (s ?? '').replace(/\D/g, '')

/** minúsculas, sem acento — para busca e comparação de nomes */
export const normaliza = (s: string) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Título em português: preposições ficam minúsculas.
 *  PJ mantém o nome como veio (razão social é escrita como está registrada).
 *
 *  BUG CORRIGIDO NA PORTABILIDADE (04/08/2026): a versão v5 usava
 *  `\b([a-zà-ú])`. Em JavaScript o `\b` só conhece [A-Za-z0-9_], então
 *  toda letra acentuada virava uma fronteira de palavra — "joão" saía
 *  "JoÃO", porque o `ã` e o `o` seguinte eram tratados como início de
 *  palavra. Um teste pegou isso. Aqui a fronteira é explícita: começo da
 *  string ou um separador de verdade. */
export function tituloPt(s: string) {
  return (s ?? '')
    .toLowerCase()
    .replace(/(^|[\s'’\-/.])(\p{Ll})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/(?<=\s)(Da|De|Do|Das|Dos|E)(?=\s)/g, (m) => m.toLowerCase())
}

export const ehPJ = (c: Cliente) => (c.tipo ?? 'PJ') === 'PJ'
export const temDoc = (c: Cliente) => !!(c.doc && c.doc !== '—')
export const temContato = (c: Cliente) => !!(c.contato || c.email)

/** Sem documento E sem contato: o registro não serve para vender nem cobrar.
 *  São 1.124 dos 1.901 na base real — é uma fila de trabalho, não um erro. */
export const incompleto = (c: Cliente) => !temDoc(c) && !temContato(c)

export function novoEm(c: Cliente, dias: number, hoje: Date) {
  if (!c.criadoEm) return false
  return (hoje.getTime() - new Date(c.criadoEm).getTime()) / 864e5 <= dias
}

/** O Bling às vezes grava "Goiânia - GO" num campo só. Aqui a UF é extraída
 *  do fim do texto quando não veio em coluna própria. */
export function cidadeUf(c: Cliente): { cidade: string; uf: string } {
  if (c.uf) return { cidade: c.cidade ?? '', uf: c.uf }
  const m = /^(.*?)[\s-]+([A-Za-z]{2})$/.exec((c.cidade ?? '').trim())
  return m ? { cidade: m[1].trim(), uf: m[2].toUpperCase() } : { cidade: c.cidade ?? '', uf: '' }
}

/** Ids de clientes que compartilham documento ou nome com outro registro.
 *  Na base real são 30 — não são fundidos automaticamente: viram aviso. */
export function idsDuplicados(clientes: Cliente[]): Set<number> {
  const porDoc: Record<string, number> = {}
  const porNome: Record<string, number> = {}
  for (const c of clientes) {
    if (temDoc(c)) porDoc[digitos(c.doc)] = (porDoc[digitos(c.doc)] ?? 0) + 1
    porNome[normaliza(c.nome)] = (porNome[normaliza(c.nome)] ?? 0) + 1
  }
  return new Set(
    clientes
      .filter((c) => (temDoc(c) && porDoc[digitos(c.doc)] > 1) || porNome[normaliza(c.nome)] > 1)
      .map((c) => c.id),
  )
}

export type FiltroCadastro =
  | '' | 'contato' | 'semcontato' | 'wa' | 'doc' | 'endereco' | 'incompleto' | 'duplicado' | 'novo30'

export interface Filtros {
  busca: string
  tipo: '' | 'PF' | 'PJ'
  uf: string
  cidade: string
  periodo: '' | 'mes' | '90' | string
  cadastro: FiltroCadastro
}

export const FILTROS_VAZIOS: Filtros = { busca: '', tipo: '', uf: '', cidade: '', periodo: '', cadastro: '' }

/** vazio '' = todos · '__vazio__' = registros SEM aquele campo */
export const SEM_VALOR = '__vazio__'

export function filtrar(
  clientes: Cliente[],
  f: Filtros,
  ctx: { duplicados: Set<number>; hoje: Date },
): Cliente[] {
  const busca = normaliza(f.busca.trim())
  return clientes.filter((c) => {
    const cu = cidadeUf(c)
    if (f.tipo && (c.tipo ?? 'PJ') !== f.tipo) return false

    if (f.uf === SEM_VALOR ? !!cu.uf : f.uf && cu.uf !== f.uf) return false
    if (f.cidade === SEM_VALOR ? !!cu.cidade : f.cidade && cu.cidade !== f.cidade) return false

    if (f.periodo) {
      if (!c.criadoEm) return false
      const d = new Date(c.criadoEm)
      if (f.periodo === 'mes') {
        if (d.getFullYear() !== ctx.hoje.getFullYear() || d.getMonth() !== ctx.hoje.getMonth()) return false
      } else if (f.periodo === '90') {
        if (!novoEm(c, 90, ctx.hoje)) return false
      } else if (String(d.getFullYear()) !== f.periodo) return false
    }

    switch (f.cadastro) {
      case 'contato': if (!temContato(c)) return false; break
      case 'semcontato': if (temContato(c)) return false; break
      case 'wa': if (digitos(c.contato).length < 10) return false; break
      case 'doc': if (!temDoc(c)) return false; break
      case 'endereco': if (!(c.endereco || c.cep)) return false; break
      case 'incompleto': if (!incompleto(c)) return false; break
      case 'duplicado': if (!ctx.duplicados.has(c.id)) return false; break
      case 'novo30': if (!novoEm(c, 30, ctx.hoje)) return false; break
    }

    if (busca) {
      const alvo = normaliza(
        [c.nome, c.fantasia, c.doc, c.email, c.contato, cu.cidade, cu.uf].filter(Boolean).join(' '),
      )
      if (!alvo.includes(busca)) return false
    }
    return true
  })
}

export type ChaveOrdem = 'nome' | 'cidade' | 'desde'

export function ordenar(clientes: Cliente[], chave: ChaveOrdem, dir: 1 | -1): Cliente[] {
  const data = (c: Cliente) => (c.criadoEm ? new Date(c.criadoEm).getTime() : 0)
  return [...clientes].sort((a, b) => {
    if (chave === 'nome') return dir * a.nome.localeCompare(b.nome, 'pt-BR')
    if (chave === 'cidade')
      return dir * (cidadeUf(a).cidade || '~').localeCompare(cidadeUf(b).cidade || '~', 'pt-BR')
    return dir * (data(a) - data(b))
  })
}

/** Contagem por valor, já ordenada — alimenta os dropdowns de UF e cidade. */
export function contarPor(clientes: Cliente[], campo: (c: Cliente) => string): [string, number][] {
  const m: Record<string, number> = {}
  for (const c of clientes) {
    const v = campo(c)
    if (v) m[v] = (m[v] ?? 0) + 1
  }
  return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
}

export interface Kpis {
  total: number; pf: number; pj: number
  comContato: number; novos30: number; incompletos: number; duplicados: number
}

export function calcularKpis(clientes: Cliente[], duplicados: Set<number>, hoje: Date): Kpis {
  return {
    total: clientes.length,
    pf: clientes.filter((c) => (c.tipo ?? 'PJ') === 'PF').length,
    pj: clientes.filter((c) => (c.tipo ?? 'PJ') === 'PJ').length,
    comContato: clientes.filter(temContato).length,
    novos30: clientes.filter((c) => novoEm(c, 30, hoje)).length,
    incompletos: clientes.filter(incompleto).length,
    duplicados: duplicados.size,
  }
}
