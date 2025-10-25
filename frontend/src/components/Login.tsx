import React, { useState } from "react";

type User = { id: string; email: string; name?: string; avatarUrl?: string };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch {
      throw new Error("Request failed");
    }
    throw new Error(body?.error || "Request failed");
  }
  return res.json();
}

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const u = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });
      onLogin(u);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const u = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(u);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleGoogle() {
    window.location.href = `${API_BASE}/api/auth/google`;
  }

  return (
    <main className="auth-card">
      <div className="stack">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h1 className="headline">Sign in to the Galaxy</h1>
          <p className="copy">Authenticate with email or warp in using Google.</p>
        </div>

        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleLogin}>
          <label className="field">
            <span>Email</span>
            <input placeholder="astro@ship.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="field">
            <span>Call sign (optional)</span>
            <input placeholder="Nova" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="actions">
            <button className="primary" type="submit">
              Login
            </button>
            <button className="ghost" type="button" onClick={handleRegister}>
              Register
            </button>
          </div>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="secondary" type="button" onClick={handleGoogle}>
          Continue with Google
        </button>
      </div>
    </main>
  );
}