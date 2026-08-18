import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-surface/60 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 shadow-[0px_0px_15px_rgba(242,202,80,0.1)]">
      <div className="flex justify-between items-center h-16 px-4 md:px-12 max-w-[1200px] mx-auto">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center shadow-inner group-hover:border-primary/50 transition-colors">
            <span className="material-symbols-outlined text-primary text-lg" data-weight="fill">
              robot_2
            </span>
          </div>
          <span className="font-headline-md text-lg md:text-xl font-semibold text-primary tracking-tight">
            Luigi's Assistant
          </span>
        </div>

        {/* Central Pill Toggle (Desktop) */}
        <div className="hidden md:flex bg-surface-container-high rounded-full p-1 border border-outline-variant/20">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-2 rounded-full transition-all duration-300 font-label-caps text-label-caps active:scale-95 ${
              activeTab === 'chat'
                ? 'bg-primary text-on-primary shadow-[0px_0px_12px_rgba(242,202,80,0.25)] font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-primary-fixed/10 hover:shadow-[0px_0px_12px_rgba(242,202,80,0.15)]'
            }`}
          >
            Customer Assistant
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-6 py-2 rounded-full transition-all duration-300 font-label-caps text-label-caps active:scale-95 flex items-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-primary text-on-primary shadow-[0px_0px_12px_rgba(242,202,80,0.25)] font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-primary-fixed/10 hover:shadow-[0px_0px_12px_rgba(242,202,80,0.15)]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            Admin Center
          </button>
        </div>

        {/* Mobile Pill Toggle */}
        <div className="md:hidden flex bg-surface-container-high rounded-full p-1 border border-outline-variant/20">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-full transition-all duration-300 font-label-caps text-[11px] active:scale-95 ${
              activeTab === 'chat'
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-full transition-all duration-300 font-label-caps text-[11px] active:scale-95 ${
              activeTab === 'admin'
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Right Spacer for balance on desktop */}
        <div className="w-8 h-8 hidden md:block"></div>
      </div>
    </nav>
  );
}
