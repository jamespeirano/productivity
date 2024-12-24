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
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {activeTab === 'calendar' && '📅 Calendar'}
          {activeTab === 'stats' && '📊 Statistics'}
          {activeTab === 'settings' && '⚙️ Settings'}
        </h1>

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
              className="fixed bottom-24 right-8 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 flex items-center justify-center text-2xl z-50"
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center py-3 px-6 ${
                activeTab === 'calendar'
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">📅</span>
              <span className="text-sm">Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center py-3 px-6 ${
                activeTab === 'stats'
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">📊</span>
              <span className="text-sm">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center py-3 px-6 ${
                activeTab === 'settings'
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">⚙️</span>
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
