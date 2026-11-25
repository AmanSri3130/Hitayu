const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    preferences: {
      dietaryPreference: {
        type: String,
        enum: ['Vegetarian', 'Vegan', 'Sattvic', 'Ayurvedic', 'Omnivore', 'Gluten-Free', 'Not Specified'],
        default: 'Not Specified'
      },
      allergies: [{ type: String, trim: true }],
      wellnessGoals: [{ type: String, trim: true }],
      dailyPracticeMinutes: { type: Number, default: 20 }
    },
    prakritiSummary: {
      dominantDosha: { type: String, default: null },
      secondaryDosha: { type: String, default: null },
      vataPercent: { type: Number, default: 0 },
      pittaPercent: { type: Number, default: 0 },
      kaphaPercent: { type: Number, default: 0 },
      assessmentDate: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
