import Thumbnail from "../components/Thumbnail";
import {thumbUrl} from "../api/archive";
import { useEffect, useState } from "react";
import artwork from "../assets/alexandria.jpg";
import { href } from "../router";
import { useReveal } from "../components/useReveal";
import { countByType, searchArchive, first, type SearchDoc, MEDIA_LABEL } from "../api/archive";

const CATEGORIES = [
  { label: "Books & Texts", type: "texts", align: "text-left" },
  { label: "Moving Images", type: "movies", align: "text-center" },
  { label: "Audio & Music", type: "audio", align: "text-right" },
];

export default function Home() {
  return (
    <main>
      <Hero />
      <Artwork />
      <ExploreSection />
      <AboutSection />
    </main>
  );
}

/* --------------------------------- Hero ---------------------------------- */

function Hero() {
  return (
    <section className="px-5 sm:px-8 lg:px-10">
      <div className="flex min-h-[78svh] flex-col items-center justify-center pb-16 pt-32 text-center sm:min-h-[84svh]">
        <h1
          className="display rise text-[clamp(3rem,min(20vw,23svh),13rem)] leading-[0.87] tracking-[-0.025em]"
        >
          <span className="block whitespace-nowrap">Open</span>{" "}
          <span className="block whitespace-nowrap">Archive</span>
        </h1>
        <p
          className="fade mt-3 text-[11px] text-mute sm:mt-4 sm:text-xs"
          style={{ animationDelay: "0.5s" }}
        >
          An independent project by Shohail Mahmud.
        </p>
      </div>

      {/* Three equal sections: left / centre / right */}
      <nav
        aria-label="Collection categories"
        className="grid grid-cols-3 py-3.5 text-[10px] uppercase tracking-[0.14em] sm:py-4 sm:text-[11px] sm:tracking-[0.2em]"
      >
        {CATEGORIES.map((c) => (
          <a
            key={c.type}
            href={href("/explore", { type: c.type })}
            className={`block w-full text-balance transition-opacity duration-200 hover:opacity-50 ${c.align}`}
          >
            {c.label}
          </a>
        ))}
      </nav>
    </section>
  );
}

/* -------------------------------- Artwork -------------------------------- */

