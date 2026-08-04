import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Densidade = 'confortavel' | 'compacta'

type Prefs = { densidade: Densidade; setDensidade: (d: Densidade) => void }
const Ctx = createContext<Prefs | null>(null)

/** Densidade é preferência do usuário e mora no <html>, como o tema.
 *  Telas densas ainda podem forçar a sua com data-density local. */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [densidade, setDensidade] = useState<Densidade>(
    () => (localStorage.getItem('ft-densidade') as Densidade) || 'confortavel',
  )
  useEffect(() => {
    document.documentElement.dataset.density = densidade
    localStorage.setItem('ft-densidade', densidade)
  }, [densidade])
  return <Ctx.Provider value={{ densidade, setDensidade }}>{children}</Ctx.Provider>
}

export function usePrefs() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePrefs precisa estar dentro de <PrefsProvider>')
  return c
}
