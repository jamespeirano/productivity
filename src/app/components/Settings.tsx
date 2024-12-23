'use client';

import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(tempSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pomodoro Length (minutes)
          </label>
          <input
            type="number"
            value={tempSettings.pomodoroTime}
            onChange={(e) =>
              setTempSettings({
                ...tempSettings,
                pomodoroTime: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
            onBlur={handleSave}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Break Length (minutes)
          </label>
          <input
            type="number"
            value={tempSettings.shortBreakTime}
            onChange={(e) =>
              setTempSettings({
                ...tempSettings,
                shortBreakTime: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
            onBlur={handleSave}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Long Break Length (minutes)
          </label>
          <input
            type="number"
            value={tempSettings.longBreakTime}
            onChange={(e) =>
              setTempSettings({
                ...tempSettings,
                longBreakTime: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
            onBlur={handleSave}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="1"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
          <p className="text-gray-600">
            The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.
          </p>
        </div>
      </div>
    </div>
  );
} 