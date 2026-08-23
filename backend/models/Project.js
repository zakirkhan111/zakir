const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 1000 },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [4, 'Title must be at least 4 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Environment', 'Education', 'Health', 'Technology', 'Poverty Relief', 'Disaster Relief', 'Community Development', 'Other'],
    },
    location: {
      city: { type: String, required: [true, 'Location city is required'], trim: true },
      address: { type: String, trim: true, default: '' },
      coordinates: {
        // GeoJSON Point: [longitude, latitude]
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
          type: [Number],
          default: undefined,
          validate: {
            validator: (v) => !v || v.length === 2,
            message: 'Coordinates must be an array of [longitude, latitude]',
          },
        },
      },
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    requiredVolunteers: {
      type: Number,
      required: [true, 'Required volunteers count is required'],
      min: [1, 'At least 1 volunteer is required'],
    },
    currentVolunteersCount: { type: Number, default: 0, min: 0 },
    skillsRequired: {
      type: [String],
      default: [],
      set: (arr) => (Array.isArray(arr) ? arr.map((s) => s.trim()) : arr),
    },
    projectImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ['pending_approval', 'active', 'in_progress', 'completed', 'rejected', 'cancelled'],
      default: 'pending_approval',
    },
    rejectionReason: { type: String, default: '' },

    updates: { type: [updateSchema], default: [] },

    // Task/progress tracking (denormalized counters, kept in sync by task controller)
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },

    impactScore: { type: Number, default: 0, min: 0 },

    reviews: { type: [reviewSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },

    completionEvidence: [
      {
        url: String,
        publicId: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ category: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'location.city': 1 });
projectSchema.index({ skillsRequired: 1 });
projectSchema.index({ 'location.coordinates': '2dsphere' });
projectSchema.index({ impactScore: -1 });

projectSchema.methods.recalculateAverageRating = function () {
  if (!this.reviews.length) {
    this.averageRating = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
};

module.exports = mongoose.model('Project', projectSchema);
