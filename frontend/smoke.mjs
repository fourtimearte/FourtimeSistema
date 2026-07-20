import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1400,height:900}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:4204/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true});
await pg.getByRole('heading',{name:/Dashboard/}).waitFor({timeout:6000});
const go=async(l,h)=>{ await pg.locator('nav').getByRole('button',{name:new RegExp(l)}).click({force:true}); await pg.getByRole('heading',{name:h}).waitFor({timeout:6000}); };
await go('Comercial','Comercial');
const temForm = await pg.getByText('Dados do pedido').count();
// autocomplete cliente -> preenche contato e reflete no A4 de impressão
await pg.getByPlaceholder('Ex.: Escola João XXIII').fill('Academia Pulse');
await pg.waitForTimeout(300);
const printTemContato = await pg.locator('.print-doc').getByText('(62) 99740-1122').count();
const printTemPD = await pg.locator('.print-doc').getByText(/PD00/).count();
// aprovar (é rascunho? o pedido 0 agora tem cliente Academia; PD003929 era Escola. Após fill viramos cliente. Segue rascunho)
const aprCount = await pg.getByRole('button',{name:/Aprovar/}).count();
if(aprCount) await pg.getByRole('button',{name:/Aprovar/}).click({force:true});
await pg.waitForTimeout(300);
await go('Produção','Kanban de Produção');
const cards = await pg.locator('.mono').filter({hasText:/PD00/}).count();
// modo impressão
await pg.emulateMedia({media:'print'});
const appDisp = await pg.locator('.app-root').evaluate(el=>getComputedStyle(el).display).catch(()=>'?');
const printDisp = await pg.locator('.print-doc').evaluate(el=>getComputedStyle(el).display).catch(()=>'?');
await pg.emulateMedia({media:'screen'});
console.log('Comercial form:',temForm>0,'| A4 mostra contato:',printTemContato>0,'| A4 tem PD:',printTemPD>0);
console.log('Aprovar existia:',aprCount,'| Kanban cards:',cards);
console.log('PRINT -> app-root display:',appDisp,'(esperado none) | print-doc display:',printDisp,'(esperado block)');
console.log('pageerrors:', errs.length?errs:'nenhum');
await b.close();
