import "./explore.css";
import {returnMark} from "../returnPosition";
import Thumbnail from "../components/Thumbnail";
import {thumbUrl} from "../api/archive";
import { useEffect, useRef, useState } from "react";
import { href, replaceRoute, goBackInApp, type Route } from "../router";
import {
  searchArchive,
  
  first,
  MEDIA_LABEL,
  type SearchDoc,
  type SortKey,
} from "../api/archive";

const TYPES = [
  { value: "", label: "All categories" },
  { value: "texts", label: "Books & Texts" },
  { value: "movies", label: "Moving Images" },
  { value: "audio", label: "Audio & Music" },
  { value: "image", label: "Images" },
  { value: "software", label: "Software" },
  { value: "web", label: "Websites" },
];

const ICONS: Record<string,string> = {
  "": "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  texts: "M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1z M12 6v14",
  movies: "M3 5h18v14H3z M3 9h18 M7 5l2 4 M13 5l2 4",
  audio: "M3 14v-3a9 9 0 0 1 18 0v3 M3 13h4v7H3z M17 13h4v7h-4z",
  image: "M3 4h18v16H3z M4 17l5-5 4 4 3-3 4 4 M15 8h2",
  software: "M3 4h18v16H3z M3 8h18 M10 11l-3 3 3 3 M14 11l3 3-3 3",
  web: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z M2 12h20 M12 2q-9 10 0 20 9-10 0-20z",
  search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0z M15 15l6 6",
  sidebar:"M4 3.5h16a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19V5A1.5 1.5 0 0 1 4 3.5z M9 4v16",
  list:"M3 6h3 M9 6h12 M3 12h3 M9 12h12 M3 18h3 M9 18h12"
};
function Icon({name}:{name:string}) {return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"><path d={ICONS[name]||ICONS[""]}/></svg>}
const ROWS = 20;
const MAX_RESULTS = 10000; // advancedsearch paging limit

export default function Explore({ route }: { route: Route }) {
  const p = route.params;
  const q = p.get("q") ?? "";
  const type = p.get("type") ?? "";
  const collection = p.get("collection") ?? "";
  const sort = (p.get("sort") as SortKey) || "relevance";
  const field = p.get("field") || "";
  const period = p.get("period") || "";
  const [view,setView] = useState<"grid"|"list">(()=>returnMark()?.list?"list":"grid");
  const [sidebarHidden,hideSidebar] = useState(() => {
    try {return localStorage.getItem('ia.explore.sidebar') === 'hidden'} catch {return false}
  });
  const [expanded,expand] = useState(()=>returnMark()?.filters ?? false);
  const [compact,setCompact] = useState(() => matchMedia('(max-width:760px)').matches);
  useEffect(() => {const mq=matchMedia('(max-width:760px)');const sync=()=>setCompact(mq.matches);mq.addEventListener('change',sync);sync();return ()=>mq.removeEventListener('change',sync)},[]);
  const panelOpen = compact ? expanded : !sidebarHidden;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleSidebar = () => {
    if(compact) expand(!expanded);
    else {hideSidebar(!sidebarHidden);try {localStorage.setItem('ia.explore.sidebar',sidebarHidden?'visible':'hidden')} catch { /* Storage is optional. */ }}
    requestAnimationFrame(()=>toggleRef.current?.focus({preventScroll:true}));
  };
  const toggleLabel = panelOpen?'Hide categories and filters':'Show categories and filters';
  const panelToggle = <button ref={toggleRef} type="button" className="xp-sidebar-button" aria-controls="xp-filter-panel" aria-expanded={panelOpen} aria-label={toggleLabel} title={toggleLabel} onClick={toggleSidebar}><Icon name="sidebar"/></button>;
  const openOnly = p.get("open") !== "0";
  const page = Math.max(1, Number(p.get("page")) || 1);

  const [draft, setDraft] = useState(q);
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const queryInput = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    const ac = new AbortController();
    setDocs(null);
    setError(null);
    searchArchive({ query: q, field, period, mediatype: type, collection, sort, page, rows: ROWS, openOnly, signal: ac.signal })
      .then((r) => {
        if (ac.signal.aborted) return;
        setDocs(r.docs);
        setTotal(r.total);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setError(e.message || "Unable to reach the Archive.");
      });
    return () => ac.abort();
  }, [q, field, period, type, collection, sort, page, openOnly, tick]);

  const update = (next: Record<string, string | undefined>) => {
    const merged = {
      q: q || undefined,
      field: field || undefined, period: period || undefined,
      type: type || undefined,
      collection: collection || undefined,
      sort: sort !== "relevance" ? sort : undefined,
      open: openOnly ? undefined : "0",
      page: undefined as string | undefined,
      ...next,
    };
    replaceRoute("/explore", merged);
  };

  const goPage = (n: number) => {
    update({ page: n > 1 ? String(n) : undefined });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pages = Math.min(Math.ceil(total / ROWS), Math.floor(MAX_RESULTS / ROWS));

  return (
    <main className="xp px-5 sm:px-8 lg:px-10">
      <button type="button" onClick={goBackInApp} className="xp-back">← Back</button>
      <div className="xp-header"><h1 className="display">Explore</h1><p>Search the Internet Archive by keyword, or browse a category.</p></div>
      <form role="search" className="xp-search" onSubmit={e=>{e.preventDefault();update({q:draft.trim() || undefined});}}>
        <label className="xp-scope"><span className="sr-only">Search field</span><select value={field} onChange={e=>update({field:e.target.value||undefined,q:draft.trim()||undefined})}>
          <option value="">All fields</option><option value="title">Title</option><option value="creator">Creator</option><option value="subject">Subject</option>
        </select></label>
        <label className="xp-input"><Icon name="search"/><span className="sr-only">Search the catalogue</span><input ref={queryInput} id="q" type="search" placeholder={field ? `Search by ${field}…` : "Title, creator or keyword…"} value={draft} onChange={e=>setDraft(e.target.value)} /></label>
        {draft && <button className="xp-clear" type="button" aria-label="Clear search text" onClick={()=>{setDraft("");queryInput.current?.focus();update({q:undefined})}}>Clear</button>}
        <button className="xp-submit" type="submit">Search <span aria-hidden="true">→</span></button>
      </form>
      <div className={`xp-layout${panelOpen?"":" xp-wide"}`}>
      <aside className="xp-side" aria-label="Search filters" hidden={!panelOpen}>
      <div id="xp-filter-panel" className="xp-panel open">
        <div className="xp-category-heading"><h2 className="xp-label">Categories</h2>{panelOpen && panelToggle}</div><ul className="xp-categories">{TYPES.map(t=><li key={t.value}><button aria-pressed={type===t.value} onClick={()=>update({type:t.value||undefined})}><Icon name={t.value}/>{t.label}</button></li>)}</ul>
        <div className="xp-refine"><h2 className="xp-label">Refine results</h2>
        <label>Publication year<select value={period} onChange={e=>update({period:e.target.value||undefined})}><option value="">Any year</option><option value="early">Before 1900</option><option value="twentieth">1900–1999</option><option value="recent">2000 onwards</option></select></label>
        <label className="xp-check"><input type="checkbox" checked={openOnly} onChange={e=>update({open:e.target.checked?undefined:"0"})}/> Hide restricted items</label>
        {(type||period||!openOnly||collection||field||sort!=="relevance")&&<button className="xp-reset" onClick={()=>update({type:undefined,period:undefined,collection:undefined,field:undefined,open:undefined,sort:undefined})}>Reset filters</button>}</div>
      </div></aside>
      <div className="xp-results" ref={topRef}>
        <div className="xp-toolbar"><div className="xp-result-heading">{!panelOpen && panelToggle}<div><h2>{q?'Search results':(TYPES.find(t=>t.value===type)?.label.replace('All categories','Browse all items')||'Browse items')}</h2>
        <p>{docs!==null&&!error ? `${total.toLocaleString("en-US")} ${total===1?'result':'results'}` : error?'Search unavailable':'Searching the catalogue'}{q&&` for “${q}”`}</p></div></div>
        <div className="xp-tools"><label><span className="sr-only">Sort results</span><select value={sort} onChange={e=>update({sort:e.target.value==='relevance'?undefined:e.target.value})}><option value="relevance">{q?'Relevance':'Most viewed (default)'}</option><option value="downloads">Most viewed</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
        <div className="xp-switch">{(['grid','list'] as const).map(v=><button key={v} aria-label={`${v==='grid'?'Grid':'List'} view`} aria-pressed={view===v} onClick={()=>setView(v)}><Icon name={v==='grid'?'':v}/></button>)}</div></div></div>
        {collection && <p className="xp-collection">Collection: {collection} <button onClick={()=>update({collection:undefined})}>Clear</button></p>}
        <div aria-live="polite">
        {error ? (
          <div className="py-16 text-center">
            <p className="display text-3xl">Search could not be completed.</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mute">{error}</p>
            <button className="text-action mt-6 text-sm" onClick={() => setTick((t) => t + 1)}>
              Try again
            </button>
          </div>
        ) : docs === null ? (
          <div aria-busy="true"><p role="status" className="py-4 text-sm text-mute">Searching the Internet Archive…</p><ul>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex gap-5 border-b border-rule py-6">
                <div className="skeleton aspect-[3/4] w-16 shrink-0 sm:w-24" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3 w-4/5" />
                </div>
              </li>
            ))}
          </ul></div>
        ) : docs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="display text-3xl">Nothing found{q ? ` for “${q}”` : ""}.</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mute">
              Try fewer or different words, or remove a filter.
            </p>
          </div>
        ) : (
          <>
            <ul className={`xp-items ${view}`}>
              {docs.map((d) => (
                <Result key={d.identifier} d={d} />
              ))}
            </ul>

            {pages > 1 && (
              <nav className="flex items-center justify-between py-8 text-[13px]" aria-label="Pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                  className="text-action disabled:pointer-events-none disabled:opacity-30"
                >
                  ← Previous
                </button>
                <span className="text-mute">
                  Page {page.toLocaleString("en-US")} of {pages.toLocaleString("en-US")}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => goPage(page + 1)}
                  className="text-action disabled:pointer-events-none disabled:opacity-30"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
      </div></div>
    </main>
  );
}

function Result({ d }: { d: SearchDoc }) {
  const creator = first(d.creator as string | string[]);
  const restricted =
    String(d["access-restricted-item"] ?? "").toLowerCase() === "true";
  const year = d.year ?? (d.date ? String(d.date).slice(0, 4) : "");
  return (
    <li><a className="xp-card" href={href(`/item/${encodeURIComponent(d.identifier)}`)}>
      <div className="xp-cover"><Thumbnail src={thumbUrl(d.identifier)} loading="lazy" decoding="async" referrerPolicy="no-referrer" alt="" className="max-w-full max-h-full object-contain"/></div>
      <div className="xp-card-body"><p className="xp-media"><Icon name={String(d.mediatype)}/>{MEDIA_LABEL[String(d.mediatype)] || d.mediatype || "Archive item"}{year&&` · ${year}`}</p>
      <h2 className="display">{d.title || d.identifier}</h2>{creator&&<p className="xp-credit">{creator}</p>}

      <div className="xp-card-foot"><span>{restricted?"Restricted":typeof d.downloads==='number'?`${d.downloads.toLocaleString('en-US')} views`:"View record"}</span><span aria-hidden="true">↗</span></div></div>
    </a></li>
  );
}
