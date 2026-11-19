import {positionKey} from './router';
/** Keep the position on the history entry, not in a single global scroll slot. */
interface Mark { hash:string; y:number; link:string; offset:number; list:boolean; filters:boolean }
export function returnMark():Mark|undefined {
  const mark=history.state?.archivePosition;
  return mark?.hash===positionKey() ? mark : undefined;
}
export function trackReturns(){
  const old=history.scrollRestoration;history.scrollRestoration='manual';
  function capture(e:MouseEvent){
    if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const a=e.target instanceof Element?e.target.closest<HTMLAnchorElement>('a[href^="/"],a[href^="#/"]'):null;
    if(!a||a.target==='_blank'||a.href===location.href)return;
    const mark:Mark={hash:positionKey(),y:scrollY,link:a.getAttribute('href')!,offset:a.getBoundingClientRect().top,
      list:!!document.querySelector('.xp-items.list'),filters:document.querySelector('.xp-sidebar-button')?.getAttribute('aria-expanded')==='true'};
    history.replaceState({...history.state,archivePosition:mark},'');
  }
  document.addEventListener('click',capture,true);
  return ()=>{document.removeEventListener('click',capture,true);history.scrollRestoration=old};
}
// Result cards and featured entries arrive after the route changes. Restore against
// the actual clicked link when available, falling back to pixels if it disappeared.
export function restorePosition(mark:Mark){
  let frame=0,stopped=false;
  const restore=()=>{if(stopped)return;const main=document.querySelector('main');
    const a=Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).find(el=>el.getAttribute('href')===mark.link && el.getClientRects().length);
    if(!a && main?.querySelector('[aria-busy="true"],.skeleton'))return;
    const top=a?scrollY+a.getBoundingClientRect().top-mark.offset:mark.y;
    window.scrollTo({top,behavior:'instant'});if(a)a.focus({preventScroll:true});
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(restore)};
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  const sizes=new ResizeObserver(schedule);sizes.observe(document.body);
  const events=['wheel','touchstart','pointerdown','keydown'];const stop=()=>{stopped=true;observer.disconnect();sizes.disconnect();cancelAnimationFrame(frame);clearTimeout(timer);events.forEach(k=>window.removeEventListener(k,stop,true))};
  const timer=setTimeout(()=>{restore();stop()},18000);events.forEach(k=>window.addEventListener(k,stop,true));schedule();void document.fonts.ready.then(()=>{if(!stopped)schedule()});return stop;
}
