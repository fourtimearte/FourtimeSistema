/* Confere que todo menu suspenso aparece INTEIRO na janela.
   Roda contra `npm run preview` em :4173.

   Existe por causa de um defeito real: quando os paineis viraram `Card`
   do shadcn — que traz `overflow-hidden` para recortar o conteudo no raio
   grande — o menu de filtro, que era um filho `absolute`, passou a ser
   cortado na borda do painel. Na tela de Clientes sobrava uma tira de
   15px do seletor de UF. A correcao foi portal + position:fixed; este
   script e a trava para nao voltar.

   A asserticao que importa: `visivel` tem de ser igual a `altura`. */
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const errs = []
const p = await b.newPage({ viewport: { width: 1500, height: 950 } })
p.on('pageerror', (e) => errs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))

const medir = () =>
  p.evaluate(() => {
    const m = document.querySelector('[role="listbox"]')
    if (!m) return null
    const r = m.getBoundingClientRect()
    const visH = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0))
    return {
      altura: Math.round(r.height),
      visivel: Math.round(visH),
      portal: m.parentElement === document.body,
      top: Math.round(r.top),
    }
  })

await p.goto('http://localhost:4173/clientes', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)

await p.getByRole('button', { name: /UF:/ }).click()
await p.waitForTimeout(400)
console.log('UF     ', JSON.stringify(await medir()))
await p.screenshot({ path: '/home/claude/dd-uf.png' })
await p.keyboard.press('Escape')
await p.waitForTimeout(250)

await p.getByRole('button', { name: /Cidade:/ }).click()
await p.waitForTimeout(400)
console.log('Cidade ', JSON.stringify(await medir()))
await p.screenshot({ path: '/home/claude/dd-cidade.png' })
const op = p.locator('[role="option"]').nth(2)
const txt = (await op.innerText()).trim().split('\n')[0]
await op.click()
await p.waitForTimeout(500)
console.log('escolheu:', txt, '| fechou:', (await p.locator('[role="listbox"]').count()) === 0)
console.log('lista agora:', (await p.locator('text=/clientes? de/').first().textContent()).trim())

await p.getByRole('button', { name: /Tipo:/ }).click()
await p.waitForTimeout(300)
await p.mouse.click(700, 750)
await p.waitForTimeout(300)
console.log('clique fora fecha:', (await p.locator('[role="listbox"]').count()) === 0)

await p.goto('http://localhost:4173/kanban', { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
await p.getByRole('button', { name: /Técnica:/ }).click()
await p.waitForTimeout(400)
console.log('Kanban ', JSON.stringify(await medir()))
await p.screenshot({ path: '/home/claude/dd-kanban.png' })

console.log('erros:', errs.length ? errs : 'nenhum')
await b.close()
