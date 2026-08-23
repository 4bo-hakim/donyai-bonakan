"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { translations } from "../../lib/translations";

const SEASON_ICONS = { Summer: "☀️", Winter: "❄️", Spring: "🌸", Fall: "🍂" };
const SEASON_COLORS = { Summer: "#f87171", Winter: "#38bdf8", Spring: "#4ade80", Fall: "#fb923c" };
const SEASON_LIST = ["Winter", "Spring", "Summer", "Fall"];

export default function PerfumeDetail() {
  const { id } = useParams();
  const [perfume, setPerfume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lang, setLang] = useState("ku");
  const [myPicks, setMyPicks] = useState([]);
  const [seasonCounts, setSeasonCounts] = useState({ Summer: 0, Winter: 0, Spring: 0, Fall: 0 });

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("siteLang");
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    async function fetchPerfume() {
      const { data, error } = await supabase.from("perfumes").select("*").eq("id", id).single();
      if (!error) setPerfume(data);
      setLoading(false);
    }
    fetchPerfume();
  }, [id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
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

  useEffect(() => {
    async function checkFavorite() {
      if (!user || !id) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("perfume_id", id)
        .maybeSingle();
      setIsFavorite(!!data);
    }
    checkFavorite();
  }, [user, id]);

  async function fetchSeasonData() {
    if (!id) return;
    const { data: allVotes } = await supabase
      .from("season_preferences")
      .select("season")
      .eq("perfume_id", id);

    const counts = { Summer: 0, Winter: 0, Spring: 0, Fall: 0 };
    (allVotes || []).forEach((v) => {
      if (counts[v.season] !== undefined) counts[v.season]++;
    });
    setSeasonCounts(counts);

    if (user) {
      const { data: mine } = await supabase
        .from("season_preferences")
        .select("season")
        .eq("perfume_id", id)
        .eq("user_id", user.id);
      setMyPicks((mine || []).map((r) => r.season));
    }
  }

  useEffect(() => {
    fetchSeasonData();
  }, [user, id]);

  async function toggleFavorite() {
    if (!user) {
      setShowLoginWarning(true);
      setTimeout(() => setShowLoginWarning(false), 3000);
      return;
    }
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("perfume_id", id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, perfume_id: id });
      setIsFavorite(true);
    }
  }

  async function toggleSeasonPick(season) {
    if (!user) {
      setShowLoginWarning(true);
      setTimeout(() => setShowLoginWarning(false), 3000);
      return;
    }
    if (myPicks.includes(season)) {
      await supabase.from("season_preferences").delete()
        .eq("user_id", user.id).eq("perfume_id", id).eq("season", season);
    } else {
      await supabase.from("season_preferences").insert({ user_id: user.id, perfume_id: id, season });
    }
    fetchSeasonData();
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this perfume? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    await supabase.from("perfumes").delete().eq("id", id);
    window.location.href = "/";
  }

  if (loading) return <p style={{ textAlign: "center", padding: "3rem" }}>{t.loadingText}</p>;
  if (!perfume) return <p style={{ textAlign: "center", padding: "3rem" }}>{t.notFound}</p>;

  const whatsappLink = "https://wa.me/qr/25WLADJ7BJBLC1";
  const maxCount = Math.max(...Object.values(seasonCounts), 1);

  return (
    <div dir={t.dir} style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>

      <div style={{
        width: "100%", aspectRatio: "1", maxWidth: "320px", margin: "0 auto 1.5rem auto",
        borderRadius: "16px", overflow: "hidden",
        background: "linear-gradient(135deg, #f0e6d2, #d9c9a3)",
      }}>
        {perfume.image_url && (
          <img src={perfume.image_url} alt={perfume.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", color: "var(--black)" }}>{perfume.name}</h1>
        <p style={{ color: "#8a7a5c" }}>{perfume.brand}</p>
        <span className="gender-tag" style={{ marginTop: "0.5rem", display: "inline-block" }}>{t[perfume.gender] || perfume.gender}</span>
      </div>

      <button
        onClick={toggleFavorite}
        style={{
          display: "block", margin: "0 auto 0.8rem auto",
          background: isFavorite ? "var(--gold)" : "white",
          color: isFavorite ? "white" : "var(--black)",
          border: "1px solid var(--border)", borderRadius: "30px",
          padding: "0.7rem 1.5rem", fontSize: "0.95rem",
        }}
      >
        {isFavorite ? `★ ${t.addedFavorite}` : `☆ ${t.addFavorite}`}
      </button>

      {showLoginWarning && (
        <p style={{
          textAlign: "center", color: "#b8860b", background: "#fff8e6",
          border: "1px solid #f0d98c", borderRadius: "10px", padding: "0.6rem 1rem",
          margin: "0 auto 1.2rem auto", maxWidth: "320px", fontSize: "0.9rem",
        }}>
          ⚠️ {t.loginFirst}
        </p>
      )}

      <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase" }}>{t.topNotes}</h4>
          <p>{perfume.top_notes?.split(",").map((n) => t.notesList[n.trim()] || n.trim()).join(", ")}</p>
        </div>
        <div>
          <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase" }}>{t.middleNotes}</h4>
          <p>{perfume.middle_notes?.split(",").map((n) => t.notesList[n.trim()] || n.trim()).join(", ")}</p>
        </div>
        <div>
          <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase" }}>{t.baseNotes}</h4>
          <p>{perfume.base_notes?.split(",").map((n) => t.notesList[n.trim()] || n.trim()).join(", ")}</p>
        </div>
        <div>
          <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase" }}>{t.longevity}</h4>
          <p>{t.longevityLevels[perfume.longevity] || perfume.longevity}</p>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "1rem" }}>{t.seasonPreference}</h4>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
          {SEASON_LIST.map((s) => {
            const isPicked = myPicks.includes(s);
            const barWidth = (seasonCounts[s] / maxCount) * 100;
            return (
              <button
                key={s}
                onClick={() => toggleSeasonPick(s)}
                style={{
                  flex: 1,
                  background: "none",
                  border: isPicked ? `2px solid ${SEASON_COLORS[s]}` : "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "0.8rem 0.4rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>{SEASON_ICONS[s]}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--black)" }}>{t.seasons[s]}</span>
                <div style={{ width: "100%", height: "6px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${barWidth}%`, height: "100%", background: SEASON_COLORS[s] }} />
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: SEASON_COLORS[s] }}>{seasonCounts[s]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {profile?.is_admin && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5",
              borderRadius: "20px", padding: "0.5rem 1.2rem", fontSize: "0.85rem",
            }}
          >
            🗑 {deleting ? "Deleting..." : "Delete Perfume"}
          </button>
        </div>
      )}

      <div style={{ textAlign: "center", paddingBottom: "3rem" }}>
           <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.6rem",
            background: "#25D366", color: "white", padding: "0.9rem 1.6rem",
            borderRadius: "30px", fontSize: "1rem", fontWeight: "bold",
          }}
        >
          📱 {t.orderButton}
        </a>
      </div>
    </div>
  );
}