'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useProjects } from '../contexts/ProjectContext';

export default function Calendar() {
  const { projects } = useProjects();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week days
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Calendar</h2>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
          {weekDays.map((date) => (
            <div
              key={date.toString()}
              className={`p-2 text-center rounded-md cursor-pointer transition-colors ${
                isSameDay(date, new Date())
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className="font-medium">{format(date, 'd')}</div>
              <div className="text-xs mt-1">
                {projects.reduce((count, project) => 
                  count + project.tasks.filter(task => !task.completed).length, 0
                )} tasks
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-3">
          Daily Goals Progress - {format(selectedDate, 'MMM d, yyyy')}
        </h3>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{project.name}</span>
                <span className="text-sm text-gray-600">
                  {project.dailyTimeSpent.toFixed(1)} / {project.dailyGoalHours} hours
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 rounded-full h-2 transition-all"
                  style={{
                    width: `${Math.min(
                      (project.dailyTimeSpent / project.dailyGoalHours) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {project.dailyGoalHours > 0
                  ? `${Math.max(
                      0,
                      project.dailyGoalHours - project.dailyTimeSpent
                    ).toFixed(1)} hours left today`
                  : 'No daily goal set'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 