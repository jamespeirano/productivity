'use client';

import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';

interface TaskListProps {
  hideAddProject?: boolean;
}

export default function TaskList({ hideAddProject = false }: TaskListProps) {
  const {
    projects,
    currentProject,
    addProject,
    addTask,
    updateTask,
    deleteTask,
    deleteProject,
    setCurrentProject,
    updateProject,
  } = useProjects();

  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState(30);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<number>(0);
  const [standaloneTaskTitle, setStandaloneTaskTitle] = useState('');
  const [standaloneTaskTime, setStandaloneTaskTime] = useState(30);
  const [standaloneTaskPlannedTime, setStandaloneTaskPlannedTime] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('standalone');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRoutineTask, setIsRoutineTask] = useState(false);
  const [editingTaskTime, setEditingTaskTime] = useState<{ [key: string]: number }>({});
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Filter tasks for today's view
  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return projects.flatMap(project => 
      project.tasks
        .filter(task => {
          return task.dueDate === today || task.isRoutine;
        })
        .map(task => ({
          ...task,
          projectName: project.name,
          projectId: project.id,
          plannedTime: task.plannedTime || 'Unset time'
        }))
    );
  };

  // Get all tasks grouped by date
  const getAllTasksGroupedByDate = () => {
    const tasksByDate = new Map<string, Array<any>>();
    
    // Get all tasks with their project info
    const allTasks = projects.flatMap(project => 
      project.tasks.map(task => ({
        ...task,
        projectName: project.name,
        projectId: project.id,
        plannedTime: task.plannedTime || 'Unset time'
      }))
    );

    // Sort tasks by date
    allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Group tasks by date
    allTasks.forEach(task => {
      const date = task.dueDate;
      if (!tasksByDate.has(date)) {
        tasksByDate.set(date, []);
      }
      tasksByDate.get(date)?.push(task);
    });

    return tasksByDate;
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName);
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  const handleAddStandaloneTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (standaloneTaskTitle.trim()) {
      const task = {
        title: standaloneTaskTitle,
        completed: false,
        estimatedTime: standaloneTaskTime,
        completedTime: 0,
        forToday: selectedDate === new Date().toISOString().split('T')[0],
        plannedTime: standaloneTaskPlannedTime || 'Unset time',
        dueDate: selectedDate,
        isRoutine: isRoutineTask
      };
      addTask(selectedProjectId, task);
      setStandaloneTaskTitle('');
      setStandaloneTaskTime(30);
      setStandaloneTaskPlannedTime('');
      setSelectedProjectId('standalone');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setIsRoutineTask(false);
      setIsAddingTask(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const task = {
        title: newTaskTitle,
        completed: false,
        estimatedTime: editingTaskTime[projectId] || 30,
        completedTime: 0,
        forToday: !projects.find(p => p.id === projectId)?.isRoutine,
        plannedTime: 'Unset time',
        dueDate: new Date().toISOString().split('T')[0],
        isRoutine: false
      };
      addTask(projectId, task);
      setNewTaskTitle('');
      setEditingTaskTime(prev => ({ ...prev, [projectId]: 30 }));
    }
  };

  const handleUpdateTaskTime = (projectId: string, taskId: string, newTime: number) => {
    updateTask(projectId, taskId, {
      estimatedTime: newTime
    });
  };

  const handleSetDailyGoal = (projectId: string, minutes: number) => {
    updateProject(projectId, { dailyGoalHours: minutes / 60 });
    setEditingTimeId(null);
    setEditingTime(0);
  };

  const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);
  const hoursToMinutes = (hours: number) => Math.round(hours * 60);

  if (hideAddProject) {
    // Today's view
    const todayTasks = getTodayTasks();
    
    return (
      <div className="space-y-8">
        {/* Today's Tasks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {showAllTasks ? 'All Tasks' : "Today's Tasks"}
              </h2>
              <label className="inline-flex items-center cursor-pointer">
                <span className="text-sm text-gray-600 mr-2">Show All</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showAllTasks}
                    onChange={(e) => setShowAllTasks(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              + Add Task
            </button>
          </div>
          
          <div className="space-y-4">
            {showAllTasks ? (
              Array.from(getAllTasksGroupedByDate().entries()).map(([date, tasks]) => (
                <div key={date} className="space-y-2">
                  <h3 className="font-medium text-gray-700">
                    {new Date(date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  {tasks.map((task) => (
                    <div
                      key={`${task.projectId}-${task.id}`}
                      className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) =>
                            updateTask(task.projectId, task.id, {
                              completed: e.target.checked,
                            })
                          }
                          className="h-5 w-5 rounded border-gray-300"
                        />
                        <div>
                          <span className={`text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({task.projectName})
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {task.plannedTime}
                          </span>
                          {task.isRoutine && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                              Daily
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {task.estimatedTime} min
                        </span>
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
                  ))}
                </div>
              ))
            ) : (
              <>
                {todayTasks.map((task) => (
                  <div
                    key={`${task.projectId}-${task.id}`}
                    className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) =>
                          updateTask(task.projectId, task.id, {
                            completed: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <div>
                        <span className={`text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({task.projectName})
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {task.plannedTime}
                        </span>
                        {!task.forToday && (
                          <span className="text-sm text-gray-500 ml-2">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {task.estimatedTime} min
                      </span>
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
                ))}
                
                {todayTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No tasks for today. Click the + button to add tasks.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
            <button
              onClick={() => setIsAddingProject(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              + Add Goal
            </button>
          </div>
          <div className="space-y-4">
            {projects
              .filter(p => p.name !== 'Standalone Tasks')
              .map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      {project.dailyGoalHours > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Daily Goal: {Math.round(project.dailyGoalHours * 60)} min
                          {project.dailyTimeSpent > 0 && ` (${Math.round(project.dailyTimeSpent * 60)} min completed)`}
                        </p>
                      )}
                    </div>
                    {project.isRoutine && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Daily
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {projects.filter(p => p.name !== 'Standalone Tasks').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No goals yet. Click the + button to add a goal.
              </div>
            )}
          </div>
        </div>

        {/* Add Task Modal */}
        {isAddingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Task</h3>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddStandaloneTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={standaloneTaskTitle}
                    onChange={(e) => setStandaloneTaskTitle(e.target.value)}
                    placeholder="Enter task name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={standaloneTaskTime}
                    onChange={(e) => setStandaloneTaskTime(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Time
                  </label>
                  <input
                    type="time"
                    value={standaloneTaskPlannedTime}
                    onChange={(e) => setStandaloneTaskPlannedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="routineCheckbox"
                        checked={isRoutineTask}
                        onChange={(e) => {
                          setIsRoutineTask(e.target.checked);
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="routineCheckbox" className="text-sm text-gray-700">
                        Daily Routine
                      </label>
                    </div>
                    {!isRoutineTask && (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal (Optional)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    >
                      <option value="standalone">No Goal</option>
                      {projects
                        .filter(p => p.name !== 'Standalone Tasks')
                        .map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))
                      }
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(true)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                    >
                      + New Goal
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTask(false);
                      setSelectedProjectId('standalone');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {isAddingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Goal</h3>
                <button
                  onClick={() => setIsAddingProject(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddProject}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Goal name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="px-4 py-2 text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
} 