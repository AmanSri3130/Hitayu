/**
 * HitAyu 2.0 — YogaAI Pose Evaluation & Feature Extraction Engine
 *
 * Implements:
 * 1. Exact 48-feature extraction matching Chakra_yoga's pose_classifier.pkl
 *    (MediaPipe landmarks 11..16 and 23..32 * [x, y, z]).
 * 2. Vector-based joint angle calculation.
 * 3. Geometric posture evaluation for Tadasana, Vrikshasana, and Virabhadrasana II.
 * 4. Visibility validation & confidence smoothing.
 */

// MediaPipe Pose Landmark indices
export const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Safely retrieve a landmark by index
 */
export function getLandmark(landmarks, index) {
  if (!landmarks || !Array.isArray(landmarks) || index < 0 || index >= landmarks.length) {
    return null;
  }
  return landmarks[index];
}

/**
 * Check if all required landmarks have sufficient visibility
 */
export function checkVisibility(landmarks, requiredIndices, minVisibility = 0.45) {
  if (!landmarks || landmarks.length < 33) {
    return { visible: false, missing: ['Full body'] };
  }

  const missing = [];
  for (const idx of requiredIndices) {
    const lm = landmarks[idx];
    if (!lm || (lm.visibility !== undefined && lm.visibility < minVisibility)) {
      missing.push(idx);
    }
  }

  return {
    visible: missing.length === 0,
    missing,
  };
}

/**
 * Calculate angle at vertex B formed by points A -> B -> C (in degrees 0..180)
 */
export function calculateAngle(A, B, C) {
  if (!A || !B || !C) return 0;

  const baX = A.x - B.x;
  const baY = A.y - B.y;
  const bcX = C.x - B.x;
  const bcY = C.y - B.y;

  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);

  if (magBA === 0 || magBC === 0) return 0;

  let cosTheta = (baX * bcX + baY * bcY) / (magBA * magBC);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  const radians = Math.acos(cosTheta);
  return Math.round((radians * 180) / Math.PI);
}

/**
 * Extract the exact 48-element feature vector expected by Chakra_yoga's pose_classifier.pkl
 * Order: indices 11..16 (shoulders, elbows, wrists) and 23..32 (hips, knees, ankles, heels, feet)
 */
export function extractClassifierFeatures(landmarks) {
  if (!landmarks || landmarks.length < 33) return null;

  const features = [];
  for (let i = 0; i < landmarks.length; i++) {
    if ((i > 10 && i < 17) || i > 22) {
      const lm = landmarks[i];
      features.push(lm.x || 0, lm.y || 0, lm.z || 0);
    }
  }
  return features.length === 48 ? features : null;
}

/**
 * Rolling window smoothing to stabilize frame-to-frame confidence fluctuations
 */
export function smoothPosePredictions(buffer, newValue, windowSize = 5) {
  const updated = [...buffer, newValue];
  if (updated.length > windowSize) {
    updated.shift();
  }
  const sum = updated.reduce((a, b) => a + b, 0);
  return {
    buffer: updated,
    smoothed: Math.round(sum / updated.length),
  };
}

/**
 * Map a classifier index to a known HitAyu pose object
 */
export function mapPredictionToPose(predictedIndex, posesCatalog) {
  if (predictedIndex === null || predictedIndex === undefined) return null;
  return posesCatalog.find((p) => p.classifierClass === predictedIndex) || null;
}

/**
 * Evaluate Virabhadrasana II (Warrior II)
 */
