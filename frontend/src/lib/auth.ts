export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthStorage {
  token?: string;
  user?: AuthUser;
}

const STORAGE_KEY = "timecapsule_auth";

export function saveAuth(data: AuthStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save auth to localStorage", e);
  }
}

export function getAuth(): AuthStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthStorage) : null;
  } catch (e) {
    console.warn("Failed to read auth from localStorage", e);
    return null;
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear auth from localStorage", e);
  }
}

export function getToken(): string | undefined {
  return getAuth()?.token;
}

export function getUser(): AuthUser | undefined {
  return getAuth()?.user;
}