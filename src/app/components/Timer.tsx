'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useProjects } from '../contexts/ProjectContext';
import { Task } from '../contexts/ProjectContext';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

interface TimerProps {
  onSessionComplete: (duration: number) => void;
  isAddingProject: boolean;
  onAddProjectClose: () => void;
}

export default function Timer({ onSessionComplete, isAddingProject, onAddProjectClose }: TimerProps) {
  const { settings } = useSettings();
  const { 
    projects, 
    currentProject,
    updateTask, 
    updateProjectTimeSpent, 
    addProject,
    setCurrentTask 
  } = useProjects();
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [newProjectName, setNewProjectName] = useState('');

  // Calculate today's workload and remaining time
  const getTodayWorkload = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = projects.flatMap(project => 
      project.tasks
        .filter(task => (task.dueDate === today || task.isRoutine) && !task.completed)
        .map(task => ({
          ...task,
          estimatedTime: task.estimatedTime || 0,
          completedTime: task.completedTime || 0
        }))
    );

    const totalEstimatedMinutes = todayTasks.reduce((total, task) => total + task.estimatedTime, 0);
    const totalCompletedMinutes = todayTasks.reduce((total, task) => total + task.completedTime, 0);
    
    return {
      totalWorkload: totalEstimatedMinutes,
      remainingTime: Math.max(0, totalEstimatedMinutes - totalCompletedMinutes)
    };
  };

  const { totalWorkload, remainingTime } = getTodayWorkload();

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
          
          // Find the current task and update it
          const currentTask = getCurrentTask();
          if (currentTask) {
            updateTask(currentTask.projectId, currentTask.id, {
              completedPomodoros: currentTask.completedPomodoros + 1,
              completedTime: currentTask.completedTime + (settings.pomodoroTime)
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
      localStorage.setItem('pomodoroTimerRunning', 'false');
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, settings.pomodoroTime, onSessionComplete, pomodoroCount, currentProject, updateTask, updateProjectTimeSpent]);

  const toggleTimer = () => {
    // Only allow starting if there's a current task
    if (!isRunning && !getCurrentTask()) {
      alert('Please select a task before starting the timer');
      return;
    }

    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    localStorage.setItem('pomodoroTimerRunning', newIsRunning.toString());
  };

  const resetTimer = () => {
    setTimeLeft(settings.pomodoroTime * 60);
    setIsRunning(false);
    localStorage.setItem('pomodoroTimerRunning', 'false');
    setMode('pomodoro');
    setPomodoroCount(0);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    localStorage.setItem('pomodoroTimerRunning', 'false');
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

  // Get current task
  const getCurrentTask = () => {
    for (const project of projects) {
      const currentTask = project.tasks.find(task => task.isCurrent);
      if (currentTask) {
        return {
          ...currentTask,
          projectName: project.name,
          projectId: project.id,
          streak: currentTask.isRoutine ? getTaskStreak(currentTask, project.id) : 0
        };
      }
    }
    return null;
  };

  // Calculate streak for a task
  const getTaskStreak = (task: Task, projectId: string) => {
    if (!task.isRoutine) return 0;
    
    const today = new Date();
    let streak = 1;
    let currentDate = new Date(task.dueDate);
    
    // Count backwards from the current date
    while (true) {
      currentDate.setDate(currentDate.getDate() - 1);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Check if this task was completed on this date
      const wasCompletedOnDate = projects
        .find(p => p.id === projectId)
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

  // Get available tasks
  const getAvailableTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return projects.flatMap(project => 
      project.tasks
        .filter(task => !task.completed && (task.dueDate === today || task.isRoutine))
        .map(task => ({
          ...task,
          projectName: project.name,
          projectId: project.id,
          streak: task.isRoutine ? getTaskStreak(task, project.id) : 0
        }))
    );
  };

  const handleStartTask = (taskId: string, projectId: string) => {
    if (isRunning) {
      alert('Cannot change tasks during an active pomodoro session');
      return;
    }

    // Find the task we want to select/deselect
    const targetTask = projects
      .find(p => p.id === projectId)
      ?.tasks.find(t => t.id === taskId);

    if (!targetTask) return;

    // If this task is already current, unselect it
    if (targetTask.isCurrent) {
      setCurrentTask(null, null);
    } else {
      setCurrentTask(projectId, taskId);
    }
  };

  const currentTask = getCurrentTask();
  const availableTasks = getAvailableTasks();

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

            <div className="text-center space-y-2">
              {currentTask ? (
                <>
                  <div className="text-xl font-medium flex items-center justify-center gap-2">
                    Current Task: {currentTask.title}
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">
                      {currentTask.projectName}
                    </span>
                  </div>
                  <div className="text-lg opacity-90">
                    {currentTask.completedTime} / {currentTask.estimatedTime} minutes completed
                  </div>
                  <div className="text-lg opacity-90">
                    {Math.ceil((currentTask.estimatedTime - currentTask.completedTime) / settings.pomodoroTime)} pomodoros to complete
                  </div>
                  {currentTask.isRoutine && currentTask.streak > 0 && (
                    <div className="text-lg opacity-90">
                      Complete to maintain your {currentTask.streak} day streak! 🔥
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xl font-medium mb-4">
                  Select a task to start working
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 