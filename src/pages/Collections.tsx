import Thumbnail from "../components/Thumbnail";
import {thumbUrl} from "../api/archive";
import { useEffect, useState } from "react";
import { href } from "../router";
import { collectionItems, type SearchDoc } from "../api/archive";

/**
 * Only the *identifiers* of well-known Archive collections are listed here;
 * titles, descriptions and artwork are fetched live from the Search API.
 */
const IDS = [
  "internetarchivebooks",
  "americana",
  "prelinger",
  "feature_films",
  "opensource_movies",
  "audio_music",
  "librivoxaudio",
  "etree",
  "nasa",
  "smithsonian",
  "newspapers",
  "softwarelibrary",
];

export default function Collections() {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    setDocs(null);
    setError(null);
    collectionItems(IDS, ac.signal)
      .then(setDocs)
      .catch((e) => e.name !== "AbortError" && setError(e.message || "Unable to reach the Archive."));
    return () => ac.abort();
  }, [tick]);

  return (
    <main className="px-5 pt-28 sm:px-8 sm:pt-36 lg:px-10">
      <h1 className="display rise text-[16vw] leading-[0.95] tracking-[-0.015em] sm:text-[9vw]">Collections</h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed">
        The Archive is organised into collections, each curated by the Archive or by its partners. Select one to browse
        what it holds.
      </p>

      <div className="mt-12 border-t border-rule" aria-live="polite">
        {error ? (
          <p className="py-12 text-sm text-mute">
            Collections could not be loaded. {error}{" "}
            <button className="text-action text-ink" onClick={() => setTick((t) => t + 1)}>
              Try again
            </button>
          </p>
        ) : docs === null ? (
          <ul aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex gap-6 border-b border-rule py-6">
                <div className="skeleton h-20 w-20" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-6 w-1/3" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : docs.length === 0 ? (
          <p className="py-12 text-sm text-mute">No collections were returned by the Archive.</p>
        ) : (
          <ul className="fade">
            {docs.map((d, i) => (
              <li key={d.identifier} className="border-b border-rule">
                <a
                  href={href("/explore", { collection: d.identifier })}
                  className="group grid grid-cols-[auto_1fr] items-start gap-5 py-6 sm:grid-cols-[3rem_6rem_1fr_auto] sm:gap-8"
                >
                  <span className="hidden pt-1 text-[11px] tabular-nums text-mute sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden bg-[#f4f4f4] sm:h-24 sm:w-24">
                    <Thumbnail src={thumbUrl(d.identifier)} loading="lazy" decoding="async" referrerPolicy="no-referrer" alt="" className="max-w-full max-h-full object-contain"/>
                  </div>
                  <div className="min-w-0">
                    <h2 className="display text-3xl leading-tight sm:text-4xl">
                      <span className="text-action">{d.title ?? d.identifier}</span>
                    </h2>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-ink/75">
                      Browse collection records →
                    </p>
                  </div>
                  <span className="hidden self-center text-[13px] transition-transform duration-300 group-hover:translate-x-1 sm:block">
                    Browse →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
