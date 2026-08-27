"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { translations } from "../lib/translations";

export default function ProfilePage() {
  const [lang, setLang] = useState("ku");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("siteLang");
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    async function checkUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
        setProfile(data);
        setImagePreview(data?.avatar_url || null);
      }
      setCheckedAuth(true);
    }
    checkUser();
  }, []);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSave() {
    if (!imageFile || !user) return;
    setSaving(true);

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, imageFile);

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    }

    setSaving(false);
  }

  if (!checkedAuth) return <p style={{ textAlign: "center", padding: "3rem" }}>...</p>;

  if (!user) {
    return (
      <div dir={t.dir} style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <p>⚠️ {t.loginFirst}</p>
        <a href="/" style={{ color: "var(--gold)" }}>← {t.back}</a>
      </div>
    );
  }

  return (
    <div dir={t.dir} style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem 1.5rem", textAlign: "center" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>
      <h1 style={{ marginBottom: "1.5rem" }}>👤 My Profile</h1>

      <div style={{
        width: "120px", height: "120px", borderRadius: "50%",
        overflow: "hidden", margin: "0 auto 1rem auto",
        background: "var(--gold)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        {imagePreview ? (
          <img src={imagePreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "2.5rem", color: "white" }}>{user.email[0].toUpperCase()}</span>
        )}
      </div>

      <p style={{ marginBottom: "1.5rem", color: "#8a7a5c" }}>{user.email}</p>

      <label style={{
        display: "inline-block", background: "white", border: "1px solid var(--border)",
        borderRadius: "20px", padding: "0.6rem 1.2rem", cursor: "pointer", marginBottom: "1rem",
      }}>
        📷 Choose Photo
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
      </label>

      <button onClick={handleSave} className="btn-primary" disabled={saving || !imageFile} style={{ display: "block", width: "100%" }}>
        {saving ? t.saving : t.save}
      </button>

      {savedMsg && <p style={{ color: "green", marginTop: "1rem" }}>✓ {t.photoSaved}</p>}
    </div>
  );
}