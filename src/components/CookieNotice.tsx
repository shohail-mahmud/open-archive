import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {href} from '../router';
import './cookie-dialog.css';

const key='open-archive.home-notice.acknowledged.v1';
let acknowledgedThisVisit=false;
export default function CookieNotice(){
  const [visible,setVisible]=useState(()=>{
    if(acknowledgedThisVisit)return false;
    try{return localStorage.getItem(key)!=='yes'}catch{return true}
  });
  const bar=useRef<HTMLElement>(null),space=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    if(!visible||!bar.current||!space.current)return;
    const el=bar.current,spacer=space.current;
    const sync=()=>{spacer.style.height=`${el.offsetHeight}px`};sync();
    const observer=new ResizeObserver(sync);observer.observe(el);
    return ()=>observer.disconnect();
  },[visible]);
  useEffect(()=>{
    const sync=(e:StorageEvent)=>{if(e.key===key&&e.newValue==='yes')setVisible(false)};
    window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);
  },[]);
  function acknowledge(){
    acknowledgedThisVisit=true;
    try{localStorage.setItem(key,'yes')}catch{/* Remember for this visit when storage is blocked. */}
    setVisible(false);
  }
  if(!visible)return null;
  return <><div ref={space} aria-hidden="true"/><aside ref={bar} className="oa-cookie-bar" aria-labelledby="oa-cookie-title"><div>
    <section><h2 id="oa-cookie-title">Cookies &amp; media</h2>
    <p>Media loads from archive.org, which may use cookies. By continuing to browse, you agree to our <a href={href('/terms')}>Terms &amp; Conditions</a>. See our <a href={href('/privacy')}>Privacy Policy</a>.</p></section>
    <button type="button" onClick={acknowledge}>Yes, got it</button>
  </div></aside></>;
}
