const express = require('express');
const Habit = require('../models/Habit');
const { protect } = require('../middleware/auth');

const router = express.Router();

const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// @route   GET /api/habits
// @desc    Get user's habits with status for today
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const today = getTodayDateString();
    let habits = await Habit.find({ user: req.user._id, isActive: true });

    // If new user with no habits, initialize defaults
    if (habits.length === 0) {
      await seedDefaultHabits(req.user._id, req.user.prakritiSummary?.dominantDosha);
      habits = await Habit.find({ user: req.user._id, isActive: true });
    }

    const habitsWithToday = habits.map((h) => {
      const obj = h.toObject();
      const todayEntry = h.completions.find((c) => c.date === today);
      obj.completedToday = Boolean(todayEntry && todayEntry.completed);
      return obj;
    });

    res.json({
      success: true,
      today,
      count: habits.length,
      habits: habitsWithToday
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, category, targetTime, suggestedDosha } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Habit title is required.'
      });
    }

    const habit = await Habit.create({
      user: req.user._id,
      title,
      description: description || '',
      category: category || 'Dinacharya',
      targetTime: targetTime || 'Morning',
      suggestedDosha: suggestedDosha || 'All'
    });

    res.status(201).json({
      success: true,
      habit
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/habits/:id/toggle
// @desc    Toggle habit completion status for today
// @access  Private
router.post('/:id/toggle', protect, async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found.'
      });
    }

    const index = habit.completions.findIndex((c) => c.date === today);

    if (index > -1) {
      // Toggle off
      habit.completions.splice(index, 1);
      habit.streakCount = Math.max(0, habit.streakCount - 1);
    } else {
      // Toggle on
      habit.completions.push({ date: today, completed: true, completedAt: new Date() });
      habit.streakCount += 1;
    }

    await habit.save();

    const obj = habit.toObject();
    obj.completedToday = index === -1;

    res.json({
      success: true,
      habit: obj
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/habits/init-defaults
// @desc    Reset or initialize standard Dinacharya habits
// @access  Private
router.post('/init-defaults', protect, async (req, res, next) => {
  try {
    await Habit.deleteMany({ user: req.user._id });
    await seedDefaultHabits(req.user._id, req.user.prakritiSummary?.dominantDosha);

    const habits = await Habit.find({ user: req.user._id, isActive: true });
    res.json({
      success: true,
      message: 'Default Ayurvedic routines initialized.',
      habits
    });
  } catch (error) {
    next(error);
  }
});

async function seedDefaultHabits(userId, dominantDosha = 'All') {
  const defaults = [
    {
      title: 'Ushapan (Warm Water Awakening)',
      description: 'Drink 1-2 glasses of warm water upon waking to kindle digestive Agni.',
      category: 'Dinacharya',
      targetTime: 'Morning',
      suggestedDosha: 'All'
    },
    {
      title: 'Jihwa Nirlekhana (Tongue Scraping)',
      description: 'Gentle copper or steel scraping to clear overnight oral deposits (Ama).',
      category: 'Dinacharya',
      targetTime: 'Morning',
      suggestedDosha: 'All'
    },
    {
      title: 'Daily YogaAI Asana Practice',
      description: 'Mindful posture practice with real-time alignment feedback.',
      category: 'Yoga',
      targetTime: 'Morning',
      suggestedDosha: dominantDosha || 'All'
    },
    {
      title: 'Nadi Shodhana Pranayama',
      description: '5-10 minutes of alternate nostril breathing for nervous system balance.',
      category: 'Pranayama',
      targetTime: 'Evening',
      suggestedDosha: 'All'
    },
    {
      title: 'Sattvic Evening Wind-Down',
      description: 'Screen-free relaxation, warm herbal tea (Chamomile/Tulsi), bedtime by 10:30 PM.',
      category: 'Sleep',
      targetTime: 'Before Bed',
      suggestedDosha: 'All'
    }
  ];

  const habitsToInsert = defaults.map((d) => ({ ...d, user: userId }));
  await Habit.insertMany(habitsToInsert);
}

module.exports = router;
