import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Clock, FileText, Film, Trash2, Calendar, Image as ImageIcon, Download, Monitor as VideoIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { getToken, getUser } from '../lib/auth';

interface ApiCapsuleFile {
  originalName?: string;
  blobName?: string;
  contentType?: string;
  fileUrl?: string;
  signedUrl?: string;
  url?: string;
  size?: number;
}

interface ApiCapsule {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  unlockDate?: string;
  createdAt?: string;
  recipients?: string[];
  files?: ApiCapsuleFile[];
}

interface CapsuleFile {
  id: string;
  name: string;
  contentType: string;
  previewUrl: string;
}

interface Capsule {
  id: string;
  name: string;
  unlockDate: Date;
  isLocked: boolean;
  files: CapsuleFile[];
  memo: string;
}

interface CapsuleViewerProps {
  onBack: () => void;
}

const importMetaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const API_BASE = importMetaEnv?.VITE_HOSTED_BACKEND_URL || 'http://localhost:5000';

async function api(path: string, init?: RequestInit) {
  const token = getToken();
  const userId = getUser()?.id;

  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}/api${path}?userId=${userId ?? ''}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* ignore parse errors */
  }

  if (!res.ok) throw new Error((body as { error?: string })?.error || 'Request failed');
  return body;
}

function mapCapsule(apiCapsule: ApiCapsule): Capsule {
  const unlockDateRaw = apiCapsule.unlockDate ?? apiCapsule.createdAt ?? new Date().toISOString();
  const unlockDate = new Date(unlockDateRaw);
  const baseId = apiCapsule._id ?? apiCapsule.id ?? `capsule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const files: CapsuleFile[] = (apiCapsule.files ?? []).map((file: ApiCapsuleFile, index: number) => {
    const name = file.originalName || `file-${index + 1}`;
    const contentType = file.contentType || 'application/octet-stream';
    const previewUrl = file.fileUrl || file.signedUrl || file.url || '';

    return {
      id: `${baseId}-file-${index}`,
      name,
      contentType,
      previewUrl,
    };
  });

  return {
    id: baseId,
    name: apiCapsule.title || 'Untitled Capsule',
    unlockDate,
    isLocked: unlockDate.getTime() > Date.now(),
    files,
    memo: apiCapsule.description || '',
  };
}

export function CapsuleViewer({ onBack }: CapsuleViewerProps) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api('/capsules', { method: 'GET' });
        const data = (response as { data?: ApiCapsule[] })?.data ?? (response as ApiCapsule[]);
        const normalized = Array.isArray(data) ? data.map(mapCapsule) : [];
        setCapsules(normalized);

        console.log('Fetched capsules:', normalized);

      } catch (err) {
        console.error("Failed to fetch capsules", err);
      }
    };

    fetchData();
  }, []);

  const handleDelete = (id: string) => {
    setCapsules((prev) => prev.filter((capsule) => capsule.id !== id));
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

  console.log('Rendering CapsuleViewer with capsules:', capsules);
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
              className={`glass p-6 rounded-2xl cursor-pointer transition-all ${capsule.isLocked
                  ? 'neon-purple hover:scale-105'
                  : 'neon-cyan hover:scale-105'
                }`}
            >
              {/* Capsule Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`mb-2 line-clamp-1 ${capsule.isLocked ? 'text-purple-300' : 'text-cyan-300'}`}>
                    Capsule: {capsule.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className={`w-4 h-4 ${capsule.isLocked ? 'text-purple-400' : 'text-cyan-400'}`} />
                    <span className={capsule.isLocked ? 'text-purple-300/70' : 'text-cyan-300/70'}>
                      {capsule.unlockDate.toLocaleString()}
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
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto overflow-x-hidden pr-1">
                  {capsule.files.slice(0, 6).map((file) => {
                    const isImage = file.contentType.startsWith('image');
                    const isVideo = file.contentType.startsWith('video');

                    return (
                      <div
                        key={file.id}
                        className="glass px-2 py-1 rounded flex items-center gap-2 w-full sm:w-auto sm:min-w-[140px] sm:max-w-[180px] max-w-full overflow-hidden"
                      >
                        {isImage && file.previewUrl ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        ) : isVideo ? (
                          <Film className="w-4 h-4 text-purple-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-xs text-white/70 truncate flex-1 min-w-0" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    );
                  })}
                  {capsule.files.length > 6 && (
                    <div className="glass px-2 py-1 rounded text-xs text-white/60">
                      +{capsule.files.length - 6} more
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/60 line-clamp-2 mt-3">{capsule.memo}</p>
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
            <DialogContent className="glass border-cyan-400/50 neon-cyan max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    Attached Files ({selectedCapsule.files.length})
                  </h4>

                  {/* scrollable two-column responsive grid */}
                  <div className="max-h-72 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 p-1">
                      {selectedCapsule.files.map((file) => {
                        const isImage = file.contentType.startsWith('image');
                        const isVideo = file.contentType.startsWith('video');
                        const previewUrl = file.previewUrl;

                        return (
                          <div
                            key={file.id}
                            className="glass p-3 rounded-lg flex flex-col gap-3 overflow-hidden border border-transparent max-h-[18rem]"
                          >
                            <p className="text-sm text-cyan-100 truncate" title={file.name}>
                              {file.name}
                            </p>
                            {isImage && previewUrl ? (
                              <div className="relative w-full mb-2 overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/5">
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="w-full h-40 object-cover select-none pointer-events-none"
                                  loading="lazy"
                                  draggable={false}
                                  onContextMenu={(event) => event.preventDefault()}
                                />
                                <div className="absolute top-3 left-3 inline-flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                              </div>
                            ) : isVideo && previewUrl ? (
                              file.contentType === 'video/x-matroska' ? (
                                <div className="w-full h-44 rounded-md mb-2 flex items-center justify-center bg-black/60 text-cyan-200 text-sm">
                                  MKV preview not supported — use Save File
                                </div>
                              ) : (
                                <video
                                  src={previewUrl}
                                  className="w-full h-44 rounded-md mb-2 bg-black"
                                  controls
                                  controlsList="nodownload noremoteplayback nofullscreen"
                                  disablePictureInPicture
                                  onContextMenu={(event) => event.preventDefault()}
                                />
                              )
                            ) : (
                              <div className="w-full h-40 rounded-md mb-2 flex items-center justify-center bg-white/5">
                                {isVideo ? (
                                  <VideoIcon className="w-6 h-6 text-purple-300" />
                                ) : (
                                  <FileText className="w-6 h-6 text-blue-400" />
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-cyan-200/80">
                              <span>{file.contentType.split('/')[0]}</span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                                onClick={() => {
                                  if (!file.previewUrl) {
                                    alert('Download not available for this file yet.');
                                    return;
                                  }
                                  const link = document.createElement('a');
                                  link.href = file.previewUrl;
                                  link.download = file.name || 'capsule-file';
                                  link.rel = 'noopener noreferrer';
                                  link.target = '_self';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-3 w-3" />
                                Save File
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
