import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1400,height:1000}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message.slice(0,160)));
await pg.goto('http://localhost:4209/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true});
await pg.waitForTimeout(400);
await pg.locator('nav').getByRole('button',{name:/Comercial/}).click({force:true});
await pg.waitForTimeout(500);
// undo/redo: toggle uma tag de design e desfazer
const silkAntes = await pg.getByRole('button',{name:/^Patch/}).evaluate(el=>getComputedStyle(el).backgroundColor).catch(()=>'?');
await pg.getByRole('button',{name:/^Patch/}).click({force:true}); await pg.waitForTimeout(200); // liga Patch
const silkDepois = await pg.getByRole('button',{name:/^Patch/}).evaluate(el=>getComputedStyle(el).backgroundColor).catch(()=>'?');
await pg.getByRole('button',{name:/Desfazer/}).click({force:true}); await pg.waitForTimeout(200); // undo
const silkUndo = await pg.getByRole('button',{name:/^Patch/}).evaluate(el=>getComputedStyle(el).backgroundColor).catch(()=>'?');
const undoFunciona = (silkDepois!==silkAntes) && (silkUndo===silkAntes);
// validação: novo orçamento vazio -> aprovar deve bloquear
await pg.getByRole('button',{name:/Novo orçamento/}).first().click({force:true}); await pg.waitForTimeout(300);
await pg.getByRole('button',{name:/^Aprovar/}).click({force:true}); await pg.waitForTimeout(200);
const toastFalta = await pg.getByText(/Falta preencher/).count();
// aprovar válido no primeiro pedido
await pg.locator('nav').getByRole('button',{name:/Produção/}).click({force:true}); await pg.getByRole('heading',{name:/Kanban/}).waitFor(); const cards=await pg.locator('.mono').filter({hasText:/PD00/}).count();
console.log('undo funciona:',undoFunciona,'| validação bloqueou vazio:',toastFalta>0,'| kanban cards:',cards);
console.log('pageerrors:', errs.length?errs:'nenhum');
await b.close();
