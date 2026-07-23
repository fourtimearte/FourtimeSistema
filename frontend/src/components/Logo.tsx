/* Logo FOURTIME — imagem oficial do cliente (PNG 1000x110, fundo transparente).
 * variant 'light' = para fundos ESCUROS (TIME branco). 'dark' = para fundos
 * CLAROS (TIME preto). Proporção fixa 1000:110 → largura = altura * 1000/110. */
import { LOGO_TIME_CLARO, LOGO_TIME_ESCURO } from './logoData'

const AR = 1000 / 110

export default function Logo({ variant = 'light', height = 26 }: { variant?: 'light' | 'dark'; height?: number }) {
  const src = variant === 'light' ? LOGO_TIME_CLARO : LOGO_TIME_ESCURO
  return <img src={src} alt="Fourtime" height={height} style={{ display: 'block', height, width: 'auto' }} />
}

/** mesma logo como string HTML (para o export standalone e outros usos fora do React) */
export function logoSvg(variant: 'light' | 'dark' = 'dark', height = 34): string {
  const src = variant === 'light' ? LOGO_TIME_CLARO : LOGO_TIME_ESCURO
  const w = Math.round(height * AR)
  return `<img src="${src}" alt="Fourtime" height="${height}" width="${w}" style="display:block;height:${height}px;width:auto">`
}
