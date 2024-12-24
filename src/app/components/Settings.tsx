'use client';

import { useProjects } from '../contexts/ProjectContext';

export default function Settings() {
  const { settings, updateSettings } = useProjects();

  // Get list of all timezones
  const timezones = Intl.supportedValuesOf('timeZone');

  const handleSaveChanges = () => {
    // Settings are saved automatically through updateSettings
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Timer Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={settings.timer.focusDuration}
                onChange={(e) => updateSettings({
                  timer: {
                    ...settings.timer,
                    focusDuration: Math.max(1, parseInt(e.target.value) || 1)
                  }
                })}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={settings.timer.breakDuration}
                onChange={(e) => updateSettings({
                  timer: {
                    ...settings.timer,
                    breakDuration: Math.max(1, parseInt(e.target.value) || 1)
                  }
                })}
                min={1}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Timezone</h3>
          <select
            value={settings.timezone}
            onChange={(e) => updateSettings({ timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
          >
            {timezones.map(timezone => (
              <option key={timezone} value={timezone}>
                {timezone.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Current time in {settings.timezone}: {new Date().toLocaleTimeString('en-US', { timeZone: settings.timezone })}
          </p>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Notifications</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 mr-2"
                checked={settings.notifications.timerCompletion}
                onChange={(e) => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    timerCompletion: e.target.checked
                  }
                })}
              />
              <span className="text-sm text-gray-600">Timer completion</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 mr-2"
                checked={settings.notifications.breakReminders}
                onChange={(e) => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    breakReminders: e.target.checked
                  }
                })}
              />
              <span className="text-sm text-gray-600">Break reminders</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Theme</h3>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={settings.theme}
            onChange={(e) => updateSettings({ 
              theme: e.target.value as 'light' | 'dark' | 'system' 
            })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSaveChanges}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 