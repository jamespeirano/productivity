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
  const { projects } = useProjects();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState(0);

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

  // Calculate total daily goal and time spent
  const totalDailyGoal = projects.reduce((total, project) => total + project.dailyGoalHours, 0);
  const totalTimeSpent = projects.reduce((total, project) => total + project.dailyTimeSpent, 0);
  const remainingTime = Math.max(0, totalDailyGoal - totalTimeSpent);

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

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Daily Goal</h3>
          <p className="text-2xl font-bold text-blue-900">{totalDailyGoal.toFixed(1)} hours</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">Time Spent Today</h3>
          <p className="text-2xl font-bold text-green-900">{totalTimeSpent.toFixed(1)} hours</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-800 mb-1">Time Remaining</h3>
          <p className="text-2xl font-bold text-orange-900">{remainingTime.toFixed(1)} hours</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
        <div className="flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-full">
          <span className="text-orange-500">🔥</span>
          <span className="font-bold text-orange-600">{streak} day streak</span>
        </div>
      </div>

      <div className="h-[300px]">
        <Line data={chartData} options={options} />
      </div>

      {projects.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Project Progress</h3>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-50 p-4 rounded-lg">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 