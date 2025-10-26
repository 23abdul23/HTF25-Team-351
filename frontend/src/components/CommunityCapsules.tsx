import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Clock, Image, Film, FileText, User, Zap, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getToken, getUser } from '../lib/auth';

interface CommunityCapsule {
  id: number;
  pilotName: string;
  title: string;
  unlockDate: Date | null;
  lockDate?: Date | null;
  sharedCapsuleId?: string | null;
  createdBy?: any;
  isUnlocked: boolean;
  files: Array<{ name: string; type: 'image' | 'video' | 'document'; fileUrl?: string; contentType?: string }>;
  memo: string;
  angle: number;
}

interface CommunityCapsulesProps {
  onBack: () => void;
}

const API_BASE = import.meta.env.VITE_HOSTED_BACKEND_URL || 'http://localhost:5000';

export function CommunityCapsules({ onBack }: CommunityCapsulesProps) {
  const [selectedCapsule, setSelectedCapsule] = useState<CommunityCapsule | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');

  const [unlockDate, setUnlockDate] = useState('');
  const [lockDate, setLockDate] = useState('');

  useEffect(() => {
    const now = new Date();
    // default lockDate to now+1 day, default unlockDate to slightly in the past so new capsules are open
    const localISONow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const localISONowMinus1Min = new Date(now.getTime() - 60_000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const localISONextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    // unlockDate default: 1 minute in the past (ensures isUnlocked true)
    setUnlockDate(localISONowMinus1Min);
    // lockDate default: next day (uploads allowed until then)
    setLockDate(localISONextDay);
  }, []);

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // recipients (emails) state + input
  const [recipientsInput, setRecipientsInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);

  function normalizeEmailsInput(raw: string) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function addRecipientsFromInput() {
    const parsed = normalizeEmailsInput(recipientsInput);
    const valid = parsed.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const unique = Array.from(new Set([...recipients, ...valid]));
    if (valid.length === 0) {
      setCreateError('Enter at least one valid email (comma, space or newline separated).');
      return;
    }
    setRecipients(unique);
    setRecipientsInput('');
    setCreateError(null);
  }

  function removeRecipient(email: string) {
    setRecipients((r) => r.filter((x) => x !== email));
  }

  const [capsules, setCapsules] = useState<CommunityCapsule[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  let mounted = true;
  const fetchData = async () => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE}/api/capsules/community?userId=${getUser()?.id}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });


      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || 'Failed to fetch community capsules');
      const data = body?.data || body || [];

      if (!mounted) return;

      const normalized = (data || []).map((c: any, idx: number) => ({
        id: c._id || c.id || idx,
        pilotName: c.pilotName || c.creatorName || c.createdByEmail || (c.createdBy && c.createdBy.email) || 'Unknown',
        title: c.title || c.name || '',
        unlockDate: c.unlockDate ? new Date(c.unlockDate) : null,
        lockDate : c.lockDate ? new Date(c.lockDate) : null, 
        sharedCapsuleId: c.sharedCapsuleId || null,
        createdBy: c.createdBy || null,
        isUnlocked: c.unlockDate ? new Date(c.unlockDate) <= new Date() : true,
        files: (c.files || []).map((f: any) => ({
          name: f.originalName || f.name || f.blobName || 'file',
          type: (f.contentType || '').startsWith('image')
            ? 'image'
            : (f.contentType || '').startsWith('video')
              ? 'video'
              : 'document',
          fileUrl: f.fileUrl || f.url || f.sasUrl || null,
        })),
        memo: c.description || c.memo || '',
        angle: c.angle || 0,
      }));

      setCapsules(normalized);

      console.log(data)
    } catch (err) {
      console.error('Failed to fetch capsules', err);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCapsuleClick = (capsule: CommunityCapsule) => {
    if (!capsule.isUnlocked) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      setSelectedCapsule(capsule);
    }, 1500);
  };

  // Create -> POST /api/capsules/upload (multipart)
  async function createCommunityCapsule() {
    setCreateError(null);
    if (!title && !memo && files.length === 0) {
      setCreateError('Please provide a title, memo or at least one file.');
      return;
    }

    setIsCreating(true);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', memo);

      if (unlockDate) form.append('unlockDate', new Date(unlockDate).toISOString());
      if (lockDate) form.append('lockDate', new Date(lockDate).toISOString());

      form.append('visibility', 'public'); // community capsules should be public

      form.append('user', getUser())
      form.append('userId', getUser().id);

      files.forEach((f) => form.append('files', f));
      // send recipients as JSON array (server will parse)
      if (recipients.length) form.append('recipients', JSON.stringify(recipients));

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${import.meta.env.VITE_HOSTED_BACKEND_URL || 'http://localhost:5000'}/api/capsules/community/create`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: form,
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || 'Failed to create capsule');
      }

      // success: close dialog, clear form
      setShowCreate(false);
      setTitle('');
      setMemo('');
      setUnlockDate('');
      setFiles([]);
      setRecipients([]);
      setRecipientsInput('');
      // optional: show created id
      console.log('Community capsule created', body);

      // You may want to refresh community list from backend here
    } catch (err: any) {
      console.error('Create capsule error', err);
      setCreateError(err.message || 'Failed to create capsule');
    } finally {
      setIsCreating(false);
    }
  }

  // upload additional files to an existing shared capsule (called from dialog)
  async function uploadSharedFiles(sharedCapsuleId: string) {
    if (!uploadFiles.length) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      uploadFiles.forEach((f) => form.append('files', f));
      form.append('sharedCapsuleId', sharedCapsuleId);
      const user = getUser();
      if (user?.id) form.append('userId', user.id);

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/capsules/community/upload`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: form,
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || 'Upload failed');

      // merge newly saved files into selectedCapsule and capsules list (optimistic)
      const added = (body.savedFiles || []).map((f: any) => ({
        name: f.originalName,
        type: (f.contentType || '').startsWith('image') ? 'image' : (f.contentType || '').startsWith('video') ? 'video' : 'document',
        fileUrl: f.url || null,
      }));

      // update selectedCapsule locally
      setSelectedCapsule((prev) =>
        prev ? { ...prev, files: [...prev.files, ...added] } : prev
      );

      // update capsules list (all items with same sharedCapsuleId) by refetching for simplicity
      // you can instead update local capsules array, but refetch keeps client state consistent:
      const refetchRes = await fetch(`${API_BASE}/api/capsules/community?userId=${getUser()?.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
      });



      const refetchBody = await refetchRes.json().catch(() => null);


      if (refetchRes.ok) {
        const refData = refetchBody?.data || refetchBody || [];
        const normalized = (refData || []).map((c: any, idx: number) => ({
          id: c._id || c.id || idx,
          pilotName: c.pilotName || c.creatorName || c.createdByEmail || (c.createdBy && c.createdBy.email) || 'Unknown',
          title: c.title || c.name || '',
          unlockDate: c.unlockDate ? new Date(c.unlockDate) : new Date(),
          sharedCapsuleId: c.sharedCapsuleId || null,
          createdBy: c.createdBy || null,
          isUnlocked: c.unlockDate ? new Date(c.unlockDate) <= new Date() : true,
          files: (c.files || []).map((f: any) => ({
            name: f.originalName || f.name || f.blobName || 'file',
            type: (f.contentType || '').startsWith('image') ? 'image' : (f.contentType || '').startsWith('video') ? 'video' : 'document',
            fileUrl: f.fileUrl || f.url || f.sasUrl || null,
          })),
          memo: c.description || c.memo || '',
          angle: c.angle || 0,
        }));
        setCapsules(normalized);
      }

      setUploadFiles([]);
      (fileInputRef.current as HTMLInputElement | null) && ((fileInputRef.current as HTMLInputElement).value = '');
    } catch (err: any) {
      console.error("Upload shared files error", err);
      setCreateError(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      {/* Hyperdrive transition effect */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Star streaks */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '50%',
                  scaleX: 1,
                  opacity: 0
                }}
                animate={{
                  x: `${Math.random() * 200 - 50}%`,
                  y: `${Math.random() * 200 - 50}%`,
                  scaleX: [1, 50],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Home
            </Button>

            <div className="flex items-center gap-3">
              <Button onClick={() => setShowCreate(true)} className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300">
                + Create Capsule
              </Button>
            </div>
          </div>

          <h1 className="text-5xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Users className="w-12 h-12 text-cyan-400" />
            Community Space Station
          </h1>
          <p className="text-cyan-300/70">Public capsules from pilots around the cosmos</p>
        </motion.div>

        {/* Space Station */}
        <div className="relative h-[600px] flex items-center justify-center">
          {/* Central Station */}
          <motion.div
            className="relative w-64 h-64"
          >
            <div className="absolute inset-0 glass rounded-full neon-cyan flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-cyan-400 mx-auto mb-2" />
                <p className="text-cyan-400">Community</p>
                <p className="text-cyan-400">Station</p>
                <p className="text-xs text-cyan-300/50 mt-2">{capsules.length} Capsules</p>
              </div>
            </div>

            {/* Station rings */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-cyan-400/30 rounded-full"
              style={{ transform: 'scale(1.2)' }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-purple-400/20 rounded-full"
              style={{ transform: 'scale(1.4)' }}
            />
          </motion.div>

          {/* Orbiting Capsules */}
          {capsules.map((capsule, index) => {
             const total = Math.max(1, capsules.length);
             // evenly distribute angles when more than one capsule
             const angleDeg = total > 1 ? (index * 360) / total : (capsule.angle || 0);
             const angleRad = (angleDeg * Math.PI) / 180;
             const radius = 350; // adjust as needed or compute based on total
             const x = Math.cos(angleRad) * radius;
             const y = Math.sin(angleRad) * radius;

             return (
               <motion.div
                 key={capsule.id}
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: index * 0.06 }}
                 className="absolute"
                 style={{
                   left: `calc(50% + ${x}px)`,
                   top: `calc(50% + ${y}px)`,
                   transform: 'translate(-50%, -50%)',
                 }}
               >
                {/* wrapper with hover group so we can show unlock tooltip for locked capsules */}
                <div className="relative group inline-block">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleCapsuleClick(capsule)}
                    className={`glass p-4 rounded-xl cursor-pointer ${capsule.isUnlocked ? 'neon-cyan' : 'neon-purple opacity-60'}`}
                  >
                    <div className="flex flex-col items-center gap-2 w-32">
                      <Avatar className="w-12 h-12 glass border-2 border-cyan-400/50">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400">
                          {String(capsule.pilotName || '')
                            .split(' ')
                            .map((n) => n[0] || '')
                            .join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="text-center">
                        <p className={`text-sm mb-2 ${capsule.isUnlocked ? 'text-cyan-400' : 'text-purple-400'}`}>
                          {capsule.title}
                        </p>

                        <div className="flex items-center justify-center gap-1 text-xs">
                          <Clock className={`w-3 h-3 ${capsule.isUnlocked ? 'text-cyan-400' : 'text-purple-400 animate-pulse-glow'}`} />
                          <span className={capsule.isUnlocked ? 'text-cyan-300/70' : 'text-purple-300/70'}>
                            {capsule.isUnlocked ? 'Open' : 'Locked'}
                          </span>
                        </div>
                      </div>

                      {capsule.isUnlocked && (
                        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Zap className="w-4 h-4 text-cyan-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* unlock date tooltip for locked capsules (becomes visible on hover) */}
                  {!capsule.isUnlocked && capsule.unlockDate && (
                    <div
                      className="pointer-events-none absolute left-1/2 transform -translate-x-1/2 bottom-full mb-3 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-150 z-50"
                      aria-hidden
                    >
                      <div className="bg-black/90 text-xs text-white px-3 py-1 rounded-md whitespace-nowrap shadow-lg">
                        Unlocks: {new Date(capsule.unlockDate).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                 {/* Connection line to station */}
                 <div
                   className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                   style={{
                     width: `${radius}px`,
                     transform: `rotate(${angleDeg + 180}deg)`,
                     transformOrigin: 'left center',
                   }}
                 />
               </motion.div>
             );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 neon-cyan" />
            <span className="text-cyan-300 text-sm">Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400 neon-purple animate-pulse-glow" />
            <span className="text-purple-300 text-sm">Locked</span>
          </div>
        </div>
      </div>

      {/* Capsule Detail Dialog */}
      <AnimatePresence>
        {selectedCapsule && (
          <Dialog open={!!selectedCapsule} onOpenChange={() => setSelectedCapsule(null)}>
            <DialogContent className="glass border-cyan-400/50 neon-cyan max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-cyan-400 flex items-center gap-3">
                  <User className="w-8 h-8" />
                  Pilot: {selectedCapsule.pilotName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="glass p-4 rounded-lg">
                  <h3 className="text-xl text-cyan-300 mb-2">{selectedCapsule.title}</h3>
                  <p className="text-cyan-100">{selectedCapsule.memo}</p>
                </div>

                <div className="glass p-4 rounded-lg">
                  <h4 className="text-cyan-400 mb-3 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Shared Files ({selectedCapsule.files.length})
                  </h4>

                  {/* improved file viewer (uses same rendering as CapsuleViewer) */}
                  <div className="max-h-72 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 p-1">
                      {selectedCapsule.files.map((file, i) => {
                        const previewUrl = file.fileUrl || '';
                        const isImage = file.type === 'image' || (file as any).contentType?.startsWith?.('image');
                        const isVideo = file.type === 'video' || (file as any).contentType?.startsWith?.('video');

                        return (
                          <div key={i} className="glass p-3 rounded-lg flex flex-col gap-3 overflow-hidden border border-transparent max-h-[18rem]">
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
                                  onContextMenu={(e) => e.preventDefault()}
                                />
                                <div className="absolute top-3 left-3 inline-flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  <Image className="h-4 w-4" />
                                </div>
                              </div>
                            ) : isVideo && previewUrl ? (
                              <video
                                src={previewUrl}
                                className="w-full h-44 rounded-md mb-2 bg-black"
                                controls
                                controlsList="nodownload noremoteplayback nofullscreen"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                              />
                            ) : (
                              <div className="w-full h-40 rounded-md mb-2 flex items-center justify-center bg-white/5">
                                {isVideo ? (
                                  <Monitor className="w-6 h-6 text-purple-300" />
                                ) : (
                                  <FileText className="w-6 h-6 text-blue-400" />
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-cyan-200/80">
                              <span>{(file as any).contentType?.split?.('/')?.[0] ?? (file.type || 'file')}</span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                                onClick={() => {
                                  if (!previewUrl) {
                                    alert('Download not available for this file yet.');
                                    return;
                                  }
                                  const link = document.createElement('a');
                                  link.href = previewUrl;
                                  link.download = file.name || 'shared-file';
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

                <div className="glass p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300/70 mb-1">Unlocked on</p>
                      <p className="text-cyan-300">{selectedCapsule.unlockDate.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* upload area visible while capsule is still open (before lockDate) */}
                {selectedCapsule && selectedCapsule.lockDate && new Date() < new Date(selectedCapsule.lockDate) && (
                  <div className="mb-3">
                    <label className="text-sm text-cyan-300 block mb-1">Add your files (available until lock date)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                        className="glass p-2 rounded text-white"
                      />
                      <Button
                        onClick={() => selectedCapsule?.sharedCapsuleId && uploadSharedFiles(selectedCapsule.sharedCapsuleId)}
                        disabled={isUploading || uploadFiles.length === 0}
                      >
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                    <p className="text-xs text-cyan-300/60 mt-2">
                      You can add files here until {new Date(selectedCapsule.lockDate!).toLocaleString()}.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Create Capsule Dialog */}
      <AnimatePresence>
        {showCreate && (
          <Dialog open={showCreate} onOpenChange={() => setShowCreate(false)}>
            <DialogContent className="glass neon-cyan max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl text-cyan-400">Create Community Capsule</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm text-cyan-300 block mb-1">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full glass p-3 rounded-md text-white placeholder:text-cyan-300/60"
                      placeholder="Enter capsule title"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-cyan-300 block mb-1">Memo</label>
                    <textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full glass p-3 rounded-md h-28 text-white placeholder:text-cyan-300/60"
                      placeholder="Write your memo..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-cyan-300 block mb-1">Unlock Date</label>
                      <input
                        type="datetime-local"
                        value={unlockDate}
                        onChange={(e) => setUnlockDate(e.target.value)}
                        className="w-full glass p-2 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-cyan-300 block mb-1">Lock Date (uploads allowed until)</label>
                      <input
                        type="datetime-local"
                        value={lockDate}
                        onChange={(e) => setLockDate(e.target.value)}
                        className="w-full glass p-2 rounded-md text-white"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-sm text-cyan-300 block mb-1">Visibility</label>
                    <input readOnly value="public" className="w-full glass p-2 rounded-md text-white" />
                  </div>

                  <div>
                    <label className="text-sm text-cyan-300 block mb-1">Files</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                      className="w-full"
                    />
                    {files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {files.map((f, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-white/5 rounded-full text-cyan-200">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-cyan-300 block mb-1">Share with (emails)</label>
                    <div className="flex gap-2">
                      <input
                        value={recipientsInput}
                        onChange={(e) => setRecipientsInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipientsFromInput(); } }}
                        placeholder="type emails, press Enter or click Add"
                        className="flex-1 glass p-2 rounded-md"
                      />
                      <Button onClick={addRecipientsFromInput} className="px-4">Add</Button>
                    </div>
                    {recipients.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recipients.map((email) => (
                          <div key={email} className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 text-xs">
                            <span className="text-cyan-100">{email}</span>
                            <button onClick={() => removeRecipient(email)} className="text-red-400 hover:text-red-300 ml-2">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300/60 mt-2">Recipients will be notified and can view the shared capsule. Separate by comma, space or newline.</p>
                  </div>

                </div>

                {createError && <p className="text-red-400 text-sm">{createError}</p>}

                <div className="flex items-center gap-3">
                  <Button onClick={() => setShowCreate(false)} variant="ghost">Cancel</Button>
                  <Button onClick={createCommunityCapsule} disabled={isCreating} className="ml-auto">
                    {isCreating ? 'Creating...' : 'Create Capsule'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
