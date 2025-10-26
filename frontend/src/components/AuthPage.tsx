import { useState } from "react";
import { motion } from "motion/react";
import { User, Lock, Mail, Rocket, CheckCircle } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.tsx";
import { saveAuth } from "../lib/auth.ts";

interface AuthPageProps {
  onAuthenticated: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* ignore parse errors */
  }

  if (!res.ok) throw new Error(body?.error || "Request failed");
  return body;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  // login/register fields & error
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pilotName, setPilotName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const body = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // backend may return user and optionally token
      // store whatever is returned (token + user) to localStorage for page-to-page usage
      const token = body?.token; // if backend returns token in body
      const user = body?.user || {
        id: body?.id || body?._id,
        email: body?.email,
        name: body?.name,
        avatarUrl: body?.avatarUrl,
      };

      if (token || user) {
        saveAuth({ token, user });
      }

      setAccessGranted(true);
      setTimeout(() => {
        onAuthenticated();
      }, 300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const body = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name: pilotName }),
      });

      const token = body?.token;
      const user = body?.user || {
        id: body?.id || body?._id,
        email: body?.email,
        name: body?.name,
        avatarUrl: body?.avatarUrl,
      };

      if (token || user) {
        saveAuth({ token, user });
      }

      setAccessGranted(true);
      setTimeout(() => {
        onAuthenticated();
      }, 300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (accessGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <CheckCircle className="w-32 h-32 text-green-400 mx-auto mb-4 neon-cyan" />
          </motion.div>
          <h2 className="text-4xl text-green-400 mb-2">ACCESS GRANTED</h2>
          <p className="text-cyan-300">Initializing hyperdrive systems...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Console header */}
        <div className="glass p-6 rounded-t-xl border-b border-cyan-400/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse-glow" />
              <div
                className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse-glow"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="w-3 h-3 rounded-full bg-green-400 animate-pulse-glow"
                style={{ animationDelay: "0.6s" }}
              />
            </div>
            <p className="text-cyan-400 text-sm font-mono">SYS.AUTH.v2.4</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 glass rounded-lg neon-cyan">
              <Rocket className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl text-cyan-400">SPACESHIP CONSOLE</h2>
              <p className="text-sm text-cyan-300/70">
                Authentication Required
              </p>
            </div>
          </div>
        </div>

        {/* Main form */}
        <div className="glass p-6 rounded-b-xl neon-blue">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass mb-6">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-cyan-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="pilot@timecapsule.space"
                      className="pl-10 glass border-cyan-400/30 text-cyan-100 placeholder:text-cyan-400/30"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-cyan-300">
                    Access Code
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 glass border-cyan-400/30 text-cyan-100 placeholder:text-cyan-400/30"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg neon-cyan border-0 mt-6"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Initiate Launch Sequence
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleRegister} className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="pilot-name" className="text-purple-300">
                    Pilot Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                    <Input
                      id="pilot-name"
                      type="text"
                      placeholder="Captain Timeline"
                      className="pl-10 glass border-purple-400/30 text-purple-100 placeholder:text-purple-400/30"
                      required
                      value={pilotName}
                      onChange={(e) => setPilotName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-purple-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="pilot@timecapsule.space"
                      className="pl-10 glass border-purple-400/30 text-purple-100 placeholder:text-purple-400/30"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-purple-300">
                    Access Code
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 glass border-purple-400/30 text-purple-100 placeholder:text-purple-400/30"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg neon-purple border-0 mt-6"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Join the Fleet
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Console footer */}
          <div className="mt-6 pt-4 border-t border-cyan-400/20">
            <p className="text-center text-cyan-400/50 text-xs font-mono">
              SECURE CONNECTION ESTABLISHED • AES-256 ENCRYPTION
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
