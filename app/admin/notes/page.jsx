"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { translations } from "../../lib/translations";

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

export default function NoteImagesAdmin() {
  const [lang, setLang] = useState("ku");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [noteImages, setNoteImages] = useState({});
  const [uploadingKey, setUploadingKey] = useState(null);
  const [customNotes, setCustomNotes] = useState([]);

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

  async function fetchNoteImages() {
    const { data } = await supabase.from("note_images").select("*");
    if (data) {
      const map = {};
      data.forEach((row) => { map[row.note_key] = row.image_url; });
      setNoteImages(map);
    }
  }

  useEffect(() => {
    fetchNoteImages();
  }, []);

  useEffect(() => {
    async function fetchCustomNotes() {
      const { data } = await supabase.from("custom_notes").select("*");
      if (data) setCustomNotes(data);
    }
    fetchCustomNotes();
  }, []);

  const customNotesMap = useMemo(() => {
    const map = {};
    customNotes.forEach((c) => { map[c.note_key] = { en: c.name_en, ku: c.name_ku, ar: c.name_ar }; });
    return map;
  }, [customNotes]);

  function getNoteLabel(key) {
    if (customNotesMap[key]) return customNotesMap[key][lang];
    return t.notesList[key] || key;
  }

  const allNoteKeys = useMemo(
    () => [...NOTES_LIST, ...customNotes.map((c) => c.note_key)],
    [customNotes]
  );

  const sortedNotes = useMemo(() => {
    return [...allNoteKeys].sort((a, b) => getNoteLabel(a).localeCompare(getNoteLabel(b)));
  }, [lang, allNoteKeys]);

  async function handleUpload(noteKey, file) {
    if (!file) return;
    setUploadingKey(noteKey);

    const fileExt = file.name.split(".").pop();
    const safeName = noteKey.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("note-images")
      .upload(fileName, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("note-images").getPublicUrl(fileName);
      await supabase.from("note_images").upsert({ note_key: noteKey, image_url: urlData.publicUrl });
      setNoteImages((prev) => ({ ...prev, [noteKey]: urlData.publicUrl }));
    }
    setUploadingKey(null);
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
    <div dir={t.dir} style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/admin" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>
      <h1 style={{ marginBottom: "0.3rem" }}>🖼️ {t.noteImagesTitle}</h1>
      <a href="/admin/notes/add" style={{ display: "inline-block", marginBottom: "1rem", color: "var(--gold)", fontWeight: "bold" }}>
        ➕ Add Custom Note →
      </a>
      <p style={{ color: "#8a7a5c", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        {t.noteImagesDesc}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "1rem",
      }}>
        {sortedNotes.map((n) => (
          <label key={n} style={{ textAlign: "center", cursor: "pointer" }}>
            <div style={{
              width: "100%", aspectRatio: "1", borderRadius: "10px",
              overflow: "hidden", background: "#f0e6d2",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", position: "relative",
            }}>
              {noteImages[n] ? (
                <img src={noteImages[n]} alt={n} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "1.5rem", opacity: 0.4 }}>+</span>
              )}
              {uploadingKey === n && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem",
                }}>
                  ...
                </div>
              )}
            </div>
            <p style={{ fontSize: "0.75rem", marginTop: "0.3rem" }}>{getNoteLabel(n)}</p>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleUpload(n, e.target.files[0])}
            />
          </label>
        ))}
      </div>
    </div>
  );
}