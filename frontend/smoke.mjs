import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1400,height:1000}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:4205/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true});
await pg.getByRole('heading',{name:/Dashboard/}).waitFor({timeout:6000});
const go=async(l,h)=>{ await pg.locator('nav').getByRole('button',{name:new RegExp(l)}).click({force:true}); await pg.getByRole('heading',{name:h}).waitFor({timeout:6000}); };
await go('Comercial','Comercial');
const secoes = {};
for(const t of ['Dados do pedido','Tecido(s)','Design (define a rota','Tabela de tamanhos','Observações do layout','Imagem do produto'])
  secoes[t.slice(0,14)] = await pg.getByText(t).count();
// tecidos +
const tecAntes = await pg.getByPlaceholder('Ex.: Dry-fit PET').count();
await pg.getByText('+ tecido').first().click({force:true}); await pg.waitForTimeout(150);
const tecDepois = await pg.getByPlaceholder('Ex.: Dry-fit PET').count();
// modo dinheiro
const temUniAntes = await pg.getByText('Uni',{exact:true}).count();
await pg.getByRole('button',{name:/Ocultar R\$/}).click({force:true}); await pg.waitForTimeout(150);
const temUniDepois = await pg.getByText('Uni',{exact:true}).count();
const botaoMostrar = await pg.getByRole('button',{name:/Mostrar R\$/}).count();
await pg.getByRole('button',{name:/Mostrar R\$/}).click({force:true}); await pg.waitForTimeout(100);
// grade infantil
await pg.getByRole('button',{name:/^Infantil/}).first().click({force:true}); await pg.waitForTimeout(150);
const gradeInf = await pg.getByText(/grade infantil/).count();
// aprovar -> kanban
await pg.getByRole('button',{name:/Aprovar/}).click({force:true}); await pg.waitForTimeout(300);
await go('Produção','Kanban de Produção');
const cards = await pg.locator('.mono').filter({hasText:/PD00/}).count();
// outras páginas
for(const [l,h] of [['CRM','Clientes'],['Ficha','Ficha Técnica'],['Estoque','Estoque'],['Financeiro','Financeiro']]) await go(l,h);
// impressão
await pg.emulateMedia({media:'print'});
const appD=await pg.locator('.app-root').evaluate(el=>getComputedStyle(el).display).catch(()=>'?');
const prD=await pg.locator('.print-doc').evaluate(el=>getComputedStyle(el).display).catch(()=>'?');
await pg.emulateMedia({media:'screen'});
console.log('seções presentes:', JSON.stringify(secoes));
console.log('tecidos', tecAntes,'->',tecDepois,'| Uni visível antes/depois ocultar:',temUniAntes,'/',temUniDepois,'| botão Mostrar R$:',botaoMostrar);
console.log('grade infantil aplicada:',gradeInf>0,'| Kanban cards após aprovar:',cards);
console.log('PRINT app:',appD,'print-doc:',prD);
console.log('pageerrors:', errs.length?errs:'nenhum');
await b.close();
