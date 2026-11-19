const paths = {
  forward:'M2 8h11M8 3l5 5-5 5', back:'M14 8H3m5-5L3 8l5 5',
  download:'M8 2v8m-4-4 4 4 4-4M2 11v3h12v-3', check:'m2.5 8 3.5 3.5L13.5 4',
  external:'M4 12 12 4M4.5 4H12v7.5',
};
export default function ActionIcon({name}:{name:keyof typeof paths}){return <svg className="link-arrow" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>}
