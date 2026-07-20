import { chromium } from 'playwright-core';
const errs=[];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage();
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
p.on('pageerror',e=>errs.push('pageerror: '+e.message));
await p.goto('http://localhost:4188/',{waitUntil:'networkidle'});
const loginBtn=await p.locator('text=Entrar no painel').count();
await p.locator('text=Entrar no painel').click();
await p.waitForTimeout(400);
// ir para produção
await p.locator('text=Produção (Kanban)').click();
await p.waitForTimeout(400);
const cols=await p.locator('text=Kanban de Produção').count();
const cards=await p.locator('.mono:has-text("PD00")').count();
// navegar demais
for(const t of ['Comercial · Editor','CRM / Clientes','Ficha Técnica (BOM)','Estoque','Financeiro','Dashboard']){await p.locator('text='+t).first().click();await p.waitForTimeout(150);}
console.log('login btn:',loginBtn,'| kanban título:',cols,'| cards PD visíveis:',cards);
console.log('ERROS:', errs.length?errs:'nenhum');
await b.close();
