import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Aplica um filtro a partir da âncora da URL (`/clientes#pj`).
 *
 *  É o que faz o submenu do rail valer alguma coisa: clicar em "Pessoa
 *  jurídica" e cair na lista inteira seria um item de menu que mente, e o
 *  usuário aprende rápido a não clicar nele.
 *
 *  Roda a cada mudança de âncora, e não só na montagem — navegar de
 *  `#pf` para `#pj` não desmonta a tela, então um efeito só de montagem
 *  não veria a segunda troca. */
export function useAncora<T>(mapa: Record<string, T>, aplicar: (valor: T) => void) {
  const { hash } = useLocation()
  useEffect(() => {
    const chave = hash.replace('#', '')
    if (chave && chave in mapa) aplicar(mapa[chave])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])
}
