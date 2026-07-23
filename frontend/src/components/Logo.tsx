/* Wordmark FOURTIME. Recriação em SVG (troca-se pelo arquivo oficial se houver).
 * variant 'light' = para fundos ESCUROS (TIME branco). 'dark' = para fundos
 * CLAROS (TIME quase-preto). FOUR sempre vermelho da marca. */
export default function Logo({ variant = 'light', height = 26 }: { variant?: 'light' | 'dark'; height?: number }) {
  const time = variant === 'light' ? '#F3F5F8' : '#161A20'
  return (
    <svg height={height} viewBox="0 0 592 100" role="img" aria-label="Fourtime" style={{ display: 'block' }}>
      <text x="0" y="79" fontFamily="'Archivo Black','Arial Black','Helvetica Neue',system-ui,sans-serif" fontSize="100" fontWeight="900" letterSpacing="-5">
        <tspan fill="#C6161B">FOUR</tspan><tspan fill={time}>TIME</tspan>
      </text>
    </svg>
  )
}

/** mesma logo como string HTML (para o export standalone e outros usos fora do React) */
export function logoSvg(variant: 'light' | 'dark' = 'dark', height = 34): string {
  const time = variant === 'light' ? '#F3F5F8' : '#161A20'
  return `<svg height="${height}" viewBox="0 0 592 100" role="img" aria-label="Fourtime" style="display:block"><text x="0" y="79" font-family="'Archivo Black','Arial Black','Helvetica Neue',system-ui,sans-serif" font-size="100" font-weight="900" letter-spacing="-5"><tspan fill="#C6161B">FOUR</tspan><tspan fill="${time}">TIME</tspan></text></svg>`
}
