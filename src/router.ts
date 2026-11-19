import { useEffect, useState } from 'react';
export interface Route {path:string;params:URLSearchParams}
const local = location.protocol==='file:' || location.origin==='null';
const known = /^\/(?:$|(?:explore|collections|terms|privacy|about)\/?$|item\/[^/?#]+\/?$)/;
function read(): Route {
  const legacy=location.hash.slice(1);
  let u=new URL(location.href);
  if(location.hash.startsWith('#/') && known.test(legacy.split('?')[0]) && !legacy.includes('\\')){
    const old=new URL(legacy,'https://routes.invalid');
    if(!local)history.replaceState(history.state,'',old.pathname+old.search);
    u=old;
  }else if(local){return {path:'/',params:new URLSearchParams()};}
  return {path:u.pathname.replace(/\/$/,'')||'/',params:u.searchParams};
}
export function href(path:string,params?:Record<string,string|undefined>){
  const qs=new URLSearchParams();for(const [k,v] of Object.entries(params||{}))if(v)qs.set(k,v);
  return (local?'#':'')+path+(qs.size?'?'+qs:'');
}
export const positionKey=()=>local?location.hash:location.pathname+location.search;
const changed=()=>window.dispatchEvent(new Event('oa-route'));
export function useRoute(){
 const [route,set]=useState(read);
 useEffect(()=>{
   const sync=()=>set(read());
   function click(e:MouseEvent){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target instanceof Element?e.target.closest<HTMLAnchorElement>('a[href]'):null;
    if(!a||a.target&&a.target!=='_self'||a.hasAttribute('download'))return;
    const raw=a.getAttribute('href')||'';
    if(!(local?raw.startsWith('#/'):raw.startsWith('/')&&a.origin===location.origin&&known.test(a.pathname)))return;
    e.preventDefault();if(a.href===location.href)return;
    history.pushState({archiveFrom:positionKey()||href('/')},'',a.href);sync();
   }
   document.addEventListener('click',click);for(const ev of ['popstate','hashchange','oa-route'])window.addEventListener(ev,sync);
   return ()=>{document.removeEventListener('click',click);for(const ev of ['popstate','hashchange','oa-route'])window.removeEventListener(ev,sync)};
 },[]);return route;
}
export function replaceRoute(path:string,params:Record<string,string|undefined>){history.replaceState({...history.state,archivePosition:undefined},'',href(path,params));changed();}
export function goBackInApp(){if(history.state?.archiveFrom){history.back();return}location.assign(href('/'));}
