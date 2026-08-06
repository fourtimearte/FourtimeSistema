import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/* Lê do disco de propósito. `import '…css?raw'` não serve: o vitest stuba
   import de CSS e o arquivo chega vazio — o teste passaria sempre, que é
   pior do que não existir. */
const ler = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const cssIndex = ler('../index.css')
const cssTokens = ler('../styles/tokens-v6.css')

/* =====================================================================
   A TRAVA DO TEMA ESCURO
   ---------------------------------------------------------------------
   `:root` e `.dark` têm a MESMA especificidade (0,1,0) e caem no MESMO
   elemento (o <html>). Quando um `:root` é escrito DEPOIS do `.dark`, ele
   ganha por ordem de escrita — e o valor claro vaza para o tema escuro.

   Aconteceu de verdade: o desvio `:root { --background: oklch(0.955) }`
   ficou depois do `.dark` do preset, e o tema escuro passou a ter a tela
   cinza-clara com os cartões pretos por cima. O olho lê como "algumas
   cores ficaram no light" e ninguém suspeita da ordem do arquivo.

   Este teste não julga cor nenhuma. Ele só checa a ordem — que é a parte
   que o olho não vê e o navegador não avisa.
   ===================================================================== */

const CSS: [string, string][] = [
  ['index.css', cssIndex],
  ['styles/tokens-v6.css', cssTokens],
]

/** Seletores no início de linha, na ordem em que aparecem no arquivo. */
function seletores(css: string) {
  const fora = tiraComentarios(css)
  return [...fora.matchAll(/(?:^|\n)\s*([^\s{}][^{}\n]*?)\s*\{([^{}]*)\}/g)].map((m) => ({
    sel: m[1].trim(),
    /* só interessa bloco que DECLARA token: `html { @apply font-sans }`
       vem depois do `.dark` e não faz mal nenhum */
    declaraToken: /--[\w-]+\s*:/.test(m[2]),
    linha: fora.slice(0, m.index).split('\n').length,
  }))
}

const tiraComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

describe('ordem dos blocos de tema', () => {
  for (const [arquivo, css] of CSS) {
    const blocos = seletores(css)

    it(`${arquivo}: nenhum ':root' solto depois de um '.dark'`, () => {
      const primeiroDark = blocos.findIndex((b) => /(^|,)\s*\.dark\s*(,|$)/.test(b.sel))
      if (primeiroDark < 0) return

      /* `:root:not(.dark)` e `[data-density=…]` podem vir depois: o
         primeiro é explicitamente inofensivo no escuro, o segundo não
         mexe em cor. O que não pode é um `:root` puro. */
      const culpados = blocos
        .slice(primeiroDark + 1)
        .filter((b) => b.declaraToken)
        .filter((b) => b.sel.split(',').some((s) => s.trim() === ':root' || s.trim() === 'html'))

      expect(
        culpados.map((c) => `linha ${c.linha}: ${c.sel}`),
        'use `:root:not(.dark)` — um `:root` puro depois do `.dark` vaza a cor clara para o tema escuro',
      ).toEqual([])
    })
  }

  it('index.css declara --background nos dois temas', () => {
    const css = tiraComentarios(cssIndex)
    /* o escuro precisa do valor ESCRITO: herdar do preset funciona até
       alguém acrescentar uma regra no fim do arquivo */
    const dark = css.split('.dark').slice(1).join('.dark')
    expect(dark).toMatch(/--background:\s*oklch\(0\.1/)
    expect(css).toMatch(/:root:not\(\.dark\)[\s\S]*?--background:\s*oklch\(0\.9/)
  })
})
