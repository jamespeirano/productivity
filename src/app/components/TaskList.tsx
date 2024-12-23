'use client';

import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Task } from '../contexts/ProjectContext';

interface TaskListProps {
  hideAddProject?: boolean;
}

interface TaskWithProject extends Task {
  projectId: string;
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
  const [viewMode, setViewMode] = useState<'today' | 'all' | 'completed'>('today');
  const [taskNotes, setTaskNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
          plannedTime: task.plannedTime || 'Unset time',
          streak: task.isRoutine ? getTaskStreak(task) : 0
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
        plannedTime: task.plannedTime || 'Unset time',
        streak: task.isRoutine ? getTaskStreak(task) : 0
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

  // Get completed tasks
  const getCompletedTasks = () => {
    return projects.flatMap(project => 
      project.tasks
        .filter(task => task.completed)
        .map(task => ({
          ...task,
          projectName: project.name,
          projectId: project.id,
          plannedTime: task.plannedTime || 'Unset time',
          streak: task.isRoutine ? getTaskStreak(task) : 0
        }))
    ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
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
    if (!standaloneTaskTitle.trim()) return;

    const newTask = {
      title: standaloneTaskTitle,
      completed: false,
      estimatedTime: standaloneTaskTime,
      completedTime: 0,
      forToday: true,
      plannedTime: standaloneTaskPlannedTime || undefined,
      dueDate: selectedDate,
      isRoutine: isRoutineTask,
      completedPomodoros: 0,
      isCurrent: false,
      subtasks: subtasks,
      notes: taskNotes
    };

    addTask(selectedProjectId, newTask);
    setStandaloneTaskTitle('');
    setStandaloneTaskTime(30);
    setStandaloneTaskPlannedTime('');
    setSelectedProjectId('standalone');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setIsRoutineTask(false);
    setTaskNotes('');
    setSubtasks([]);
    setIsAddingTask(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: Date.now().toString(),
        title: newSubtask.trim(),
        completed: false
      }
    ]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId));
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

  const handleEditTask = (task: TaskWithProject) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTask(editingTask.projectId, editingTask.id, {
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
                {viewMode === 'today' && "Today's Tasks"}
                {viewMode === 'all' && "All Tasks"}
                {viewMode === 'completed' && "Completed Tasks"}
              </h2>
              <div className="flex rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('today')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'today'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode('completed')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'completed'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              + Add Task
            </button>
          </div>
          
          <div className="space-y-4">
            {viewMode === 'today' && (
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
                        <div className="flex items-center gap-2 mt-1">
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
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
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

            {viewMode === 'all' && (
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
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit task"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
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
            )}

            {viewMode === 'completed' && (
              <>
                {getCompletedTasks().map((task) => (
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
                        <span className="text-gray-500 line-through">
                          {task.title}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({task.projectName})
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {task.plannedTime}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          Completed on: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        {task.isRoutine && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                            Daily
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
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
                
                {getCompletedTasks().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No completed tasks yet.
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="Add any notes or details about the task..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtasks
                  </label>
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => {
                            setSubtasks(subtasks.map(st =>
                              st.id === subtask.id ? { ...st, completed: !st.completed } : st
                            ));
                          }}
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

        {/* Edit Task Modal */}
        {isEditModalOpen && editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                          onChange={() => {
                            setEditingTask({
                              ...editingTask,
                              subtasks: editingTask.subtasks.map(st =>
                                st.id === subtask.id ? { ...st, completed: !st.completed } : st
                              )
                            });
                          }}
                          className="rounded text-blue-500"
                        />
                        <span className="flex-1">{subtask.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask({
                              ...editingTask,
                              subtasks: editingTask.subtasks.filter(st => st.id !== subtask.id)
                            });
                          }}
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
      </div>
    );
  }

  return null;
} 