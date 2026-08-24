"use client";

import { useEffect, useState } from "react";
import { translations } from "./translations";

const SPRAY_OFFSETS = [
  { dx: "-40px", dy: "-30px" }, { dx: "30px", dy: "-35px" },
  { dx: "-25px", dy: "20px" }, { dx: "35px", dy: "15px" },
  { dx: "0px", dy: "-45px" }, { dx: "-45px", dy: "5px" },
  { dx: "45px", dy: "-5px" }, { dx: "10px", dy: "30px" },
];

function Bottle({ className }) {
  return (
    <svg viewBox="0 0 60 100" className={`intro-bottle ${className}`}>
      <rect x="22" y="8" width="16" height="12" rx="2" fill="#c9a961" />
      <rect x="26" y="2" width="8" height="8" rx="1" fill="#a3854a" />
      <path d="M18 20 L42 20 L46 96 Q46 100 42 100 L18 100 Q14 100 14 96 Z" fill="#ffffff" stroke="#c9a961" strokeWidth="1.5" />
      <rect x="20" y="55" width="20" height="24" fill="#f0e6d2" opacity="0.6" />
    </svg>
  );
}

export default function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [lang, setLang] = useState("ku");

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedWorldOfScents");
    const savedLang = localStorage.getItem("siteLang");

    if (hasVisited && savedLang) {
      setLang(savedLang);
    } else {
      setLang("ku");
      localStorage.setItem("siteLang", "ku");
    }

    const fadeTimer = setTimeout(() => setFading(true), 2600);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem("hasVisitedWorldOfScents", "true");
    }, 3100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  const t = translations[lang];

  return (
    <div className={`intro-overlay ${fading ? "fade-out" : ""}`}>
      <Bottle className="b1" />
      <Bottle className="b2" />
      <Bottle className="b3" />
      {SPRAY_OFFSETS.map((offset, i) => (
        <span
          key={i}
          className="spray-drop"
          style={{ "--dx": offset.dx, "--dy": offset.dy }}
        />
      ))}
      <div className="intro-text" dir={t.dir}>{t.learnMore}</div>
    </div>
  );
}