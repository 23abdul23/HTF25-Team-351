import { motion } from 'motion/react';
import { Rocket, Clock, Lock, Unlock, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Button } from './ui/button';

interface HeroSectionProps {
  onNavigate: (page: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include',
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* ignore parse errors */
  }

  if (!res.ok) throw new Error(body?.error || 'Request failed');
  return body;
}

const logout = async () => {
  await api('/auth/logout', { method: 'POST' });
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const floatingCapsules = [
    { id: 1, locked: true, x: 15, y: 20, delay: 0 },
    { id: 2, locked: false, x: 70, y: 15, delay: 0.2 },
    { id: 3, locked: true, x: 45, y: 35, delay: 0.4 },
    { id: 4, locked: false, x: 25, y: 50, delay: 0.6 },
    { id: 5, locked: true, x: 80, y: 45, delay: 0.8 },
    { id: 6, locked: true, x: 55, y: 65, delay: 1.0 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Navigation hints */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-10 cursor-pointer"
        onClick={() => onNavigate('community')}
      >
        <div className="glass p-4 rounded-lg neon-cyan hover:scale-110 transition-transform">
          <ChevronLeft className="w-8 h-8 text-cyan-400" />
          <p className="text-cyan-400 mt-2 text-sm">Community<br />Wall</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-10 cursor-pointer"
        onClick={() => onNavigate('planets')}
      >
        <div className="glass p-4 rounded-lg neon-purple hover:scale-110 transition-transform">
          <ChevronRight className="w-8 h-8 text-purple-400" />
          <p className="text-purple-400 mt-2 text-sm">Solar<br />System</p>
        </div>
      </motion.div>

      {/* Floating capsules background */}
      {/* <div className="absolute inset-0 pointer-events-none"> 
        {floatingCapsules.map((capsule) => (
          <motion.div
            key={capsule.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: 1,
              y: [0, -30, 0]
            }}
            transition={{
              delay: capsule.delay,
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute"
            style={{ left: `${capsule.x}%`, top: `${capsule.y}%` }}
            // allow interactive capsule elements only (if you want them clickable)
            // otherwise they will remain non-interactive due to parent pointer-events-none
            // if you need a capsule clickable, add style={{ pointerEvents: 'auto' }} here
          >
            <div className={`glass p-6 rounded-xl ${capsule.locked ? 'neon-purple' : 'neon-cyan'} cursor-pointer hover:scale-110 transition-transform`}>
              {capsule.locked ? (
                <div className="flex flex-col items-center gap-2">
                  <Lock className="w-8 h-8 text-purple-400" />
                  <Clock className="w-6 h-6 text-purple-300 animate-pulse-glow" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Unlock className="w-8 h-8 text-cyan-400" />
                  <div className="w-16 h-16 glass rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div> */}

      {/* Main content */}
      {/* Top-right logout button */}
      <div className="absolute right-6 top-6 z-50 pointer-events-auto"> {/* ensure it's above background and receives clicks */}
        <Button
          onClick={async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout error', err);
            } finally {
              onNavigate('auth');
            }
          }}
          variant="ghost"
          className="glass neon-cyan px-4 py-2 flex items-center gap-2 border border-cyan-400/20 hover:scale-105 transition-transform pointer-events-auto"
        >
          <LogOut className="w-5 h-5 text-cyan-300" />
          <span className="text-sm text-white-200">Log out</span>
        </Button>
      </div>
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo/Icon */}
            <div className="flex justify-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full glass neon-blue flex items-center justify-center">
                  <Rocket className="w-16 h-16 text-blue-400" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl" />
              </motion.div>
            </div>

            <h1 className="text-6xl mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Preserve Your Memories Across Time
            </h1>
            
            <p className="text-xl text-cyan-300 mb-12 max-w-2xl mx-auto">
              Launch your memories into the cosmos — reopen them when the stars align.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => onNavigate('create')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 rounded-xl neon-cyan border-0"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Create Capsule
              </Button>
              
              <Button
                onClick={() => onNavigate('viewer')}
                variant="outline"
                className="glass border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 px-8 py-6 rounded-xl"
              >
                <Clock className="w-5 h-5 mr-2" />
                View Capsules
              </Button>
            </div>

            {/* Stats display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto"
            >
              <div className="glass p-4 rounded-lg neon-cyan">
                <p className="text-3xl text-cyan-400 mb-1">42</p>
                <p className="text-sm text-cyan-300/70">Active Capsules</p>
              </div>
              <div className="glass p-4 rounded-lg neon-purple">
                <p className="text-3xl text-purple-400 mb-1">127</p>
                <p className="text-sm text-purple-300/70">Community Pilots</p>
              </div>
              <div className="glass p-4 rounded-lg neon-blue">
                <p className="text-3xl text-blue-400 mb-1">∞</p>
                <p className="text-sm text-blue-300/70">Memories Saved</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
