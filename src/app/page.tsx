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
  const [isAddingProject, setIsAddingProject] = useState(false);

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
        return (
          <div className="space-y-8">
            <Timer 
              onSessionComplete={handleSessionComplete}
              isAddingProject={isAddingProject}
              onAddProjectClose={() => setIsAddingProject(false)}
            />
            <Stats />
          </div>
        );
      case 'calendar':
        return <Calendar />;
      case 'tasks':
        return <TaskList />;
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
                {activeTab === 'today' && 'Pomodoro Timer'}
                {activeTab === 'calendar' && 'Calendar'}
                {activeTab === 'tasks' && 'Tasks & Projects'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
            </div>

            {renderContent()}
          </div>

          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </main>
      </ProjectProvider>
    </SettingsProvider>
  );
}
