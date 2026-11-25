const express = require('express');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to determine dominant dosha & notes
const calculateDoshaCharacteristics = (dominant, vata, pitta, kapha) => {
  const guidance = {
    characteristics: [],
    dietaryGuidance: [],
    lifestyleGuidance: [],
    recommendedYoga: []
  };

  if (dominant.includes('Vata')) {
    guidance.characteristics.push('Creative, quick-thinking, adaptable, light frame, prone to dry skin or chilly extremities.');
    guidance.dietaryGuidance.push('Favor warm, unctuous, grounding foods: cooked grains, soups, ghee, root vegetables, warming spices like ginger and cinnamon.');
    guidance.lifestyleGuidance.push('Emphasize consistent daily routines (Dinacharya), grounding self-massage (Abhyanga) with warm sesame oil, and regular restful sleep.');
    guidance.recommendedYoga.push('Tadasana (Mountain Pose), Vrikshasana (Tree Pose), gentle slow sun salutations with mindful grounding focus.');
  }

  if (dominant.includes('Pitta')) {
    guidance.characteristics.push('Focused, articulate, discerning, moderate build, efficient metabolism, sensitive to heat or intensity.');
    guidance.dietaryGuidance.push('Favor cooling, sweet, bitter, and astringent flavors: coconut, cucumber, cilantro, mint, basmati rice, sweet fruits.');
    guidance.lifestyleGuidance.push('Avoid midday peak heat, cultivate relaxation without competitive pressure, enjoy cooling evening strolls.');
    guidance.recommendedYoga.push('Virabhadrasana II (Warrior II), Chandra Namaskar (Moon Salutations), gentle heart openers and forward folds.');
  }

  if (dominant.includes('Kapha')) {
    guidance.characteristics.push('Calm, loyal, enduring, sturdy frame, steady energy, strong immunity, tendency toward slow digestion or lethargy.');
    guidance.dietaryGuidance.push('Favor light, warm, dry, pungent, bitter, and astringent foods: steamed greens, lentils, warming spices like black pepper and turmeric.');
    guidance.lifestyleGuidance.push('Engage in invigorating daily physical activity, rise early before 6:00 AM, dry skin brushing (Garshana).');
    guidance.recommendedYoga.push('Dynamic Vinyasa flow, Warrior poses, Utkatasana (Chair pose), stimulating pranayama like Bhastrika.');
  }

  if (dominant === 'Tridoshic') {
    guidance.characteristics.push('Remarkably balanced constitutional harmony with equal presence of Vata, Pitta, and Kapha attributes.');
    guidance.dietaryGuidance.push('Focus on seasonal adjustments (Ritucharya): warm in winter, cooling in summer, light in spring.');
    guidance.lifestyleGuidance.push('Maintain balanced circadian rhythm and mind-body harmony.');
    guidance.recommendedYoga.push('All classical balanced Hatha yoga sequences.');
  }

  return guidance;
};

// @route   POST /api/assessment
// @desc    Submit Prakriti assessment answers and compute results
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid answers to complete the assessment.'
      });
    }

    let vataScore = 0;
    let pittaScore = 0;
    let kaphaScore = 0;

    answers.forEach((ans) => {
      if (ans.dosha === 'Vata') vataScore++;
      else if (ans.dosha === 'Pitta') pittaScore++;
      else if (ans.dosha === 'Kapha') kaphaScore++;
    });

    const totalScore = vataScore + pittaScore + kaphaScore || 1;
    const vataPercent = Math.round((vataScore / totalScore) * 100);
    const pittaPercent = Math.round((pittaScore / totalScore) * 100);
    // Ensure sum equals 100
    const kaphaPercent = 100 - (vataPercent + pittaPercent);

    // Determine dominant dosha
    const scores = [
      { dosha: 'Vata', val: vataPercent },
      { dosha: 'Pitta', val: pittaPercent },
      { dosha: 'Kapha', val: kaphaPercent }
    ].sort((a, b) => b.val - a.val);

    let dominantDosha = scores[0].dosha;
    let secondaryDosha = scores[1].dosha;

    // Check for dual dosha or tridoshic
    if (Math.abs(scores[0].val - scores[1].val) <= 5 && Math.abs(scores[1].val - scores[2].val) <= 5) {
      dominantDosha = 'Tridoshic';
      secondaryDosha = 'Balanced';
    } else if (Math.abs(scores[0].val - scores[1].val) <= 7) {
      dominantDosha = `${scores[0].dosha}-${scores[1].dosha}`;
      secondaryDosha = scores[2].dosha;
    }

    const educationalNotes = calculateDoshaCharacteristics(dominantDosha, vataPercent, pittaPercent, kaphaPercent);

    // Set previous current assessments to false
    await Assessment.updateMany({ user: req.user._id, isCurrent: true }, { isCurrent: false });

    // Create new assessment
    const assessment = await Assessment.create({
      user: req.user._id,
      answers,
      scores: {
        vataScore,
        pittaScore,
        kaphaScore,
        totalScore,
        vataPercent,
        pittaPercent,
        kaphaPercent
      },
      dominantDosha,
      secondaryDosha,
      educationalNotes,
      isCurrent: true
    });

    // Update user summary
    await User.findByIdAndUpdate(req.user._id, {
      prakritiSummary: {
        dominantDosha,
        secondaryDosha,
        vataPercent,
        pittaPercent,
        kaphaPercent,
        assessmentDate: new Date()
      }
    });

    res.status(201).json({
      success: true,
      assessment
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/assessment/current
// @desc    Get user's latest current assessment
// @access  Private
router.get('/current', protect, async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ user: req.user._id, isCurrent: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/assessment/history
// @desc    Get all user assessment history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    const assessments = await Assessment.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assessments.length,
      assessments
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
