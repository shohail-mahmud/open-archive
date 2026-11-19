import { href } from "../router";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Collections", to: "/collections" },
  { label: "About", to: "/about" },
];

export default function Nav({ path }: { path: string }) {
  const active = (to: string) =>
    to === "/" ? path === "/" : path === to || path.startsWith(to + "/");

  return (
    <header className="absolute top-0 inset-x-0 z-20">
      <nav
        aria-label="Primary"
        className="mx-auto flex flex-col gap-3 px-5 pt-5 text-[13px] sm:flex-row sm:items-baseline sm:justify-between sm:px-8 lg:px-10"
      >
        <a href={href("/")} className="display text-[19px] leading-none tracking-tight">
          Open Archive
        </a>
        <ul className="flex items-baseline justify-between gap-0 sm:gap-10">
          {LINKS.map((l) => (
            <li key={l.to}>
              <a
                href={href(l.to)}
                className="nav-link"
                aria-current={active(l.to) && l.to !== "/about" ? "page" : undefined}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
