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

  const [customNotesList, setCustomNotesList] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editEn, setEditEn] = useState("");
  const [editKu, setEditKu] = useState("");
  const [editAr, setEditAr] = useState("");

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

  async function fetchCustomNotesList() {
    const { data } = await supabase.from("custom_notes").select("*").order("name_en");
    if (data) setCustomNotesList(data);
  }

  useEffect(() => {
    fetchCustomNotesList();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!nameEn.trim() || !nameKu.trim() || !nameAr.trim()) {
      setError("Please fill in all three languages.");
      return;
    }

    const noteKey = nameEn.trim();

    const builtInMatch = Object.keys(translations.en.notesList).find(
      (k) => k.toLowerCase() === noteKey.toLowerCase()
    );
    if (builtInMatch) {
      setError("This note already exists in the built-in list.");
      return;
    }

    const { data: existing } = await supabase
      .from("custom_notes")
      .select("note_key")
      .ilike("note_key", noteKey);

    if (existing && existing.length > 0) {
      setError("This note already exists.");
      return;
    }

    setSaving(true);

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
    fetchCustomNotesList();
    setTimeout(() => setSavedMsg(false), 3000);
  }

  function startEdit(note) {
    setEditingKey(note.note_key);
    setEditEn(note.name_en);
    setEditKu(note.name_ku);
    setEditAr(note.name_ar);
  }

  async function handleUpdate(noteKey) {
    await supabase.from("custom_notes").update({
      name_en: editEn.trim(),
      name_ku: editKu.trim(),
      name_ar: editAr.trim(),
    }).eq("note_key", noteKey);
    setEditingKey(null);
    fetchCustomNotesList();
  }

  async function handleDeleteNote(noteKey) {
    const confirmed = window.confirm("Delete this custom note? Perfumes using it will keep the plain text.");
    if (!confirmed) return;
    await supabase.from("custom_notes").delete().eq("note_key", noteKey);
    fetchCustomNotesList();
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

      <div style={{ marginTop: "2.5rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Existing Custom Notes</h2>
        {customNotesList.length === 0 && <p style={{ color: "#8a7a5c" }}>No custom notes yet.</p>}
        {customNotesList.map((note) => (
          <div key={note.note_key} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "0.8rem" }}>
            {editingKey === note.note_key ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <input className="search-input" value={editEn} onChange={(e) => setEditEn(e.target.value)} placeholder="English" />
                <input className="search-input" value={editKu} onChange={(e) => setEditKu(e.target.value)} dir="rtl" placeholder="کوردی" />
                <input className="search-input" value={editAr} onChange={(e) => setEditAr(e.target.value)} dir="rtl" placeholder="عربي" />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleUpdate(note.note_key)} className="btn-primary">{t.save}</button>
                  <button onClick={() => setEditingKey(null)} className="btn-secondary">{t.clear}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{note.name_en}</strong> — {note.name_ku} — {note.name_ar}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => startEdit(note)} style={{ background: "#e6f0ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "8px", padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>✏️</button>
                  <button onClick={() => handleDeleteNote(note.note_key)} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}