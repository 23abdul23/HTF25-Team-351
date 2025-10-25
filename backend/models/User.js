const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['CO', 'JCO', 'USER'],
    default: 'USER',
    required: true
  },
  armyNo: {
    type: String,
    sparse: true, // Only required for JSO and USER roles
    trim: true,
    uppercase: true
  },
  rank: {
    type: String,
    trim: true,
    uppercase: true
  },
  battalion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battalion'
  },
  subBty : {
    type: String,
    trim: true,
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Create unique index on armyNo only when it exists
userSchema.index({ armyNo: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { armyNo: { $exists: true, $ne: null } }
})

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    throw error
  }
}

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model('User', userSchema)