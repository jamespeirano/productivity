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

export default function Stats() {
  const { projects, updateTask, setCurrentTask } = useProjects();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
          id: task.id,
          title: task.title,
          estimatedTime: task.estimatedTime,
          completedTime: task.completedTime,
          isRoutine: task.isRoutine,
          projectId: project.id,
          isCurrent: task.isCurrent
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

  const { totalWorkload, remainingTime } = getTodayWorkload();

  const chartData = {
    labels: stats.slice(-7).map(stat => format(new Date(stat.date), 'MMM d')),
    datasets: [
      {
        label: 'Hours Worked',
        data: stats.slice(-7).map(stat => stat.hours),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Work Hours',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
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
                  {task.isRoutine && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Daily
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
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