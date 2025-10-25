import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Clock, Image, FileText, Film, Trash2, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

import axios from 'axios';


interface Capsule {
  id: number;
  name: string;
  unlockDate: Date;
  isLocked: boolean;
  files: Array<{ name: string; type: 'image' | 'video' | 'document' }>;
  memo: string;
}

interface CapsuleViewerProps {
  onBack: () => void;
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


export function CapsuleViewer({ onBack }: CapsuleViewerProps) {

  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  // const [capsules, setCapsules] = useState<Capsule[]>([
   
  
  useEffect(() => {

    const fetchData = async () => {
    const response = await api('/capsules',
      {method: 'GET'}
    );
    const data = await response.data;

    console.log("Fetched capsules data:", data);
    setCapsules(data);

    };

    fetchData();

  }, []);

  const handleDelete = (id: number) => {
    setCapsules(capsules.filter(c => c.id !== id));
    setSelectedCapsule(null);
  };

  const getTimeUntilUnlock = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Unlocked';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-5xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            My Time Capsules
          </h1>
          <p className="text-cyan-300/70">Your memories stored across time</p>
        </motion.div>

        {/* Capsules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capsules?.map((capsule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !capsule.isLocked && setSelectedCapsule(capsule)}
              className={`glass p-6 rounded-2xl cursor-pointer transition-all ${
                capsule.isLocked 
                  ? 'neon-purple hover:scale-105' 
                  : 'neon-cyan hover:scale-105'
              }`}
            >
              {/* Capsule Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`mb-2 ${capsule.isLocked ? 'text-purple-300' : 'text-cyan-300'}`}>
                    {capsule.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className={`w-4 h-4 ${capsule.isLocked ? 'text-purple-400' : 'text-cyan-400'}`} />
                    <span className={capsule.isLocked ? 'text-purple-300/70' : 'text-cyan-300/70'}>
                      {capsule.unlockDate}
                    </span>
                  </div>
                </div>
                
                <div className={`p-3 glass rounded-lg ${capsule.isLocked ? 'neon-purple' : 'neon-cyan'}`}>
                  {capsule.isLocked ? (
                    <Lock className="w-6 h-6 text-purple-400 animate-pulse-glow" />
                  ) : (
                    <Unlock className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
              </div>

              {/* Capsule Preview */}
              <div className={`glass p-4 rounded-lg mb-4 ${capsule.isLocked ? 'opacity-50' : ''}`}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {capsule.files.slice(0, 3).map((file, i) => (
                    <div key={i} className="glass p-2 rounded flex items-center gap-2">
                      {file.contentType.slice(0, 5) === 'image' && <Image className="w-4 h-4 text-cyan-400" />} <img src={file.fileUrl} alt={file.name} className="w-4 h-4" />
                      {file.contentType.slice(0, 5) === 'video' && <Film className="w-4 h-4 text-purple-400" />}
                      {file.contentType.slice(0, 9) === 'document' && <FileText className="w-4 h-4 text-blue-400" />}
                      <span className="text-xs text-white/70">{file.name}</span>
                    </div>
                  ))}
                  {capsule.files.length > 3 && (
                    <div className="glass p-2 rounded text-xs text-white/50">
                      +{capsule.files.length - 3} more
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/60 line-clamp-2">{capsule.memo}</p>
              </div>

              {/* Status */}
              {capsule.isLocked ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400 animate-pulse-glow" />
                    <span className="text-sm text-purple-300">
                      Unlocks in {getTimeUntilUnlock(capsule.unlockDate)}
                    </span>
                  </div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse-glow" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full glass border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                  onClick={() => setSelectedCapsule(capsule)}
                >
                  Open Capsule
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {capsules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="glass p-12 rounded-2xl neon-blue inline-block">
              <Clock className="w-20 h-20 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl text-blue-400 mb-2">No Capsules Yet</h3>
              <p className="text-blue-300/70">Create your first time capsule to get started</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Capsule Detail Dialog */}
      <AnimatePresence>
        {selectedCapsule && !selectedCapsule.isLocked && (
          <Dialog open={!!selectedCapsule} onOpenChange={() => setSelectedCapsule(null)}>
            <DialogContent className="glass border-cyan-400/50 neon-cyan max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-cyan-400 flex items-center gap-3">
                  <Unlock className="w-8 h-8" />
                  {selectedCapsule.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Memo */}
                <div className="glass p-4 rounded-lg">
                  <h4 className="text-cyan-400 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Memory Memo
                  </h4>
                  <p className="text-cyan-100">{selectedCapsule.memo}</p>
                </div>

                {/* Files */}
                <div className="glass p-4 rounded-lg">
                  <h4 className="text-cyan-400 mb-3 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Attached Files ({selectedCapsule.files.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedCapsule.files.map((file, i) => (
                      <div key={i} className="glass p-3 rounded flex items-center gap-3">
                        {file.type === 'image' && <Image className="w-5 h-5 text-cyan-400" />}
                        {file.type === 'video' && <Film className="w-5 h-5 text-purple-400" />}
                        {file.type === 'document' && <FileText className="w-5 h-5 text-blue-400" />}
                        <span className="text-cyan-100">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unlock Info */}
                <div className="glass p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300/70 mb-1">Unlocked on</p>
                      <p className="text-cyan-300">{selectedCapsule.unlockDate.toLocaleString()}</p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedCapsule.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-400/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
