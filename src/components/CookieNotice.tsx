import {useLayoutEffect,useRef,useState} from 'react';
import {href} from '../router';
import './cookie-dialog.css';

const key='open-archive.home-notice.acknowledged.v1';
let acknowledgedThisVisit=false;
export default function CookieNotice(){
  const [visible,setVisible]=useState(()=>{
    if(acknowledgedThisVisit)return false;
    try{return localStorage.getItem(key)!=='yes'}catch{return true}
  });
  const ref=useRef<HTMLDialogElement>(null);
  useLayoutEffect(()=>{
    const dialog=ref.current;
    if(!visible||!dialog)return;
    const previous=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    const keepOpen=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation()}};
    dialog.setAttribute('closedby','none');
    window.addEventListener('keydown',keepOpen,true);
    dialog.showModal();
    return ()=>{window.removeEventListener('keydown',keepOpen,true);dialog.close();document.documentElement.style.overflow=previous};
  },[visible]);
  function acknowledge(){
    acknowledgedThisVisit=true;
    try{localStorage.setItem(key,'yes')}catch{/* Keep the acknowledgement in memory when storage is blocked. */}
    setVisible(false);
  }
  if(!visible)return null;
  return <dialog ref={ref} className="oa-cookie-dialog" aria-labelledby="oa-cookie-title" aria-describedby="oa-cookie-copy" onCancel={event=>event.preventDefault()}>
    <p className="oa-cookie-kicker">Open Archive</p>
    <h2 id="oa-cookie-title" className="display">Cookies &amp; media</h2>
    <p id="oa-cookie-copy">Images, books and players load from archive.org, which may use cookies. By continuing to browse, you agree to our Terms &amp; Conditions.</p>
    <div className="oa-cookie-links"><a href={href('/terms')} target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a><a href={href('/privacy')} target="_blank" rel="noopener noreferrer">Privacy Policy</a></div>
    <button type="button" autoFocus onClick={acknowledge}>Got it, continue</button>
  </dialog>;
}
