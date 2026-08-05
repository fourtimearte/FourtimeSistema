import { moeda } from '@/lib/pedidos/regras'
import { cn } from '@/lib/utils'
import { foraDaGrade, subtotal, totaisGrade, type Grade, type LinhaGrade } from '@/lib/grade'

/** A tabela de tamanhos do orçamento.
 *
 *  Tudo numérico em `tabular-nums` e alinhado à direita — em fonte
 *  proporcional as casas decimais dançam linha a linha e conferir a coluna
 *  vira trabalho manual. */
export function GradeTamanhos({
  linhas, grade, className,
}: {
  linhas: LinhaGrade[]
  grade: Grade
  className?: string
}) {
  const t = totaisGrade(linhas)
  return (
    <div className={className} data-density="compacta">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <Th className="text-left">Tamanho</Th>
            <Th>Qtd</Th>
            <Th>Valor un.</Th>
            <Th>Subtotal</Th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const fora = foraDaGrade(l.tamanho, grade)
            return (
              <tr key={l.tamanho} style={fora ? { background: `color-mix(in oklch, ${corSinal(fora)} 14%, transparent)` } : undefined}>
                <Td className="text-left font-medium">
                  {l.tamanho}
                  {fora && (
                    <span className="ml-1.5 text-[10px] font-semibold" style={{ color: corSinal(fora) }}>
                      {fora === 'infantil' ? 'infantil na grade adulta' : 'adulto na grade infantil'}
                    </span>
                  )}
                </Td>
                <Td>{l.qtd}</Td>
                <Td>{moeda(l.uni)}</Td>
                <Td>{moeda(subtotal(l))}</Td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-secondary font-semibold">
            <Td className="text-left">Total</Td>
            <Td>{t.pecas}</Td>
            <Td className="text-muted-foreground">{moeda(t.medio)} méd.</Td>
            <Td>{moeda(t.valor)}</Td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/* classificação, não alerta: por isso cor categórica e fundo tingido */
const corSinal = (s: 'infantil' | 'adulto') => (s === 'infantil' ? 'var(--cat-8)' : 'var(--cat-6)')

function Th({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <th
      className={cn(
        'font-heading text-muted-foreground border-b px-(--ft-pad-x) py-(--ft-pad-y) text-right text-[11px] font-semibold tracking-[0.03em] uppercase',
        className,
      )}
    >
      {children}
    </th>
  )
}
function Td({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <td className={cn('h-(--ft-row-h) border-b px-(--ft-pad-x) text-right font-mono tabular-nums', className)}>
      {children}
    </td>
  )
}
