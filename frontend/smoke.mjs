import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1400,height:1000}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message.slice(0,160)));
await pg.goto('http://localhost:4208/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true});
await pg.waitForTimeout(400);
await pg.locator('nav').getByRole('button',{name:/Comercial/}).click({force:true});
await pg.waitForTimeout(500);
// combo referência abre busca
await pg.getByRole('button',{name:/Camiseta dry-fit/}).click({force:true}); await pg.waitForTimeout(200);
const busca = await pg.getByPlaceholder('Buscar…').count();
await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
// + adicionar tecido: conta combos de tecido antes/depois
const combosAntes = await pg.getByRole('button',{name:/Tecido|Dry-fit|Ribana/}).count();
await pg.getByRole('button',{name:/Adicionar tecido/}).click({force:true}); await pg.waitForTimeout(200);
const combosDepois = await pg.getByRole('button',{name:/Tecido|Dry-fit|Ribana/}).count();
// aprovar -> kanban
await pg.getByRole('button',{name:/^Aprovar/}).click({force:true}); await pg.waitForTimeout(300);
await pg.locator('nav').getByRole('button',{name:/Produção/}).click({force:true}); await pg.waitForTimeout(400);
const cards = await pg.locator('.mono').filter({hasText:/PD00/}).count();
// impressão
await pg.emulateMedia({media:'print'});
const appD=await pg.locator('.app-root').evaluate(el=>getComputedStyle(el).display).catch(()=>'?');
const prD=await pg.locator('.print-doc').evaluate(el=>getComputedStyle(el).display).catch(()=>'?');
await pg.emulateMedia({media:'screen'});
console.log('combo busca abriu:',busca>0,'| tecido combos',combosAntes,'->',combosDepois);
console.log('Kanban cards após aprovar:',cards,'| PRINT app:',appD,'print-doc:',prD);
console.log('pageerrors:', errs.length?errs:'nenhum');
await b.close();
