import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Edit3, 
  Settings, 
  Camera, 
  Shield, 
  Activity, 
  Award,
  Clock,
  Heart,
  Star,
  TrendingUp,
  Bell,
  Lock,
  Unlock,
  Save,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { getToken, getUser } from '../lib/auth';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
}

interface UserProfileProps {
  onBack: () => void;
}

const activeTab = "activity"
const API_BASE = import.meta.env.VITE_HOSTED_BACKEND_URL || 'http://localhost:5000';

async function api(path: string, init?: RequestInit) {
  const token = getToken();
  const userId = getUser()?.id;

  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}/api${path}?userId=${userId}`, {
    ...init,
    headers,
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

export function UserProfile({ onBack }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api('/profile', { method: 'GET' });
        const data = response.data || response;
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        // Mock data for demonstration
        setProfile({
          id: 1,
          name: 'Yeah user not loaded brother',
          email: 'user@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        });
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await api('/profile', {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      setProfile({ ...profile, ...editData } as UserProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleCancel = () => {
  };


  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-2xl neon-blue">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyan-300">Loading profile...</p>
        </div>
      </div>
    );
  }

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
            Back to Home
          </Button>
          <h1 className="text-5xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Profile
          </h1>
        </motion.div>

        {/* Cover Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8"
        >
          <div className="glass rounded-2xl overflow-hidden h-64 relative">

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Avatar */}
            <div className="absolute bottom-4 left-6 flex items-end gap-4">
              <div className="relative">
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-cyan-400/50 object-cover"
                />

              </div>
              <div className="text-white mb-2">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-cyan-300">@{profile.email}</p>
              </div>
            </div>

          </div>
        </motion.div>


        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-3 gap-6"
            >

              </div>
            </motion.div>
          )}
      </div>
    </div>
  );
}


