import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1400,height:1100}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message.slice(0,160)));
await pg.goto('http://localhost:4210/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true});
await pg.waitForTimeout(400);
await pg.locator('nav').getByRole('button',{name:/Comercial/}).click({force:true});
await pg.waitForTimeout(500);
// colunas 1.7/1.3 do módulo
const cols = await pg.locator('.lay-grid').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns);
// ficha é flex (com dinheiro)
const fichaDisp1 = await pg.locator('.ficha').first().evaluate(el=>getComputedStyle(el).display);
// alterna sem dinheiro -> ficha vira grid
await pg.getByRole('button',{name:/Ocultar R\$/}).click({force:true}); await pg.waitForTimeout(200);
const fichaDisp2 = await pg.locator('.ficha').first().evaluate(el=>getComputedStyle(el).display);
await pg.getByRole('button',{name:/Mostrar R\$/}).click({force:true}); await pg.waitForTimeout(150);
// toggle A/I no cabeçalho tam
const temToggle = await pg.getByRole('button',{name:'I',exact:true}).count();
// +tecido
const tecAntes = await pg.getByRole('button',{name:/Tecido|Dry-fit|Ribana/}).count();
await pg.locator('button[title="Adicionar tecido"]').first().click({force:true}); await pg.waitForTimeout(150);
const tecDepois = await pg.getByRole('button',{name:/Tecido|Dry-fit|Ribana/}).count();
// obs tags no cabeçalho
const urgente = await pg.getByRole('button',{name:'URGENTE',exact:true}).count();
console.log('grid-cols módulo:',cols);
console.log('ficha display com$ ->',fichaDisp1,'| sem$ ->',fichaDisp2,'(esperado flex -> grid)');
console.log('toggle A/I:',temToggle>0,'| tecido',tecAntes,'->',tecDepois,'| tag URGENTE no header:',urgente>0);
console.log('pageerrors:', errs.length?errs:'nenhum');
await b.close();
