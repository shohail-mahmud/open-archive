import {useEffect, useRef, useState} from 'react';
import {detailsUrl} from '../api/archive';

function copySelection(text: string) {
  const focus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none;font-size:16px';
  document.body.append(field);
  try {
    field.focus({preventScroll:true}); field.select(); field.setSelectionRange(0,text.length);
    return document.execCommand('copy');
  } catch { return false; }
  finally {field.remove(); if(focus instanceof HTMLElement) focus.focus({preventScroll:true});}
}

export default function ArchiveLink({id,label,primary=false,copyOnly=false}:{id:string;label?:string;primary?:boolean;copyOnly?:boolean}) {
  const local=location.protocol==='file:'||location.origin==='null';
  const url=local?detailsUrl(id):new URL('/item/'+encodeURIComponent(id),location.origin).href;
  const [status,setStatus]=useState<'idle'|'copied'|'blocked'>('idle');
  const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  async function copy() {
    clearTimeout(timer.current);
    let copied=false;
    try {if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);copied=true;}} catch { /* Some embedded contexts deny the async clipboard. */ }
    if(!copied) copied=copySelection(url);
    setStatus(copied?'copied':'blocked');
    if(copied) timer.current=setTimeout(()=>setStatus('idle'),2200);
  }
  return <span className="inline-flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
    {!copyOnly&&<a href={detailsUrl(id)} target="_blank" rel="noopener noreferrer" className={primary?"record-primary":"text-action text-ink"}>{label||"View on archive.org"} ↗</a>}
    <button type="button" className="text-action text-mute" onClick={copy}><span aria-live="polite">{status==='copied'?'Link copied ✓':local?'Copy Archive source link':'Copy item link'}</span></button>
    {status==='blocked'&&<label className="basis-full text-xs text-mute">This browser blocked automatic copying. Copy the selected link:
      <input readOnly aria-label="Shareable item URL" className="mt-1 block w-full rounded border border-rule p-2 text-ink" value={url} onFocus={e=>e.target.select()} autoFocus/>
    </label>}
  </span>;
}
