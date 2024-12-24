'use client';

import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
      
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
                defaultValue={25}
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
                defaultValue={5}
                min={1}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Notifications</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 mr-2"
                defaultChecked
              />
              <span className="text-sm text-gray-600">Timer completion</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 mr-2"
                defaultChecked
              />
              <span className="text-sm text-gray-600">Break reminders</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Theme</h3>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 