"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { translations } from "../../../lib/translations";

export default function AddCustomNote() {
  const [lang, setLang] = useState("ku");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const [nameEn, setNameEn] = useState("");
  const [nameKu, setNameKu] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState("");

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("siteLang");
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
        setProfile(data);
      }
      setCheckedAuth(true);
    }
    checkAdmin();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!nameEn.trim() || !nameKu.trim() || !nameAr.trim()) {
      setError("Please fill in all three languages.");
      return;
    }

    setSaving(true);
    const noteKey = nameEn.trim();

    const { error: insertError } = await supabase.from("custom_notes").insert({
      note_key: noteKey,
      name_en: nameEn.trim(),
      name_ku: nameKu.trim(),
      name_ar: nameAr.trim(),
    });

    if (insertError) {
      setError(insertError.message.includes("duplicate") ? "This note already exists." : insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSavedMsg(true);
    setNameEn(""); setNameKu(""); setNameAr("");
    setTimeout(() => setSavedMsg(false), 3000);
  }

  if (!checkedAuth) return <p style={{ textAlign: "center", padding: "3rem" }}>...</p>;

  if (!user || !profile?.is_admin) {
    return (
      <div dir={t.dir} style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <p>{t.notAdmin}</p>
        <a href="/" style={{ color: "var(--gold)" }}>← {t.back}</a>
      </div>
    );
  }

  return (
    <div dir={t.dir} style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/admin/notes" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>
      <h1 style={{ marginBottom: "1.5rem" }}>➕ Add Custom Note</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>English Name</label>
          <input className="search-input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Rhubarb" />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Kurdish Name (کوردی)</label>
          <input className="search-input" value={nameKu} onChange={(e) => setNameKu(e.target.value)} dir="rtl" />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>Arabic Name (عربي)</label>
          <input className="search-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
        </div>

        {error && <p style={{ color: "crimson", fontSize: "0.9rem" }}>{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>

        {savedMsg && <p style={{ color: "green" }}>✓ Note added! It now appears everywhere.</p>}
      </form>
    </div>
  );
}