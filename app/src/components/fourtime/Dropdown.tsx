import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normaliza } from '@/lib/clientes/regras'

export interface Opcao { valor: string; texto: string; contagem?: number }

interface Caixa { left: number; top: number; width: number; acima: boolean }

/** Dropdown de filtro. Quando há valor escolhido ele se destaca — o usuário
 *  precisa ver de relance que a lista está filtrada, senão estranha a
 *  contagem.
 *
 *  O menu é desenhado num PORTAL no `<body>`, com posição `fixed`, e não como
 *  filho absoluto do gatilho. Isso não é preciosismo: desde que os painéis
 *  passaram a ser `Card` do shadcn — que traz `overflow-hidden` para recortar
 *  o conteúdo no raio grande — um menu absoluto era cortado na borda inferior
 *  do próprio painel. Na tela de Clientes aparecia só uma tira de 15px do
 *  seletor de UF. Qualquer ancestral com `overflow` diferente de `visible`
 *  recorta um filho absoluto; o portal sai dessa cadeia de vez. */
export function Dropdown({
  rotulo, valor, opcoes, onEscolher, buscavel, largura = 150,
}: {
  rotulo: string; valor: string; opcoes: Opcao[]
  onEscolher: (v: string) => void; buscavel?: boolean; largura?: number
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const gatilho = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  const MAX_ALTURA = 288 /* max-h-72 */

  const posicionar = useCallback(() => {
    const g = gatilho.current
    if (!g) return
    const r = g.getBoundingClientRect()
    /* abre para cima quando não cabe embaixo e cabe em cima — senão o menu
       nasce fora da janela e o usuário não vê o que escolheu */
    const abaixo = window.innerHeight - r.bottom
    const acima = abaixo < 200 && r.top > abaixo
    setCaixa({
      left: r.left,
      top: acima ? r.top - 4 : r.bottom + 4,
      width: r.width,
      acima,
    })
  }, [])

  useLayoutEffect(() => {
    if (aberto) posicionar()
  }, [aberto, posicionar])

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (gatilho.current?.contains(alvo) || menu.current?.contains(alvo)) return
      setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    /* `capture` para pegar a rolagem de qualquer contêiner interno, não só a
       da janela — o quadro do Kanban rola dentro de si mesmo */
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', posicionar, true)
    window.addEventListener('resize', posicionar)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', posicionar, true)
      window.removeEventListener('resize', posicionar)
    }
  }, [aberto, posicionar])

  const atual = opcoes.find((o) => o.valor === valor)
  const filtrado = !!valor
  const visiveis =
    buscavel && busca ? opcoes.filter((o) => !o.valor || normaliza(o.texto).includes(normaliza(busca))) : opcoes

  function escolher(v: string) {
    onEscolher(v)
    setAberto(false)
    setBusca('')
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        style={{ minWidth: largura }}
        className={cn(
          'flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-3xl border px-3 text-xs transition-colors',
          filtrado ? 'border-primary text-primary font-semibold' : 'hover:bg-accent',
        )}
      >
        {!filtrado && <span className="text-muted-foreground">{rotulo}:</span>}
        <span className="truncate">{atual?.texto ?? 'Todos'}</span>
        <ChevronDown className="ml-auto size-3.5 shrink-0" />
      </button>

      {aberto &&
        caixa &&
        createPortal(
          <div
            ref={menu}
            role="listbox"
            aria-label={rotulo}
            style={{
              position: 'fixed',
              left: caixa.left,
              top: caixa.acima ? undefined : caixa.top,
              bottom: caixa.acima ? window.innerHeight - caixa.top : undefined,
              minWidth: Math.max(caixa.width, largura),
              maxHeight: MAX_ALTURA,
            }}
            className="bg-popover mov-surgir z-[80] overflow-y-auto rounded-2xl border p-1.5 shadow-lg"
          >
            {buscavel && (
              <input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite para filtrar…"
                className="bg-input/50 mb-1 h-8 w-full rounded-2xl border border-transparent px-2.5 text-xs outline-none"
              />
            )}
            {visiveis.map((o) => (
              <button
                key={o.valor}
                role="option"
                aria-selected={o.valor === valor}
                onClick={() => escolher(o.valor)}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs whitespace-nowrap"
              >
                <span className="flex-1 truncate">{o.texto}</span>
                {o.contagem != null && <span className="text-muted-foreground font-mono text-[10px]">{o.contagem}</span>}
                {o.valor === valor && <Check className="size-3.5 shrink-0" />}
              </button>
            ))}
            {!visiveis.length && (
              <div className="text-muted-foreground px-2 py-3 text-center text-xs">nada encontrado</div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
