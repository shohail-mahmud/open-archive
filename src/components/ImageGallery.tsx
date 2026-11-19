import {useState} from 'react';
import {fileUrl,formatBytes,type ArchiveFile} from '../api/archive';
import FileLink from './FileLink';

const PAGE=20;
export const isGalleryImage=(f:ArchiveFile)=>/\.(?:jpe?g|jpe|png|apng|webp|avif|gif|bmp|ico|svg|tiff?|jp2|j2k|heic|heif|jxl)$/i.test(f.name)||/^(JPEG|PNG|GIF|TIFF|JPEG 2000|WebP|Image Bitmap)$/i.test(f.format||'');

export default function ImageGallery({id,files,index,select}:{id:string;files:ArchiveFile[];index:number;select:(n:number)=>void}){
 const [query,search]=useState(''),[page,setPage]=useState(Math.floor(index/PAGE));
 const [failed,fail]=useState('');const file=files[index],url=fileUrl(id,file.name);
 const matches=files.map((f,i)=>({f,i})).filter(({f})=>f.name.toLowerCase().includes(query.trim().toLowerCase()));
 const pages=Math.ceil(matches.length/PAGE);
 const move=(i:number)=>{if(i<0||i>=files.length)return;select(i);fail('');search('');setPage(Math.floor(i/PAGE))};
 return <section aria-label="Image gallery" className="image-gallery">
   <div className="gallery-view"><div className="gallery-bar"><h2 className="display">Images</h2><nav aria-label="Image navigation"><button disabled={!index} onClick={()=>move(index-1)} aria-label="Previous image">←</button><span aria-live="polite">{index+1} / {files.length}</span><button disabled={index===files.length-1} onClick={()=>move(index+1)} aria-label="Next image">→</button></nav></div>
   <div className="gallery-frame" tabIndex={0} aria-label="Image preview. Use left and right arrow keys to browse." onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(index+(e.key==='ArrowLeft'?-1:1))}}}>
   {failed!==url?<img key={url} src={url} alt={file.name} onError={()=>fail(url)}/>:<p>Preview unavailable for this file.<br/>You can still download the original.</p>}</div>
   <div className="gallery-caption"><div><strong>{file.name}</strong><small>{[file.format,formatBytes(file.size)].filter(Boolean).join(' · ')}</small></div><FileLink className="record-secondary" url={url} size={Number(file.size)} name={file.name.split('/').pop()!}>Download image ↓</FileLink></div></div>
   <aside aria-label="Image index" className="gallery-index"><label>Image index<input type="search" value={query} onChange={e=>{search(e.target.value);setPage(0)}} placeholder="Find an image by filename…"/></label>
   <ol>{matches.slice(page*PAGE,(page+1)*PAGE).map(({f,i})=><li key={f.name}><button title={f.name} aria-pressed={i===index} onClick={()=>{select(i);fail('')}}><small>{i+1}</small><span>{f.name}</span></button></li>)}</ol>
   {!matches.length&&<p className="record-note">No matching images.</p>}
   {pages>1&&<nav aria-label="Image index pages"><button disabled={!page} onClick={()=>setPage(page-1)}>Previous</button><span>{page+1} / {pages}</span><button disabled={page>=pages-1} onClick={()=>setPage(page+1)}>Next</button></nav>}</aside>
 </section>;
}
