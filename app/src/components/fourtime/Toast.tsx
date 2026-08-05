import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Check, TriangleAlert } from 'lucide-react'

type Tom = 'ok' | 'erro'
interface Aviso { id: number; texto: string; tom: Tom }

const Ctx = createContext<{ avisar: (texto: string, tom?: Tom) => void } | null>(null)

/** Aviso curto de que uma ação aconteceu.
 *
 *  Vira provider — e não estado local de tela — porque toda tela que move
 *  alguma coisa precisa do mesmo retorno. Quando cada uma escreve o seu, um
 *  fica no rodapé, outro no canto, e o usuário deixa de procurar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const avisar = useCallback((texto: string, tom: Tom = 'ok') => {
    /* id vem de um contador monotônico, não de Date.now(): dois avisos no
       mesmo milissegundo colidiriam e o React reusaria a chave */
    setAvisos((a) => [...a, { id: (a.at(-1)?.id ?? 0) + 1, texto, tom }])
  }, [])

  useEffect(() => {
    if (!avisos.length) return
    const t = setTimeout(() => setAvisos((a) => a.slice(1)), 3200)
    return () => clearTimeout(t)
  }, [avisos])

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <Ctx.Provider value={valor}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-1.5 px-4"
      >
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`bg-card mov-crescer flex max-w-full items-center gap-2 rounded-3xl border px-4 py-2.5 text-xs shadow-lg ${
              a.tom === 'erro' ? 'border-destructive text-destructive' : ''
            }`}
          >
            {a.tom === 'erro' ? (
              <TriangleAlert className="size-3.5 shrink-0" />
            ) : (
              <Check className="text-success size-3.5 shrink-0" />
            )}
            <span className="truncate">{a.texto}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast fora do ToastProvider')
  return c.avisar
}
