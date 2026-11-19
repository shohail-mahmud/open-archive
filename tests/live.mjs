// Run against a served production build. Success cases always contact archive.org.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const browser = await chromium.launch({executablePath: process.env.CHROME_BIN});
const page = await browser.newPage({ reducedMotion: 'reduce' });
const root = process.env.APP_URL || 'http://localhost:5173/';
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const go = hash => page.goto(root + '#' + hash, {waitUntil:'domcontentloaded'});
const rows = page.locator('main a[href^="/item/"]');
async function search(action) {
  const pending = page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/advancedsearch.php') && r.request().method()==='GET');
  await action(); const r=await pending; assert.equal(r.status(),200);
  const {response}=await r.json(); assert.ok(response.docs.length);
  await page.getByRole('heading', {name:response.docs[0].title || response.docs[0].identifier,exact:true}).first().waitFor();
  assert.equal(await rows.count(),response.docs.length);return response;
}
try {
  await go('/'); await page.locator('h1 span').first().waitFor(); await page.evaluate(()=>document.fonts.ready);
  for (const [width,height] of [[320,568],[390,844],[560,820],[768,1024],[1440,900]]) {
    await page.setViewportSize({width,height}); const [upper,lower]=await page.locator('h1 span').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().toJSON()));
    assert.ok(upper.bottom<=lower.top+1 && upper.left>=0 && lower.right<=width);
    assert.ok(await page.evaluate(()=>document.fonts.check('italic 400 80px "Dai Banna SIL"') && document.documentElement.scrollWidth<=innerWidth));
  }
  console.log('Two-line wordmark and font: 320, 390, 560, 768, 1440px');
  await go('/explore'); await rows.first().waitFor(); await page.locator('#q').fill('astronomy');
  const first=await search(()=>page.getByRole('button',{name:'Search',exact:true}).click());
  const d=first.docs[0];const text=await rows.first().innerText();for(const value of [typeof d.creator==='string'?d.creator:d.creator?.[0],d.year])if(value)assert.ok(text.includes(String(value)));
  await page.locator('.xp-cover img').first().waitFor();
  const second=await search(()=>page.getByRole('button',{name:'Next →'}).click());assert.equal(second.start,20);assert.notEqual(second.docs[0].identifier,d.identifier);
  const back=await search(()=>page.getByRole('button',{name:'← Previous'}).click());assert.equal(back.start,0);
  const id=back.docs[0].identifier; const metadata=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith(`/metadata/${encodeURIComponent(id)}`));await rows.first().click();const mr=await metadata;assert.equal(mr.status(),200);
  const {metadata:m}=await mr.json();assert.equal(m.identifier,id);await page.getByRole('heading',{name:[m.title].flat()[0]||id,exact:true}).waitFor();assert.ok(await page.locator(`a[href="https://archive.org/details/${encodeURIComponent(id)}"]`).count());
  console.log('Search, cover results, pagination, detail and metadata:',id,'—',m.title);
  await search(()=>go('/explore?q=rock+AND'));console.log('Former parser failure now returns results');
  await go('/explore?q=qzzxwvvqzzxwvvqnomatch991');await page.getByText(/Nothing found for/).waitFor();
  // Deliberately malformed filter: the Archive itself supplies the error envelope.
  await go('/explore?type=%28');await page.getByText(/Internet Archive rejected this request/).waitFor();
  await page.context().setOffline(true);await page.getByText('Try again').click();await page.getByText(/Could not connect to archive.org/).waitFor();await page.context().setOffline(false);
  await go('/item/qzzxwvvqzzxwvvqnomatch991');await page.getByText('No such item.').waitFor();
  // Delay (but do not replace) one real response to inspect the loading state.
  let release;const gate=new Promise(resolve=>{release=resolve});
  await page.route('**/advancedsearch.php?**',async route=>{await gate;await route.continue()});
  await page.route('**/services/img/**',route=>route.abort());
  await go('/explore?q=astronomy');await page.locator('main [aria-busy="true"]').waitFor();release();
  await rows.first().waitFor();assert.ok(await rows.count()>0);
  await page.unroute('**/advancedsearch.php?**');await page.unroute('**/services/img/**');
  await go('/collections');await page.locator('main a[href*="collection="]').first().waitFor();assert.deepEqual(errors,[]);console.log('Empty, live API rejection, offline, collections: pass. No page exceptions.');
} finally {await browser.close();}
