import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Clock, Image, Film, FileText, User, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';

interface CommunityCapsule {
  id: number;
  pilotName: string;
  title: string;
  unlockDate: Date;
  isUnlocked: boolean;
  files: Array<{ name: string; type: 'image' | 'video' | 'document' }>;
  memo: string;
  angle: number;
}

interface CommunityCapsulesProps {
  onBack: () => void;
}

export function CommunityCapsules({ onBack }: CommunityCapsulesProps) {
  const [selectedCapsule, setSelectedCapsule] = useState<CommunityCapsule | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const capsules: CommunityCapsule[] = [
    {
      id: 1,
      pilotName: 'Captain Nova',
      title: 'World Peace 2025',
      unlockDate: new Date('2025-12-31'),
      isUnlocked: false,
      files: [{ name: 'hopes.txt', type: 'document' }],
      memo: 'My wishes for a better world',
      angle: 0,
    },
    {
      id: 2,
      pilotName: 'Stellar Phoenix',
      title: 'Music Through Time',
      unlockDate: new Date('2024-06-01'),
      isUnlocked: true,
      files: [
        { name: 'playlist.txt', type: 'document' },
        { name: 'concert.jpg', type: 'image' },
      ],
      memo: 'The songs that defined this era',
      angle: 60,
    },
    {
      id: 3,
      pilotName: 'Cosmic Wanderer',
      title: 'Tech Predictions',
      unlockDate: new Date('2030-01-01'),
      isUnlocked: false,
      files: [{ name: 'predictions.txt', type: 'document' }],
      memo: 'What will technology look like in 2030?',
      angle: 120,
    },
    {
      id: 4,
      pilotName: 'Star Voyager',
      title: 'Art & Culture',
      unlockDate: new Date('2024-09-15'),
      isUnlocked: true,
      files: [
        { name: 'gallery.jpg', type: 'image' },
        { name: 'exhibit.mp4', type: 'video' },
      ],
      memo: 'The most inspiring art exhibition',
      angle: 180,
    },
    {
      id: 5,
      pilotName: 'Luna Explorer',
      title: 'Family Stories',
      unlockDate: new Date('2026-07-20'),
      isUnlocked: false,
      files: [
        { name: 'stories.txt', type: 'document' },
        { name: 'photo.jpg', type: 'image' },
      ],
      memo: 'Stories passed down through generations',
      angle: 240,
    },
    {
      id: 6,
      pilotName: 'Galaxy Keeper',
      title: 'Climate Journey',
      unlockDate: new Date('2024-04-22'),
      isUnlocked: true,
      files: [
        { name: 'nature.jpg', type: 'image' },
        { name: 'documentary.mp4', type: 'video' },
      ],
      memo: 'Our planet, our responsibility',
      angle: 300,
    },
  ];

  const handleCapsuleClick = (capsule: CommunityCapsule) => {
    if (!capsule.isUnlocked) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      setSelectedCapsule(capsule);
    }, 1500);
  };

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
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 mb-4"
          >
            ← Back to Home
          </Button>
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
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
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
            const radius = 350;
            const angleRad = (capsule.angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            return (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{ delay: index * 0.1 }}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleCapsuleClick(capsule)}
                  className={`glass p-4 rounded-xl cursor-pointer ${
                    capsule.isUnlocked ? 'neon-cyan' : 'neon-purple opacity-60'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 w-32">
                    <Avatar className="w-12 h-12 glass border-2 border-cyan-400/50">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400">
                        {capsule.pilotName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center">
                      <p className={`text-xs mb-1 ${capsule.isUnlocked ? 'text-cyan-300' : 'text-purple-300'}`}>
                        {capsule.pilotName}
                      </p>
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
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Connection line to station */}
                <div 
                  className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                  style={{
                    width: `${radius}px`,
                    transform: `rotate(${capsule.angle + 180}deg)`,
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

                <div className="glass p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300/70 mb-1">Unlocked on</p>
                      <p className="text-cyan-300">{selectedCapsule.unlockDate.toLocaleString()}</p>
                    </div>
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
