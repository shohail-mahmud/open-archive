import ActionIcon from "./ActionIcon";
import "@fontsource/dai-banna-sil/latin-500-italic.css";
import "@fontsource/caveat/latin-500.css";
import domeMark from "../../public/favicon.ico?inline";
import signatureMark from "../assets/shohail-mark.png";
import { href } from "../router";

const COLS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Navigate",
    links: [
      { label: "Explore", to: href("/explore") },
      { label: "Collections", to: href("/collections") },
      { label: "About", to: href("/about") },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "Resources", to: "https://help.archive.org/", external: true },
      { label: "Support", to: "https://archive.org/donate", external: true },
      { label: "Wayback Machine", to: "https://web.archive.org/", external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="page-end-gap border-t border-rule">
      <div className="px-5 py-12 text-[13px] sm:px-8 lg:px-10">
        <div className="max-w-xs">
          <p className="leading-relaxed text-mute">
          Independent catalogue by Shohail Mahmud. Records are sourced from archive.org. Not affiliated with or endorsed by the Internet Archive.
          </p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[17px] leading-tight font-medium text-ink" style={{fontFamily:'Caveat, cursive'}}>
            <img src={signatureMark} alt="" className="h-5 w-auto shrink-0" />
            <span>A website by <a href="https://www.instagram.com/shohailmahmud09/" target="_blank" rel="noopener noreferrer" aria-label="Shohail Mahmud on Instagram" className="text-action whitespace-nowrap">Shohail Mahmud</a>.</span>
          </p>
        </div>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-2 sm:gap-x-6">
        <a href={href("/")} aria-label="Open Archive home" className="col-start-2 row-start-1 self-center justify-self-center grid min-h-11 min-w-11 place-items-center p-1">
          <img src={domeMark} width={56} height={56} alt="" className="block size-[1.8rem] object-contain sm:size-[2.4rem]" />
        </a>
        {COLS.map((c, i) => (
          <nav
            key={c.title}
            aria-label={c.title}
            className={i === 0 ? "col-start-1 row-start-1" : "col-start-3 row-start-1 text-right"}
          >
            <h3 className="mb-4 text-[10px] uppercase tracking-[0.18em] text-mute">{c.title}</h3>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.to}
                    {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="text-action"
                  >
                    {l.label}
                    {l.external && <>{" "}<ActionIcon name="external"/></>}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        </div>
      </div>

      <nav aria-label="Site policies" className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-5 pb-4 text-[12px] text-mute sm:px-8 lg:px-10">
        <a className="text-action" href={href("/terms")}>Terms &amp; Conditions</a>
        <a className="text-action" href={href("/privacy")}>Privacy Policy</a>
      </nav>
      {/* Fit the whole line across the footer; crop only the lower half of the lettering. */}
      <svg aria-hidden="true" focusable="false" viewBox="0 0 476 52" className="block w-full overflow-hidden select-none" fill="currentColor">
        <text className="display" style={{fontWeight:500}} textLength="464" lengthAdjust="spacingAndGlyphs" x="238" y="74" textAnchor="middle" fontSize="100" letterSpacing="-1">Open Archive</text>
      </svg>
    </footer>
  );
}