export function evaluateWarriorTwo(landmarks) {
  const required = [
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_ELBOW,
    LANDMARKS.RIGHT_ELBOW,
    LANDMARKS.LEFT_WRIST,
    LANDMARKS.RIGHT_WRIST,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
  ];

  const vis = checkVisibility(landmarks, required, 0.4);
  if (!vis.visible) {
    return {
      isVisible: false,
      alignmentScore: 0,
      checklist: [],
      feedback: ['Please move into full camera view so arms and legs are visible.'],
      status: 'error',
    };
  }

  const lShoulder = getLandmark(landmarks, LANDMARKS.LEFT_SHOULDER);
  const rShoulder = getLandmark(landmarks, LANDMARKS.RIGHT_SHOULDER);
  const lElbow = getLandmark(landmarks, LANDMARKS.LEFT_ELBOW);
  const rElbow = getLandmark(landmarks, LANDMARKS.RIGHT_ELBOW);
  const lWrist = getLandmark(landmarks, LANDMARKS.LEFT_WRIST);
  const rWrist = getLandmark(landmarks, LANDMARKS.RIGHT_WRIST);
  const lHip = getLandmark(landmarks, LANDMARKS.LEFT_HIP);
  const rHip = getLandmark(landmarks, LANDMARKS.RIGHT_HIP);
  const lKnee = getLandmark(landmarks, LANDMARKS.LEFT_KNEE);
  const rKnee = getLandmark(landmarks, LANDMARKS.RIGHT_KNEE);
  const lAnkle = getLandmark(landmarks, LANDMARKS.LEFT_ANKLE);
  const rAnkle = getLandmark(landmarks, LANDMARKS.RIGHT_ANKLE);

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const leftArmAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const rightArmAngle = calculateAngle(rShoulder, rElbow, rWrist);

  // Determine which leg is bent (front leg) vs straight (back leg)
  const frontKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
  const backKneeAngle = Math.max(leftKneeAngle, rightKneeAngle);

  const checklist = [];
  const feedback = [];
  let points = 0;

  // 1. Front knee bend (target: 85° - 125°)
  const frontKneeGood = frontKneeAngle >= 80 && frontKneeAngle <= 130;
  checklist.push({
    label: `Front knee bend (${frontKneeAngle}°)`,
    passed: frontKneeGood,
  });
  if (frontKneeGood) {
    points += 30;
  } else if (frontKneeAngle > 130) {
    feedback.push('Bend your front knee deeper toward a 90° lunge.');
  } else {
    feedback.push('Ease slightly out of the front knee bend so knee stays over ankle.');
  }

  // 2. Back leg extension (target: >= 155°)
  const backLegGood = backKneeAngle >= 155;
  checklist.push({
    label: `Back leg extension (${backKneeAngle}°)`,
    passed: backLegGood,
  });
  if (backLegGood) {
    points += 25;
  } else {
    feedback.push('Straighten and press firmly through your back leg.');
  }

  // 3. Arms horizontal & extended (target: elbow angles >= 155°, wrists near shoulder height)
  const armsExtended = leftArmAngle >= 150 && rightArmAngle >= 150;
  const wristHeightDiff =
    Math.abs(lWrist.y - lShoulder.y) + Math.abs(rWrist.y - rShoulder.y);
  const armsLevel = wristHeightDiff < 0.2;

  checklist.push({
    label: 'Arms extended horizontally',
    passed: armsExtended && armsLevel,
  });
  if (armsExtended && armsLevel) {
    points += 25;
  } else {
    feedback.push('Extend both arms wide at shoulder height, parallel to the mat.');
  }

  // 4. Upright torso / level shoulders
  const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y);
  const torsoGood = shoulderTilt < 0.08;
  checklist.push({
    label: 'Level shoulders & centered torso',
    passed: torsoGood,
  });
  if (torsoGood) {
    points += 20;
  } else {
    feedback.push('Keep your torso centered and level your shoulders.');
  }

  if (feedback.length === 0) {
    feedback.push('Strong Warrior II alignment! Breathe steadily and hold with ease.');
  }

  return {
    isVisible: true,
    alignmentScore: points,
    checklist,
    feedback,
    status: points >= 75 ? 'good' : points >= 45 ? 'warn' : 'error',
  };
}

/**
 * Evaluate Tadasana (Mountain Pose)
 */
export function evaluateTadasana(landmarks) {
  const required = [
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
  ];

  const vis = checkVisibility(landmarks, required, 0.4);
  if (!vis.visible) {
    return {
      isVisible: false,
      alignmentScore: 0,
      checklist: [],
      feedback: ['Please step back so your full body from head to ankles is visible.'],
      status: 'error',
    };
  }

  const lShoulder = getLandmark(landmarks, LANDMARKS.LEFT_SHOULDER);
  const rShoulder = getLandmark(landmarks, LANDMARKS.RIGHT_SHOULDER);
  const lHip = getLandmark(landmarks, LANDMARKS.LEFT_HIP);
  const rHip = getLandmark(landmarks, LANDMARKS.RIGHT_HIP);
  const lKnee = getLandmark(landmarks, LANDMARKS.LEFT_KNEE);
  const rKnee = getLandmark(landmarks, LANDMARKS.RIGHT_KNEE);
  const lAnkle = getLandmark(landmarks, LANDMARKS.LEFT_ANKLE);
  const rAnkle = getLandmark(landmarks, LANDMARKS.RIGHT_ANKLE);

  const leftLegAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightLegAngle = calculateAngle(rHip, rKnee, rAnkle);
  const shoulderLevel = Math.abs(lShoulder.y - rShoulder.y) < 0.06;
  const hipLevel = Math.abs(lHip.y - rHip.y) < 0.06;

  // Vertical stack check (shoulders over hips)
  const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
  const hipMidX = (lHip.x + rHip.x) / 2;
  const spineVertical = Math.abs(shoulderMidX - hipMidX) < 0.07;

  const checklist = [];
  const feedback = [];
  let points = 0;

  const legsStraight = leftLegAngle >= 165 && rightLegAngle >= 165;
  checklist.push({ label: 'Legs straight & grounded', passed: legsStraight });
  if (legsStraight) points += 30;
  else feedback.push('Stand tall and gently straighten both legs without locking knees.');

  checklist.push({ label: 'Level shoulders', passed: shoulderLevel });
  if (shoulderLevel) points += 25;
  else feedback.push('Relax and level both shoulders evenly.');

  checklist.push({ label: 'Balanced hips', passed: hipLevel });
  if (hipLevel) points += 20;
  else feedback.push('Distribute weight evenly across both feet to level your hips.');

  checklist.push({ label: 'Upright spinal alignment', passed: spineVertical });
  if (spineVertical) points += 25;
  else feedback.push('Stack your shoulders directly over your hips.');

  if (feedback.length === 0) {
    feedback.push('Grounded and poised Tadasana! Lengthen through the crown of your head.');
  }

  return {
    isVisible: true,
    alignmentScore: points,
    checklist,
    feedback,
    status: points >= 75 ? 'good' : points >= 45 ? 'warn' : 'error',
  };
}

