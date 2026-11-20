import { restorePosition,returnMark,trackReturns } from "./returnPosition";
import { useEffect,useLayoutEffect } from "react";
import { useRoute } from "./router";
import Nav from "./components/Nav";
import CookieNotice from "./components/CookieNotice";
import Footer from "./components/Footer";
import Policies from "./pages/Policies";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Collections from "./pages/Collections";
import Item from "./pages/Item";

export default function App() {
  const route = useRoute();
  const { path } = route;

  // Page title + scroll handling per route
  useEffect(() => {
    const base = "Open Archive - Independent Archive search";
    document.title =
      path === "/terms" ? "Terms & Conditions - Open Archive"
      : path === "/privacy" ? "Privacy Policy - Open Archive"
      : path === "/explore"
        ? "Explore - Open Archive"
        : path === "/collections"
        ? "Collections - Open Archive"
        : path.startsWith("/item/")
        ? "Item - Open Archive"
        : base;
  }, [path]);

  useLayoutEffect(trackReturns,[]);
  // Scroll to top on page change, or to #about on the home page for /about
  useLayoutEffect(() => {
    const mark=returnMark();if(mark)return restorePosition(mark);
    if (path === "/about") {
      requestAnimationFrame(() =>
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [path]);

  let page;
  if (path === "/explore") page = <Explore route={route} />;
  else if (path === "/collections") page = <Collections />;
  else if (path === "/terms" || path === "/privacy") page = <Policies privacy={path === "/privacy"} />;
  else if (path.startsWith("/item/")) page = <Item id={decodeURIComponent(path.slice(6))} />;
  else page = <Home />;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav path={path} />
      {page}
      <Footer />
      <CookieNotice />
    </div>
  );
}
