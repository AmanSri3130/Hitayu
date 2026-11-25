import React, { useState } from 'react';
import { Menu, Leaf } from 'lucide-react';
import Sidebar from './Sidebar';
import { SanskritDivider } from './IndianMotifs';

export default function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
  showWellnessImage = true,
}) {
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
          {showWellnessImage && (
            <div className="relative mb-8 min-h-40 sm:min-h-48 overflow-hidden rounded-3xl bg-[#102E28]">
              <img
                src="/images/dashboard-cosmic-meditation.png"
                alt="Meditation beneath a cosmic sky with glowing chakra energy"
                className="absolute inset-y-0 right-0 h-full w-auto max-w-[58%] object-contain object-right"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#102E28] via-[#102E28]/85 to-transparent" />
              <div className="relative z-10 flex min-h-40 sm:min-h-48 items-center p-5 sm:p-8">
                <p className="max-w-xs font-serif text-2xl sm:text-3xl font-semibold leading-tight text-[#F8F6EF]">
                  Find your balance, one mindful moment at a time.
                </p>
              </div>
            </div>
          )}

          {(title || subtitle || actions) && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
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
              <SanskritDivider label="सर्वे भवन्तु सुखिनः" className="mb-8" />
            </>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
