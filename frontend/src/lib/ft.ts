/* =====================================================================
   Contrato .ft (FT-FORMATO-CONTRATO) — envelope versionado + leitura
   tolerante. Salvar/abrir round-trip sem perda. Campo ausente vira padrão;
   campo existente nunca é removido.
   ===================================================================== */
import { novoLayout, type Pedido, type Layout, type DesignTag } from '../store/model'

export const FT_FORMATO = 'FOURTIME_ORCAMENTO'
export const FT_VERSAO = 2

function blankHeader() {
  return { pedido: '', clienteId: null, cliente: '', cpf: '', vendedor: '', contato: '', depto: '', embalagem: '', entrega: '', envio: '', pagamento: '', obs: '', obsTags: [] as string[] }
}

export function toFt(p: Pedido, salvoEm: string) {
  return {
    _formato: FT_FORMATO, _versao: FT_VERSAO, salvoEm,
    header: {
      pedido: p.pedido, clienteId: p.clienteId, cliente: p.cliente, cpf: p.cpf, vendedor: p.vendedor, contato: p.contato,
      depto: p.depto, embalagem: p.embalagem, entrega: p.entrega, envio: p.envio, pagamento: p.pagamento, obs: p.obs, obsTags: p.obsTags ?? [],
    },
    layouts: p.layouts.map(l => ({
      refCod: l.refCod, ref: l.ref, grade: l.grade, tecidos: l.tecidos, cor: l.cor, corHex: l.corHex,
      design: l.design, tamanhos: l.tamanhos, img: l.img, obs: l.obs, obsTags: l.obsTags,
    })),
    anotacoes: p.anotacoes ?? [],
  }
}

function completaLayout(raw: any): Layout {
  const base = novoLayout()
  const l: Layout = { ...base, ...(raw || {}) }
  if (!Array.isArray(l.tecidos) || !l.tecidos.length) l.tecidos = ['']
  if (!Array.isArray(l.design)) l.design = []
  l.design = l.design.map((d: any): DesignTag => ({ tag: d.tag, cores: Array.isArray(d.cores) ? d.cores : [] }))
  if (typeof l.tamanhos !== 'object' || !l.tamanhos) l.tamanhos = {}
  if (l.grade !== 'infantil') l.grade = 'adulto'
  if (!Array.isArray(l.obsTags)) l.obsTags = []
  if (typeof l.img !== 'string') l.img = l.img ?? null
  return l
}

/** aceita o formato oficial (header/layouts) ou tolerante (Array.isArray(layouts)) */
export function fromFt(obj: any): Pedido {
  const h = obj?.header ?? obj ?? {}
  const layouts = Array.isArray(obj?.layouts) ? obj.layouts : []
  const p: Pedido = {
    ...blankHeader(),
    ...h,
    obsTags: Array.isArray(h.obsTags) ? h.obsTags : [],
    status: 'rascunho', aprovado: false,
    anotacoes: Array.isArray(obj?.anotacoes) ? obj.anotacoes.filter((a: any) => a && a.tipo) : [],
    layouts: (layouts.length ? layouts : [novoLayout()]).map(completaLayout),
  } as Pedido
  if (!p.pedido) p.pedido = 'PD000000'
  return p
}

export function ehFt(obj: any): boolean {
  return !!obj && (obj._formato === FT_FORMATO || Array.isArray(obj.layouts) || Array.isArray(obj?.header && obj.layouts))
}

/** nome do arquivo: NOME - PEDIDO - DD-MM-AA - HHhMM (v172) */
export function nomeFt(p: Pedido, d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const data = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)}`
  const hora = `${pad(d.getHours())}h${pad(d.getMinutes())}`
  const nome = (p.cliente || 'ORÇAMENTO').toUpperCase()
  return `${nome} - ${p.pedido} - ${data} - ${hora}`
}
