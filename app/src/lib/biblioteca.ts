/* =====================================================================
   BIBLIOTECA VISUAL — cores de peça e tecidos
   ---------------------------------------------------------------------
   Estes hex NÃO são tokens de tema, e por isso são a única exceção à regra
   de "nenhuma cor literal fora do tokens.css". Eles descrevem a cor FÍSICA
   de um tecido no estoque — como uma foto do rolo. Um azul-marinho não vira
   claro porque o usuário trocou o tema; ele continua azul-marinho.
   ===================================================================== */

export interface CorTecido { nome: string; hex: string; claro?: boolean }

export const CORES_TECIDO: CorTecido[] = [
  { nome: 'Preto', hex: '#1B1B1F' },
  { nome: 'Branco', hex: '#F3F4F6', claro: true },
  { nome: 'Vermelho Fourtime', hex: '#C6161B' },
  { nome: 'Azul-marinho', hex: '#12213F' },
  { nome: 'Royal', hex: '#2456C6' },
  { nome: 'Verde bandeira', hex: '#0B7A3B' },
  { nome: 'Amarelo ouro', hex: '#F2B705', claro: true },
  { nome: 'Laranja', hex: '#EA580C' },
  { nome: 'Rosa pink', hex: '#DB2777' },
  { nome: 'Roxo', hex: '#6D28D9' },
  { nome: 'Cinza mescla', hex: '#9AA1AC', claro: true },
  { nome: 'Grafite', hex: '#3A3F47' },
]

export type TexturaKey = 'dry' | 'pv' | 'piquet' | 'helanca' | 'ribana'

export interface Tecido {
  nome: string
  ref: string
  composicao: string
  textura: TexturaKey
  cor: CorTecido
}

export const TECIDOS: Tecido[] = [
  { nome: 'Dry-fit', ref: 'REF-DF01', composicao: '100% poliéster · leve, respirável', textura: 'dry', cor: CORES_TECIDO[4] },
  { nome: 'Malha PV', ref: 'REF-PV02', composicao: '67% poliéster / 33% viscose', textura: 'pv', cor: CORES_TECIDO[0] },
  { nome: 'Piquet', ref: 'REF-PQ03', composicao: 'Algodão · textura em grade (polos)', textura: 'piquet', cor: CORES_TECIDO[5] },
  { nome: 'Helanca light', ref: 'REF-HL04', composicao: 'Poliéster · caimento fluido', textura: 'helanca', cor: CORES_TECIDO[2] },
  { nome: 'Dry premium', ref: 'REF-DP05', composicao: 'Microfibra · toque seco', textura: 'dry', cor: CORES_TECIDO[3] },
  { nome: 'Ribana', ref: 'REF-RB06', composicao: 'Algodão canelado (punho e gola)', textura: 'ribana', cor: CORES_TECIDO[6] },
]

/** A amostra é CSS puro, não imagem: 6 texturas em gradiente pesam zero e
 *  não precisam de upload. Quando existir foto real do rolo, ela entra no
 *  lugar sem que o componente mude. */
export function fundoTextura(t: TexturaKey, hex: string): string {
  switch (t) {
    case 'dry':
      return `linear-gradient(0deg,rgba(0,0,0,.10),rgba(255,255,255,.05)),repeating-linear-gradient(45deg,rgba(255,255,255,.12) 0 2px,transparent 2px 6px),${hex}`
    case 'pv':
      return `radial-gradient(rgba(255,255,255,.16) 1px,transparent 1.5px) 0 0/7px 7px,${hex}`
    case 'piquet':
      return `repeating-linear-gradient(0deg,rgba(255,255,255,.12) 0 1px,transparent 1px 6px),repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 1px,transparent 1px 6px),${hex}`
    case 'helanca':
      return `linear-gradient(135deg,rgba(255,255,255,.10),rgba(0,0,0,.28)),${hex}`
    case 'ribana':
      return `repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 2px,rgba(255,255,255,.07) 2px 4px),${hex}`
  }
}
