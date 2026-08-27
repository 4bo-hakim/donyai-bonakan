"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { supabase } from "./lib/supabase";
import { translations } from "./lib/translations";
import AuthModal from "./lib/AuthModal";

const NOTES_LIST = [
  "Amber", "Amber Marine", "Sandalwood", "Cedarwood", "Oud",
  "Musk", "Vanilla", "Caramel", "Cashmere", "Bergamot",
  "Citrus", "Lemon", "Orange Blossom", "Jasmine", "Rose",
  "Lavender", "Patchouli", "Vetiver", "Tobacco", "Leather",
  "Black Leather", "Coffee", "Cinnamon", "Cardamom", "Pepper",
  "Iris", "Tonka Bean", "Coconut", "Saffron", "Incense",
  "Grapefruit", "Mandarin", "Neroli", "Ylang-Ylang", "Tuberose",
  "Violet", "Peony", "Lily of the Valley", "Geranium", "Basil",
  "Mint", "Green Tea", "Apple", "Pear", "Peach",
  "Blackcurrant", "Fig", "Almond", "Honey", "White Musk",
  "Woody", "Warm Spicy", "Oakmoss", "Nutmeg", "Clove",
  "Ginger", "Pink Pepper", "Freesia", "Magnolia", "Water Lily",
  "Marine", "Ozonic", "Pineapple", "Raspberry", "Strawberry",
  "Plum", "Cocoa", "Praline", "Suede", "Birch",
  "Anise", "Aldehydes", "Apricot", "Bamboo", "Bay Leaf",
  "Benzoin", "Blackberry", "Blood Orange", "Cade", "Camphor",
  "Cassis", "Champaca", "Cherry", "Chestnut", "Chocolate",
  "Cistus", "Clary Sage", "Cognac", "Cucumber", "Currant",
  "Cypress", "Date", "Dill", "Elemi", "Fir",
  "Frangipani", "Frankincense", "Galbanum", "Gardenia", "Grape",
  "Guaiac Wood", "Hay", "Heliotrope", "Hyacinth", "Immortelle",
  "Juniper Berries", "Kiwi", "Labdanum", "Licorice", "Lily",
  "Lime", "Lotus", "Mango", "Melon", "Mimosa",
  "Myrrh", "Narcissus", "Orris", "Osmanthus", "Palo Santo",
  "Ambergris", "Amber Wood", "Sea Notes",
  "Black Pepper", "Ice Cream", "Brown Sugar", "Rum", "Watermelon",
  "Orange", "Mahogany", "Fruits", "Ambrette", "Almizcle",
  "Black Tea", "Toffee", "Mahonial", "Candied Almond", "Ambroxan",
  "Truffle",
];

const LANG_LABELS = { ku: "KU", ar: "AR", en: "EN" };

