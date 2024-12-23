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
  const [newTaskTime, setNewTaskTime] = useState(30); // Default 30 minutes
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<number>(0);
  const [standaloneTaskTitle, setStandaloneTaskTitle] = useState('');
  const [standaloneTaskTime, setStandaloneTaskTime] = useState(30); // Default 30 minutes

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
      };
      addTask('standalone', task);
      setStandaloneTaskTitle('');
      setStandaloneTaskTime(30);
      setIsAddingTask(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const task = {
        title: newTaskTitle,
        completed: false,
        estimatedTime: newTaskTime,
        completedTime: 0,
      };
      addTask(projectId, task);
      setNewTaskTitle('');
      setNewTaskTime(30);
    }
  };

  const handleSetDailyGoal = (projectId: string, minutes: number) => {
    updateProject(projectId, { dailyGoalHours: minutes / 60 });
    setEditingTimeId(null);
    setEditingTime(0);
  };

  const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);
  const hoursToMinutes = (hours: number) => Math.round(hours * 60);

  return (
    <div className="bg-white min-h-screen">
      {/* Projects Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Projects</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingTask(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              + Add Task
            </button>
            <button
              onClick={() => setIsAddingProject(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              + Add Project
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-50 rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{project.name}</span>
                  <div className="flex items-center gap-3">
                    {editingTimeId === project.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingTime}
                          onChange={(e) => setEditingTime(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          min="1"
                        />
                        <span className="text-sm text-gray-600">min</span>
                        <button
                          onClick={() => handleSetDailyGoal(project.id, editingTime)}
                          className="text-sm text-blue-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingTimeId(project.id);
                            setEditingTime(hoursToMinutes(project.dailyGoalHours));
                          }}
                          className="text-sm text-blue-500"
                        >
                          Set Time Goal
                        </button>
                        <button
                          onClick={() => updateProject(project.id, { isRoutine: !project.isRoutine })}
                          className={`text-sm ${project.isRoutine ? 'text-green-500' : 'text-gray-600'}`}
                        >
                          {project.isRoutine ? 'Daily' : 'Set as Daily'}
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-sm text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {project.dailyGoalHours > 0 && project.isRoutine && (
                  <div className="text-sm text-gray-600">
                    Daily Goal: {hoursToMinutes(project.dailyTimeSpent)} / {hoursToMinutes(project.dailyGoalHours)} min
                  </div>
                )}

                {/* Tasks */}
                <div className="mt-4 space-y-2">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) =>
                            updateTask(project.id, task.id, {
                              completed: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className={`text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {task.completedTime}/{task.estimatedTime} min
                        </span>
                        <button
                          onClick={() => deleteTask(project.id, task.id)}
                          className="text-sm text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Form */}
                <form onSubmit={(e) => handleAddSubtask(e, project.id)} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add subtask"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-16 px-2 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    />
                    <span className="text-sm text-gray-600 mr-2">min</span>
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 text-blue-500 font-medium text-sm"
                  >
                    Add Subtask
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Project</h3>
            <form onSubmit={handleAddProject}>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
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
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Task</h3>
            <form onSubmit={handleAddStandaloneTask}>
              <input
                type="text"
                value={standaloneTaskTitle}
                onChange={(e) => setStandaloneTaskTitle(e.target.value)}
                placeholder="Task name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 mb-4"
              />
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm text-gray-600">Estimated Time:</label>
                <input
                  type="number"
                  value={standaloneTaskTime}
                  onChange={(e) => setStandaloneTaskTime(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-sm text-gray-600">min</span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 