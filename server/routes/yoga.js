const express = require('express');
const YogaSession = require('../models/YogaSession');
const yogaInference = require('../services/yogaInference');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/yoga/sessions
// @desc    Save a completed yoga practice session
// @access  Private
router.post('/sessions', protect, async (req, res, next) => {
  try {
    const {
      startTime,
      endTime,
      totalDurationSeconds,
      difficultyLevel,
      completedPoses,
      overallScore,
      notes
    } = req.body;

    if (!Array.isArray(completedPoses) || completedPoses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Session must contain at least one completed pose.'
      });
    }

    const avgAlignment = Math.round(
      completedPoses.reduce((sum, p) => sum + (p.alignmentScore || 0), 0) / completedPoses.length
    );

    const avgConfidence = Math.round(
      completedPoses.reduce((sum, p) => sum + (p.classificationConfidence || 0), 0) / completedPoses.length
    );

    // Compute grade
    let grade = 'C';
    if (avgAlignment >= 85) grade = 'S';
    else if (avgAlignment >= 70) grade = 'A';
    else if (avgAlignment >= 50) grade = 'B';
    else if (avgAlignment >= 30) grade = 'C';
    else grade = 'D';

    const session = await YogaSession.create({
      user: req.user._id,
      startTime: startTime || new Date(Date.now() - (totalDurationSeconds || 60) * 1000),
      endTime: endTime || new Date(),
      totalDurationSeconds: Math.max(totalDurationSeconds || 0, 1),
      difficultyLevel: difficultyLevel || 'beginner',
      completedPoses,
      totalPosesCompleted: completedPoses.length,
      averageAlignmentScore: avgAlignment,
      averageConfidence: avgConfidence,
      grade,
      completedSuccessfully: true,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/yoga/sessions
// @desc    Get user's yoga practice session history
// @access  Private
router.get('/sessions', protect, async (req, res, next) => {
  try {
    const sessions = await YogaSession.find({ user: req.user._id }).sort({ createdAt: -1 });

    const totalPracticeSeconds = sessions.reduce((acc, s) => acc + s.totalDurationSeconds, 0);
    const totalPosesCompleted = sessions.reduce((acc, s) => acc + s.totalPosesCompleted, 0);

    res.json({
      success: true,
      count: sessions.length,
      totalPracticeMinutes: Math.round(totalPracticeSeconds / 60),
      totalPosesCompleted,
      sessions
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/yoga/sessions/:id
// @desc    Get single session details
// @access  Private
router.get('/sessions/:id', protect, async (req, res, next) => {
  try {
    const session = await YogaSession.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Yoga session not found or unauthorized.'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/yoga/infer
// @desc    Server-side pose classification using Chakra_yoga's 48-feature SVM model
// @access  Public / Private
router.post('/infer', async (req, res, next) => {
  try {
    const { features, targetPoseIndex } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        error: 'Missing features array. Expected 48 numeric values (16 landmarks * 3 coords).'
      });
    }

    const result = await yogaInference.classifyPose(features, targetPoseIndex);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/yoga/poses
// @desc    Get list of verified poses supported by HitAyu & Chakra_yoga
// @access  Public
router.get('/poses', (req, res) => {
  res.json({
    success: true,
    supportedPoses: [
      {
        id: 75,
        name: 'Warrior II',
        sanskritName: 'Virabhadrasana II',
        difficulty: 'beginner',
        classifierClass: 75,
        targetHoldSeconds: 15,
        image: '/poses/75.jpg',
        instructions: [
          'Step feet wide apart, about 3 to 4 feet distance.',
          'Turn right foot out 90 degrees and bend the front knee over the ankle.',
          'Extend both arms horizontally at shoulder height, gaze over front fingertips.',
          'Keep torso vertical, shoulders relaxed away from ears.'
        ],
        safety: 'Keep the front knee tracking directly over the second toe; avoid letting it collapse inward.'
      },
      {
        id: 0,
        name: 'Mountain Pose',
        sanskritName: 'Tadasana',
        difficulty: 'beginner',
        classifierClass: null, // Evaluated via geometric posture analyzer
        targetHoldSeconds: 15,
        image: '/poses/tadasana.png',
        instructions: [
          'Stand with feet parallel, grounding evenly through all four corners of each foot.',
          'Engage quadriceps, draw tailbone down slightly, and lengthen the spine.',
          'Roll shoulders back and down, letting arms rest gently beside the body.',
          'Crown of the head reaches toward the sky with chin level to the floor.'
        ],
        safety: 'Do not lock knees completely; maintain a micro-bend to protect the joints.'
      },
      {
        id: 68,
        name: 'Tree Pose',
        sanskritName: 'Vrikshasana',
        difficulty: 'beginner',
        classifierClass: 68,
        targetHoldSeconds: 15,
        image: '/poses/68.jpg',
        instructions: [
          'Shift weight onto the left standing leg and ground firmly.',
          'Place the sole of right foot against the inner left calf or inner thigh (never on knee).',
          'Bring palms together in prayer position at chest center or overhead.',
          'Fix your gaze on a steady point ahead to sustain balance.'
        ],
        safety: 'Never place the foot directly against the side of the standing knee joint.'
      },
      {
        id: 8,
        name: 'Chair Pose',
        sanskritName: 'Utkatasana',
        difficulty: 'beginner',
        classifierClass: 8,
        targetHoldSeconds: 15,
        image: '/poses/8.jpg',
        instructions: [
          'Stand tall, inhale and raise arms overhead perpendicular to the floor.',
          'Exhale and bend knees, shifting weight back into the heels as if sitting in an imaginary chair.',
          'Keep chest lifted and lower back long.'
        ],
        safety: 'Avoid overarching the lumbar spine; keep core engaged.'
      },
      {
        id: 44,
        name: 'Plank Pose',
        sanskritName: 'Kumbhakasana',
        difficulty: 'easy',
        classifierClass: 44,
        targetHoldSeconds: 15,
        image: '/poses/44.jpg',
        instructions: [
          'Press firmly through hands directly beneath shoulders.',
          'Form a straight line from crown of head to heels.',
          'Engage core and quadriceps.'
        ],
        safety: 'Do not allow hips to sag downward or pike upward excessively.'
      }
    ]
  });
});

module.exports = router;
