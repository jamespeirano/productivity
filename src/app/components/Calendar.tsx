'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, setHours, setMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useProjects } from '../contexts/ProjectContext';

export default function Calendar() {
  const { projects, deleteTask, settings } = useProjects();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'agenda' | 'day'>('agenda');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get current hour percentage for the time indicator line
  const getCurrentTimePercentage = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours + minutes / 60) / 24 * 100;
  };

  // Calculate streak for a task
  const getTaskStreak = (task: any) => {
    if (!task.isRoutine || !task.completed) return 0;
    
    const today = new Date();
    let streak = 1;
    let currentDate = new Date(task.dueDate);
    
    // Count backwards from the current date
    while (true) {
      currentDate.setDate(currentDate.getDate() - 1);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Check if this task was completed on this date
      const wasCompletedOnDate = projects
        .find(p => p.id === task.projectId)
        ?.tasks.some(t => 
          t.title === task.title && 
          t.completed && 
          t.dueDate === dateString
        );
      
      if (!wasCompletedOnDate) break;
      streak++;
    }
    
    return streak;
  };

  // Generate week days
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return projects.flatMap(project => 
      project.tasks
        .filter(task => 
          task.dueDate === dateString || task.isRoutine
        )
        .map(task => ({
          ...task,
          projectName: project.name,
          projectId: project.id,
          projectColor: project.color,
          streak: task.isRoutine ? getTaskStreak(task) : 0
        }))
    );
  };

  // Get tasks for selected date
  const selectedDateTasks = getTasksForDate(selectedDate);

  // Generate time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const time = setHours(setMinutes(selectedDate, 0), i);
    return {
      time,
      label: format(time, 'h:mm a'),
      tasks: selectedDateTasks.filter(task => {
        const taskTime = task.plannedTime;
        if (!taskTime) return false;
        const [hours] = taskTime.split(':').map(Number);
        return hours === i;
      })
    };
  });

  // Get all-day tasks (tasks without specific time)
  const allDayTasks = selectedDateTasks.filter(task => !task.plannedTime);

  const renderAgendaView = () => (
    <div className="space-y-4">
      {selectedDateTasks.length > 0 ? (
        selectedDateTasks.map((task) => (
          <div key={task.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-500">
                  {task.estimatedTime} min
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {task.projectId !== 'standalone' && (
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${task.projectColor}20`,
                        color: task.projectColor
                      }}
                    >
                      {task.projectName}
                    </span>
                  )}
                  {task.isRoutine && (
                    <>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Daily
                      </span>
                      <span className={`text-xs ${task.streak > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'} px-2 py-1 rounded-full flex items-center gap-1`}>
                        🔥 {task.streak} day{task.streak !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
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
  );

  const renderDayView = () => (
    <div className="space-y-4">
      {/* All-day tasks section */}
      {allDayTasks.length > 0 && (
        <div className="border-b pb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">All-day</h4>
          <div className="space-y-2">
            {allDayTasks.map(task => (
              <div key={task.id} className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{task.title}</span>
                    {task.projectId !== 'standalone' && (
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${task.projectColor}20`,
                          color: task.projectColor
                        }}
                      >
                        {task.projectName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTask(task.projectId, task.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time slots */}
      <div className="space-y-2 relative">
        {/* Current time indicator */}
        {isSameDay(selectedDate, currentTime) && (
          <div 
            className="absolute left-20 right-0 border-t-2 border-red-500 z-10"
            style={{ 
              top: `${getCurrentTimePercentage()}%`,
              borderColor: 'rgba(239, 68, 68, 0.5)'
            }}
          >
            <div className="absolute -left-20 -top-3 text-xs text-red-500">
              {format(currentTime, 'h:mm a')}
            </div>
          </div>
        )}

        {timeSlots.map(({ time, label, tasks }) => (
          <div key={label} className="flex gap-4">
            <div className="w-20 text-sm text-gray-500">{label}</div>
            <div className="flex-1 min-h-[3rem] border-l pl-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-2 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{task.title}</span>
                      {task.projectId !== 'standalone' && (
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${task.projectColor}20`,
                            color: task.projectColor
                          }}
                        >
                          {task.projectName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.projectId, task.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Calendar header with view toggle and current time */}
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-7 gap-2 flex-1">
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
        <div className="ml-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('agenda')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === 'agenda'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === 'day'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-700">
            Tasks for {format(selectedDate, 'MMM d, yyyy')}
          </h3>
          <div className="text-sm text-gray-500">
            Current time: {format(currentTime, 'h:mm a')} ({settings.timezone})
          </div>
        </div>
        {view === 'agenda' ? renderAgendaView() : renderDayView()}
      </div>
    </div>
  );
} 