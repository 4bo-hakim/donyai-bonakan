"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { translations } from "../../lib/translations";

const SEASON_ICONS = { Summer: "☀️", Winter: "❄️", Spring: "🌸", Fall: "🍂" };
const SEASON_COLORS = { Summer: "#f87171", Winter: "#38bdf8", Spring: "#4ade80", Fall: "#fb923c" };
const SEASON_LIST = ["Winter", "Spring", "Summer", "Fall"];

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
];

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

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editGender, setEditGender] = useState("unisex");
  const [editLongevity, setEditLongevity] = useState("Moderate");
  const [editTopNotes, setEditTopNotes] = useState([]);
  const [editMiddleNotes, setEditMiddleNotes] = useState([]);
  const [editBaseNotes, setEditBaseNotes] = useState([]);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const t = translations[lang];

  const sortedNotes = useMemo(() => {
    return [...NOTES_LIST].sort((a, b) => t.notesList[a].localeCompare(t.notesList[b]));
  }, [lang]);

  useEffect(() => {
    const saved = localStorage.getItem("siteLang");
    if (saved) setLang(saved);
  }, []);

  async function fetchPerfume() {
    const { data, error } = await supabase.from("perfumes").select("*").eq("id", id).single();
    if (!error) setPerfume(data);
    setLoading(false);
  }

  useEffect(() => {
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

  function startEditing() {
    setEditName(perfume.name || "");
    setEditBrand(perfume.brand || "");
    setEditGender(perfume.gender || "unisex");
    setEditLongevity(perfume.longevity || "Moderate");
    setEditTopNotes(perfume.top_notes ? perfume.top_notes.split(",").map((s) => s.trim()).filter(Boolean) : []);
    setEditMiddleNotes(perfume.middle_notes ? perfume.middle_notes.split(",").map((s) => s.trim()).filter(Boolean) : []);
    setEditBaseNotes(perfume.base_notes ? perfume.base_notes.split(",").map((s) => s.trim()).filter(Boolean) : []);
    setEditImagePreview(perfume.image_url);
    setEditImageFile(null);
    setEditing(true);
  }

  function toggleEditNote(list, setList, note) {
    setList((prev) => prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]);
  }

  function handleEditImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSaveEdit() {
    setSavingEdit(true);

    let image_url = perfume.image_url;

    if (editImageFile) {
      const fileExt = editImageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("perfume-images")
        .upload(fileName, editImageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("perfume-images").getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
    }

    await supabase.from("perfumes").update({
      name: editName,
      brand: editBrand,
      gender: editGender,
      longevity: editLongevity,
      top_notes: editTopNotes.join(", "),
      middle_notes: editMiddleNotes.join(", "),
      base_notes: editBaseNotes.join(", "),
      image_url,
    }).eq("id", id);

    setSavingEdit(false);
    setEditing(false);
    fetchPerfume();
  }

  if (loading) return <p style={{ textAlign: "center", padding: "3rem" }}>{t.loadingText}</p>;
  if (!perfume) return <p style={{ textAlign: "center", padding: "3rem" }}>{t.notFound}</p>;

  const whatsappLink = "https://wa.me/qr/25WLADJ7BJBLC1";
  const maxCount = Math.max(...Object.values(seasonCounts), 1);

  return (
    <div dir={t.dir} style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>

      {!editing ? (
        <>
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
                      flex: 1, background: "none",
                      border: isPicked ? `2px solid ${SEASON_COLORS[s]}` : "1px solid var(--border)",
                      borderRadius: "12px", padding: "0.8rem 0.4rem",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
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
            <div style={{ textAlign: "center", marginBottom: "1.5rem", display: "flex", gap: "0.8rem", justifyContent: "center" }}>
              <button
                onClick={startEditing}
                style={{
                  background: "#e6f0ff", color: "#1d4ed8", border: "1px solid #93c5fd",
                  borderRadius: "20px", padding: "0.5rem 1.2rem", fontSize: "0.85rem",
                }}
              >
                ✏️ Edit
              </button>
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
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", paddingBottom: "3rem" }}>
          <h2>✏️ Editing Perfume</h2>

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.uploadImage}</label>
            <input type="file" accept="image/*" onChange={handleEditImageChange} />
            {editImagePreview && (
              <img src={editImagePreview} alt="preview" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "10px", marginTop: "0.5rem" }} />
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.perfumeName}</label>
            <input className="search-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.brand}</label>
            <input className="search-input" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.gender}</label>
            <select className="search-input" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
              <option value="men">{t.men}</option>
              <option value="women">{t.women}</option>
              <option value="unisex">{t.unisex}</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.longevity}</label>
            <select className="search-input" value={editLongevity} onChange={(e) => setEditLongevity(e.target.value)}>
              {["Weak", "Moderate", "Long-lasting", "Very Long-lasting"].map((l) => (
                <option key={l} value={l}>{t.longevityLevels[l]}</option>
              ))}
            </select>
          </div>

          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>{t.topNotesSection}</h4>
            <div className="chip-row">
              {sortedNotes.map((n) => (
                <button type="button" key={n} className={`chip ${editTopNotes.includes(n) ? "active" : ""}`} onClick={() => toggleEditNote(editTopNotes, setEditTopNotes, n)}>
                  {t.notesList[n]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>{t.middleNotesSection}</h4>
            <div className="chip-row">
              {sortedNotes.map((n) => (
                <button type="button" key={n} className={`chip ${editMiddleNotes.includes(n) ? "active" : ""}`} onClick={() => toggleEditNote(editMiddleNotes, setEditMiddleNotes, n)}>
                  {t.notesList[n]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>{t.baseNotesSection}</h4>
            <div className="chip-row">
              {sortedNotes.map((n) => (
                <button type="button" key={n} className={`chip ${editBaseNotes.includes(n) ? "active" : ""}`} onClick={() => toggleEditNote(editBaseNotes, setEditBaseNotes, n)}>
                  {t.notesList[n]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button onClick={() => setEditing(false)} className="btn-secondary" disabled={savingEdit}>
              {t.clear}
            </button>
            <button onClick={handleSaveEdit} className="btn-primary" disabled={savingEdit}>
              {savingEdit ? t.saving : t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}