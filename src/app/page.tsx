'use client';

import { useState } from 'react';
import Calendar from './components/Calendar';
import Timer from './components/Timer';
import Stats from './components/Stats';
import Settings from './components/Settings';
import TaskList from './components/TaskList';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats' | 'settings'>('calendar');
  const [isAddingTask, setIsAddingTask] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'calendar' && 'Calendar'}
            {activeTab === 'stats' && 'Statistics'}
            {activeTab === 'settings' && 'Settings'}
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'stats'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative">
          {activeTab === 'calendar' && <Calendar />}
          {activeTab === 'stats' && (
            <>
              <div className="mb-8">
                <Timer />
              </div>
              <Stats />
            </>
          )}
          {activeTab === 'settings' && <Settings />}

          {/* Floating Action Button */}
          {activeTab !== 'settings' && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="fixed bottom-8 right-8 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 flex items-center justify-center text-2xl z-50"
            >
              +
            </button>
          )}

          {/* Add Task Modal */}
          <TaskList 
            hideAddProject={true} 
            isAddingTask={isAddingTask} 
            onAddTaskClose={() => setIsAddingTask(false)} 
          />
        </div>
      </div>
    </main>
  );
}
