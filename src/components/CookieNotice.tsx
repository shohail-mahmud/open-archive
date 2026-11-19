import {useEffect,useState} from 'react';
import {href} from '../router';

const key = 'open-archive.home-notice.v1';
export default function CookieNotice() {
  const [visible, setVisible] = useState(() => {
    try { const saved = localStorage.getItem(key); return saved !== 'seen' && saved !== 'dismissed'; } catch { return true; }
  });
  useEffect(() => {
    if (!visible) return;
    function remember() {
      if (document.visibilityState !== 'visible') return;
      try { localStorage.setItem(key, 'seen'); } catch { /* Storage is optional. */ }
    }
    remember();
    document.addEventListener('visibilitychange', remember);
    return () => document.removeEventListener('visibilitychange', remember);
  }, [visible]);
  if (!visible) return null;
  return <aside className="cookie-notice" aria-label="Cookie and media notice"><div>
    <section><h2>Cookies &amp; media</h2>
    <p>Media loads from archive.org, which may use cookies. By continuing to view, play, read or download, you agree to our <a href={href('/terms')}>Terms &amp; Conditions</a>. See our <a href={href('/privacy')}>Privacy Policy</a>.</p></section>
    <button type="button" onClick={() => setVisible(false)}>Got it</button>
  </div></aside>;
}
