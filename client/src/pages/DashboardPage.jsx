import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MessageSquareHeart,
  Video,
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  Activity,
  BookOpen,
  Flame,
  Leaf,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, LoadingSkeleton, EmptyState } from '../components/CommonUI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [habits, setHabits] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        await refreshUser();
        const [habitsRes, sessionsRes, knowledgeRes] = await Promise.all([
          api.get('/habits'),
          api.get('/yoga/sessions'),
          api.get('/knowledge?featured=true'),
        ]);
        setHabits(habitsRes.data.habits || []);
        setSessions(sessionsRes.data.sessions || []);
        setKnowledge((knowledgeRes.data.knowledge || []).slice(0, 3));
      } catch (err) {
        console.error('Dashboard fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleHabit = async (habitId) => {
    try {
      const res = await api.post(`/habits/${habitId}/toggle`);
      const updated = res.data.habit;
      setHabits((prev) => prev.map((h) => (h._id === habitId ? updated : h)));
      if (updated.completedToday) {
        showSuccess('Routine marked complete!');
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const prakriti = user?.prakritiSummary;
  const hasPrakriti = Boolean(prakriti?.dominantDosha);
  const completedHabitsToday = habits.filter((h) => h.completedToday).length;
  const totalYogaMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.totalDurationSeconds || 0), 0) / 60
  );

  return (
    <DashboardLayout
      showWellnessImage={false}
      title={`Namaste, ${user?.name?.split(' ')[0] || 'Friend'}.`}
      subtitle={`${getGreeting()} • शुभं भवतु — Your journey toward mindful wellness starts here.`}
      actions={
        <Link to="/yoga-ai" className="hitayu-btn-gold py-2.5 px-5 text-sm">
          <Video className="w-4 h-4" />
          <span>Start YogaAI</span>
        </Link>
      }
    >
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="space-y-8">
          {/* NATURE HEALS — BOTANICAL EDITORIAL HERO BANNER */}
          <div className="relative rounded-3xl overflow-hidden bg-[#F6F5EF] border border-[#E4E9E2] shadow-card">
            <div className="grid lg:grid-cols-12 items-center min-h-[340px]">
              {/* Left Editorial Typography & Actions */}
              <div className="lg:col-span-6 p-7 sm:p-10 space-y-5 relative z-10">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#173F35]">
                  <span className="w-6 h-6 rounded-full bg-[#173F35] text-[#C6A56B] flex items-center justify-center">
                    <Leaf className="w-3.5 h-3.5" />
                  </span>
                  <span>100% Natural • Ayurvedic Wellness</span>
                </div>

                <h2 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-[#173F35] leading-[1.02]">
                  NATURE{' '}
                  <span className="text-[#244F42] font-semibold block sm:inline">HEALS</span>
                </h2>

                <p className="text-sm sm:text-base text-[#26352F]/80 max-w-md leading-relaxed">
                  Ancient Ayurveda for a healthier tomorrow — personalized to your{' '}
                  <span className="font-semibold text-[#173F35]">
                    {hasPrakriti ? `${prakriti.dominantDosha} Prakriti` : 'unique constitution'}
                  </span>
                  .
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to="/knowledge"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#173F35] text-white text-xs font-semibold hover:bg-[#102E28] transition-all shadow-sm"
                  >
                    <span>Explore Ayurveda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/ayu-ai"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#173F35]/30 bg-white/80 text-[#173F35] text-xs font-semibold hover:bg-[#E8F0E9] transition-all"
                  >
                    <span>Consult Ayu AI</span>
                  </Link>
                </div>

                {/* Bottom Mini Feature Pills */}
                <div className="grid sm:grid-cols-2 gap-3 pt-3">
                  <Link
                    to="/prakriti"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E4E9E2] hover:border-[#173F35]/40 transition-all group"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#173F35]">Dosha Balance</p>
                      <p className="text-[11px] text-[#78847C]">
                        {hasPrakriti ? `${prakriti.dominantDosha} Profile` : 'Assess Prakriti'}
                      </p>
                    </div>
                    <span className="w-7 h-7 rounded-full bg-[#E8F0E9] text-[#173F35] flex items-center justify-center group-hover:bg-[#173F35] group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  <Link
                    to="/knowledge"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E4E9E2] hover:border-[#173F35]/40 transition-all group"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#173F35]">Pure Ingredients</p>
                      <p className="text-[11px] text-[#78847C]">Herbs, Shrubs & Recipes</p>
                    </div>
                    <span className="w-7 h-7 rounded-full bg-[#E8F0E9] text-[#173F35] flex items-center justify-center group-hover:bg-[#173F35] group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right Botanical Visual */}
              <div className="lg:col-span-6 relative h-72 lg:h-full min-h-[340px] overflow-hidden">
                <img
                  src="/images/dashboard-cosmic-meditation.png"
                  alt="Meditation beneath a cosmic sky with glowing chakra energy"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#F6F5EF] via-transparent to-transparent lg:w-24" />

                {/* Top-Right Circular Stamp */}
                <div className="hidden sm:flex absolute top-5 right-5 items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E4E9E2] shadow-sm">
                  <div className="w-8 h-8 rounded-full border border-[#173F35]/30 flex items-center justify-center text-[#173F35]">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-[#173F35] leading-tight">
                    Ancient Wisdom
                    <br />
                    Modern Living
                  </div>
                </div>

                {/* Bottom-Right Trust Icons */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#102E28]/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/15">
                  <span className="inline-flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-[#C6A56B]" /> Balance
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#C6A56B]" /> Energy
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3 h-3 text-[#C6A56B]" /> Immunity
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Stats Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Prakriti Profile"
              value={hasPrakriti ? prakriti.dominantDosha : 'Not Assessed'}
              subtitle={hasPrakriti ? 'Constitutional tendency' : 'Take 10-question assessment'}
              icon={Sparkles}
              accentColor="#C6A56B"
            />
            <StatCard
              title="Daily Habits"
              value={`${completedHabitsToday} / ${habits.length}`}
              subtitle="Completed today"
              icon={Calendar}
              accentColor="#173F35"
            />
            <StatCard
              title="Yoga Sessions"
              value={sessions.length}
              subtitle={`${totalYogaMinutes} total minutes practiced`}
              icon={Activity}
              accentColor="#244F42"
            />
            <StatCard
              title="Top Streak"
              value={`${Math.max(0, ...habits.map((h) => h.streakCount || 0))} days`}
              subtitle="Dinacharya consistency"
              icon={Flame}
              accentColor="#D99A50"
            />
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Prakriti Card or Onboarding CTA */}
              {hasPrakriti ? (
                <div className="hitayu-card p-6 sm:p-8 bg-gradient-to-br from-white to-[#F8F6EF]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#C6A56B]">
                        Your Constitution
                      </span>
                      <h2 className="font-serif text-2xl font-bold text-[#173F35] mt-1">
                        {prakriti.dominantDosha} Predominance
                      </h2>
                    </div>
                    <Link
                      to="/prakriti"
                      className="text-sm font-semibold text-[#173F35] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Full Breakdown</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Vata (Air/Space)', val: prakriti.vataPercent, color: '#C6A56B' },
                      { label: 'Pitta (Fire/Water)', val: prakriti.pittaPercent, color: '#D99A50' },
                      { label: 'Kapha (Earth/Water)', val: prakriti.kaphaPercent, color: '#173F35' },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="p-4 rounded-xl bg-white border border-[#E4E9E2]"
                      >
                        <div className="flex justify-between items-center text-xs font-medium text-[#78847C] mb-2">
                          <span>{d.label}</span>
                          <span className="font-bold text-[#173F35]">{d.val}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E8F0E9] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${d.val}%`, backgroundColor: d.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#173F35] text-[#F8F6EF] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-card">
                  <div className="space-y-2 max-w-lg">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A56B]">
                      Onboarding
                    </span>
                    <h2 className="font-serif text-2xl font-bold">
                      Your wellness journey begins here.
                    </h2>
                    <p className="text-sm text-[#A8BDA8] leading-relaxed">
                      Complete our 10-question Prakriti self-assessment to unlock tailored Ayurvedic
                      insights, AI guidance, and yoga posture recommendations.
                    </p>
                  </div>
                  <Link
                    to="/prakriti"
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C6A56B] text-[#102E28] font-semibold hover:bg-[#d3b57f] transition-colors"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Daily Wellness Routine */}
              <div className="hitayu-card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#173F35]">
                      Today's Dinacharya Routine
                    </h3>
                    <p className="text-xs text-[#78847C] mt-0.5">
                      Click any practice to mark it complete for today.
                    </p>
                  </div>
                  <Link
                    to="/planner"
                    className="text-xs font-semibold text-[#173F35] hover:underline"
                  >
                    Manage Habits →
                  </Link>
                </div>

                {habits.length === 0 ? (
                  <p className="text-sm text-[#78847C]">No habits configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {habits.map((habit) => (
                      <button
                        key={habit._id}
                        onClick={() => toggleHabit(habit._id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                          habit.completedToday
                            ? 'bg-[#E8F0E9]/60 border-[#A8BDA8]'
                            : 'bg-white border-[#E4E9E2] hover:border-[#173F35]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {habit.completedToday ? (
                            <CheckCircle2 className="w-5 h-5 text-[#173F35] shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#78847C] shrink-0" />
                          )}
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                habit.completedToday
                                  ? 'line-through text-[#78847C]'
                                  : 'text-[#26352F]'
                              }`}
                            >
                              {habit.title}
                            </p>
                            <p className="text-xs text-[#78847C] mt-0.5">
                              {habit.category} • {habit.targetTime}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#C6A56B] shrink-0">
                          {habit.streakCount || 0}d streak
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Yoga Sessions */}
              <div className="hitayu-card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-xl font-bold text-[#173F35]">
                    Recent YogaAI Sessions
                  </h3>
                  <Link
                    to="/yoga-ai"
                    className="text-xs font-semibold text-[#173F35] hover:underline"
                  >
                    New Practice →
                  </Link>
                </div>

                {sessions.length === 0 ? (
                  <EmptyState
                    icon={Video}
                    title="No YogaAI sessions recorded yet"
                    description="Step into the YogaAI Studio for real-time MediaPipe landmark tracking and alignment feedback."
                    action={
                      <Link to="/yoga-ai" className="hitayu-btn-primary text-sm py-2.5 px-5">
                        Launch Yoga Studio
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 4).map((s) => (
                      <div
                        key={s._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#F8F6EF] border border-[#E4E9E2]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#173F35]">
                            {s.totalPosesCompleted} Pose{s.totalPosesCompleted !== 1 ? 's' : ''}{' '}
                            Completed ({s.difficultyLevel})
                          </p>
                          <p className="text-xs text-[#78847C] mt-0.5">
                            {new Date(s.createdAt).toLocaleDateString()} •{' '}
                            {Math.round(s.totalDurationSeconds)}s duration
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0E9] text-[#173F35]">
                            Alignment: {s.averageAlignmentScore}%
                          </span>
                          <span className="w-8 h-8 rounded-lg bg-[#173F35] text-[#C6A56B] font-bold text-sm flex items-center justify-center">
                            {s.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Ayu AI Shortcut Card */}
              <div className="rounded-2xl bg-[#102E28] text-[#F8F6EF] p-6 space-y-4 shadow-card">
                <div className="w-11 h-11 rounded-xl bg-[#244F42] flex items-center justify-center text-[#C6A56B]">
                  <MessageSquareHeart className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Ask Ayu AI</h3>
                <p className="text-xs text-[#A8BDA8] leading-relaxed">
                  Explore personalized Ayurvedic lifestyle insights grounded in classical texts and
                  your saved Prakriti profile.
                </p>
                <Link
                  to="/ayu-ai"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C6A56B] text-[#102E28] text-sm font-semibold hover:bg-[#d3b57f] transition-colors"
                >
                  <span>Open Ayu AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* YogaAI Card */}
              <div className="hitayu-card p-6 space-y-4 border-[#173F35]/20">
                <div className="w-11 h-11 rounded-xl bg-[#E8F0E9] text-[#173F35] flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#173F35]">YogaAI Studio</h3>
                <p className="text-xs text-[#78847C] leading-relaxed">
                  Practice Warrior II, Mountain Pose, and Tree Pose with live MediaPipe skeletal
                  alignment feedback.
                </p>
                <Link to="/yoga-ai" className="hitayu-btn-secondary w-full py-2.5 text-sm">
                  <span>Practice Now</span>
                </Link>
              </div>

              {/* Educational Suggestions */}
              <div className="hitayu-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-[#173F35]">
                    Recommended Reading
                  </h3>
                  <BookOpen className="w-4 h-4 text-[#78847C]" />
                </div>
                <div className="space-y-3">
                  {knowledge.map((k) => (
                    <Link
                      key={k._id}
                      to="/knowledge"
                      className="block p-3.5 rounded-xl bg-[#F8F6EF] hover:bg-[#E8F0E9]/60 transition-colors"
                    >
                      <span className="text-[10px] font-semibold uppercase text-[#C6A56B]">
                        {k.category}
                      </span>
                      <p className="text-sm font-semibold text-[#173F35] mt-0.5">{k.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
