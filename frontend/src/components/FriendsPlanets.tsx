import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Clock, Image, Film, FileText, User, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Capsule {
  id: number;
  name: string;
  unlockDate: Date;
  isLocked: boolean;
  files: Array<{ name: string; type: 'image' | 'video' | 'document' }>;
  memo: string;
}

interface Friend {
  id: number;
  name: string;
  planetColor: string;
  planetImage: string;
  position: { x: number; y: number };
  capsules: Capsule[];
}

interface FriendsPlanetsProps {
  onBack: () => void;
}

export function FriendsPlanets({ onBack }: FriendsPlanetsProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);

  const friends: Friend[] = [
    {
      id: 1,
      name: 'Alex Nova',
      planetColor: 'from-blue-500 to-cyan-500',
      planetImage: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200',
      position: { x: 20, y: 30 },
      capsules: [
        {
          id: 1,
          name: 'Vacation Memories',
          unlockDate: new Date('2025-08-15'),
          isLocked: true,
          files: [{ name: 'beach.jpg', type: 'image' }],
          memo: 'Best summer ever!',
        },
        {
          id: 2,
          name: 'Birthday 2024',
          unlockDate: new Date('2024-03-10'),
          isLocked: false,
          files: [{ name: 'party.mp4', type: 'video' }],
          memo: 'Amazing celebration',
        },
      ],
    },
    {
      id: 2,
      name: 'Sarah Stellar',
      planetColor: 'from-purple-500 to-pink-500',
      planetImage: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=200',
      position: { x: 70, y: 25 },
      capsules: [
        {
          id: 3,
          name: 'Graduation Day',
          unlockDate: new Date('2024-05-20'),
          isLocked: false,
          files: [
            { name: 'ceremony.jpg', type: 'image' },
            { name: 'speech.txt', type: 'document' },
          ],
          memo: 'Proud moment!',
        },
      ],
    },
    {
      id: 3,
      name: 'Mike Cosmos',
      planetColor: 'from-orange-500 to-red-500',
      planetImage: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=200',
      position: { x: 45, y: 60 },
      capsules: [
        {
          id: 4,
          name: 'New Year 2025',
          unlockDate: new Date('2025-12-31'),
          isLocked: true,
          files: [{ name: 'resolutions.txt', type: 'document' }],
          memo: 'Goals for the new year',
        },
        {
          id: 5,
          name: 'Road Trip',
          unlockDate: new Date('2024-07-04'),
          isLocked: false,
          files: [
            { name: 'route.jpg', type: 'image' },
            { name: 'highlights.mp4', type: 'video' },
          ],
          memo: 'Epic adventure across the country',
        },
      ],
    },
    {
      id: 4,
      name: 'Emma Galaxy',
      planetColor: 'from-green-500 to-emerald-500',
      planetImage: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=200',
      position: { x: 25, y: 75 },
      capsules: [
        {
          id: 6,
          name: 'Art Exhibition',
          unlockDate: new Date('2024-09-01'),
          isLocked: false,
          files: [{ name: 'gallery.jpg', type: 'image' }],
          memo: 'My first solo show',
        },
      ],
    },
    {
      id: 5,
      name: 'Chris Orbit',
      planetColor: 'from-yellow-500 to-orange-400',
      planetImage: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?w=200',
      position: { x: 75, y: 65 },
      capsules: [
        {
          id: 7,
          name: 'Wedding Day',
          unlockDate: new Date('2026-06-15'),
          isLocked: true,
          files: [
            { name: 'ceremony.jpg', type: 'image' },
            { name: 'vows.txt', type: 'document' },
          ],
          memo: 'The best day of our lives',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
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
          <h1 className="text-5xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Users className="w-12 h-12 text-purple-400" />
            Friends' Solar System
          </h1>
          <p className="text-purple-300/70">Explore capsules orbiting your friends' planets</p>
        </motion.div>

        {/* Solar System View */}
        <div className="relative h-[700px] glass rounded-3xl neon-purple p-8">
          {/* Background stars */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}

          {/* Friends as Planets */}
          {friends.map((friend, index) => {
            const orbitRadius = 80;
            
            return (
              <div
                key={friend.id}
                className="absolute"
                style={{
                  left: `${friend.position.x}%`,
                  top: `${friend.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Planet */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSelectedFriend(friend)}
                  className="relative cursor-pointer group"
                >
                  {/* Planet glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${friend.planetColor} rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity`} />
                  
                  {/* Planet body */}
                  <div className="relative w-32 h-32 rounded-full overflow-hidden glass border-2 border-white/20">
                    <ImageWithFallback
                      src={friend.planetImage}
                      alt={friend.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${friend.planetColor} opacity-40`} />
                  </div>

                  {/* Pilot info */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <p className="text-white mb-1">{friend.name}</p>
                    <p className="text-white/50 text-xs">{friend.capsules.length} capsules</p>
                  </div>

                  {/* Orbit path */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/10 rounded-full"
                    style={{ 
                      width: `${orbitRadius * 2}px`, 
                      height: `${orbitRadius * 2}px` 
                    }}
                  />

                  {/* Orbiting Capsules */}
                  {friend.capsules.map((capsule, capsuleIndex) => {
                    const angle = (capsuleIndex / friend.capsules.length) * 360;
                    const angleRad = (angle * Math.PI) / 180;
                    const x = Math.cos(angleRad) * orbitRadius;
                    const y = Math.sin(angleRad) * orbitRadius;

                    return (
                      <motion.div
                        key={capsule.id}
                        animate={{ 
                          rotate: 360,
                        }}
                        transition={{ 
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!capsule.isLocked) setSelectedCapsule(capsule);
                          }}
                          className={`w-8 h-8 glass rounded-lg flex items-center justify-center cursor-pointer ${
                            capsule.isLocked ? 'neon-purple' : 'neon-cyan'
                          }`}
                        >
                          <Clock className={`w-4 h-4 ${
                            capsule.isLocked ? 'text-purple-400 animate-pulse-glow' : 'text-cyan-400'
                          }`} />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Friend Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {friends.map((friend) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedFriend(friend)}
              className="glass p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform neon-purple"
            >
              <Avatar className="w-12 h-12 mx-auto mb-2">
                <AvatarFallback className={`bg-gradient-to-br ${friend.planetColor} text-white`}>
                  {friend.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-purple-300 text-center">{friend.name.split(' ')[0]}</p>
              <p className="text-xs text-purple-400/70 text-center">{friend.capsules.length} capsules</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Friend Detail Dialog */}
      <AnimatePresence>
        {selectedFriend && (
          <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
            <DialogContent className="glass border-purple-400/50 neon-purple max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-purple-400 flex items-center gap-3">
                  <Globe className="w-8 h-8" />
                  {selectedFriend.name}'s Capsules
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-4">
                {selectedFriend.capsules.map((capsule) => (
                  <motion.div
                    key={capsule.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => !capsule.isLocked && setSelectedCapsule(capsule)}
                    className={`glass p-4 rounded-lg cursor-pointer ${
                      capsule.isLocked ? 'opacity-60' : 'neon-cyan'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={capsule.isLocked ? 'text-purple-300' : 'text-cyan-300'}>
                          {capsule.name}
                        </h4>
                        <p className={`text-sm mt-1 ${capsule.isLocked ? 'text-purple-300/70' : 'text-cyan-300/70'}`}>
                          {capsule.memo}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <Clock className={`w-3 h-3 ${capsule.isLocked ? 'text-purple-400' : 'text-cyan-400'}`} />
                          <span className={capsule.isLocked ? 'text-purple-300/70' : 'text-cyan-300/70'}>
                            {capsule.isLocked ? `Unlocks ${capsule.unlockDate.toLocaleDateString()}` : 'Unlocked'}
                          </span>
                        </div>
                      </div>
                      <div className={`p-2 glass rounded ${capsule.isLocked ? 'neon-purple' : 'neon-cyan'}`}>
                        {capsule.isLocked ? '🔒' : '🔓'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Capsule Detail Dialog */}
      <AnimatePresence>
        {selectedCapsule && (
          <Dialog open={!!selectedCapsule} onOpenChange={() => setSelectedCapsule(null)}>
            <DialogContent className="glass border-cyan-400/50 neon-cyan max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-cyan-400">{selectedCapsule.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="glass p-4 rounded-lg">
                  <h4 className="text-cyan-400 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Memory Memo
                  </h4>
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
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
