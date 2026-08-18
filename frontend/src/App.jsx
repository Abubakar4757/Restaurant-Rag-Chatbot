import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative overflow-x-hidden">
      {/* Toast Notifications Styled to Aura Noir System */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1c1b1b',
            color: '#e5e2e1',
            border: '1px solid rgba(77, 70, 53, 0.4)',
            borderRadius: '9999px',
            fontSize: '13px',
            padding: '8px 16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
          },
          success: {
            iconTheme: {
              primary: '#f2ca50',
              secondary: '#3c2f00'
            }
          },
          error: {
            iconTheme: {
              primary: '#ffb4ab',
              secondary: '#690005'
            }
          }
        }}
      />

      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* View Switcher */}
      <div className="flex-1 flex flex-col w-full h-full">
        {activeTab === 'chat' ? <ChatWidget /> : <AdminPanel />}
      </div>
    </div>
  );
}

export default App;
