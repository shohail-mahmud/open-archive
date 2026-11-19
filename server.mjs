// First-party, read-only catalogue relay. No arbitrary upstream URLs or credentials.
import http from 'node:http';
import {gzipSync} from 'node:zlib';
import { readFile } from 'node:fs/promises';
const html=(await readFile(new URL('./dist/index.html', import.meta.url),'utf8')).replace('<head>','<head><meta name="archive-relay" content="/api/archive">');
const gzipHTML=gzipSync(html);
const cache=new Map(), pending=new Map();
const send=(res,status,type,body,extra={})=>{res.writeHead(status,{'content-type':type,'x-content-type-options':'nosniff',...extra});res.end(body)};
async function lookup(path){
  const r=await fetch('https://archive.org'+path,{signal:AbortSignal.timeout(12000),redirect:'error'});
  const body=await r.text();const value=JSON.parse(body);
  const result={status:r.status,body};
  if(r.ok && value && !value.error && (value.response||value.metadata) && body.length<200000){
    if(cache.size>=64)cache.delete(cache.keys().next().value);
    cache.set(path,{result,until:Date.now()+120000});
  }
  return result;
}
http.createServer(async(req,res)=>{
  if(req.method!=='GET')return send(res,405,'text/plain','GET required');
  let u;try {u=new URL(req.url,'http://app.local');}catch{return send(res,400,'text/plain','Invalid path');}
  if(/^\/(?:index\.html|(?:explore|collections|about|terms|privacy)\/?|item\/[^/]+\/?)?$/.test(u.pathname)){const gzip=/\bgzip\b/.test(req.headers['accept-encoding']||'');return send(res,200,'text/html; charset=utf-8',gzip?gzipHTML:html,{'cache-control':'no-cache','vary':'Accept-Encoding',...(gzip?{'content-encoding':'gzip'}:{})});}
  const file=/^\/api\/archive\/file\/([\w.~-]{1,241})$/.exec(u.pathname);
  if(file)return send(res,403,'text/plain','Downloads are provided by archive.org, not by Open Archive.');
  const img=/^\/api\/archive\/services\/img\/([a-zA-Z0-9_][a-zA-Z0-9._~-]{0,240})$/.exec(u.pathname);
  if(img)return send(res,403,'text/plain','Archive thumbnails are not cleared for redistribution.');
  if(!(u.pathname==='/api/archive/advancedsearch.php'||/^\/api\/archive\/metadata\/[\w.%~-]+$/.test(u.pathname)))return send(res,404,'text/plain','Not found');
  const path=u.pathname.slice('/api/archive'.length)+u.search;
  if(path.length>6000 || (u.pathname.endsWith('.php') && (u.searchParams.get('output')!=='json'||!/^\d{1,2}$/.test(u.searchParams.get('rows')||'')||u.searchParams.has('callback'))))return send(res,400,'text/plain','Invalid catalogue request');
  try {
    const hit=cache.get(path);const cached=hit && hit.until>Date.now();
    let result;
    if(cached)result=hit.result;
    else {if(!pending.has(path)){if(pending.size>=32)return send(res,503,'text/plain','Catalogue busy');pending.set(path,lookup(path).finally(()=>pending.delete(path)));} result=await pending.get(path);}
    send(res,result.status,'application/json',result.body,{'cache-control':'no-store','x-catalogue-cache':cached?'hit':'miss'});
  }catch(e){send(res,e.name==='TimeoutError'?504:502,'application/json',JSON.stringify({error:'Archive did not return a usable response.'}));}
}).listen(Number(process.env.PORT)||5173,'0.0.0.0');
