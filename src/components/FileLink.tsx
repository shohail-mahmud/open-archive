import type {ReactNode} from 'react';
// Keep the transfer on the source domain. Never fetch a blob or repackage a file.
export default function FileLink({url,children,className}:{url:string;name:string;size?:number;children:ReactNode;className:string}){return <a className={className} href={url+'?download=1'} target="_blank" rel="noopener noreferrer">{children}</a>}
