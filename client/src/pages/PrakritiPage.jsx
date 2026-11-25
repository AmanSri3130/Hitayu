import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QUESTIONS = [
  {
    id: 1,
    category: 'Body Constitution',
    question: 'How would you best describe your natural physical build?',
    options: [
      { text: 'Light, lean, narrow frame; difficulty gaining weight', dosha: 'Vata' },
      { text: 'Medium, athletic, well-proportioned muscular build', dosha: 'Pitta' },
      { text: 'Solid, sturdy, broader frame; gains weight easily', dosha: 'Kapha' },
    ],
  },
  {
    id: 2,
    category: 'Skin Tendencies',
    question: 'What is the typical nature of your skin?',
    options: [
      { text: 'Dry, thin, cool to the touch, prone to roughness', dosha: 'Vata' },
      { text: 'Warm, sensitive, prone to redness, freckles, or flushing', dosha: 'Pitta' },
      { text: 'Thick, smooth, naturally hydrated, cool and soft', dosha: 'Kapha' },
    ],
  },
  {
    id: 3,
    category: 'Appetite Patterns',
    question: 'How does your daily appetite behave?',
    options: [
      { text: 'Variable or irregular; sometimes I forget to eat', dosha: 'Vata' },
      { text: 'Strong and sharp; I feel irritable if meals are delayed', dosha: 'Pitta' },
      { text: 'Steady and mild; I can comfortably skip a meal', dosha: 'Kapha' },
    ],
  },
  {
    id: 4,
    category: 'Digestion',
    question: 'How does your digestive system typically respond after meals?',
    options: [
      { text: 'Prone to bloating, gas, or occasional dryness', dosha: 'Vata' },
      { text: 'Fast digestion, occasional acidity or warmth', dosha: 'Pitta' },
      { text: 'Slow, steady digestion with a feeling of fullness', dosha: 'Kapha' },
    ],
  },
  {
    id: 5,
    category: 'Sleep Patterns',
    question: 'What best characterizes your sleep quality?',
    options: [
      { text: 'Light, easily interrupted, active dreaming', dosha: 'Vata' },
      { text: 'Moderate, sound, usually wake up alert', dosha: 'Pitta' },
      { text: 'Deep, heavy, prolonged; love sleeping in', dosha: 'Kapha' },
    ],
  },
  {
    id: 6,
    category: 'Energy & Stamina',
    question: 'How do your energy levels flow throughout the day?',
    options: [
      { text: 'Comes in quick bursts, followed by sudden fatigue', dosha: 'Vata' },
      { text: 'Focused, driven, intense productivity', dosha: 'Pitta' },
      { text: 'Slow to start, but steady and enduring stamina', dosha: 'Kapha' },
    ],
  },
  {
    id: 7,
    category: 'Temperature Preference',
    question: 'Which climate and temperature do you feel best in?',
    options: [
      { text: 'I love warmth and sunshine; dislike cold wind', dosha: 'Vata' },
      { text: 'I prefer cool, breezy environments; dislike heat', dosha: 'Pitta' },
      { text: 'I thrive in warm, dry climates; dislike damp cold', dosha: 'Kapha' },
    ],
  },
  {
    id: 8,
    category: 'Mental Style',
    question: 'How do you approach learning and decision-making?',
    options: [
      { text: 'Quick to grasp new ideas, creative, flexible', dosha: 'Vata' },
      { text: 'Analytical, sharp, decisive, goal-oriented', dosha: 'Pitta' },
      { text: 'Thoughtful, methodical, strong long-term memory', dosha: 'Kapha' },
    ],
  },
  {
    id: 9,
    category: 'Stress Response',
    question: 'Under pressure, what emotional tendency arises first?',
    options: [
      { text: 'Worry, restlessness, or feeling overwhelmed', dosha: 'Vata' },
      { text: 'Frustration, impatience, or critical intensity', dosha: 'Pitta' },
      { text: 'Withdrawal, stubbornness, or sluggishness', dosha: 'Kapha' },
    ],
  },
  {
    id: 10,
    category: 'Movement Style',
    question: 'What kind of physical movement feels most natural to you?',
    options: [
      { text: 'Dynamic, varied, light, playful movement', dosha: 'Vata' },
      { text: 'Structured, challenging, purposeful exercise', dosha: 'Pitta' },
      { text: 'Grounded, rhythmic, steady endurance pace', dosha: 'Kapha' },
    ],
  },
];