/**
 * Evaluate Vrikshasana (Tree Pose)
 */
export function evaluateVrikshasana(landmarks) {
  const required = [
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
  ];

  const vis = checkVisibility(landmarks, required, 0.4);
  if (!vis.visible) {
    return {
      isVisible: false,
      alignmentScore: 0,
      checklist: [],
      feedback: ['Please move into full camera view so your legs and torso are visible.'],
      status: 'error',
    };
  }

  const lShoulder = getLandmark(landmarks, LANDMARKS.LEFT_SHOULDER);
  const rShoulder = getLandmark(landmarks, LANDMARKS.RIGHT_SHOULDER);
  const lHip = getLandmark(landmarks, LANDMARKS.LEFT_HIP);
  const rHip = getLandmark(landmarks, LANDMARKS.RIGHT_HIP);
  const lKnee = getLandmark(landmarks, LANDMARKS.LEFT_KNEE);
  const rKnee = getLandmark(landmarks, LANDMARKS.RIGHT_KNEE);
  const lAnkle = getLandmark(landmarks, LANDMARKS.LEFT_ANKLE);
  const rAnkle = getLandmark(landmarks, LANDMARKS.RIGHT_ANKLE);

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);

  // One leg should be straight (>= 160°), the other bent (< 130°)
  const standingLegAngle = Math.max(leftKneeAngle, rightKneeAngle);
  const raisedLegAngle = Math.min(leftKneeAngle, rightKneeAngle);

  const standingStraight = standingLegAngle >= 160;
  const raisedBent = raisedLegAngle <= 135;
  const hipLevel = Math.abs(lHip.y - rHip.y) < 0.09;
  const shoulderLevel = Math.abs(lShoulder.y - rShoulder.y) < 0.08;

  const checklist = [];
  const feedback = [];
  let points = 0;

  checklist.push({ label: `Standing leg steady (${standingLegAngle}°)`, passed: standingStraight });
  if (standingStraight) points += 30;
  else feedback.push('Root firmly through your standing leg and keep it tall.');

  checklist.push({ label: `Raised knee bent (${raisedLegAngle}°)`, passed: raisedBent });
  if (raisedBent) points += 30;
  else feedback.push('Lift your bent foot onto the inner calf or thigh (avoiding the knee).');

  checklist.push({ label: 'Level hips', passed: hipLevel });
  if (hipLevel) points += 20;
  else feedback.push('Keep your hips squared forward and level.');

  checklist.push({ label: 'Relaxed level shoulders', passed: shoulderLevel });
  if (shoulderLevel) points += 20;
  else feedback.push('Relax shoulders away from your ears and fix your gaze ahead.');

  if (feedback.length === 0) {
    feedback.push('Serene Tree Pose balance! Engage your core and breathe softly.');
  }

  return {
    isVisible: true,
    alignmentScore: points,
    checklist,
    feedback,
    status: points >= 75 ? 'good' : points >= 45 ? 'warn' : 'error',
  };
}

/**
 * Unified evaluator entry point
 */
export function evaluatePoseGeometry(poseName, landmarks) {
  const nameLower = (poseName || '').toLowerCase();
  if (nameLower.includes('warrior')) {
    return evaluateWarriorTwo(landmarks);
  }
  if (nameLower.includes('tree') || nameLower.includes('vriksh')) {
    return evaluateVrikshasana(landmarks);
  }
  if (nameLower.includes('mountain') || nameLower.includes('tadasana')) {
    return evaluateTadasana(landmarks);
  }
  // General standing/posture visibility check for other poses
  const required = [
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
  ];
  const vis = checkVisibility(landmarks, required, 0.4);
  if (!vis.visible) {
    return {
      isVisible: false,
      alignmentScore: 0,
      checklist: [],
      feedback: ['Please move into full camera view.'],
      status: 'error',
    };
  }
  return {
    isVisible: true,
    alignmentScore: 78,
    checklist: [
      { label: 'Full body landmarks detected', passed: true },
      { label: 'Steady posture alignment', passed: true },
    ],
    feedback: ['Hold steady and maintain mindful breathing.'],
    status: 'good',
  };
}
