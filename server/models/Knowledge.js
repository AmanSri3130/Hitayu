const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    sanskritName: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Doshas',
        'Herbs',
        'Shrubs',
        'Recipes',
        'Dinacharya',
        'Ritucharya',
        'Nutrition',
        'YogaTherapy',
        'HomeRemedies',
        'Mindfulness'
      ],
      index: true
    },
    doshaAffinity: {
      type: String,
      enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridoshic', 'All'],
      default: 'Tridoshic',
      index: true
    },
    imageUrl: {
      type: String,
      default: '/images/botanical-apothecary.jpg'
    },
    description: {
      type: String,
      required: true
    },
    traditionalUses: [String],
    modernContext: {
      type: String
    },
    contraindications: [String],
    practicalApplication: [String],
    references: [String],
    tags: [
      {
        type: String,
        trim: true,
        index: true
      }
    ],
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Full text search index
knowledgeSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
