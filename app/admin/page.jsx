"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { translations } from "../lib/translations";

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

export default function AdminPage() {
  const [lang, setLang] = useState("ku");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState("unisex");
  const [longevity, setLongevity] = useState("Moderate");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingBrands, setExistingBrands] = useState([]);
  const [noteImages, setNoteImages] = useState({});

  const [topSearch, setTopSearch] = useState("");
  const [middleSearch, setMiddleSearch] = useState("");
  const [baseSearch, setBaseSearch] = useState("");

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const [year, setYear] = useState(currentYear);

  const [topNotes, setTopNotes] = useState([]);
  const [middleNotes, setMiddleNotes] = useState([]);
  const [baseNotes, setBaseNotes] = useState([]);

  const [saving, setSaving] = useState(false);

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
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(data);
      }
      setCheckedAuth(true);
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    async function fetchBrands() {
      const { data } = await supabase.from("perfumes").select("brand");
      if (data) {
        const unique = [...new Set(data.map((p) => p.brand?.trim()).filter(Boolean))];
        setExistingBrands(unique);
      }
    }
    fetchBrands();
  }, []);

  useEffect(() => {
    async function fetchNoteImages() {
      const { data } = await supabase.from("note_images").select("*");
      if (data) {
        const map = {};
        data.forEach((row) => { map[row.note_key] = row.image_url; });
        setNoteImages(map);
      }
    }
    fetchNoteImages();
  }, []);

  const sortedNotes = useMemo(() => {
    return [...NOTES_LIST].sort((a, b) =>
      t.notesList[a].localeCompare(t.notesList[b])
    );
  }, [lang]);

  function toggleNote(list, setList, note) {
    setList((prev) => prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    let image_url = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("perfume-images")
        .upload(fileName, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("perfume-images").getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
    }

    await supabase.from("perfumes").insert({
      name,
      brand,
      gender,
      image_url,
      top_notes: topNotes.join(", "),
      middle_notes: middleNotes.join(", "),
      base_notes: baseNotes.join(", "),
      season: "",
      longevity,
      year,
    });

    window.location.href = "/";
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
    <div dir={t.dir} style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--black)", fontWeight: "bold" }}>← {t.back}</a>
      <a href="/admin/notes" style={{ display: "block", marginBottom: "1rem", color: "var(--gold)", fontWeight: "bold" }}>
        🖼️ {t.manageNoteImages} →
      </a>
      <h1 style={{ marginBottom: "1.5rem" }}>{t.adminPanel} — {t.addPerfume}</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.uploadImage}</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img src={imagePreview} alt="preview" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "10px", marginTop: "0.5rem" }} />
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.perfumeName}</label>
          <input className="search-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.brand}</label>
          <input
            className="search-input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
            list="brand-suggestions"
          />
          <datalist id="brand-suggestions">
            {existingBrands.map((b) => <option key={b} value={b} />)}
          </datalist>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.gender}</label>
          <select className="search-input" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="men">{t.men}</option>
            <option value="women">{t.women}</option>
            <option value="unisex">{t.unisex}</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.year}</label>
          <select className="search-input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold" }}>{t.longevity}</label>
          <select className="search-input" value={longevity} onChange={(e) => setLongevity(e.target.value)}>
            {["Weak", "Moderate", "Long-lasting", "Very Long-lasting"].map((l) => (
              <option key={l} value={l}>{t.longevityLevels[l]}</option>
            ))}
          </select>
        </div>

        <div>
          <h4 style={{ marginBottom: "0.5rem" }}>{t.topNotesSection}</h4>
          <input
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={topSearch}
            onChange={(e) => setTopSearch(e.target.value)}
            style={{ marginBottom: "0.6rem" }}
          />
          <div className="chip-row">
            {sortedNotes
              .filter((n) => t.notesList[n].toLowerCase().includes(topSearch.toLowerCase()))
              .map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`chip ${topNotes.includes(n) ? "active" : ""}`}
                  onClick={() => toggleNote(topNotes, setTopNotes, n)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {noteImages[n] && (
                    <img src={noteImages[n]} alt={n} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  {t.notesList[n]}
                </button>
              ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: "0.5rem" }}>{t.middleNotesSection}</h4>
          <input
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={middleSearch}
            onChange={(e) => setMiddleSearch(e.target.value)}
            style={{ marginBottom: "0.6rem" }}
          />
          <div className="chip-row">
            {sortedNotes
              .filter((n) => t.notesList[n].toLowerCase().includes(middleSearch.toLowerCase()))
              .map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`chip ${middleNotes.includes(n) ? "active" : ""}`}
                  onClick={() => toggleNote(middleNotes, setMiddleNotes, n)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {noteImages[n] && (
                    <img src={noteImages[n]} alt={n} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  {t.notesList[n]}
                </button>
              ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: "0.5rem" }}>{t.baseNotesSection}</h4>
          <input
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={baseSearch}
            onChange={(e) => setBaseSearch(e.target.value)}
            style={{ marginBottom: "0.6rem" }}
          />
          <div className="chip-row">
            {sortedNotes
              .filter((n) => t.notesList[n].toLowerCase().includes(baseSearch.toLowerCase()))
              .map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`chip ${baseNotes.includes(n) ? "active" : ""}`}
                  onClick={() => toggleNote(baseNotes, setBaseNotes, n)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {noteImages[n] && (
                    <img src={noteImages[n]} alt={n} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  {t.notesList[n]}
                </button>
              ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
      </form>
    </div>
  );
}