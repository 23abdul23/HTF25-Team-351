import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signJwt } from '../lib/jwt.js';
import { getUserFromReq, requireAuth } from '../middleware/authentication.js';
import { googleAuthStart, googleAuthCallback } from '../lib/passport-google.js';

const router = Router();

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' :'none',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: 'email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: String(email).toLowerCase(), passwordHash, name });
    const token = signJwt({ id: user._id, email: user.email });
    setAuthCookie(res, token);
    res.json({ id: user._id, email: user.email, name: user.name });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = signJwt(user.id ?? user._id);
    setAuthCookie(res, token);
    res.json({ id: user.id ?? user._id, email: user.email, name: user.name , token : token});
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.post('/logout', (_req, res) => {
  try {
    res.clearCookie('token');
    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(404).json({ error: 'not found' });
    res.json({ id: user._id ?? user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error('Get /me error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Google OAuth (keep middleware factories as-is)
router.get('/google', googleAuthStart());
router.get('/google/callback', googleAuthCallback());

export default router;
