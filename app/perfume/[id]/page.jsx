"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { translations } from "../../lib/translations";

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

  return (
    <div dir={t.dir} style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>

      <div style={{
        width: "100%",
        aspectRatio: "1",
        maxWidth: "320px",
        margin: "0 auto 1.5rem auto",
        borderRadius: "16px",
        overflow: "hidden",
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
          display: "block",
          margin: "0 auto 0.8rem auto",
          background: isFavorite ? "var(--gold)" : "white",
          color: isFavorite ? "white" : "var(--black)",
          border: "1px solid var(--border)",
          borderRadius: "30px",
          padding: "0.7rem 1.5rem",
          fontSize: "0.95rem",
        }}
      >
        {isFavorite ? `★ ${t.addedFavorite}` : `☆ ${t.addFavorite}`}
      </button>

      {showLoginWarning && (
        <p style={{
          textAlign: "center",
          color: "#b8860b",
          background: "#fff8e6",
          border: "1px solid #f0d98c",
          borderRadius: "10px",
          padding: "0.6rem 1rem",
          margin: "0 auto 1.2rem auto",
          maxWidth: "320px",
          fontSize: "0.9rem",
        }}>
          ⚠️ {t.loginFirst}
        </p>
      )}

      <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
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
          <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase" }}>{t.season}</h4>
          <p>{t.seasons[perfume.season] || perfume.season}</p>
        </div>
        <div>
          <h4 style={{ color: "#8a7a5c", fontSize: "0.85rem", textTransform: "uppercase" }}>{t.longevity}</h4>
          <p>{t.longevityLevels[perfume.longevity] || perfume.longevity}</p>
        </div>
      </div>

      {profile?.is_admin && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              borderRadius: "20px",
              padding: "0.5rem 1.2rem",
              fontSize: "0.85rem",
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
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "#25D366",
            color: "white",
            padding: "0.9rem 1.6rem",
            borderRadius: "30px",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          📱 {t.orderButton}
        </a>
      </div>
    </div>
  );
}