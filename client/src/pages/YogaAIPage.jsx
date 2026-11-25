import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Timer,
  Award,
  ArrowLeft,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  evaluatePoseGeometry,
  extractClassifierFeatures,
  smoothPosePredictions,
} from '../services/poseEvaluation';

const DEFAULT_POSES = [
  {
    id: 75,
    name: 'Warrior II',
    sanskritName: 'Virabhadrasana II',
    difficulty: 'beginner',
    classifierClass: 75,
    targetHoldSeconds: 15,
    instructions: [
      'Step feet wide apart (3–4 feet) and turn your front foot out 90 degrees.',
      'Bend the front knee directly over the ankle while keeping the back leg straight.',
      'Extend both arms horizontally at shoulder height, palms facing down.',
      'Keep your torso centered and gaze steadily over your front fingertips.',
    ],
    safety:
      'Keep the front knee aligned over the second toe; avoid letting it collapse inward.',
  },
  {
    id: 0,
    name: 'Mountain Pose',
    sanskritName: 'Tadasana',
    difficulty: 'beginner',
    classifierClass: null,
    targetHoldSeconds: 15,
    instructions: [
      'Stand with feet hip-width apart or together, grounding evenly through all four corners.',
      'Engage thighs gently, lengthen your tailbone toward the floor, and lift your chest.',
      'Relax shoulders down and back with arms resting calmly at your sides.',
      'Keep your chin parallel to the floor and lengthen through the crown of your head.',
    ],
    safety: 'Maintain a subtle micro-bend in your knees rather than locking the joints.',
  },
  {
    id: 68,
    name: 'Tree Pose',
    sanskritName: 'Vrikshasana',
    difficulty: 'beginner',
    classifierClass: 68,
    targetHoldSeconds: 15,
    instructions: [
      'Ground firmly through one standing leg and engage your core.',
      'Place the sole of the opposite foot onto your inner calf or upper inner thigh.',
      'Bring palms together at heart center or reach arms upward.',
      'Fix your gaze on a steady focal point ahead.',
    ],
    safety: 'Never press the raised foot directly against the side of the standing knee joint.',
  },
];

