import React, { useState } from 'react';
import { Menu, Leaf } from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, title, subtitle, actions }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8F6EF]">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden h-16 px-4 bg-[#173F35] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Leaf className="w-5 h-5 text-[#C6A56B]" />
            <span className="font-serif font-bold tracking-wide">HITAYU</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {(title || subtitle || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                {title && (
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173F35] tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm sm:text-base text-[#78847C] mt-1">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
