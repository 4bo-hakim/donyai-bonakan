"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { translations } from "../lib/translations";

export default function FavoritesPage() {
  const [lang, setLang] = useState("ku");
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("siteLang");
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setCheckedAuth(true);
    }
    checkUser();
  }, []);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("favorites")
        .select("perfume_id, perfumes(*)")
        .eq("user_id", user.id);
      if (!error) setFavorites(data.map((row) => row.perfumes).filter(Boolean));
      setLoading(false);
    }
    if (checkedAuth) fetchFavorites();
  }, [user, checkedAuth]);

  if (!checkedAuth || loading) return <p style={{ textAlign: "center", padding: "3rem" }}>{t.loadingText}</p>;

  if (!user) {
    return (
      <div dir={t.dir} style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <p>⚠️ {t.loginFirst}</p>
        <a href="/" style={{ color: "var(--gold)" }}>← {t.back}</a>
      </div>
    );
  }

  return (
    <div dir={t.dir} style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>
      <h1 style={{ marginBottom: "1.5rem" }}>❤️ {t.myFavorites}</h1>

      {favorites.length === 0 ? (
        <p>{t.noResults}</p>
      ) : (
        <div className="perfume-grid">
          {favorites.map((p) => (
            <Link key={p.id} href={`/perfume/${p.id}`} className="perfume-card" style={{ display: "block" }}>
              <div className="perfume-img">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "No Image"}
              </div>
              <div className="perfume-info">
                <h3>{p.name}</h3>
                <p className="brand">{p.brand}</p>
                <span className="gender-tag">{t[p.gender] || p.gender}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}