export default function YogaAIPage() {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // Pose catalog
  const [poses, setPoses] = useState(DEFAULT_POSES);
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [holdTarget, setHoldTarget] = useState(15);

  // Camera & MediaPipe state
  const [cameraActive, setCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [personDetected, setPersonDetected] = useState(false);

  // Real-time evaluation state
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [checklist, setChecklist] = useState([]);
  const [feedback, setFeedback] = useState([
    'Start your camera and step into full view to begin.',
  ]);
  const [evalStatus, setEvalStatus] = useState('idle'); // idle | good | warn | error
  const [classifierPrediction, setClassifierPrediction] = useState(null);

  // Session & Hold Timer state
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [completedPoses, setCompletedPoses] = useState([]);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [savingSession, setSavingSession] = useState(false);

  // Refs for high-frequency CV loop
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const scoreBufferRef = useRef([]);
  const isPausedRef = useRef(false);
  const currentPoseRef = useRef(poses[0]);
  const lastInferenceTimeRef = useRef(0);
  const poseCompletedLockRef = useRef(false);
  const sessionStartRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    currentPoseRef.current = poses[currentPoseIdx];
    setHoldSeconds(0);
    poseCompletedLockRef.current = false;
    scoreBufferRef.current = [];
  }, [currentPoseIdx, poses]);

  // Fetch verified pose catalog from backend
  useEffect(() => {
    const loadPoses = async () => {
      try {
        const res = await api.get('/yoga/poses');
        if (res.data.supportedPoses?.length > 0) {
          setPoses(res.data.supportedPoses);
        }
      } catch (err) {
        console.warn('Using local pose catalog fallback:', err.message);
      }
    };
    loadPoses();
  }, []);

  // Initialize MediaPipe PoseLandmarker
  const initPoseLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setModelLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      landmarkerRef.current = landmarker;
      return landmarker;
    } catch (err) {
      console.error('MediaPipe init error:', err);
      throw new Error(
        'Could not load MediaPipe Pose Landmarker model. Check your internet connection.'
      );
    } finally {
      setModelLoading(false);
    }
  };

  // Cleanup function
  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPersonDetected(false);
    setIsPaused(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [stopCamera]);

  // Session & Hold Timers
  useEffect(() => {
    if (!cameraActive || isPaused || sessionSummary) return;

    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);

      // Increment hold timer only when person is detected and alignment >= 65%
      if (personDetected && alignmentScore >= 65 && !poseCompletedLockRef.current) {
        setHoldSeconds((prev) => {
          const next = prev + 1;
          if (next >= holdTarget) {
            poseCompletedLockRef.current = true;
            handlePoseCompleted(currentPoseRef.current, alignmentScore);
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cameraActive, isPaused, personDetected, alignmentScore, holdTarget, sessionSummary]);

  const handlePoseCompleted = (pose, score) => {
    try {
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    setCompletedPoses((prev) => {
      const already = prev.find((p) => p.poseName === pose.name);
      if (already) return prev;
      return [
        ...prev,
        {
          poseIndex: pose.id,
          poseName: pose.name,
          sanskritName: pose.sanskritName,
          difficulty: pose.difficulty || 'beginner',
          targetHoldDuration: holdTarget,
          actualHoldDuration: holdTarget,
          classificationConfidence: classifierPrediction?.confidence || score,
          alignmentScore: score,
        },
      ];
    });

    showSuccess(`Great hold! ${pose.name} completed!`);

    // Advance automatically if more poses remain
    setTimeout(() => {
      setCurrentPoseIdx((idx) => (idx < poses.length - 1 ? idx + 1 : idx));
    }, 1500);
  };

  // Detection loop
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || !streamRef.current) return;

    if (!isPausedRef.current && video.readyState >= 2) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nowMs = performance.now();
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        const results = landmarker.detectForVideo(video, nowMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const lm = results.landmarks[0];
          setPersonDetected(true);

          // Draw skeletal overlay
          const drawingUtils = new DrawingUtils(ctx);
          drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
            color: '#A8BDA8',
            lineWidth: 3,
          });
          drawingUtils.drawLandmarks(lm, {
            color: '#C6A56B',
            fillColor: '#173F35',
            lineWidth: 2,
            radius: 4,
          });

          // Geometric pose evaluation
          const targetPose = currentPoseRef.current;
          const evalResult = evaluatePoseGeometry(targetPose.name, lm);

          if (!evalResult.isVisible) {
            setAlignmentScore(0);
            setChecklist([]);
            setFeedback(evalResult.feedback);
            setEvalStatus('error');
          } else {
            const { buffer, smoothed } = smoothPosePredictions(
              scoreBufferRef.current,
              evalResult.alignmentScore,
              6
            );
            scoreBufferRef.current = buffer;
            setAlignmentScore(smoothed);
            setChecklist(evalResult.checklist);
            setFeedback(evalResult.feedback);
            setEvalStatus(evalResult.status);
          }

          // Throttled SVM inference call every 1.2s when pose has a classifierClass
          if (
            targetPose.classifierClass !== null &&
            nowMs - lastInferenceTimeRef.current > 1200
          ) {
            lastInferenceTimeRef.current = nowMs;
            const features = extractClassifierFeatures(lm);
            if (features) {
              api
                .post('/yoga/infer', {
                  features,
                  targetPoseIndex: targetPose.classifierClass,
                })
                .then((res) => {
                  if (res.data?.success) {
                    setClassifierPrediction({
                      poseName: res.data.poseName,
                      confidence: res.data.targetConfidence ?? res.data.predictedConfidence,
                    });
                  }
                })
                .catch(() => {});
            }
          }
        } else {
          setPersonDetected(false);
          setAlignmentScore(0);
          setFeedback(['Please move into full camera view.']);
          setEvalStatus('error');
        }
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setSessionSummary(null);

    try {
      await initPoseLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      sessionStartRef.current = new Date();
      setSessionSeconds(0);
      setCompletedPoses([]);
      setCameraActive(true);
      setIsPaused(false);
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      console.error('Camera start failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission denied. Please allow camera access in your browser settings to practice YogaAI.'
        );
      } else if (err.name === 'NotFoundError') {
        setCameraError('No webcam device found on this system.');
      } else {
        setCameraError(err.message || 'Unable to start camera.');
      }
      stopCamera();
    }
  };

  const handleEndSession = async () => {
    stopCamera();

    // Ensure at least current pose is recorded if held >= 3s
    let finalPoses = [...completedPoses];
    if (finalPoses.length === 0 && sessionSeconds > 3) {
      const cur = poses[currentPoseIdx];
      finalPoses.push({
        poseIndex: cur.id,
        poseName: cur.name,
        sanskritName: cur.sanskritName,
        difficulty: cur.difficulty || 'beginner',
        targetHoldDuration: holdTarget,
        actualHoldDuration: holdSeconds,
        classificationConfidence: classifierPrediction?.confidence || alignmentScore,
        alignmentScore: alignmentScore || 70,
      });
    }

    if (finalPoses.length === 0) {
      showInfo('Session ended without completed poses.');
      return;
    }

    const summaryData = {
      startTime: sessionStartRef.current || new Date(),
      endTime: new Date(),
      totalDurationSeconds: Math.max(sessionSeconds, 1),
      difficultyLevel: 'beginner',
      completedPoses: finalPoses,
    };

    if (isAuthenticated) {
      setSavingSession(true);
      try {
        const res = await api.post('/yoga/sessions', summaryData);
        setSessionSummary(res.data.session);
        showSuccess('YogaAI session saved to your wellness history!');
      } catch (err) {
        showError(err.message);
      } finally {
        setSavingSession(false);
      }
    } else {
      setSessionSummary({
        ...summaryData,
        totalPosesCompleted: finalPoses.length,
        averageAlignmentScore: Math.round(
          finalPoses.reduce((a, b) => a + b.alignmentScore, 0) / finalPoses.length
        ),
        grade: 'A',
      });
      showInfo('Sign in to save your YogaAI sessions permanently.');
    }
  };

  const currentPose = poses[currentPoseIdx] || poses[0];

  return (
    <div className="min-h-screen bg-[#102E28] text-[#F8F6EF] flex flex-col">
      {/* Studio Top Bar */}
      <header className="px-6 py-4 bg-[#173F35] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A8BDA8] hover:text-white transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white leading-none">
                Your Personal Yoga Studio
              </h1>
              <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[11px] bg-[#C6A56B]/20 text-[#C6A56B] border border-[#C6A56B]/30">
                योगः कर्मसु कौशलम्
              </span>
            </div>
            <p className="text-xs text-[#A8BDA8] mt-1">
              Move mindfully. Align naturally. Improve with every practice.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F8F6EF] text-xs font-medium transition-colors"
          >
            Home
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-full bg-[#244F42] hover:bg-[#2d6252] text-[#C6A56B] text-xs font-semibold border border-[#C6A56B]/30 transition-colors"
            >
              Dashboard
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#102E28] border border-white/10 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                cameraActive && personDetected
                  ? 'bg-emerald-400 animate-pulse'
                  : cameraActive
                  ? 'bg-amber-400'
                  : 'bg-white/30'
              }`}
            />
            <span className="text-[#E8F0E9]">
              {cameraActive
                ? personDetected
                  ? 'Landmarks Active'
                  : 'Searching for Body'
                : 'Camera Off'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: LIVE WEBCAM + SKELETON OVERLAY */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden bg-[#0A1F1B] border border-white/10 aspect-video shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover -scale-x-100 ${
                cameraActive ? 'block' : 'hidden'
              }`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none ${
                cameraActive ? 'block' : 'hidden'
              }`}
            />

            {!cameraActive && !cameraError && (
              <div className="text-center p-8 space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-[#173F35] text-[#C6A56B] flex items-center justify-center mx-auto border border-white/10">
                  {modelLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Video className="w-8 h-8" />
                  )}
                </div>
                <h3 className="font-serif text-2xl font-semibold text-white">
                  {modelLoading ? 'Loading MediaPipe Vision...' : 'Ready for Mindful Practice'}
                </h3>
                <p className="text-xs text-[#A8BDA8] leading-relaxed">
                  All video processing happens locally inside your browser. Zero video frames are
                  ever uploaded or stored.
                </p>
                <button
                  onClick={startCamera}
                  disabled={modelLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C6A56B] text-[#102E28] font-semibold hover:bg-[#d3b57f] transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {cameraError && (
              <div className="text-center p-8 space-y-4 max-w-md">
                <VideoOff className="w-12 h-12 text-[#C85D55] mx-auto" />
                <p className="text-sm text-[#F8F6EF] font-medium">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  Retry Camera Access
                </button>
              </div>
            )}

            {/* Live Overlay Badge */}
            {cameraActive && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                    evalStatus === 'good'
                      ? 'bg-emerald-950/80 border-emerald-400/40 text-emerald-200'
                      : evalStatus === 'warn'
                      ? 'bg-amber-950/80 border-amber-400/40 text-amber-200'
                      : 'bg-red-950/80 border-red-400/40 text-red-200'
                  }`}
                >
                  Alignment: {alignmentScore}%
                </div>

                {holdSeconds > 0 && (
                  <div className="px-3.5 py-1.5 rounded-full bg-[#173F35]/90 border border-[#C6A56B]/50 text-[#C6A56B] text-xs font-bold">
                    Holding: {holdSeconds}s / {holdTarget}s
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#173F35] p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2.5">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={modelLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C6A56B] text-[#102E28] text-sm font-semibold hover:bg-[#d3b57f] transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Practice</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={handleEndSession}
                    disabled={savingSession}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C85D55] hover:bg-[#b54e47] text-white text-sm font-semibold"
                  >
                    <Square className="w-4 h-4" />
                    <span>{savingSession ? 'Saving...' : 'End & Save'}</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-[#A8BDA8]">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-[#C6A56B]" />
                <span>
                  Session: {Math.floor(sessionSeconds / 60)}:
                  {String(sessionSeconds % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#C6A56B]" />
                <span>
                  Poses: {completedPoses.length} / {poses.length}
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-[11px] text-[#A8BDA8]">
            <ShieldAlert className="w-4 h-4 text-[#C6A56B] shrink-0 mt-0.5" />
            <p>
              YogaAI provides educational pose recognition and general movement feedback. It is not
              a substitute for a qualified yoga instructor or medical advice. Practice within your
              comfort level and stop if you experience pain.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: POSTURE GUIDANCE & FEEDBACK */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pose Header & Navigation */}
          <div className="bg-[#173F35] rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#244F42] text-[#C6A56B] text-xs font-semibold uppercase tracking-wider">
                Pose {currentPoseIdx + 1} of {poses.length} • {currentPose.difficulty}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPoseIdx((i) => Math.max(0, i - 1))}
                  disabled={currentPoseIdx === 0}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 disabled:opacity-30"
                  aria-label="Previous Pose"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPoseIdx((i) => Math.min(poses.length - 1, i + 1))}
                  disabled={currentPoseIdx === poses.length - 1}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 disabled:opacity-30"
                  aria-label="Next Pose"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-3xl font-bold text-white">{currentPose.name}</h2>
              <p className="text-sm italic text-[#C6A56B] mt-0.5">{currentPose.sanskritName}</p>
            </div>

            {/* Reference Image if available */}
            {currentPose.image && currentPose.classifierClass !== null && (
              <div className="rounded-2xl overflow-hidden bg-[#102E28] border border-white/10 h-40 flex items-center justify-center">
                <img
                  src={currentPose.image}
                  alt={currentPose.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Live Feedback Box */}
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                evalStatus === 'good'
                  ? 'bg-emerald-950/50 border-emerald-400/30'
                  : evalStatus === 'warn'
                  ? 'bg-amber-950/50 border-amber-400/30'
                  : 'bg-[#102E28] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#C6A56B] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Alignment Feedback</span>
                </span>
                {classifierPrediction && (
                  <span className="text-[#A8BDA8]">
                    SVM Match: {classifierPrediction.confidence}%
                  </span>
                )}
              </div>

              <ul className="text-xs text-[#E8F0E9] space-y-1">
                {feedback.map((f, idx) => (
                  <li key={idx}>• {f}</li>
                ))}
              </ul>

              {checklist.length > 0 && (
                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          item.passed ? 'text-emerald-400' : 'text-white/25'
                        }`}
                      />
                      <span className={item.passed ? 'text-white' : 'text-white/50'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8BDA8]">
                Alignment Steps
              </h4>
              <ol className="text-xs text-[#E8F0E9]/85 space-y-1.5 list-decimal list-inside leading-relaxed">
                {currentPose.instructions?.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ol>
            </div>

            {/* Safety Precaution */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{currentPose.safety}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Session Completion Modal */}
      {sessionSummary && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#173F35] border border-white/15 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#C6A56B]/20 text-[#C6A56B] flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-white">Practice Complete!</h2>
            <p className="text-sm text-[#A8BDA8]">
              You practiced for {sessionSummary.totalDurationSeconds} seconds and completed{' '}
              {sessionSummary.totalPosesCompleted} posture(s).
            </p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-4 rounded-xl bg-[#102E28]">
                <p className="text-xs text-[#A8BDA8]">Avg Alignment</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {sessionSummary.averageAlignmentScore}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#102E28]">
                <p className="text-xs text-[#A8BDA8]">Session Grade</p>
                <p className="text-xl font-bold text-[#C6A56B] mt-0.5">{sessionSummary.grade}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSessionSummary(null)}
                className="flex-1 py-3 rounded-xl border border-white/20 text-sm font-medium hover:bg-white/10"
              >
                Practice Again
              </button>
              <Link
                to={isAuthenticated ? '/dashboard' : '/'}
                className="flex-1 py-3 rounded-xl bg-[#C6A56B] text-[#102E28] text-sm font-semibold hover:bg-[#d3b57f]"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Home'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