export default function Home() {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("ku");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const menuRef = useRef(null);
  const langMenuRef = useRef(null);

  const [gender, setGender] = useState("all");
  const [brand, setBrand] = useState("all");
  const [longevity, setLongevity] = useState("all");
  const [notes, setNotes] = useState([]);

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("siteLang");
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("siteLang", lang);
  }, [lang]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchMemberCount() {
      const { data, error } = await supabase.rpc("get_member_count");
      if (!error) setMemberCount(data);
    }
    fetchMemberCount();
  }, []);

  useEffect(() => {
    async function fetchPerfumes() {
      const { data, error } = await supabase
        .from("perfumes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setPerfumes(data);
      setLoading(false);
    }
    fetchPerfumes();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) { setProfile(null); return; }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
    fetchProfile();
  }, [user]);

  const brands = useMemo(() => {
    const seen = new Map();
    perfumes.forEach((p) => {
      if (!p.brand) return;
      const key = p.brand.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, p.brand.trim());
    });
    return [...seen.values()];
  }, [perfumes]);

  const filtered = perfumes.filter((p) => {
    if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (gender !== "all" && p.gender !== gender) return false;
    if (brand !== "all" && p.brand?.trim().toLowerCase() !== brand.trim().toLowerCase()) return false;
    if (longevity !== "all" && p.longevity !== longevity) return false;
    if (notes.length > 0) {
      const allNotes = `${p.top_notes} ${p.middle_notes} ${p.base_notes}`.toLowerCase();
      if (!notes.some((n) => allNotes.includes(n.toLowerCase()))) return false;
    }
    return true;
  });

  const activeFilterCount = [gender, brand, longevity].filter((v) => v !== "all").length + (notes.length > 0 ? 1 : 0);

  function toggleNote(note) {
    setNotes((prev) => prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]);
  }

  function clearFilters() {
    setGender("all"); setBrand("all"); setLongevity("all"); setNotes([]);
  }

  return (
    <div dir={t.dir}>
      <header className="header">
        <div className="logo">{t.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>

          <div ref={langMenuRef} style={{ position: "relative" }}>
            <button
              className="menu-icon-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              style={{ fontSize: "1.3rem" }}
            >
              🌐
            </button>
            {langMenuOpen && (
              <div className="dropdown-menu" style={{ minWidth: "140px", padding: "0.5rem" }}>
                {["ku", "ar", "en"].map((code) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setLangMenuOpen(false); }}
                    className="dropdown-link"
                    style={{
                      background: lang === code ? "var(--background)" : "none",
                      border: "none", width: "100%", textAlign: "center",
                      fontWeight: lang === code ? "bold" : "normal",
                    }}
                  >
                    {LANG_LABELS[code]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {memberCount !== null && (
            <span style={{
              display: "flex", alignItems: "center", gap: "0.3rem",
              fontSize: "0.8rem", color: "#8a7a5c", background: "var(--background)",
              padding: "0.25rem 0.6rem", borderRadius: "20px", whiteSpace: "nowrap",
            }}>
              👥 {memberCount} {t.members}
            </span>
          )}

          <div ref={menuRef} style={{ position: "relative" }}>
            <button className="menu-icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div className="profile-circle" style={{ width: "36px", height: "36px", fontSize: "1rem", margin: 0 }}>
                  {user ? user.email[0].toUpperCase() : "👤"}
                </div>
              )}
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                <div className="profile-circle">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : user ? (
                    user.email[0].toUpperCase()
                  ) : "?"}
                </div>
                {user ? (
                  <>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem", wordBreak: "break-all" }}>{user.email}</p>
                    <a href="/favorites" className="dropdown-link">❤️ {t.myFavorites}</a>
                    <a href="/profile" className="dropdown-link">👤 {t.myProfile}</a>
                    {profile?.is_admin && (
                      <a href="/admin" className="dropdown-link">🛠 {t.adminPanelLink}</a>
                    )}
                    <button
                      className="dropdown-link"
                      style={{ background: "none", border: "none", width: "100%" }}
                      onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }}
                    >
                      {t.logout}
                    </button>
                  </>
                ) : (
                  <button
                    className="dropdown-link"
                    style={{ background: "none", border: "none", width: "100%" }}
                    onClick={() => { setAuthOpen(true); setMenuOpen(false); }}
                  >
                    {t.login}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="hero">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="controls-row">
        <input
          className="search-input"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="filter-btn" onClick={() => setDrawerOpen(true)}>
          ⚙ {t.filters} {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
        </button>
      </div>

      {loading && <p style={{ textAlign: "center" }}>...</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ textAlign: "center" }}>{t.noResults}</p>
      )}

      <div className="perfume-grid">
        {filtered.map((p) => (
          <Link key={p.id} href={`/perfume/${p.id}`} className="perfume-card" style={{ display: "block" }}>
            <div className="perfume-img" style={{ position: "relative" }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : "No Image"}
              {p.year && (
                <span style={{
                  position: "absolute", bottom: "8px", right: "8px",
                  background: "rgba(0,0,0,0.7)", color: "white",
                  fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "6px",
                }}>
                  {p.year}
                </span>
              )}
            </div>
            <div className="perfume-info">
              <h3>{p.name}</h3>
              <p className="brand">{p.brand}</p>
              <span className="gender-tag">{t[p.gender] || p.gender}</span>
            </div>
          </Link>
        ))}
      </div>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="close-drawer" onClick={() => setDrawerOpen(false)}>×</button>
            <h2>{t.filters}</h2>

            <div className="filter-group">
              <h4>{t.gender}</h4>
              <div className="chip-row">
                {["all", "men", "women", "unisex"].map((g) => (
                  <button key={g} className={`chip ${gender === g ? "active" : ""}`} onClick={() => setGender(g)}>
                    {t[g]}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>{t.brand}</h4>
              <div className="chip-row">
                <button className={`chip ${brand === "all" ? "active" : ""}`} onClick={() => setBrand("all")}>{t.all}</button>
                {brands.map((b) => (
                  <button key={b} className={`chip ${brand === b ? "active" : ""}`} onClick={() => setBrand(b)}>{b}</button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>{t.longevity}</h4>
              <div className="chip-row">
                {["all", "Weak", "Moderate", "Long-lasting", "Very Long-lasting"].map((l) => (
                  <button key={l} className={`chip ${longevity === l ? "active" : ""}`} onClick={() => setLongevity(l)}>
                    {l === "all" ? t.all : t.longevityLevels[l]}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>{t.notes}</h4>
              {NOTES_LIST.map((n) => (
                <label key={n} className="checkbox-row">
                  <input type="checkbox" checked={notes.includes(n)} onChange={() => toggleNote(n)} />
                  {t.notesList[n]}
                </label>
              ))}
            </div>

            <div className="drawer-actions">
              <button className="btn-secondary" onClick={clearFilters}>{t.clear}</button>
              <button className="btn-primary" onClick={() => setDrawerOpen(false)}>{t.apply}</button>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: t.dir === "rtl" ? "auto" : "1.5rem",
            left: t.dir === "rtl" ? "1.5rem" : "auto",
            background: "var(--black)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            fontSize: "1.3rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 100,
          }}
        >
          ↑
        </button>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} t={t} />}
    </div>
  );
}