const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isFallback: {
      type: Boolean,
      default: false
    },
    references: [
      {
        title: String,
        category: String
      }
    ]
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Ayurvedic Wellness Discussion',
      trim: true
    },
    messages: [messageSchema],
    prakritiContext: {
      dominantDosha: String,
      vataPercent: Number,
      pittaPercent: Number,
      kaphaPercent: Number
    }
  },
  {
    timestamps: true
  }
);

chatSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
