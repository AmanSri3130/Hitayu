import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Flame, RotateCcw, Calendar } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/CommonUI';

export default function PlannerPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Dinacharya');
  const [newTime, setNewTime] = useState('Morning');

  const { showSuccess, showError } = useToast();

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/habits');
      setHabits(res.data.habits || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.post('/habits', {
        title: newTitle.trim(),
        category: newCategory,
        targetTime: newTime,
      });
      setHabits((prev) => [...prev, { ...res.data.habit, completedToday: false }]);
      setNewTitle('');
      showSuccess('New habit added to your Dinacharya!');
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleHabit = async (id) => {
    try {
      const res = await api.post(`/habits/${id}/toggle`);
      setHabits((prev) => prev.map((h) => (h._id === id ? res.data.habit : h)));
    } catch (err) {
      showError(err.message);
    }
  };

  const handleResetDefaults = async () => {
    try {
      await api.post('/habits/init-defaults');
      await fetchHabits();
      showSuccess('Classical Dinacharya habits restored.');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <DashboardLayout
      title="Wellness Planner & Dinacharya"
      subtitle="Build consistent daily habits aligned with Ayurvedic circadian rhythms."
      actions={
        <button onClick={handleResetDefaults} className="hitayu-btn-secondary py-2 px-4 text-xs">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      }
    >
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Add Habit Form */}
        <div className="lg:col-span-4">
          <form onSubmit={handleAddHabit} className="hitayu-card p-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#173F35]">Add Daily Practice</h3>
            <div>
              <label className="block text-xs font-semibold text-[#78847C] uppercase mb-1.5">
                Practice Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., 10 min Mindful Walking"
                className="hitayu-input text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#78847C] uppercase mb-1.5">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="hitayu-input text-sm"
                >
                  <option value="Dinacharya">Dinacharya</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Pranayama">Pranayama</option>
                  <option value="Diet">Diet</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Mindfulness">Mindfulness</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#78847C] uppercase mb-1.5">
                  Time of Day
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="hitayu-input text-sm"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Before Bed">Before Bed</option>
                </select>
              </div>
            </div>

            <button type="submit" className="hitayu-btn-primary w-full py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              <span>Add to Routine</span>
            </button>
          </form>
        </div>

        {/* Habit List */}
        <div className="lg:col-span-8">
          <div className="hitayu-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E9E2] pb-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#173F35]" />
                <h3 className="font-serif text-xl font-bold text-[#173F35]">Today's Checklist</h3>
              </div>
              <span className="text-xs font-semibold text-[#78847C]">
                {habits.filter((h) => h.completedToday).length} of {habits.length} completed
              </span>
            </div>

            {loading ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div
                    key={habit._id}
                    onClick={() => toggleHabit(habit._id)}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      habit.completedToday
                        ? 'bg-[#E8F0E9]/70 border-[#A8BDA8]'
                        : 'bg-white border-[#E4E9E2] hover:border-[#173F35]/40'
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
                          className={`text-sm font-semibold ${
                            habit.completedToday ? 'line-through text-[#78847C]' : 'text-[#26352F]'
                          }`}
                        >
                          {habit.title}
                        </p>
                        <p className="text-xs text-[#78847C]">
                          {habit.category} • {habit.targetTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F6EF] text-xs font-semibold text-[#173F35]">
                      <Flame className="w-3.5 h-3.5 text-[#D99A50]" />
                      <span>{habit.streakCount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
