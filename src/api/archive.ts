/**
 * Thin client for the public Internet Archive APIs.
 *  - Advanced Search:  https://archive.org/advancedsearch.php
 *  - Metadata:         https://archive.org/metadata/{identifier}
 *  - Thumbnails:       https://archive.org/services/img/{identifier}
 *  - Embeds:           https://archive.org/embed/{identifier}  (BookReader / players)
 *
 * Nothing is cached in a local database: the Archive is always the source of truth.
 */


const BASE = "https://archive.org";

export type MediaType =
  | "texts"
  | "movies"
  | "audio"
  | "software"
  | "image"
  | "web"
  | "collection";

export interface SearchDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  year?: number | string;
  date?: string;
  mediatype?: MediaType | string;
  downloads?: number;
  description?: string | string[];
  "access-restricted-item"?: string | boolean;
  lending___status?: string | string[];
}

export interface SearchResult {
  total: number;
  docs: SearchDoc[];
}

export type SortKey = "relevance" | "downloads" | "newest" | "oldest";

export interface SearchParams {
  query: string;
  field?: string;
  period?: string;
  mediatype?: string; // "" = all
  collection?: string; // restrict to one Archive collection identifier
  sort?: SortKey;
  page?: number; // 1-indexed
  rows?: number;
  openOnly?: boolean; // exclude items with access restrictions (borrowing)
  signal?: AbortSignal;
}

const SORTS: Record<SortKey, string | null> = {
  relevance: null,
  downloads: "downloads desc",
  newest: "date desc",
  oldest: "date asc",
};

const FIELDS = [
  "identifier",
  "title",
  "creator",
  "year",
  "date",
  "mediatype",
  "downloads",
  "access-restricted-item",
  "lending___status",
];

/** Ordinary terms retain the Archive's relevance matching. Treat punctuation and
 * reserved operators as literal search text, not an incomplete Lucene expression. */
