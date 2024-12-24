'use client';

import React, { useState, useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Task, Project } from '../contexts/ProjectContext';

export default function Timer() {
  const { projects, setCurrentTask, updateTask } = useProjects();
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const currentTask = projects
    .flatMap((project: Project) => project.tasks)
    .find((task: Task) => task.isCurrent);

  const currentProject = currentTask
    ? projects.find((project: Project) => project.id === currentTask.projectId)
    : null;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'focus' && currentTask) {
        // Update task progress
        updateTask(currentTask.projectId, currentTask.id, {
          ...currentTask,
          completedTime: currentTask.completedTime + 25,
          completedPomodoros: currentTask.completedPomodoros + 1
        });
      }
      // Switch modes
      setMode(mode === 'focus' ? 'break' : 'focus');
      setTimeLeft(mode === 'focus' ? 5 * 60 : 25 * 60);
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, currentTask, updateTask]);

  const toggleTimer = () => {
    if (!isRunning && !currentTask) {
      alert('Please select a task before starting the timer');
      return;
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getBackgroundColor = () => {
    switch (mode) {
      case 'focus':
        return 'bg-red-500';
      case 'break':
        return 'bg-green-500';
    }
  };

  const getTimerMessage = () => {
    if (!currentTask) return 'Select a task to start working';
    
    const remainingPomodoros = Math.ceil((currentTask.estimatedTime - currentTask.completedTime) / 25);
    let message = `${remainingPomodoros} pomodoro${remainingPomodoros !== 1 ? 's' : ''} to complete`;
    
    if (currentTask.isRoutine && currentTask.streak > 0) {
      message += ` • Continue your ${currentTask.streak} day streak! 🔥`;
    }
    
    return message;
  };

  return (
    <div className={`${getBackgroundColor()} rounded-lg shadow-lg p-8 text-white`}>
      <div className="text-center">
        <div className="text-8xl font-bold mb-8">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={toggleTimer}
            className="px-8 py-3 bg-white text-gray-800 rounded-md text-xl font-semibold hover:bg-white/90 transition-colors"
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-8 py-3 bg-white/10 rounded-md text-xl font-semibold hover:bg-white/20 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setMode('focus');
              setTimeLeft(25 * 60);
              setIsRunning(false);
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              mode === 'focus'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => {
              setMode('break');
              setTimeLeft(5 * 60);
              setIsRunning(false);
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              mode === 'break'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            Break
          </button>
        </div>

        {currentTask && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span
                className="w-auto h-6 px-2 rounded-full flex items-center text-xs"
                style={{ 
                  backgroundColor: `${currentProject?.color}20`,
                  color: currentProject?.color
                }}
              >
                {currentProject?.name}
              </span>
              <span className="text-xl font-medium">{currentTask.title}</span>
              {currentTask.isRoutine && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Daily
                </span>
              )}
            </div>
            <div className="text-lg opacity-90">
              {currentTask.completedTime} / {currentTask.estimatedTime} minutes completed
            </div>
            <div className="text-lg opacity-90">
              {getTimerMessage()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 