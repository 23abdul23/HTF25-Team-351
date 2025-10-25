import React, { useEffect, useState } from "react";
import "./App.css";
import ShowFiles from "./components/ShowFiles";
import Login from "./components/Login";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

type User = { id: string; email: string; name?: string; avatarUrl?: string };

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}

export function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api("/auth/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  }

  // When logged in show ShowFiles page, otherwise render Login component
  if (!user) {
    return (
      <div className="app-shell">
        <div className="stars" aria-hidden="true" />
        <div className="aurora" aria-hidden="true" />
        <Login onLogin={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="stars" aria-hidden="true" />
      <div className="aurora" aria-hidden="true" />

      <header style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>Welcome,</strong> {user.name || user.email}
        </div>
        <div>
          <button onClick={handleLogout} className="ghost">
            Log out
          </button>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <ShowFiles />
      </main>
    </div>
  );
}
