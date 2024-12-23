'use client';

import { useState } from 'react';
import Timer from './components/Timer';
import Stats from './components/Stats';
import TaskList from './components/TaskList';
import Settings from './components/Settings';
import Calendar from './components/Calendar';
import TabNavigation from './components/TabNavigation';
import { SettingsProvider } from './contexts/SettingsContext';
import { ProjectProvider } from './contexts/ProjectContext';

export default function Home() {
  const [stats, setStats] = useState<{ date: string; hours: number; }[]>([]);
  const [activeTab, setActiveTab] = useState('today');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleSessionComplete = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const hours = minutes / 60;
    
    setStats(prevStats => {
      const existingDayIndex = prevStats.findIndex(stat => stat.date === today);
      let newStats;

      if (existingDayIndex >= 0) {
        newStats = [...prevStats];
        newStats[existingDayIndex] = {
          ...newStats[existingDayIndex],
          hours: newStats[existingDayIndex].hours + hours
        };
      } else {
        newStats = [...prevStats, { date: today, hours }];
      }

      localStorage.setItem('pomodoroStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return <TaskList hideAddProject={true} />;
      case 'timer':
        return (
          <div className="space-y-8">
            <Timer 
              onSessionComplete={handleSessionComplete}
              isAddingProject={false}
              onAddProjectClose={() => {}}
            />
            <Stats />
          </div>
        );
      case 'calendar':
        return <Calendar />;
      case 'settings':
        return <Settings isOpen={true} onClose={() => setActiveTab('today')} />;
      default:
        return null;
    }
  };

  return (
    <SettingsProvider>
      <ProjectProvider>
        <main className="min-h-screen bg-gray-100">
          <div className="max-w-4xl mx-auto p-4 pb-24">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === 'today' && 'Tasks'}
                {activeTab === 'timer' && 'Pomodoro Timer'}
                {activeTab === 'calendar' && 'Calendar'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
            </div>

            {renderContent()}
          </div>

          {/* Floating Action Button */}
          {activeTab === 'today' && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="fixed right-6 bottom-20 w-14 h-14 bg-red-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-red-600 transition-colors"
            >
              +
            </button>
          )}

          {/* Task Modal */}
          {isTaskModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Manage Tasks</h2>
                  <button
                    onClick={() => setIsTaskModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <TaskList />
              </div>
            </div>
          )}

          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </main>
      </ProjectProvider>
    </SettingsProvider>
  );
}
