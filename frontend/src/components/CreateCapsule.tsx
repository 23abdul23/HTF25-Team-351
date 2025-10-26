import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, Image, Film, Calendar, Clock, X, Rocket, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import axios from 'axios';
import { getToken , getUser} from '../lib/auth';

interface CreateCapsuleProps {
  onBack: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.NEXT_BACKEND_URL || 'http://localhost:5000';
const SINGLE_TOKEN = import.meta.env.VITE_SINGLE_USER_TOKEN || '';

export function CreateCapsule({ onBack }: CreateCapsuleProps) {
  // store File objects
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [memo, setMemo] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    // Convert to the format required by datetime-local: "YYYY-MM-DDTHH:MM"
    const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setUnlockDate(localISOTime);
  }, []);


  const user = getUser();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) setFiles((prev) => [...prev, ...chosen]);
    // clear input so same file can be reselected if needed
    e.currentTarget.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function uploadToServer() {
    if (!files.length) return null;
    const formData = new FormData();


    
    files.forEach((f) => formData.append('files', f));
    if (title) formData.append('title', title);
    if (memo) formData.append('description', memo);
    if (unlockDate) formData.append('unlockDate', unlockDate);
    if (user?.id) formData.append('userId', user.id);

    // include auth token (Bearer) and optional single-user token header
    const token = getToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(SINGLE_TOKEN ? { 'x-api-token': SINGLE_TOKEN } : {}),
      // DO NOT set Content-Type here — the browser/axios will set multipart boundary
    };

    try {
      const res = await axios.post(`${API_BASE}/api/capsules/upload`, formData, {
        headers,
        withCredentials: true,
      });

      console.log('Upload response:', res.data);
      return res.data;
    } catch (err: any) {
      throw new Error(err?.response?.data?.error || err?.message || 'Upload failed');
    }
  }

  const handleSealCapsule = async () => {
    setStatus(null);
    setIsSealing(true);
    try {
      // Upload files first (if any)
      const resp = await uploadToServer();
      // animate sealing after successful upload or no files
      setStatus(resp?.id ? `Sealed capsule id=${resp.id}` : 'Sealed capsule');
      // small delay to show animation
      setTimeout(() => {
        alert('Capsule sealed and launched into the cosmos! 🚀');
        setIsSealing(false);
        onBack();
      }, 2000);
    } catch (err: any) {
      setStatus(err.message || 'Failed to seal capsule');
      setIsSealing(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
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
          <h1 className="text-5xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Create Time Capsule
          </h1>
          <p className="text-cyan-300/70">Package your memories for future recovery</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: 3D Capsule Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="glass p-8 rounded-2xl neon-cyan h-full">
              <h3 className="text-xl text-cyan-400 mb-6">Capsule Preview</h3>

              {/* 3D Capsule Container */}
              <div className="relative h-96 flex items-center justify-center">
                {isSealing ? (
                  <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{
                      scale: [1, 1.2, 0],
                      opacity: [1, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 3 }}
                    className="absolute"
                  >
                    <div className="w-64 h-80 glass rounded-3xl neon-purple flex items-center justify-center">
                      <Rocket className="w-32 h-32 text-purple-400" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotateY: [0, 360],
                    }}
                    transition={{
                      y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                      rotateY: { duration: 10, repeat: Infinity, ease: 'linear' },
                    }}
                    className="relative perspective-1000"
                  >
                    <div className="w-64 h-80 glass rounded-3xl border-2 border-cyan-400/50 neon-cyan relative overflow-hidden">
                      {/* Capsule top */}
                      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-cyan-500/30 to-transparent rounded-t-3xl" />

                      {/* Capsule bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-purple-500/30 to-transparent rounded-b-3xl" />

                      {/* Content preview */}
                      <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-3">
                        {files.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {files.slice(0, 3).map((file, i) => (
                              <div key={i} className="w-12 h-12 glass rounded-lg flex items-center justify-center">
                                {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <Image className="w-6 h-6 text-cyan-400" />
                                ) : file.name.match(/\.(mp4|mov|avi)$/i) ? (
                                  <Film className="w-6 h-6 text-purple-400" />
                                ) : (
                                  <FileText className="w-6 h-6 text-blue-400" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {memo && (
                          <div className="glass p-2 rounded text-xs text-cyan-300 max-w-[150px] truncate">
                            {memo.substring(0, 20)}...
                          </div>
                        )}
                        {files.length === 0 && !memo && (
                          <p className="text-cyan-400/50 text-sm text-center">
                            Add files and memos to fill your capsule
                          </p>
                        )}
                      </div>

                      {/* Glow rings */}
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border-2 border-cyan-400/30 rounded-3xl"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Capsule Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="glass p-3 rounded-lg text-center">
                  <p className="text-2xl text-cyan-400">{files.length}</p>
                  <p className="text-xs text-cyan-300/70">Files</p>
                </div>
                <div className="glass p-3 rounded-lg text-center">
                  <p className="text-2xl text-purple-400">{memo ? '1' : '0'}</p>
                  <p className="text-xs text-purple-300/70">Memo</p>
                </div>
                <div className="glass p-3 rounded-lg text-center">
                  <p className="text-2xl text-blue-400">{unlockDate ? '✓' : '○'}</p>
                  <p className="text-xs text-blue-300/70">Timer Set</p>
                </div>
              </div>

              {status && <p className="mt-3 text-sm text-yellow-300">{status}</p>}
            </div>
          </motion.div>

          {/* Right: Upload Controls */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >

            {/* Title */}
            <div className="glass p-6 rounded-2xl neon-purple">
              <Label htmlFor="memo" className="text-purple-400 mb-3 block">
                <FileText className="w-5 h-5 inline mr-2" />
                Title
              </Label>
              <Textarea
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name Your Capsule"
                className="glass border-purple-400/30 text-purple-100 placeholder:text-purple-400/30 min-h-22"
              />
            </div>
            
            {/* File Upload */}
            <div className="glass p-6 rounded-2xl neon-blue">
              <Label className="text-blue-400 mb-3 block">Upload Files</Label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-400/10 neon-cyan'
                    : 'border-blue-400/30 hover:border-blue-400/50'
                }`}
              >
                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-300 mb-2">Drag & drop files here</p>
                <p className="text-blue-300/50 text-sm mb-4">or click to browse</p>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <Button
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="glass border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                  variant="outline"
                >
                  Select Files
                </Button>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <Image className="w-5 h-5 text-cyan-400" />
                        ) : file.name.match(/\.(mp4|mov|avi)$/i) ? (
                          <Film className="w-5 h-5 text-purple-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-400" />
                        )}
                        <span className="text-sm text-blue-200">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Memo Pad */}
            <div className="glass p-6 rounded-2xl neon-purple">
              <Label htmlFor="memo" className="text-purple-400 mb-3 block">
                <FileText className="w-5 h-5 inline mr-2" />
                Memory Memo
              </Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Write a message to your future self..."
                className="glass border-purple-400/30 text-purple-100 placeholder:text-purple-400/30 min-h-32"
              />
            </div>

            {/* Time Dial */}
            <div className="glass p-6 rounded-2xl neon-cyan">
              <Label htmlFor="unlock-date" className="text-cyan-400 mb-3 block">
                <Clock className="w-5 h-5 inline mr-2" />
                Unlock Date/Time
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                <Input
                  id="unlock-date"
                  type="datetime-local"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="pl-10 glass border-cyan-400/30 text-cyan-100"
                />
              </div>
              {unlockDate && (
                <p className="text-cyan-300/70 text-sm mt-2">
                  Capsule will unlock: {new Date(unlockDate).toLocaleString()}
                </p>
              )}
            </div>

            {/* Seal Button */}
            <Button
              onClick={handleSealCapsule}
              disabled={isSealing}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white py-6 rounded-xl neon-cyan border-0"
            >
              {isSealing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Rocket className="w-6 h-6 mr-2" />
                  </motion.div>
                  Launching into Space...
                </>
              ) : (
                <>
                  <Lock className="w-6 h-6 mr-2" />
                  Close & Seal Capsule
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
