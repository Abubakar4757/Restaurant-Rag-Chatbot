import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="flex-none px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-xl z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-tight hidden sm:block">
          Luigi's Assistant
        </h1>
      </div>
      
      <div className="flex bg-slate-900/80 p-1.5 rounded-full border border-slate-800/80 shadow-inner">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'chat' ? 'bg-amber-500 text-slate-950 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          Customer Chat
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'admin' ? 'bg-amber-500 text-slate-950 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          Admin Panel
        </button>
      </div>
    </header>
  );
}
