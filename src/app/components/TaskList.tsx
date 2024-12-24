'use client';

import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Task } from '../contexts/ProjectContext';

interface TaskListProps {
  hideAddProject?: boolean;
  isAddingTask?: boolean;
  onAddTaskClose?: () => void;
}

interface TaskWithProject extends Task {
  projectId: string;
}

export default function TaskList({ hideAddProject = false, isAddingTask = false, onAddTaskClose }: TaskListProps) {
  const {
    projects,
    addProject,
    addTask,
    updateTask,
    deleteTask,
  } = useProjects();

  const [newProjectName, setNewProjectName] = useState('');
  const [standaloneTaskTitle, setStandaloneTaskTitle] = useState('');
  const [standaloneTaskTime, setStandaloneTaskTime] = useState(30);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('standalone');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRoutineTask, setIsRoutineTask] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'all' | 'completed'>('today');
  const [taskNotes, setTaskNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectColor, setProjectColor] = useState('#000000');
  const [isAddingProject, setIsAddingProject] = useState(false);

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
          streak: task.isRoutine ? getTaskStreak(task) : 0
        }))
    ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName, projectColor);
      setNewProjectName('');
      setProjectColor('#000000');
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
      dueDate: selectedDate,
      isRoutine: isRoutineTask,
      completedPomodoros: 0,
      isCurrent: false,
      subtasks: subtasks,
      notes: taskNotes,
      projectId: selectedProjectId,
      streak: 0
    };

    addTask(selectedProjectId, newTask);
    setStandaloneTaskTitle('');
    setStandaloneTaskTime(30);
    setSelectedProjectId('standalone');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setIsRoutineTask(false);
    setTaskNotes('');
    setSubtasks([]);
    onAddTaskClose?.();
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

  // If we're in add task mode, show the modal first
  if (isAddingTask) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Task</h3>
              <button
                onClick={onAddTaskClose}
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
                        <option 
                          key={project.id} 
                          value={project.id}
                          style={{
                            backgroundColor: `${project.color}20`,
                            color: project.color
                          }}
                        >
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
                {selectedProjectId !== 'standalone' && (
                  <div className="mt-2">
                    <span
                      className="inline-block px-2 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${projects.find(p => p.id === selectedProjectId)?.color}20`,
                        color: projects.find(p => p.id === selectedProjectId)?.color
                      }}
                    >
                      {projects.find(p => p.id === selectedProjectId)?.name}
                    </span>
                  </div>
                )}
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
                  onClick={onAddTaskClose}
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

        {isAddingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Goal</h4>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter goal name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={projectColor}
                      onChange={(e) => setProjectColor(e.target.value)}
                      className="h-8 w-16"
                    />
                    <div
                      className="flex-1 px-3 py-2 rounded-md text-sm"
                      style={{
                        backgroundColor: `${projectColor}20`,
                        color: projectColor
                      }}
                    >
                      Preview Tag
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProject(false);
                      setNewProjectName('');
                      setProjectColor('#000000');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
      </>
    );
  }
} 