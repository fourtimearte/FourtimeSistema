import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:process.env.CHROME});
const ctx=await b.newContext({acceptDownloads:true}); const pg=await ctx.newPage();
await pg.goto('http://localhost:4213/',{waitUntil:'networkidle'});
await pg.getByText('Entrar no painel').click({force:true}); await pg.waitForTimeout(400);
await pg.locator('nav').getByRole('button',{name:/Comercial/}).click({force:true}); await pg.waitForTimeout(500);
const [dl]=await Promise.all([pg.waitForEvent('download'), pg.getByRole('button',{name:/^HTML/}).click({force:true})]);
await dl.saveAs('/tmp/o.html'); await b.close();
