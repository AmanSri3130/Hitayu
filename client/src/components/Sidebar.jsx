import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Sparkles,
  MessageSquareHeart,
  Video,
  CalendarCheck,
  BookOpen,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LotusEmblem, MandalaWatermark } from './IndianMotifs';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'Home Page', icon: Home, to: '/' },
    { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'My Prakriti', icon: Sparkles, to: '/prakriti' },
    { label: 'Ayu AI', icon: MessageSquareHeart, to: '/ayu-ai' },
    { label: 'Yoga Studio', icon: Video, to: '/yoga-ai', badge: 'CV' },
    { label: 'Wellness Planner', icon: CalendarCheck, to: '/planner' },
    { label: 'Knowledge Library', icon: BookOpen, to: '/knowledge' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Backdrop on mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#102E28]/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-[#173F35] text-[#F8F6EF] flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 relative overflow-hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '268px' }}
      >
        <MandalaWatermark className="w-64 h-64 opacity-[0.06] absolute -bottom-16 -right-16 pointer-events-none" />
        {/* Top Branding */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10 relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#244F42] flex items-center justify-center border border-[#C6A56B]/30">
              <LotusEmblem className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-lg font-bold tracking-wide text-[#F8F6EF] leading-none">
                  HITAYU
                </span>
                <span className="text-[11px] text-[#C6A56B]">हितायुः</span>
              </div>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[#A8BDA8] block mt-0.5">
                Wellness Studio
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#244F42] text-white shadow-sm border border-white/10'
                    : 'text-[#A8BDA8] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${active ? 'text-[#C6A56B]' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#C6A56B]/20 text-[#C6A56B] border border-[#C6A56B]/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-[#102E28]/80 border border-white/5">
            <p className="text-xs text-[#A8BDA8] truncate">Signed in as</p>
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Member'}</p>
            {user?.prakritiSummary?.dominantDosha && (
              <p className="text-[11px] text-[#C6A56B] mt-0.5 font-medium">
                Prakriti: {user.prakritiSummary.dominantDosha}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#A8BDA8] hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
