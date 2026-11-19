import fs from 'node:fs';
import path from 'node:path';
const packages=['react','react-dom','scheduler','fflate','pdfjs-dist','@fontsource/caveat','@fontsource/inter','@fontsource/dai-banna-sil','clsx','tailwind-merge','tailwindcss'];
const entries=[];
for(const pkg of packages){const root=path.join('node_modules',pkg);const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
 const names=fs.readdirSync(root).filter(n=>/^(licen[cs]e(?:\..*)?|notice(?:\..*)?|copying(?:\..*)?)$/i.test(n));if(!names.length)throw Error(`Missing notice: ${pkg}`);
 if(pkg==='pdfjs-dist'){entries.push('PDF.js — Copyright Mozilla Foundation. Included under Apache License 2.0.');for(const sub of ['wasm','standard_fonts','iccs','cmaps'])for(const n of fs.readdirSync(path.join(root,sub)))if(/^LICENSE/.test(n))names.push(`${sub}/${n}`)}
 for(const name of names)entries.push(`${pkg} ${version} — ${name}\n\n${fs.readFileSync(path.join(root,name),'utf8').trim()}`);
}
fs.writeFileSync('THIRD-PARTY-NOTICES.txt',entries.join('\n\n────────────────────────────────────────────────\n\n')+'\n');
