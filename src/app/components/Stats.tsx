'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { useProjects } from '../contexts/ProjectContext';
import { Task } from '../contexts/ProjectContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DailyStats {
  date: string;
  hours: number;
}

interface TaskWithProject extends Task {
  projectId: string;
}

export default function Stats() {
  const { projects, updateTask, setCurrentTask } = useProjects();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pomodoroTimerRunning') {
        setIsTimerRunning(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    setIsTimerRunning(localStorage.getItem('pomodoroTimerRunning') === 'true');

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const storedStats = localStorage.getItem('pomodoroStats');
    if (storedStats) {
      setStats(JSON.parse(storedStats));
    }
  }, []);

  useEffect(() => {
    // Calculate streak
    let currentStreak = 0;
    const today = new Date();
    const sortedStats = [...stats].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 0; i < sortedStats.length; i++) {
      const date = new Date(sortedStats[i].date);
      const expectedDate = subDays(today, i);
      
      if (format(date, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd') && 
          sortedStats[i].hours > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  }, [stats]);

  // Get today's tasks with progress
  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return projects.flatMap(project => 
      project.tasks
        .filter(task => (task.dueDate === today || task.isRoutine) && !task.completed)
        .map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        }))
    );
  };

  // Calculate total daily goal and time spent
  const getTodayWorkload = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = projects.flatMap(project => 
      project.tasks
        .filter(task => (task.dueDate === today || task.isRoutine) && !task.completed)
        .map(task => ({
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

  // Get stats for each project
  const getProjectStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    // Get all projects except standalone
    const projectsWithStats = projects
      .filter(project => project.name !== 'Standalone Tasks')
      .map(project => {
        const dailyStats = last7Days.map(date => {
          const completedTasks = project.tasks.filter(task => 
            task.completed && 
            task.dueDate === date
          );
          
          const totalMinutes = completedTasks.reduce((total, task) => 
            total + (task.completedTime || 0), 0
          );
          
          return totalMinutes / 60; // Convert to hours
        });

        return {
          label: project.name,
          data: dailyStats,
          borderColor: project.color,
          backgroundColor: `${project.color}50`,
          tension: 0.3,
        };
      });

    return {
      labels: last7Days.map(date => format(new Date(date), 'MMM d')),
      datasets: projectsWithStats
    };
  };

  const { totalWorkload, remainingTime } = getTodayWorkload();
  const chartData = getProjectStats();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
      },
      title: {
        display: true,
        text: 'Daily Work Hours by Goal',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
        stacked: true,
      },
      x: {
        stacked: true,
      }
    },
  };

  const handleTaskSelection = (task: any) => {
    if (isTimerRunning) {
      alert('Cannot change tasks during an active pomodoro session');
      return;
    }

    if (task.isCurrent) {
      setCurrentTask(null, null);
    } else {
      setCurrentTask(task.projectId, task.id);
    }
  };

  const handleEditTask = (task: TaskWithProject) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTask(editingTask.projectId!, editingTask.id, {
      title: editingTask.title,
      estimatedTime: editingTask.estimatedTime,
      dueDate: editingTask.dueDate,
      isRoutine: editingTask.isRoutine,
      subtasks: editingTask.subtasks,
      notes: editingTask.notes
    });

    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleAddSubtask = () => {
    if (!editingTask || !newSubtask.trim()) return;

    setEditingTask({
      ...editingTask,
      subtasks: [
        ...editingTask.subtasks,
        {
          id: Date.now().toString(),
          title: newSubtask.trim(),
          completed: false
        }
      ]
    });
    setNewSubtask('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!editingTask) return;

    setEditingTask({
      ...editingTask,
      subtasks: editingTask.subtasks.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    });
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    if (!editingTask) return;

    setEditingTask({
      ...editingTask,
      subtasks: editingTask.subtasks.filter(subtask => subtask.id !== subtaskId)
    });
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Today's Workload</h3>
          <p className="text-2xl font-bold text-blue-900">{Math.round(totalWorkload / 60)} hours</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">Time Spent Today</h3>
          <p className="text-2xl font-bold text-green-900">{Math.round((totalWorkload - remainingTime) / 60)} hours</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-800 mb-1">Time Remaining</h3>
          <p className="text-2xl font-bold text-orange-900">{Math.round(remainingTime / 60)} hours</p>
        </div>
      </div>

      {/* Today's Tasks Progress */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Today's Tasks Progress</h3>
        <div className="space-y-4">
          {getTodayTasks().map((task) => (
            <div key={task.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <div className="flex items-center gap-2">
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
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Daily
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTaskSelection(task)}
                    disabled={isTimerRunning}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      task.isCurrent
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    } ${isTimerRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {task.isCurrent ? '✓ Current' : 'Start'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {task.completedTime} / {task.estimatedTime} min
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 rounded-full h-2 transition-all"
                  style={{
                    width: `${Math.min(
                      (task.completedTime / task.estimatedTime) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {getTodayTasks().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks for today.
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Task</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={editingTask.estimatedTime}
                  onChange={(e) => setEditingTask({ ...editingTask, estimatedTime: Math.max(1, parseInt(e.target.value) || 1) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingTask.isRoutine}
                    onChange={(e) => setEditingTask({ ...editingTask, isRoutine: e.target.checked })}
                    className="rounded text-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Daily Routine</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingTask.notes}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtasks
                </label>
                <div className="space-y-2">
                  {editingTask.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleToggleSubtask(subtask.id)}
                        className="rounded text-blue-500"
                      />
                      <span className="flex-1">{subtask.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(subtask.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a subtask"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
          <div className="flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-full">
            <span className="text-orange-500">����</span>
            <span className="font-bold text-orange-600">{streak} day streak</span>
          </div>
        </div>

        <div className="h-[300px]">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
} 