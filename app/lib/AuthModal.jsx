"use client";

import { useState } from "react";
import { supabase } from "./supabase";

export default function AuthModal({ onClose, t }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Account created! Check your email to confirm, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        setMessage("Logged in!");
        setTimeout(() => onClose(), 800);
      }
    }
    setLoading(false);
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          width: "90%",
          maxWidth: "380px",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>
          {mode === "login" ? "Login" : "Sign up"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="search-input"
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="search-input"
          />

          {error && <p style={{ color: "crimson", fontSize: "0.85rem" }}>{error}</p>}
          {message && <p style={{ color: "green", fontSize: "0.85rem" }}>{message}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Login" : "Sign up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer" }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer" }}>
                Login
              </button>
            </>
          )}
        </p>

        <button onClick={onClose} className="close-drawer" style={{ position: "absolute", top: "1rem", right: "1.5rem" }}>×</button>
      </div>
    </div>
  );
}