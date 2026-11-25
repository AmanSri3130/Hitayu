const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true },
    questionText: { type: String, required: true },
    selectedOption: { type: String, required: true },
    dosha: {
      type: String,
      enum: ['Vata', 'Pitta', 'Kapha'],
      required: true
    }
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    answers: [answerSchema],
    scores: {
      vataScore: { type: Number, required: true },
      pittaScore: { type: Number, required: true },
      kaphaScore: { type: Number, required: true },
      totalScore: { type: Number, required: true },
      vataPercent: { type: Number, required: true },
      pittaPercent: { type: Number, required: true },
      kaphaPercent: { type: Number, required: true }
    },
    dominantDosha: {
      type: String,
      required: true,
      enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridoshic']
    },
    secondaryDosha: {
      type: String,
      default: 'Balanced'
    },
    educationalNotes: {
      characteristics: [String],
      dietaryGuidance: [String],
      lifestyleGuidance: [String],
      recommendedYoga: [String]
    },
    isCurrent: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