function userTerms(input: string) {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text || /^[\p{L}\p{N} ]+$/u.test(text) && !/\b(?:AND|OR|NOT)\b/.test(text)) return text;
  return '"' + text.replace(/["\\]/g, '\\$&') + '"';
}

export function buildSearchQuery(p: Pick<SearchParams, "query" | "mediatype" | "openOnly" | "collection" | "field" | "period">) {
  const parts: string[] = [];
  const text = userTerms(p.query);
  if (text) parts.push(p.field && ["title", "creator", "subject"].includes(p.field) ? `${p.field}:(${text})` : `(${text})`);
  const periods: Record<string,string> = { early: "[* TO 1899]", twentieth: "[1900 TO 1999]", recent: "[2000 TO *]" };
  if (p.period && Object.prototype.hasOwnProperty.call(periods,p.period)) parts.push(`year:${periods[p.period]}`);
  if (p.mediatype) parts.push(`mediatype:${p.mediatype}`);
  if (p.collection) parts.push(`collection:${p.collection.replace(/[^\w.-]/g, "")}`);
  if (p.openOnly) parts.push("NOT access-restricted-item:true");
  if (!p.mediatype && !p.collection) parts.push("NOT mediatype:collection");
  return parts.length ? parts.join(" AND ") : "NOT mediatype:collection";
}

export async function searchArchive(p: SearchParams): Promise<SearchResult> {
  const params = new URLSearchParams();
  params.set("q", buildSearchQuery(p));
  FIELDS.forEach((f) => params.append("fl[]", f));
  params.set("rows", String(p.rows ?? 24));
  params.set("page", String(p.page ?? 1));
  params.set("output", "json");
  const sort = SORTS[p.sort ?? "relevance"];
  if (sort) params.append("sort[]", sort);
  // Without a free-text query, default to most-downloaded so results are meaningful.
  else if (!userTerms(p.query)) params.append("sort[]", "downloads desc");

  return readSearch(params, p.signal);
}

async function archiveJSON(path: string, signal?: AbortSignal, missingOK = false) {
  const apiBase = catalogueBase();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, 15000);
  try {
    let response: Response;
    try {
      response = await fetch(`${apiBase}${path}`, { signal: controller.signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      if (controller.signal.aborted) throw new Error("The Archive took too long to respond. Please try again.");
      throw new Error("Could not connect to archive.org. Check your connection and try again.");
    }
    if (missingOK && response.status === 404) return {};
    if (response.status === 504) throw new Error("The Archive took too long to respond. Please try again.");
    if (!response.ok) throw new Error(`Internet Archive returned HTTP ${response.status}. Please try again later.`);
    const data = await response.json().catch((e) => {
      if (signal?.aborted) throw e;
      if (controller.signal.aborted) throw new Error("The Archive took too long to respond. Please try again.");
      throw new Error("Internet Archive returned an unreadable response.");
    });
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unexpected Internet Archive response.");
    if (data.error || data.responseHeader?.status > 0) {
      const reason = typeof data.error === "string" ? data.error : data.error?.msg;
      throw new Error(`Internet Archive rejected this request.${reason ? ` ${reason}` : ""}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

async function readSearch(params: URLSearchParams, signal?: AbortSignal): Promise<SearchResult> {
  const { response } = await archiveJSON(`/advancedsearch.php?${params}`, signal);
  if (!Number.isSafeInteger(response?.numFound) || response.numFound < 0 || !Array.isArray(response.docs)
      || !response.docs.every((d: SearchDoc) => d && typeof d.identifier === "string" && d.identifier)) {
    throw new Error("Internet Archive returned incomplete search results.");
  }
  return { total: response.numFound, docs: response.docs };
}

export async function countByType(mediatype: string, signal?: AbortSignal): Promise<number> {
  const params = new URLSearchParams({ q: `mediatype:${mediatype}`, rows: "0", output: "json", "fl[]": "identifier" });
  return (await readSearch(params, signal)).total;
}

export async function collectionItems(ids: string[], signal?: AbortSignal) {
  const params = new URLSearchParams({ q: `mediatype:collection AND identifier:(${ids.join(" OR ")})`, rows: String(ids.length), output: "json" });
  ["identifier", "title", "downloads"].forEach(f => params.append("fl[]", f));
  return (await readSearch(params, signal)).docs.sort((a, b) => ids.indexOf(a.identifier) - ids.indexOf(b.identifier));
}

/* ------------------------------ Metadata API ----------------------------- */

export interface ArchiveFile {
  name: string;
  sha1?: string;
  source?: string;
  format?: string;
  size?: string;
  private?: string;
  original?: string;
}

export interface ItemMetadata {
  metadata: Record<string, string | string[] | undefined>;
  files: ArchiveFile[];
  is_dark?: boolean;
  server?: string;
  dir?: string;
  files_count?: number;
  sourceAccess?: Access;
  sourceFilesAvailable?: boolean;
}

export async function getItem(identifier: string, signal?: AbortSignal): Promise<ItemMetadata | null> {
  const json = await archiveJSON(`/metadata/${encodeURIComponent(identifier)}`, signal, true);
  if (!Object.keys(json).length) return null;
  if (!json.metadata || typeof json.metadata !== "object" || Array.isArray(json.metadata)) {
    throw new Error("Internet Archive did not provide readable metadata for this item.");
  }
  // Check access against the complete record before removing unapproved files.
  const original = {...json, files:Array.isArray(json.files)?json.files.filter((f:ArchiveFile)=>f && typeof f.name==='string'):[]};
  const sourceAccess = getAccess(original);
  const allowed = json.metadata.identifier===identifier && sourceAccess.kind==='open';
  return {...original, sourceAccess, sourceFilesAvailable:sourceAccess.kind==='open' && publicFiles(original).length>0, files:allowed?original.files.filter((f:ArchiveFile)=>isPublicFile(f) && f.name.split('/').every(part=>!!part && part!=='.' && part!=='..' && !/[\\\x00-\x1f]/.test(part))):[]};

}

/* -------------------------------- Helpers -------------------------------- */

const catalogueBase = () => document.querySelector<HTMLMetaElement>('meta[name="archive-relay"]')?.content || BASE;
export const thumbUrl = (id: string) => `${BASE}/services/img/${encodeURIComponent(id)}`;
export const sourceDirectory = (id:string) => `${BASE}/download/${encodeURIComponent(id)}/`;
export const detailsUrl = (id: string) => `${BASE}/details/${encodeURIComponent(id)}`;
export const embedUrl = (id: string) => `${BASE}/embed/${encodeURIComponent(id)}`;
export const downloadUrl = (id: string, name: string) =>
  `${BASE}/download/${encodeURIComponent(id)}/${name.split("/").map(encodeURIComponent).join("/")}`;

export const hosted = () => catalogueBase() !== BASE;
export const fileUrl = downloadUrl;
export const isPublicFile = (f:ArchiveFile) => String(f.private).toLowerCase() !== "true" && !/encrypted/i.test(f.format || "");

export const asArray = <T,>(v: T | T[] | undefined | null): T[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

export const first = (v: string | string[] | undefined | null): string | undefined =>
  asArray(v)[0];

/** Archive descriptions often contain HTML; reduce to readable plain text. */
export function plainText(html: string | string[] | undefined | null): string {
  const raw = asArray(html).join("\n\n");
  if (!raw) return "";
  const doc = new DOMParser().parseFromString(
    raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n\n"),
    "text/html"
  );
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

export function formatBytes(n?: string | number) {
  const v = Number(n);
  if (!v || Number.isNaN(v)) return "";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(v) / Math.log(1024)));
  return `${(v / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

export const MEDIA_LABEL: Record<string, string> = {
  texts: "Text",
  movies: "Moving image",
  audio: "Audio",
  software: "Software",
  image: "Image",
  web: "Web",
  collection: "Collection",
  data: "Data",
  etree: "Live music",
};

export type Access =
  | { kind: "open" }
  | { kind: "borrow"; reason: string }
  | { kind: "restricted"; reason: string };

/**
 * Work out how an item may be accessed. We never try to bypass restrictions:
 * restricted items are only linked to archive.org, where sign-in and lending apply.
 */
export function getAccess(item: ItemMetadata): Access {
  const m = item.metadata;
  if (item.is_dark) {
    return { kind: "restricted", reason: "This item is currently not available to the public." };
  }
  const restricted = String(first(m["access-restricted-item"]) ?? "").toLowerCase() === "true";
  const collections = asArray(m.collection);
  const lendable =
    collections.some((c) => ["inlibrary", "lendinglibrary", "printdisabled"].includes(c)) ||
    item.files.some((f) => /encrypted/i.test(f.format ?? ""));
  if (lendable) {
    return {
      kind: "borrow",
      reason:
        "This item is marked for lending. Check its Archive record for current reading and borrowing options.",
    };
  }
  if (restricted) {
    return {
      kind: "restricted",
      reason: "The Archive limits access to this item. Its catalogue record is available, but its files cannot be opened here.",
    };
  }
  return { kind: "open" };
}

/** Files that may be linked directly (public, non-encrypted, non-log). */
export function publicFiles(item: ItemMetadata): ArchiveFile[] {
  const hidden = /^(item tile|metadata|log|item image|archive bittorrent|text|djvuxml|dublin core|marc|marc source|marc binary|json|sqlite|item cdx index|web archive|chocr|hocr|scandata|single page processed jp2 zip|djvu|spectrogram)$/i;
  return item.files.filter(
    (f) =>
      String(f.private).toLowerCase() !== "true" &&
      !/encrypted/i.test(f.format ?? "") &&
      !/^(logs\/|__ia_thumb)/.test(f.name) &&
      f.source !== "metadata" &&
      !hidden.test(f.format ?? "") &&
      !/_(meta|files)\.(xml|sqlite)$/.test(f.name)
  );
}
