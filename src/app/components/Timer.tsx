'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useProjects } from '../contexts/ProjectContext';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

interface TimerProps {
  onSessionComplete: (duration: number) => void;
  isAddingProject: boolean;
  onAddProjectClose: () => void;
}

export default function Timer({ onSessionComplete, isAddingProject, onAddProjectClose }: TimerProps) {
  const { settings } = useSettings();
  const { projects, currentProject, addProject, updateTask, updateProjectTimeSpent } = useProjects();
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    // Update timer when settings change
    if (mode === 'pomodoro') {
      setTimeLeft(settings.pomodoroTime * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(settings.shortBreakTime * 60);
    } else {
      setTimeLeft(settings.longBreakTime * 60);
    }
  }, [settings, mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'pomodoro') {
        const hoursWorked = settings.pomodoroTime / 60;
        onSessionComplete(settings.pomodoroTime);
        setPomodoroCount((prev) => prev + 1);
        
        // Update project time spent and task pomodoro count
        if (currentProject) {
          updateProjectTimeSpent(currentProject.id, hoursWorked);
          
          const activeTask = currentProject.tasks.find(task => !task.completed);
          if (activeTask) {
            updateTask(currentProject.id, activeTask.id, {
              completedPomodoros: activeTask.completedPomodoros + 1
            });
          }
        }

        // After 4 pomodoros, take a long break
        if (pomodoroCount === 3) {
          setMode('longBreak');
          setPomodoroCount(0);
        } else {
          setMode('shortBreak');
        }
      } else {
        setMode('pomodoro');
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, settings.pomodoroTime, onSessionComplete, pomodoroCount, currentProject, updateTask, updateProjectTimeSpent]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(settings.pomodoroTime * 60);
    setIsRunning(false);
    setMode('pomodoro');
    setPomodoroCount(0);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'pomodoro') {
      setTimeLeft(settings.pomodoroTime * 60);
    } else if (newMode === 'shortBreak') {
      setTimeLeft(settings.shortBreakTime * 60);
    } else {
      setTimeLeft(settings.longBreakTime * 60);
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName);
      setNewProjectName('');
      onAddProjectClose();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getBackgroundColor = () => {
    switch (mode) {
      case 'pomodoro':
        return 'bg-red-500';
      case 'shortBreak':
        return 'bg-green-500';
      case 'longBreak':
        return 'bg-blue-500';
    }
  };

  // Calculate remaining pomodoros needed
  const getRemainingPomodoros = () => {
    if (!currentProject || !currentProject.dailyGoalHours) return 0;
    const totalPomodorosNeeded = Math.ceil((currentProject.dailyGoalHours * 60) / settings.pomodoroTime);
    const completedPomodoros = Math.floor((currentProject.dailyTimeSpent * 60) / settings.pomodoroTime);
    return Math.max(0, totalPomodorosNeeded - completedPomodoros);
  };

  return (
    <div className={`${getBackgroundColor()} rounded-lg shadow-lg p-8 text-white`}>
      {isAddingProject ? (
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Add New Project</h3>
          <form onSubmit={handleAddProject} className="space-y-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-4 py-2 rounded-md text-gray-800"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onAddProjectClose}
                className="px-4 py-2 bg-white/10 rounded-md hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-gray-800 rounded-md hover:bg-white/90"
              >
                Add Project
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => switchMode('pomodoro')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'pomodoro'
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'shortBreak'
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'longBreak'
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              Long Break
            </button>
          </div>

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

            {currentProject && (
              <div className="text-center space-y-2">
                <div className="text-xl font-medium">
                  Working on {currentProject.name}
                </div>
                {currentProject.dailyGoalHours > 0 && (
                  <>
                    <div className="text-lg opacity-90">
                      {Math.max(0, currentProject.dailyGoalHours - currentProject.dailyTimeSpent).toFixed(1)} hours left today
                    </div>
                    <div className="text-lg opacity-90">
                      {getRemainingPomodoros()} pomodoros to go
                    </div>
                  </>
                )}
                {currentProject.tasks.some(task => !task.completed) && (
                  <div className="text-lg mt-4 opacity-80">
                    Current Task: {currentProject.tasks.find(task => !task.completed)?.title}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 