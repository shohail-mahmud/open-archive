import {useEffect,useRef,useState} from 'react';
import {href} from '../router';
const links=[['Home','/'],['Explore','/explore'],['Collections','/collections'],['About','/about']];
export default function Nav({path}:{path:string}){
  const [open,setOpen]=useState(false);
  const nav=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>setOpen(false),[path]);
  useEffect(()=>{
    if(!open)return;
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};
    const outside=(e:Event)=>{if(!nav.current?.contains(e.target as Node))setOpen(false)};
    const mq=matchMedia('(min-width:640px)'),resize=()=>{if(mq.matches)setOpen(false)};
    document.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);mq.addEventListener('change',resize);
    return ()=>{document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);mq.removeEventListener('change',resize)};
  },[open]);
  return <header className="absolute top-0 inset-x-0 z-20"><nav ref={nav} aria-label="Primary" className="relative mx-auto flex items-center justify-between gap-3 px-5 pt-2 text-[13px] sm:items-baseline sm:px-8 sm:pt-5 lg:px-10">
    <a href={href('/')} onClick={()=>setOpen(false)} className="display inline-flex min-h-11 items-center text-[19px] leading-none tracking-tight sm:min-h-0">Open Archive</a>
    <button ref={trigger} type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="site-menu" onClick={()=>setOpen(!open)} className="inline-flex size-11 items-center justify-center sm:hidden"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d={open?'M5 5l14 14M19 5L5 19':'M3 6h18M3 12h18M3 18h18'}/></svg></button>
    <ul id="site-menu" className={'primary-links '+(open?'mobile-open':'')}>{links.map(([label,to])=><li key={to}><a className="nav-link" href={href(to)} onClick={()=>setOpen(false)} aria-current={path===to?'page':undefined}>{label}</a></li>)}</ul>
  </nav></header>;
}
