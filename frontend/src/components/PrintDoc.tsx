import { useApp } from '../store/useApp'
import A4Sheet, { AnotSvg } from './A4Sheet'

/** Alvo de impressão / PDF — fora do shell, só em @media print. */
export default function PrintDoc() {
  const { pedidos, curPed, semDinheiro } = useApp()
  const p = pedidos[curPed]
  if (!p) return <div className="print-doc" />
  return (
    <div className="print-doc">
      <A4Sheet p={p} semDinheiro={semDinheiro}>
        <AnotSvg anots={p.anotacoes ?? []} />
      </A4Sheet>
    </div>
  )
}
