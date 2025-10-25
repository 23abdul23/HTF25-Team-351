
import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Register

router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
    } = req.body

    // Validate required fields
    if (!username || !password || !fullName) {
      return res.status(400).json({ message: 'Username, password and full name are required' })
    }

    const newUser = new User({
      username: username.trim(),
      password,
      fullName: fullName.trim(),
    })

    await newUser.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      token,
      user: newUser 
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await User.findOne({ username }).populate('battalion')
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' })
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router;