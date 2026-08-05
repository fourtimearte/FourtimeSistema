import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Rows3, Rows4, Sun } from 'lucide-react'
import { usePrefs } from '@/lib/prefs'
import { CabecalhoPagina, Nota } from '@/components/fourtime/pagina'
import { Cores, Forma, Icones, Movimento, Tipografia } from './Fundamentos'
import { Superficie } from './Superficie'
import { Composicao } from './Composicao'
import { Botoes, Campos, Estados, Navegacao, Padroes } from './Componentes'
import { Biblioteca, Dados, Fatia, Grade, Tecnicas } from './Negocio'

/** /kit — o Design Kit V6.
 *
 *  É uma ROTA do app, não um arquivo separado, e essa é a decisão que
 *  organiza tudo. O kit v5 era um HTML à parte; ele e o app divergiram, e a
 *  divergência não apareceu como "está diferente" — apareceu semanas depois
 *  como "o CSS da página de clientes quebrou", porque um bloco de tokens
 *  não foi copiado junto e o navegador descartou em silêncio toda regra que
 *  dependia dele.
 *
 *  Aqui os componentes são importados dos mesmos arquivos que as telas
 *  usam. Se o botão muda, o kit muda no mesmo commit, porque é o mesmo
 *  botão. Componente novo só está pronto quando tem a sua seção aqui. */

const INDICE = [
  { grupo: 'Fundamentos', itens: [['cores', 'Cor'], ['tipografia', 'Tipografia'], ['superficie', 'Superfície'], ['forma', 'Forma e densidade'], ['icones', 'Ícones'], ['movimento', 'Movimento']] },
  { grupo: 'Componentes', itens: [['botoes', 'Botões'], ['campos', 'Campos'], ['navegacao', 'Abas · chips · KPI'], ['estados', 'Estados'], ['padroes', 'Padrões de tela'], ['composicao', 'Arranjos de módulo']] },
  { grupo: 'Fourtime', itens: [['tecnicas', 'Técnicas e estações'], ['fatia', 'Card de fatia'], ['grade', 'Grade de tamanhos'], ['biblioteca', 'Cores e tecidos'], ['dados', 'Dados']] },
] as const

export function Kit() {
  const { theme, setTheme } = useTheme()
  const { densidade, setDensidade } = usePrefs()
  const [ativa, setAtiva] = useState('cores')
  const escuro = theme === 'dark'
  const compacta = densidade === 'compacta'

  /* scroll-spy: a faixa estreita no meio da tela evita que duas seções
     disputem o destaque enquanto a página rola */
  useEffect(() => {
    const alvos = INDICE.flatMap((g) => g.itens.map(([id]) => document.getElementById(id))).filter(Boolean) as HTMLElement[]
    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((e) => e.isIntersecting)
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    alvos.forEach((a) => obs.observe(a))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <CabecalhoPagina
        titulo="/kit — Design Kit V6"
        descricao="Renderiza os componentes reais do app, nunca cópias. Cada verbete mostra as variantes, os tamanhos e os estados — inclusive vazio, carregando e erro, que são os que somem quando ninguém desenha."
      >
        <button
          onClick={() => setDensidade(compacta ? 'confortavel' : 'compacta')}
          className="hover:bg-accent flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium"
        >
          {compacta ? <Rows4 className="size-[15px]" /> : <Rows3 className="size-[15px]" />}
          {compacta ? 'Compacta' : 'Confortável'}
        </button>
        <button
          onClick={() => setTheme(escuro ? 'light' : 'dark')}
          className="hover:bg-accent flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium"
        >
          {escuro ? <Moon className="size-[15px]" /> : <Sun className="size-[15px]" />}
          {escuro ? 'Escuro' : 'Claro'}
        </button>
      </CabecalhoPagina>

      <Nota>
        Este kit substitui o <b>v5</b>, que era um HTML separado do app. Nada de CSS antigo atravessou: só o vocabulário
        — os nomes das animações, das cores por setor e das peças de negócio. O visual todo vem do preset{' '}
        <code>b7AJGDOVg8</code> do ui.shadcn.com: Luma · Neutral · chart Red · IBM Plex Sans + Montserrat · Lucide ·
        raio 0.45rem.
      </Nota>

      <div className="grid gap-(--ft-gap) lg:grid-cols-[196px_minmax(0,1fr)]">
        <nav aria-label="Seções do kit" className="hidden lg:block">
          <div className="sticky top-[72px] flex flex-col gap-0.5">
            {INDICE.map((g) => (
              <div key={g.grupo}>
                <div className="text-muted-foreground px-2.5 pt-3 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
                  {g.grupo}
                </div>
                {g.itens.map(([id, rotulo]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    aria-current={ativa === id ? 'true' : undefined}
                    className={`hover:bg-accent flex h-8 items-center rounded-lg px-2.5 text-[12.5px] transition-colors ${
                      ativa === id ? 'bg-secondary font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {rotulo}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col gap-8">
          <Cores />
          <Tipografia />
          <Superficie />
          <Forma />
          <Icones />
          <Movimento />
          <Botoes />
          <Campos />
          <Navegacao />
          <Estados />
          <Padroes />
          <Composicao />
          <Tecnicas />
          <Fatia />
          <Grade />
          <Biblioteca />
          <Dados />
        </div>
      </div>
    </>
  )
}
