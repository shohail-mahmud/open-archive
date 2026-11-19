import "./item.css";

import ImageGallery,{isGalleryImage} from "../components/ImageGallery";
import RecordFile from "../components/RecordFile";
import {embedUrl} from "../api/archive";
import ArchiveLink from "../components/ArchiveLink";
import FileLink from "../components/FileLink";
import Thumbnail from "../components/Thumbnail";
import {thumbUrl} from "../api/archive";

import { useEffect, useRef, useState } from "react";
import { href } from "../router";
import {
  getItem, detailsUrl, sourceDirectory,
  getAccess,
  publicFiles,
  fileUrl,
  isPublicFile,

  asArray,
  first,
  MEDIA_LABEL,
  type ItemMetadata,
} from "../api/archive";

export default function Item({ id }: { id: string }) {
  const [item, setItem] = useState<ItemMetadata | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    setItem(undefined);
    setError(null);
    getItem(id, ac.signal)
      .then(setItem)
      .catch((e) => e.name !== "AbortError" && setError(e.message || "Unable to reach the Archive."));
    return () => ac.abort();
  }, [id, tick]);

  return (
    <main className="record-page px-5 sm:px-8 lg:px-10">
      <nav aria-label="Breadcrumb" className="record-crumb"><a href={history.state?.archiveFrom || href("/explore")} onClick={e=>{if(history.state?.archiveFrom && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey){e.preventDefault();history.back()}}}>{history.state?.archiveFrom && !history.state.archiveFrom.replace(/^#/,'').startsWith('/explore')?'← Back':'← Explore'}</a><span aria-hidden="true">/</span><span>Item record</span></nav>

      {error ? (
        <div className="py-20 text-center">
          <p className="display text-3xl">This item could not be loaded.</p>
          <p className="mt-3 text-sm text-mute">{error}</p>
          <button className="text-action mt-6 text-sm" onClick={() => setTick((t) => t + 1)}>
            Try again
          </button> <a href={detailsUrl(id)} className="record-secondary" target="_blank" rel="noopener noreferrer">Check the original record ↗</a>
        </div>
      ) : item === undefined ? (
        <div className="mt-10 grid gap-10 md:grid-cols-12" aria-busy="true">
          <div className="skeleton aspect-[3/4] md:col-span-4" />
          <div className="space-y-4 md:col-span-7">
            <div className="skeleton h-14 w-4/5" />
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        </div>
      ) : item === null ? (
        <div className="py-20 text-center">
          <p className="display text-3xl">No such item.</p>
          <p className="mt-3 text-sm text-mute">
            “{id}” does not exist in the Archive, or it has been removed.
          </p>
          <a href={href("/explore")} className="text-action mt-6 inline-block text-sm">
            Search the Archive
          </a>
        </div>
      ) : (
        <Detail key={id} id={id} item={item} />
      )}
    </main>
  );
}

function Detail({ id, item }: { id: string; item: ItemMetadata }) {
  const m = item.metadata;
  const access = item.sourceAccess ?? getAccess(item);
  const type = String(first(m.mediatype) ?? "");
  const contentRef = useRef<HTMLDivElement>(null);
  const [section,pick] = useState<"overview"|"media"|"files"|"images">("overview");

  const [previewFile,preview]=useState("");
  const [fileQuery,filterFiles] = useState("");
  const [fileLimit,setLimit] = useState(25);
  const [showAll,showDescription] = useState(false);
  const activate = (next:typeof section,jump=false) => {

    pick(next);
    if(jump) requestAnimationFrame(()=>{contentRef.current?.focus({preventScroll:true});contentRef.current?.scrollIntoView({block:"start"})});
  };
  const title = first(m.title) ?? id;
  useEffect(()=>{document.title=`${title} — Open Archive`},[title]);
  const creators = asArray(m.creator);
  const subjects = asArray(m.subject).flatMap((s) => s.split(/\s*;\s*/)).filter(Boolean);
  const description = "For the full description, artwork and access options, visit the original Archive record.";
  const files = access.kind === "open" ? publicFiles(item) : [];
  const images=access.kind === "open" ? item.files.filter(f=>isPublicFile(f) && isGalleryImage(f) && !/(^|\/)__ia_thumb\./i.test(f.name)) : [];
  const [imageIndex,setImageIndex]=useState(0);
  const originalImage = type === "image" ? files.find(f => f.source === "original" && /\.(?:jpe?g|png|webp|gif|tiff?|avif)$/i.test(f.name)) : undefined;
  const declaredLicence = first(m.licenseurl);
  const license = declaredLicence && /^https?:\/\//i.test(declaredLicence) ? declaredLicence : undefined;

  const rows: [string, string | undefined][] = [
    ["Creator", creators.join(", ") || undefined],
    ["Date", first(m.date)],
    ["Publisher", first(m.publisher)],
    ["Language", first(m.language)],
    ["Type", MEDIA_LABEL[type] ?? type],
    ["Identifier", id],
    ["Rights (source metadata)", first(m.rights)],
  ];

  const open = access.kind === "open";
  const sourceAction = ({texts:'Read',movies:'Watch',audio:'Listen',etree:'Listen',image:'View image',software:'Open software'} as Record<string,string>)[type] || 'Open item';
  const book = type === "texts";
  const avFile=files.find(f=>(type==='audio'||type==='etree')?/\.(mp3|ogg|wav|m4a|flac)$/i.test(f.name):type==='movies'&&/\.(mp4|webm|ogv)$/i.test(f.name));
  const playable = open && (book || !!avFile || ["movies","audio","etree"].includes(type));
  const mediaName = book ? "Reading room" : type === "movies" ? "Video player" : "Audio player";

  const matched = files.filter(f=>`${f.name} ${f.format||""}`.toLowerCase().includes(fileQuery.trim().toLowerCase()));
  const tags = [...new Set(subjects)];
  const shortDescription = description.length>850 && !showAll;
  return <article className="record fade">
    <header className="record-hero">
      <figure className="record-figure"><div className="record-mount">{open?<Thumbnail src={thumbUrl(id)} referrerPolicy="no-referrer" alt={`Cover for ${title}`} className="record-cover"/>:<span>Limited access</span>}</div>
      {images.length>0 && <button className="gallery-shortcut" onClick={()=>activate('images',true)}>View {images.length===1?"image":`all ${images.length} images`} →</button>}
      </figure>
      <div className="record-intro"><p className="record-type">{[MEDIA_LABEL[type] || type || "Archive item", first(m.date), open ? (item.files.length?"Public access":"Catalogue record") : "Limited access"].filter(Boolean).join(" · ")}</p>
        <h1 className="display">{title}</h1>
        {creators.length>0&&<p className="record-by">By {creators.join(", ")}</p>}
        {open && <><div className="record-actions">
          {!item.files.length&&<a className="record-primary" href={detailsUrl(id)} target="_blank" rel="noopener noreferrer">{sourceAction} on archive.org ↗</a>}
          {item.sourceFilesAvailable&&<a className="record-secondary" href={sourceDirectory(id)} target="_blank" rel="noopener noreferrer">Download options on archive.org ↗</a>}
          {playable&&<button className="record-primary" onClick={()=>activate('media',true)}>{book?"Read book":type==='movies'?"Watch video":"Listen to audio"} <span aria-hidden="true">→</span></button>}
          {originalImage&&<FileLink url={fileUrl(id,originalImage.name)} name={originalImage.name.split('/').pop()!} size={Number(originalImage.size)} className="record-primary">Download image on archive.org ↗</FileLink>}
          {!!files.length&&<button className={playable||originalImage?"record-secondary":"record-primary"} onClick={()=>activate('files',true)}>Browse files →</button>}
        </div>{!item.files.length&&<p className="record-note">Opens in a new tab. The Archive controls which viewing and download options are available. This catalogue does not serve these files.</p>}<ArchiveLink id={id} copyOnly={!item.files.length}/></>}
        {!open&&<AccessNotice id={id} access={access} related={tags[0]||creators[0]||first(m.title)}/>}
      </div>
    </header>
    <div ref={contentRef} tabIndex={-1} className="record-sections">
      {!!item.files.length&&<nav aria-label="Record sections" className="record-nav"><button aria-pressed={section==='overview'} onClick={()=>activate('overview')}>Overview</button>
        {!!images.length&&<button aria-pressed={section==='images'} onClick={()=>activate('images')}>Images <span>{images.length}</span></button>}
        {playable&&<button aria-pressed={section==='media'} onClick={()=>activate('media')}>{mediaName}</button>}
        {!!files.length&&<button aria-pressed={section==='files'} onClick={()=>activate('files')}>Files <span>{files.length}</span></button>}
      </nav>}
      {section==='overview'&&<div className="record-overview"><section><h2 className="display">About this item</h2>
        <p className="record-description">{description?(shortDescription?description.slice(0,850).trimEnd()+"…":description):"No description was supplied for this item."}</p>
        {description.length>850&&<button className="record-more" onClick={()=>showDescription(!showAll)}>{showAll?'Show less':'Read full description'}</button>}
        {!!tags.length&&<><h3 className="record-label record-subhead">Subjects</h3><ul className="record-tags">{tags.slice(0,18).map(s=><li key={s}><a href={href('/explore',{q:s,field:'subject'})}>{s}</a></li>)}</ul></>}
      </section><aside className="record-details"><h2>Catalogue details</h2><dl>{rows.filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        {license&&<div><dt>Source licence</dt><dd><a href={license} rel="noreferrer" target="_blank">{license} ↗</a></dd></div>}</dl></aside></div>}
      {playable&&section==='media'&&<section aria-label={mediaName} className="record-media"><h2 className="display">{mediaName}</h2>
        <iframe title={`${mediaName}: ${title}`} src={embedUrl(id)} referrerPolicy="no-referrer" allow="fullscreen" allowFullScreen style={{width:'100%',height:book?'min(76vh,820px)':type==='movies'?'min(58vw,540px)':'220px',border:0}}/>
        <p className="record-note">Reader or player not available? <a className="text-action" href={detailsUrl(id)} target="_blank" rel="noopener noreferrer">{sourceAction} on archive.org ↗</a></p></section>}
      {section==='images'&&!!images.length&&<ImageGallery id={id} files={images} index={imageIndex} select={setImageIndex}/>}
      {section==='files'&&<section aria-label="Files" className="record-files"><div className="record-file-head"><div><h2 className="display">Files &amp; downloads</h2><p className="record-note">Preview a file or download it. Thumbnails and alternate formats are listed separately. <a className="text-action font-medium" href={href("/terms")}>Check reuse rights →</a></p></div>
      {files.length>1&&<label><span className="sr-only">Filter files by name or format</span><input placeholder="Filter by filename or format…" value={fileQuery} onChange={e=>{filterFiles(e.target.value);setLimit(25)}}/></label>}</div>
      <ul>{matched.slice(0,fileLimit).map(f=><li key={f.name}><RecordFile id={id} f={f} active={previewFile===f.name} toggle={()=>preview(previewFile===f.name?"":f.name)}/></li>)}</ul>
      {!matched.length&&<p className="record-note">No matching files. <button onClick={()=>filterFiles('')}>Clear filter</button></p>}
      {matched.length>fileLimit&&<button className="record-secondary" onClick={()=>setLimit(n=>n+25)}>Show more files ({matched.length-fileLimit} remaining)</button>}</section>}
    </div>
  </article>;
}

function AccessNotice({ id, access, related }: { id: string; access: ReturnType<typeof getAccess>; related?: string }) {
  if (access.kind === "open") {
    return (
      <p className="mt-6 text-[13px] text-mute">
        Freely accessible.{" "}
        <ArchiveLink id={id} />
      </p>
    );
  }
  return (
    <aside aria-label="Item access" className="mt-7 max-w-2xl border-y border-rule py-5">
      <p className="text-[10px] uppercase tracking-[0.19em] text-mute">Reading room · Access</p>
      <h2 className="display mt-2 text-3xl">{access.kind === "borrow" ? "Check borrowing availability" : "Limited access"}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-mute">{access.reason}</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-[13px]">
        <a href={href("/explore", { q: related, open: "1" })} className="text-action">
          {related ? "Find related open items" : "Browse open items"} →
        </a>
        <ArchiveLink id={id} primary label="Check access on archive.org" />
      </div>
    </aside>
  );
}
