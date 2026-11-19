import {useEffect,useRef,useState} from 'react';
import {getDocument,GlobalWorkerOptions,type PDFDocumentProxy} from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?raw';
import {fileUrl,isPublicFile,detailsUrl,type ArchiveFile} from '../api/archive';

export default function BookReader({id,files,autoOpen=false}:{id:string;files:ArchiveFile[];autoOpen?:boolean}){
 const available=files.filter(isPublicFile);
 const pdf=available.filter(f=>/\.pdf$/i.test(f.name)).sort((a,b)=>Number(a.size||Infinity)-Number(b.size||Infinity))[0];
 const txt=available.find(f=>/(_djvu|_text)\.txt$/i.test(f.name)) || available.find(f=>/\.txt$/i.test(f.name));
 const [format,choose]=useState<'pdf'|'text'>(pdf?'pdf':'text');const file=format==='pdf'?pdf:txt;
 const [run,start]=useState(autoOpen?1:0),[page,setPage]=useState(1),[doc,setDoc]=useState<PDFDocumentProxy|null>(null),[text,setText]=useState<string[]>([]),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null);const url=file&&fileUrl(id,file.name);
 useEffect(()=>{if(!run||!url)return;let active=true;const ac=new AbortController();let task:ReturnType<typeof getDocument>|undefined;
 setErr('');setDoc(null);setText([]);setPage(1);setBusy(true);
 const error=()=>{if(active){setErr('This edition could not be loaded. Retry, choose another available format, or use the Archive record.');setBusy(false)}};
 const timer=setTimeout(()=>{error();active=false;ac.abort();void task?.destroy()},45000);
 (async()=>{try{if(format==='pdf'){
   if(!GlobalWorkerOptions.workerSrc.startsWith('blob:'))GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([worker],{type:'text/javascript'}));
   task=getDocument({url,isEvalSupported:false,useSystemFonts:true,disableStream:true,disableAutoFetch:true});const d=await task.promise;if(active)setDoc(d);
 }else{const r=await fetch(url,{signal:ac.signal});if(!r.ok)throw Error();const pages=(await r.text()).match(/[\s\S]{1,3200}(?:\s|$)|[\s\S]{1,3200}/g);if(!pages?.length)throw Error();if(active){setText(pages);setBusy(false)}}}catch{error()}finally{clearTimeout(timer)}})();
 return()=>{active=false;clearTimeout(timer);ac.abort();void task?.destroy()};},[url,run,format]);
 useEffect(()=>{if(!doc||!canvas.current)return;let active=true;let render:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
 const el=canvas.current;setBusy(true);setErr('');const timer=setTimeout(()=>{if(active){active=false;render?.cancel();setErr('The page took too long to render. Please retry.');setBusy(false)}},35000);
 (async()=>{try{const pg=await doc.getPage(page);if(!active)return;const v=pg.getViewport({scale:1});const vp=pg.getViewport({scale:Math.min(2,1400/v.width,1800/v.height)});el.width=Math.ceil(vp.width);el.height=Math.ceil(vp.height);render=pg.render({canvas:el,viewport:vp});await render.promise;if(active)setBusy(false)}catch{if(active){setErr('This page could not be rendered. Try the text edition or open the Archive record.');setBusy(false)}}finally{clearTimeout(timer)}})();return()=>{active=false;clearTimeout(timer);render?.cancel()};},[doc,page]);
 const total=doc?.numPages||text.length;
 return <section aria-label="Read online" className="section-gap border-y border-rule py-6">
 <h2 className="text-[11px] uppercase tracking-[0.2em] text-mute">Read online</h2>
 <div className="my-4 flex flex-wrap items-baseline gap-5"><h3 className="display text-3xl">Reading room</h3>
 {pdf&&txt&&<label className="text-sm">Edition <select className="border-b border-rule" value={format} onChange={e=>{choose(e.target.value as 'pdf'|'text');start(n=>n+1)}}><option value="pdf">Printed pages</option><option value="text">Plain text</option></select></label>}
 {file&&(!run||err)&&<button className="text-action text-sm" onClick={()=>start(n=>n+1)}>{run?'Retry':'Open book'} →</button>}</div>
 {!file&&<p className="text-sm text-mute">No public PDF or plain-text edition is listed. <a className="text-action" href={detailsUrl(id)} target="_blank" rel="noreferrer">Check the original reader ↗</a></p>}
 {!!run&&<><p role="status" className="text-sm text-mute">{err|| (busy?'Loading page…':'')}</p>
 {err&&<a className="record-secondary" href={url} target="_blank" rel="noopener noreferrer">Open this edition on archive.org ↗</a>}
 {total>0&&<nav aria-label="Book pages" className="my-4 flex items-center gap-6 text-sm"><button className="text-action disabled:opacity-30" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Previous</button><span>{format==='pdf'?'Page':'Section'} {page} of {total}</span><button className="text-action disabled:opacity-30" disabled={page>=total} onClick={()=>setPage(p=>p+1)}>Next →</button></nav>}
 {format==='pdf'&&doc&&<canvas ref={canvas} aria-label={`Book page ${page}`} className="mx-auto block h-auto max-w-full border border-rule" style={{visibility:busy||err?'hidden':'visible'}}/>}
 {format==='text'&&text.length>0&&<p className="mx-auto max-w-prose whitespace-pre-wrap leading-relaxed">{text[page-1]}</p>}</>}
 </section>;
}
