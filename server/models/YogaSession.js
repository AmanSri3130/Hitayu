const mongoose = require('mongoose');

const completedPoseSchema = new mongoose.Schema(
  {
    poseIndex: { type: Number, required: true },
    poseName: { type: String, required: true },
    sanskritName: { type: String },
    difficulty: {
      type: String,
      enum: ['beginner', 'easy', 'medium', 'difficult', 'impossible'],
      default: 'beginner'
    },
    targetHoldDuration: { type: Number, default: 15 },
    actualHoldDuration: { type: Number, default: 0 },
    classificationConfidence: { type: Number, default: 0 },
    alignmentScore: { type: Number, default: 0 },
    feedbackReceived: [String]
  },
  { _id: false }
);

const yogaSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true
    },
    endTime: {
      type: Date,
      default: Date.now
    },
    totalDurationSeconds: {
      type: Number,
      required: true,
      min: 0
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'easy', 'medium', 'difficult'],
      default: 'beginner'
    },
    completedPoses: [completedPoseSchema],
    totalPosesCompleted: {
      type: Number,
      default: 0
    },
    averageAlignmentScore: {
      type: Number,
      default: 0
    },
    averageConfidence: {
      type: Number,
      default: 0
    },
    grade: {
      type: String,
      enum: ['S', 'A', 'B', 'C', 'D'],
      default: 'A'
    },
    completedSuccessfully: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

yogaSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('YogaSession', yogaSessionSchema);
