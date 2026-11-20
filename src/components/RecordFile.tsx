import ActionIcon from "./ActionIcon";
import {useState} from 'react';
import {fileUrl,formatBytes,type ArchiveFile} from '../api/archive';
import {isGalleryImage} from './ImageGallery';
import BookReader from './BookReader';
import FileLink from './FileLink';

function kind(f:ArchiveFile){if(isGalleryImage(f))return 'image';if(/\.(pdf|txt)$/i.test(f.name))return 'document';if(/\.(mp3|m4a|wav|flac|ogg|opus|aac)$/i.test(f.name))return 'audio';if(/\.(mp4|webm|ogv|mov|m4v)$/i.test(f.name))return 'video';return ''}
function Preview({id,f}:{id:string;f:ArchiveFile}){
 const [failed,fail]=useState(false);const src=fileUrl(id,f.name),type=kind(f);
 return <div className="individual-preview" aria-label={`Preview of ${f.name}`}>{failed?<p role="status">This browser couldn’t preview this file. Use Download to open it on your device.</p>:type==='image'?<img src={src} alt={f.name} onError={()=>fail(true)}/>:type==='document'?<BookReader id={id} files={[f]} autoOpen/>:type==='audio'?<audio controls preload="metadata" src={src} onError={()=>fail(true)}/>:<video controls preload="metadata" src={src} onError={()=>fail(true)}/>}</div>
}
export default function RecordFile({id,f,active,toggle}:{id:string;f:ArchiveFile;active:boolean;toggle:()=>void}){
 const thumbnail=/thumb|item tile/i.test(f.format||'');
 const source=thumbnail?'Thumbnail':f.source==='original'?'Original':f.source==='derivative'?'Derived file':'';
 return <div className="individual-file"><div className="individual-file-head"><div><strong>{f.name}</strong><small>{[source,f.format,formatBytes(f.size)].filter(Boolean).join(' · ')}{f.original && <> · From: {f.original}</>}</small></div>
 <div className="file-actions">{kind(f)?<button type="button" aria-label={`${active?'Hide preview of':'Preview'} ${f.name}`} aria-expanded={active} onClick={toggle}>{active?'Hide preview':'Preview'}</button>:<small>Download only</small>}
 <FileLink className="record-secondary" url={fileUrl(id,f.name)} name={f.name.split('/').pop()!} size={Number(f.size)}>Download <ActionIcon name="download"/></FileLink></div></div>
 {active&&kind(f)&&<Preview id={id} f={f}/>}</div>;
}
