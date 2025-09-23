import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Outlet } from 'react-router-dom';
import AgentFAB from '@/components/agent/AgentFAB';
import AgentChat from '@/components/agent/AgentChat';

const AppLayout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar />
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <AgentFAB onClick={() => setIsChatOpen(true)} />
      <AgentChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default AppLayout;