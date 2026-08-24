"use client";

import { useEffect, useState } from "react";
import { translations } from "./translations";

const PATHS = ["path1", "path2", "path3", "path4"];

const COLOR_THEMES = [
  { glass: "#ffffff", accent: "#c9a961", cap: "#a3854a" },
  { glass: "#f7ecd9", accent: "#8a6d3b", cap: "#5e4a26" },
  { glass: "#fbeaea", accent: "#b76e79", cap: "#8a4a54" },
  { glass: "#eef2f5", accent: "#556070", cap: "#33404d" },
];

function ShapeA({ glass, accent, cap }) {
  return (
    <g>
      <rect x="21" y="6" width="14" height="10" rx="2" fill={accent} />
      <rect x="25" y="1" width="6" height="6" rx="1" fill={cap} />
      <path d="M17 17 L39 17 L43 62 Q43 66 39 66 L17 66 Q13 66 13 62 Z" fill={glass} stroke={accent} strokeWidth="1.4" />
    </g>
  );
}
function ShapeB({ glass, accent, cap }) {
  return (
    <g>
      <rect x="22" y="4" width="12" height="9" rx="2" fill={accent} />
      <rect x="25" y="0" width="6" height="5" rx="1" fill={cap} />
      <circle cx="28" cy="42" r="22" fill={glass} stroke={accent} strokeWidth="1.4" />
    </g>
  );
}
function ShapeC({ glass, accent, cap }) {
  return (
    <g>
      <rect x="20" y="5" width="16" height="9" rx="1" fill={accent} />
      <rect x="24" y="0" width="8" height="6" rx="1" fill={cap} />
      <rect x="12" y="14" width="32" height="50" rx="4" fill={glass} stroke={accent} strokeWidth="1.4" />
    </g>
  );
}
function ShapeD({ glass, accent, cap }) {
  return (
    <g>
      <rect x="23" y="4" width="10" height="8" rx="2" fill={accent} />
      <rect x="25" y="0" width="6" height="5" rx="1" fill={cap} />
      <rect x="16" y="12" width="24" height="58" rx="10" fill={glass} stroke={accent} strokeWidth="1.4" />
    </g>
  );
}
function ShapeE({ glass, accent, cap }) {
  return (
    <g>
      <rect x="22" y="4" width="12" height="8" rx="2" fill={accent} />
      <rect x="25" y="0" width="6" height="5" rx="1" fill={cap} />
      <path d="M16 12 C16 28, 30 28, 30 40 C30 52, 14 54, 14 64 Q14 68 18 68 L38 68 Q42 68 42 64 C42 54, 26 52, 26 40 C26 28, 40 28, 40 12 Z" fill={glass} stroke={accent} strokeWidth="1.3" />
    </g>
  );
}

const SHAPES = [ShapeA, ShapeB, ShapeC, ShapeD, ShapeE];

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

    const fadeTimer = setTimeout(() => setFading(true), 6400);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem("hasVisitedWorldOfScents", "true");
    }, 7000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  const t = translations[lang];

  const bottles = Array.from({ length: 20 }, (_, i) => {
    const Shape = SHAPES[i % SHAPES.length];
    const colors = COLOR_THEMES[i % COLOR_THEMES.length];
    const pathClass = PATHS[i % PATHS.length];
    const delay = (i * (7000 / 20)) / 1000;
    const duration = 4.2 + (i % 3) * 0.4;
    const size = 40 + (i % 4) * 6;
    return { Shape, colors, pathClass, delay, duration, size, key: i };
  });

  const sparkles = Array.from({ length: 14 }, (_, i) => ({
    key: i,
    left: 5 + ((i * 37) % 90),
    top: 10 + ((i * 53) % 80),
    delay: (i % 7) * 0.45,
  }));

  return (
    <div className={`intro-overlay ${fading ? "fade-out" : ""}`}>
      <div className="intro-stage">
        {bottles.map(({ Shape, colors, pathClass, delay, duration, size, key }) => (
          <svg
            key={key}
            viewBox="0 0 56 70"
            className={`intro-bottle ${pathClass}`}
            style={{
              width: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            <Shape glass={colors.glass} accent={colors.accent} cap={colors.cap} />
          </svg>
        ))}

        {sparkles.map((s) => (
          <span
            key={s.key}
            className="intro-sparkle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="intro-text-big" dir={t.dir}>{t.learnMore}</div>
    </div>
  );
}