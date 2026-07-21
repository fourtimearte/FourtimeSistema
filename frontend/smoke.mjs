import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
const pg=await ctx.newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(e.message.slice(0,160)));
await pg.goto('http://localhost:4211/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true});
await pg.waitForTimeout(400);
await pg.locator('nav').getByRole('button',{name:/Comercial/}).click({force:true});
await pg.waitForTimeout(500);
// SALVAR .ft -> baixa arquivo
const [dl] = await Promise.all([ pg.waitForEvent('download'), pg.getByRole('button',{name:/Salvar \.ft/}).click({force:true}) ]);
const nome = dl.suggestedFilename();
const path = '/tmp/'+nome; await dl.saveAs(path);
const fs = await import('fs'); const obj = JSON.parse(fs.readFileSync(path,'utf8'));
const ok = obj._formato==='FOURTIME_ORCAMENTO' && obj.header && Array.isArray(obj.layouts);
// COPIAR layout (L-01) -> aparece botão Colar -> colar adiciona layout
await pg.getByRole('button',{name:/^L-01/}).click({force:true}); await pg.waitForTimeout(150);
const temColar = await pg.getByRole('button',{name:/Colar layout/}).count();
const laysAntes = await pg.getByRole('button',{name:/^L-0/}).count();
await pg.getByRole('button',{name:/Colar layout/}).click({force:true}); await pg.waitForTimeout(200);
const laysDepois = await pg.getByRole('button',{name:/^L-0/}).count();
console.log('nome .ft:', nome);
console.log('.ft válido (envelope+header+layouts):', ok);
console.log('botão Colar apareceu:', temColar>0,'| layouts', laysAntes,'->',laysDepois);
console.log('pageerrors:', errs.length?errs:'nenhum');
await b.close();