function Artwork() {
  return (
    <section className="px-5 sm:px-8 lg:px-10" aria-label="Featured artwork">
      <figure className="mx-auto max-w-[1836px]">
        {/* Natural aspect ratio is preserved: width fills, height follows. */}
        <img
          src={artwork}
          width={1836}
          height={1352}
          alt="The Burning of the Library at Alexandria in 391 AD, a lithograph by Ambrose Dudley showing a crowd in front of burning colonnades and a seated statue"
          className="fade block h-auto w-full"
          style={{ animationDelay: "0.2s" }}
          fetchPriority="high"
        />
        <figcaption className="mt-3 flex flex-col gap-1 text-[11px] leading-relaxed text-mute sm:flex-row sm:justify-between sm:gap-8">
          <span>
            Ambrose Dudley, <em>The Burning of the Library at Alexandria in 391 AD</em>, c. 1915.
            Illustration from <em>Hutchinson’s Story of the Nations</em>.
          </span>
          <span className="sm:text-right">
            Public domain in the US · The Stapleton Collection ·{" "}
            <a
              className="text-action"
              target="_blank"
              rel="noreferrer"
              href="https://commons.wikimedia.org/wiki/File:The_Burning_of_the_Library_at_Alexandria_in_391_AD.jpg"
            >
              Wikimedia Commons
            </a>{" "}
            ·{" "}
            <a
              className="text-action"
              target="_blank"
              rel="noreferrer"
              href="https://archive.org/details/hutchinsonsstory00londuoft"
            >
              Scan from the Internet Archive
            </a>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

/* ----------------------------- Explore section ---------------------------- */

function ExploreSection() {
  const intro = useReveal<HTMLDivElement>();
  return (
    <section id="explore" className="section-gap scroll-mt-10 px-5 sm:px-8 lg:px-10">
      <div className="border-t border-rule pt-8">
        <div ref={intro} className="reveal grid gap-10 md:grid-cols-12 md:gap-8">
          <h2
            className="display text-[13vw] leading-[0.95] tracking-[-0.01em] sm:text-[8vw] md:col-span-8 lg:text-[7vw]"
          >
            Explore the Archive
          </h2>
          <div className="md:col-span-4 md:col-start-9 md:pt-3">
            <p className="max-w-sm text-[15px] leading-relaxed">
              Discover books, films, music, websites and millions of preserved pieces of history.
            </p>
            <a
              href={href("/explore")}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-4 rounded-md bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-offset-4"
            >
              Explore Archive <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        <Counts />
        <Featured />
      </div>
    </section>
  );
}

function Counts() {
  const types = [
    { type: "texts", label: "Texts" },
    { type: "movies", label: "Moving images" },
    { type: "audio", label: "Audio recordings" },
  ];
  const [counts, setCounts] = useState<Record<string, number | null | "err">>({});

  useEffect(() => {
    const ac = new AbortController();
    types.forEach(({ type }) =>
      countByType(type, ac.signal)
        .then((n) => setCounts((c) => ({ ...c, [type]: n })))
        .catch((e) => e.name !== "AbortError" && setCounts((c) => ({ ...c, [type]: "err" })))
    );
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="subsection-gap grid grid-cols-3 border-t border-rule">
      {types.map((t, i) => {
        const v = counts[t.type];
        return (
          <a
            key={t.type}
            href={href("/explore", { type: t.type })}
            className={`group block pt-5 ${i === 1 ? "text-center" : i === 2 ? "text-right" : ""}`}
          >
            <p className="display text-[7vw] leading-none sm:text-[4.5vw]">
              {v === undefined ? (
                <span className="skeleton inline-block h-[0.8em] w-[3.2em] align-middle" />
              ) : v === "err" || v === null ? (
                "—"
              ) : (
                v.toLocaleString("en-US")
              )}
            </p>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.14em] text-mute transition-colors group-hover:text-ink sm:text-[11px] sm:tracking-[0.2em]">
              {t.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}

function Featured() {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const ref = useReveal<HTMLDivElement>();

  useEffect(() => {
    const ac = new AbortController();
    setDocs(null);
    setError(null);
    // The most-downloaded freely accessible items of each major media type.
    Promise.all(
      ["texts", "movies", "audio"].map((mediatype) =>
        searchArchive({
          query: "",
          mediatype,
          sort: "downloads",
          rows: 2,
          openOnly: true,
          signal: ac.signal,
        })
      )
    )
      .then((r) => {
        const merged: SearchDoc[] = [];
        for (let i = 0; i < 2; i++) r.forEach((x) => x.docs[i] && merged.push(x.docs[i]));
        setDocs(merged);
      })
      .catch((e) => e.name !== "AbortError" && setError(e.message || "Unable to reach the Archive."));
    return () => ac.abort();
  }, [tick]);

  return (
    <div ref={ref} className="reveal subsection-gap">
      <div className="mb-5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-mute sm:text-[11px]">
        <span>From the collection</span>
        <a href={href("/explore", { sort: "downloads" })} className="text-action normal-case tracking-normal">
          Most viewed →
        </a>
      </div>

      {error ? (
        <p className="border-t border-rule py-8 text-sm text-mute">
          We couldn’t load items from the Archive right now. {error}{" "}
          <button className="text-action text-ink" onClick={() => setTick((t) => t + 1)}>
            Try again
          </button>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {docs === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <div className="skeleton aspect-[3/4]" />
                  <div className="skeleton mt-3 h-3 w-4/5" />
                </li>
              ))
            : docs.length === 0 ? (
                <li className="col-span-full text-sm text-mute">No items returned.</li>
              ) : (
                docs.map((d) => (
                  <li key={d.identifier}>
                    <a href={href(`/item/${encodeURIComponent(d.identifier)}`)} className="group block">
                      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-[#f4f4f4]">
                        <Thumbnail src={thumbUrl(d.identifier)} loading="lazy" decoding="async" referrerPolicy="no-referrer" alt="" className="max-w-full max-h-full object-contain"/>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[13px] leading-snug">{d.title ?? d.identifier}</p>
                      <p className="mt-1 text-[11px] text-mute">
                        {MEDIA_LABEL[String(d.mediatype)] ?? d.mediatype}
                        {first(d.creator as string | string[]) ? ` · ${first(d.creator as string | string[])}` : ""}
                      </p>
                    </a>
                  </li>
                ))
              )}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ About section ----------------------------- */

const PRINCIPLES = [
  {
    t: "Browse",
    d: "Browse the catalogue by format, from books and photographs to music and film.",
  },
  {
    t: "Open access",
    d: "Read, watch or listen where access is available. Each entry links to its original record.",
  },
  {
    t: "Discover",
    d: "Books, films, music, websites, software and images are catalogued and searchable together, so one curiosity can lead to the next.",
  },
  { t: "About the original source", d: "Read archive.org About", url: "https://archive.org/about/" },
];

function AboutSection() {
  const a = useReveal<HTMLDivElement>();
  const b = useReveal<HTMLDivElement>();
  return (
    <section id="about" className="section-gap scroll-mt-10 px-5 sm:px-8 lg:px-10">
      <div className="border-t border-rule pt-8">
        <div ref={a} className="reveal grid gap-8 md:grid-cols-12">
          <p className="text-[10px] uppercase tracking-[0.2em] text-mute sm:text-[11px] md:col-span-3">About Open Archive</p>
          <p className="display text-[7.2vw] leading-[1.08] tracking-[-0.005em] sm:text-[4.2vw] md:col-span-9 lg:text-[3.6vw]">
            Open Archive is an independent catalogue by Shohail Mahmud. Records are sourced from <a href="https://archive.org/" target="_blank" rel="noopener noreferrer" className="text-action">archive.org</a>.
          </p>
        </div>

        <div ref={b} className="reveal subsection-gap grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="grid gap-10 md:col-span-9 md:col-start-4 md:grid-cols-2 md:gap-8">
            {PRINCIPLES.map((p) => (
              <div key={p.t} className="border-t border-rule pt-4">
                <h3 className="display text-2xl">{p.t}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/80">{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-action">{p.d} <span aria-hidden="true">↗</span></a> : p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
