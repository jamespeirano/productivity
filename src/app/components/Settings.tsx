'use client';

import { useProjects } from '../contexts/ProjectContext';

export default function Settings() {
  const { settings, updateSettings } = useProjects();

  // Get list of all timezones
  const timezones = Intl.supportedValuesOf('timeZone');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
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
      </div>
    </div>
  );
} 