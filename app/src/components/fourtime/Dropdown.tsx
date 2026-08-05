import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normaliza } from '@/lib/clientes/regras'

export interface Opcao { valor: string; texto: string; contagem?: number }

/** Dropdown de filtro. Quando há valor escolhido ele se destaca — o usuário
 *  precisa ver de relance que a lista está filtrada, senão estranha a contagem. */
export function Dropdown({
  rotulo, valor, opcoes, onEscolher, buscavel, largura = 150,
}: {
  rotulo: string; valor: string; opcoes: Opcao[]
  onEscolher: (v: string) => void; buscavel?: boolean; largura?: number
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const atual = opcoes.find((o) => o.valor === valor)
  const filtrado = !!valor
  const visiveis = buscavel && busca ? opcoes.filter((o) => !o.valor || normaliza(o.texto).includes(normaliza(busca))) : opcoes

  return (
    <div ref={ref} className="relative" style={{ minWidth: largura }}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className={cn(
          'flex h-(--ft-control-h-sm) w-full items-center gap-1.5 rounded-3xl border px-3 text-xs transition-colors',
          filtrado ? 'border-primary text-primary font-semibold' : 'hover:bg-accent',
        )}
      >
        {!filtrado && <span className="text-muted-foreground">{rotulo}:</span>}
        <span className="truncate">{atual?.texto ?? 'Todos'}</span>
        <ChevronDown className="ml-auto size-3.5 shrink-0" />
      </button>

      {aberto && (
        <div
          role="listbox"
          className="bg-popover absolute top-[calc(100%+4px)] left-0 z-50 max-h-72 min-w-full overflow-y-auto rounded-2xl border p-1.5 shadow-lg"
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
              onClick={() => {
                onEscolher(o.valor)
                setAberto(false)
                setBusca('')
              }}
              className="hover:bg-accent flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs whitespace-nowrap"
            >
              <span className="flex-1 truncate">{o.texto}</span>
              {o.contagem != null && <span className="text-muted-foreground font-mono text-[10px]">{o.contagem}</span>}
              {o.valor === valor && <Check className="size-3.5 shrink-0" />}
            </button>
          ))}
          {!visiveis.length && <div className="text-muted-foreground px-2 py-3 text-center text-xs">nada encontrado</div>}
        </div>
      )}
    </div>
  )
}
