const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: '🏅' },
    awardedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: (v) => /^[0-9+\-\s()]{7,20}$/.test(v),
        message: 'Please provide a valid phone number',
      },
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
      set: (arr) => (Array.isArray(arr) ? arr.map((s) => s.trim()) : arr),
    },
    profilePicture: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: { type: String, maxlength: 500, default: '' },

    role: {
      type: String,
      enum: {
        values: ['student', 'project_manager', 'admin'],
        message: 'Role must be student, project_manager, or admin',
      },
      default: 'student',
    },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },

    // Gamification
    volunteerPoints: { type: Number, default: 0, min: 0 },
    impactScoreContribution: { type: Number, default: 0, min: 0 },
    badges: { type: [badgeSchema], default: [] },

    // Aggregated stats (denormalized for fast dashboard reads)
    stats: {
      projectsJoined: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      hoursContributed: { type: Number, default: 0 },
    },

    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ volunteerPoints: -1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
