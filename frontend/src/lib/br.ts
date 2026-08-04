/* =====================================================================
   Utilidades brasileiras — máscaras e validação de CPF/CNPJ/CEP/fone.
   Usadas pelo cadastro de clientes (CRM). Máscaras aplicadas ao digitar;
   validação de dígito verificador no salvar (aviso, não bloqueio duro —
   docs estrangeiros/atípicos passam com confirmação visual).
   ===================================================================== */

const dig = (v: string) => v.replace(/\D/g, '')

/** máscara progressiva de CPF: 000.000.000-00 */
export function maskCpf(v: string): string {
  const d = dig(v).slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}
/** máscara progressiva de CNPJ: 00.000.000/0000-00 */
export function maskCnpj(v: string): string {
  const d = dig(v).slice(0, 14)
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
export const maskDoc = (v: string, tipo: 'PF' | 'PJ') => (tipo === 'PF' ? maskCpf(v) : maskCnpj(v))

/** máscara de telefone/WhatsApp: (00) 00000-0000 ou (00) 0000-0000 */
export function maskFone(v: string): string {
  const d = dig(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}
/** máscara de CEP: 00000-000 */
export function maskCep(v: string): string {
  return dig(v).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

/** dígitos verificadores de CPF */
export function validaCpf(v: string): boolean {
  const d = dig(v)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  for (const t of [9, 10]) {
    let s = 0
    for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i)
    const r = (s * 10) % 11 % 10
    if (r !== +d[t]) return false
  }
  return true
}
/** dígitos verificadores de CNPJ */
export function validaCnpj(v: string): boolean {
  const d = dig(v)
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let s = 0
    for (let i = 0; i < n; i++) s += +d[i] * w[i]
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === +d[12] && calc(13) === +d[13]
}
/** válido para o tipo — campo vazio ou '—' conta como "sem doc" (permitido) */
export function validaDoc(v: string, tipo: 'PF' | 'PJ'): boolean {
  const d = dig(v)
  if (!d.length) return true
  return tipo === 'PF' ? validaCpf(v) : validaCnpj(v)
}
export function validaEmail(v: string): boolean {
  return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}
/** link de WhatsApp a partir do telefone BR */
export function linkWhats(fone: string): string {
  const d = dig(fone)
  return d.length >= 10 ? `https://wa.me/55${d}` : ''
}

/** Consulta CNPJ na BrasilAPI (grátis, sem token, com CORS) para auto-preencher
 * o cadastro PJ. Retorna null se inválido/erro. */
export interface DadosCnpj { razao: string; fantasia: string; cep: string; logradouro: string; numero: string; bairro: string; cidade: string; uf: string; email: string; telefone: string }
export async function consultaCnpj(v: string): Promise<DadosCnpj | null> {
  const d = dig(v)
  if (d.length !== 14) return null
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`)
    if (!r.ok) return null
    const j = await r.json()
    return {
      razao: j.razao_social ?? '', fantasia: j.nome_fantasia ?? '', cep: j.cep ?? '',
      logradouro: j.logradouro ?? '', numero: j.numero ?? '', bairro: j.bairro ?? '',
      cidade: j.municipio ?? '', uf: j.uf ?? '', email: j.email ?? '',
      telefone: j.ddd_telefone_1 ?? '',
    }
  } catch { return null }
}
