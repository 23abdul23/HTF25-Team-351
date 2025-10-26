import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/profile?userId=123
router.get('/', async (req, res) => {
  const id = req.query.id;

  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const user = await User.findById(userId).lean(); // lean returns plain JS object
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
