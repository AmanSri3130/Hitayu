import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LotusEmblem, MandalaWatermark } from '../components/IndianMotifs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      showSuccess('Welcome back to HitAyu!');
      navigate(from, { replace: true });
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
          <div className="w-20 h-28 rounded-2xl overflow-hidden border border-[#C6A56B]/50 shadow-lg bg-[#F8F6EF] p-1">
            <img
              src="/images/sacred-lotus-om.jpg"
              alt="Sacred Golden Lotus and Om"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#C6A56B] font-semibold">
            स्वस्थस्य स्वास्थ्य रक्षणम्
          </p>
          <h2 className="font-serif text-4xl font-bold leading-tight">
            Balance is not something you find. It is something you cultivate.
          </h2>
          <p className="text-sm text-[#A8BDA8] leading-relaxed">
            Sign in to access your Prakriti constitution profile, personal Dinacharya routines, Ayu
            AI guidance, and YogaAI posture studio.
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
            <h1 className="font-serif text-3xl font-bold text-[#173F35]">Welcome Back</h1>
            <p className="text-sm text-[#78847C] mt-1.5">
              Sign in to continue your holistic wellness journey.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#C85D55]/40 text-sm text-[#9B3B35]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
              className="hitayu-btn-primary w-full py-3.5 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#78847C]">
            New to HitAyu?{' '}
            <Link to="/register" className="font-semibold text-[#173F35] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
