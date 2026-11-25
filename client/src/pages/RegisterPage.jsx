import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LotusEmblem, MandalaWatermark } from '../components/IndianMotifs';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('Not Specified');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, dietaryPreference });
      showSuccess('Account created! Welcome to HitAyu.');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message);
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F8F6EF]">
      {/* Left Botanical Editorial Panel */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#173F35] text-[#F8F6EF] p-12 flex-col justify-between relative overflow-hidden">
        <MandalaWatermark className="w-[460px] h-[460px] opacity-10 absolute -bottom-24 -right-24 pointer-events-none" />

        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-[#244F42] flex items-center justify-center border border-[#C6A56B]/30">
            <LotusEmblem className="w-6 h-6" />
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-wide block leading-none">
              HITAYU
            </span>
            <span className="text-[11px] text-[#C6A56B]">हितायुः</span>
          </div>
        </Link>

        <div className="space-y-6 relative z-10 max-w-md border-l-2 border-[#C6A56B]/50 pl-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C6A56B] font-semibold">
            आयुर्वेद • Personalized Ayurveda
          </p>
          <h2 className="font-serif text-4xl font-bold leading-tight">
            Understand your unique constitution and move with confidence.
          </h2>
          <p className="text-sm text-[#A8BDA8] leading-relaxed">
            Your profile securely stores your Prakriti assessment, daily Dinacharya habits, AI
            conversations, and YogaAI progress in MongoDB Atlas.
          </p>
        </div>

        <p className="text-xs text-[#A8BDA8]/80 relative z-10">
          Ancient Wisdom. Intelligent Wellness. Better Living.
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <LotusEmblem className="w-6 h-6" />
            <span className="font-serif text-xl font-bold text-[#173F35]">HITAYU</span>
          </div>

          <div>
            <h1 className="font-serif text-3xl font-bold text-[#173F35]">Create Your Account</h1>
            <p className="text-sm text-[#78847C] mt-1.5">
              Start with your free personalized wellness profile.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#C85D55]/40 text-sm text-[#9B3B35]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#26352F] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="hitayu-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#26352F] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="hitayu-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#26352F] mb-1.5">
                Dietary Preference (Optional)
              </label>
              <select
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
                className="hitayu-input"
              >
                <option value="Not Specified">Prefer not to say / Flexible</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Sattvic">Sattvic</option>
                <option value="Vegan">Vegan</option>
                <option value="Ayurvedic">Ayurvedic Whole Food</option>
                <option value="Omnivore">Omnivore</option>
                <option value="Gluten-Free">Gluten-Free</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#26352F] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="hitayu-input pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78847C] hover:text-[#173F35]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="hitayu-btn-primary w-full py-3.5 text-base mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#78847C]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#173F35] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
