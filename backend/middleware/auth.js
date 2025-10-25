import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user with role information
    const user = await User.findById(decoded.userId).select('-password')
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' })
    }

    req.user = {
      userId: user._id,
    }
    
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' })
  }
}

export default auth