export default function PrakritiPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await api.get('/assessment/current');
        if (res.data.assessment) {
          setResult(res.data.assessment);
        }
      } catch (err) {
        console.error('Failed to load assessment:', err.message);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchCurrent();
  }, []);

  const currentQuestion = QUESTIONS[currentIdx];

  const handleSelectOption = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        selectedOption: option.text,
        dosha: option.dosha,
      },
    }));
  };

  const handleSubmit = async () => {
    const formatted = Object.values(answers);
    if (formatted.length < QUESTIONS.length) {
      showError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/assessment', { answers: formatted });
      setResult(res.data.assessment);
      await refreshUser();
      showSuccess('Prakriti assessment calculated and saved!');
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
  };

  const chartData = result
    ? [
        { name: 'Vata', value: result.scores.vataPercent, color: '#C6A56B' },
        { name: 'Pitta', value: result.scores.pittaPercent, color: '#D99A50' },
        { name: 'Kapha', value: result.scores.kaphaPercent, color: '#173F35' },
      ]
    : [];

  return (
    <DashboardLayout
      title="Prakriti Assessment"
      subtitle="Discover your traditional Ayurvedic mind-body constitutional tendencies."
    >
      {loadingInitial ? (
        <div className="hitayu-card p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#173F35]" />
        </div>
      ) : result ? (
        /* RESULTS VIEW */
        <div className="space-y-6">
          <div className="hitayu-card p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E9E2] pb-6 mb-8">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0E9] text-[#173F35] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6A56B]" />
                  <span>Constitutional Summary</span>
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#173F35] mt-2">
                  {result.dominantDosha} Constitution
                </h2>
                <p className="text-sm text-[#78847C] mt-1">
                  Secondary tendency: {result.secondaryDosha}
                </p>
              </div>
              <button onClick={handleRetake} className="hitayu-btn-secondary py-2.5 px-5 text-sm">
                <RotateCcw className="w-4 h-4" />
                <span>Retake Assessment</span>
              </button>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" width={60} />
                    <Tooltip formatter={(val) => `${val}%`} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-6 space-y-4">
                {[
                  {
                    name: 'Vata (Space & Air)',
                    pct: result.scores.vataPercent,
                    desc: 'Movement, creativity, nervous system, lightness.',
                  },
                  {
                    name: 'Pitta (Fire & Water)',
                    pct: result.scores.pittaPercent,
                    desc: 'Transformation, digestion, intellect, focus.',
                  },
                  {
                    name: 'Kapha (Earth & Water)',
                    pct: result.scores.kaphaPercent,
                    desc: 'Structure, stability, endurance, nourishment.',
                  },
                ].map((d) => (
                  <div key={d.name} className="p-4 rounded-xl bg-[#F8F6EF] border border-[#E4E9E2]">
                    <div className="flex justify-between font-semibold text-sm text-[#173F35]">
                      <span>{d.name}</span>
                      <span>{d.pct}%</span>
                    </div>
                    <p className="text-xs text-[#78847C] mt-1">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Educational Guidance */}
            {result.educationalNotes && (
              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-[#E4E9E2]">
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-bold text-[#173F35]">Key Tendencies</h4>
                  <ul className="text-sm text-[#78847C] space-y-1.5">
                    {result.educationalNotes.characteristics?.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-bold text-[#173F35]">Dietary Guidance</h4>
                  <ul className="text-sm text-[#78847C] space-y-1.5">
                    {result.educationalNotes.dietaryGuidance?.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-bold text-[#173F35]">Recommended Yoga</h4>
                  <ul className="text-sm text-[#78847C] space-y-1.5">
                    {result.educationalNotes.recommendedYoga?.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-8 p-4 rounded-xl bg-[#E8F0E9]/60 border border-[#A8BDA8]/50 flex items-start gap-3 text-xs text-[#26352F]">
              <Info className="w-4 h-4 text-[#173F35] shrink-0 mt-0.5" />
              <p>
                <strong>Educational Disclaimer:</strong> This is a simplified educational Prakriti
                self-assessment, not a clinically validated medical diagnosis. For health concerns,
                please consult a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE QUESTION WIZARD */
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress */}
          <div className="hitayu-card p-5">
            <div className="flex justify-between text-xs font-semibold text-[#78847C] mb-2">
              <span>
                Question {currentIdx + 1} of {QUESTIONS.length} • {currentQuestion.category}
              </span>
              <span>{Math.round(((currentIdx + 1) / QUESTIONS.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#E8F0E9] overflow-hidden">
              <div
                className="h-full bg-[#173F35] transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="hitayu-card p-6 sm:p-10 space-y-6"
            >
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173F35]">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id]?.dosha === opt.dosha;
                  return (
                    <button
                      key={opt.dosha}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all ${
                        isSelected
                          ? 'bg-[#173F35] text-white border-[#173F35] shadow-sm'
                          : 'bg-[#F8F6EF] text-[#26352F] border-[#E4E9E2] hover:border-[#173F35]/40'
                      }`}
                    >
                      <span className="text-sm sm:text-base font-medium">{opt.text}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#C6A56B] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E4E9E2]">
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="hitayu-btn-secondary py-2.5 px-5 text-sm disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIdx < QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((i) => i + 1)}
                    disabled={!answers[currentQuestion.id]}
                    className="hitayu-btn-primary py-2.5 px-6 text-sm"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!answers[currentQuestion.id] || submitting}
                    className="hitayu-btn-primary py-2.5 px-6 text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Calculating...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Assessment</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
}
