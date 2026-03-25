import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-amber-500/30 overflow-hidden relative">
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(245,158,11,0.2)' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#1e293b' } }
        }} 
      />
      {/* Background Ambience Layer */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-slate-950 to-slate-900 pointer-events-none z-0"></div>
      
      {/* Main Layout Layer */}
      <div className="relative z-10 flex flex-col h-screen max-w-[1920px] mx-auto">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex items-center justify-center p-0 sm:p-6 lg:p-10 hide-scrollbar overflow-hidden">
          <div className="w-full h-full max-w-5xl sm:bg-slate-900/40 sm:backdrop-blur-2xl sm:border border-slate-800/80 sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform-gpu transition-all duration-500">
            {activeTab === 'chat' ? <ChatWidget /> : <AdminPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
