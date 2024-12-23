'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useProjects } from '../contexts/ProjectContext';

export default function Calendar() {
  const { projects, deleteTask } = useProjects();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week days
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return projects.flatMap(project => 
      project.tasks
        .filter(task => 
          // Include task if:
          // 1. It's due on this date OR
          // 2. It's a routine task
          task.dueDate === dateString || task.isRoutine
        )
        .map(task => ({
          ...task,
          projectName: project.name,
          projectId: project.id
        }))
    );
  };

  // Get tasks for selected date
  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
          {weekDays.map((date) => {
            const tasksForDay = getTasksForDate(date);
            return (
              <div
                key={date.toString()}
                className={`p-2 text-center rounded-md cursor-pointer transition-colors ${
                  isSameDay(date, selectedDate)
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="font-medium">{format(date, 'd')}</div>
                <div className="text-xs mt-1">
                  {tasksForDay.length} tasks
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-3">
          Tasks for {format(selectedDate, 'MMM d, yyyy')}
        </h3>
        <div className="space-y-4">
          {selectedDateTasks.length > 0 ? (
            selectedDateTasks.map((task) => (
              <div key={task.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-500">
                      Goal: {task.projectName} • {task.estimatedTime} min
                      {task.plannedTime !== 'Unset time' && ` • ${task.plannedTime}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.projectId, task.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tasks scheduled for this date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 