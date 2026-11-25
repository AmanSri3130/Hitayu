const mongoose = require('mongoose');

const dailyCompletionSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    completed: {
      type: Boolean,
      default: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['Dinacharya', 'Yoga', 'Pranayama', 'Diet', 'Sleep', 'Mindfulness'],
      default: 'Dinacharya'
    },
    suggestedDosha: {
      type: String,
      enum: ['Vata', 'Pitta', 'Kapha', 'All'],
      default: 'All'
    },
    targetTime: {
      type: String, // e.g. "Morning", "Afternoon", "Evening", "Before Bed"
      default: 'Morning'
    },
    streakCount: {
      type: Number,
      default: 0
    },
    completions: [dailyCompletionSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

habitSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Habit', habitSchema);
