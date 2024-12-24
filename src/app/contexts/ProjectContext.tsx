'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  dailyGoalHours: number;
  dailyTimeSpent: number;
  isRoutine: boolean;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime: number;
  completedTime: number;
  forToday: boolean;
  dueDate: string;
  isRoutine: boolean;
  isCurrent: boolean;
  completedPomodoros: number;
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  notes: string;
  projectId: string;
  streak: number;
}

interface Routine {
  id: string;
  name: string;
  timeGoalHours: number;
  timeSpent: number;
  daysOfWeek: number[];
}

export interface ProjectContextType {
  projects: Project[];
  routines: Routine[];
  addProject: (name: string, color?: string) => void;
  addRoutine: (name: string, timeGoalHours: number, daysOfWeek: number[]) => void;
  addTask: (projectId: string, task: Omit<Task, 'id'>) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => void;
  deleteRoutine: (routineId: string) => void;
  setCurrentTask: (projectId: string | null, taskId: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);

  useEffect(() => {
    const savedProjects = localStorage.getItem('pomodoroProjects');
    const savedRoutines = localStorage.getItem('pomodoroRoutines');
    const savedCurrentProject = localStorage.getItem('currentProject');
    
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
      if (savedCurrentProject) {
        const current = parsedProjects.find((p: Project) => p.id === savedCurrentProject);
        setCurrentProjectState(current || null);
      }
    }
    
    if (savedRoutines) {
      setRoutines(JSON.parse(savedRoutines));
    }
  }, []);

  const saveToLocalStorage = (newProjects: Project[], newRoutines: Routine[], currentId: string | null = null) => {
    localStorage.setItem('pomodoroProjects', JSON.stringify(newProjects));
    localStorage.setItem('pomodoroRoutines', JSON.stringify(newRoutines));
    if (currentId) {
      localStorage.setItem('currentProject', currentId);
    }
  };

  const addProject = (name: string, color: string = '#000000') => {
    setProjects((prevProjects) => [
      ...prevProjects,
      {
        id: uuidv4(),
        name,
        tasks: [],
        dailyGoalHours: 0,
        dailyTimeSpent: 0,
        isRoutine: false,
        color
      },
    ]);
  };

  const addRoutine = (name: string, timeGoalHours: number, daysOfWeek: number[]) => {
    const newRoutine: Routine = {
      id: Date.now().toString(),
      name,
      timeGoalHours,
      timeSpent: 0,
      daysOfWeek,
    };
    const updatedRoutines = [...routines, newRoutine];
    setRoutines(updatedRoutines);
    saveToLocalStorage(projects, updatedRoutines);
  };

  const updateRoutine = (routineId: string, updates: Partial<Routine>) => {
    const updatedRoutines = routines.map(routine => {
      if (routine.id === routineId) {
        return { ...routine, ...updates };
      }
      return routine;
    });
    setRoutines(updatedRoutines);
    saveToLocalStorage(projects, updatedRoutines);
  };

  const deleteRoutine = (routineId: string) => {
    const updatedRoutines = routines.filter(routine => routine.id !== routineId);
    setRoutines(updatedRoutines);
    saveToLocalStorage(projects, updatedRoutines);
  };

  const updateRoutineTimeSpent = (routineId: string, additionalHours: number) => {
    const updatedRoutines = routines.map(routine => {
      if (routine.id === routineId) {
        return {
          ...routine,
          timeSpent: routine.timeSpent + additionalHours
        };
      }
      return routine;
    });
    setRoutines(updatedRoutines);
    saveToLocalStorage(projects, updatedRoutines);
  };

  const addTask = (projectId: string, task: Omit<Task, 'id'>) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId || (projectId === 'standalone' && project.name === 'Standalone Tasks')) {
        const isRoutineProject = project.isRoutine || (projectId === 'standalone' && project.name === 'Standalone Tasks');
        return {
          ...project,
          tasks: [...project.tasks, { 
            ...task, 
            id: Date.now().toString(), 
            forToday: isRoutineProject ? true : task.forToday 
          }],
        };
      }
      return project;
    });

    // If adding to standalone and no standalone project exists, create it
    if (projectId === 'standalone' && !projects.find(p => p.name === 'Standalone Tasks')) {
      const standaloneProject: Project = {
        id: 'standalone',
        name: 'Standalone Tasks',
        tasks: [{ ...task, id: Date.now().toString(), forToday: true }],
        dailyGoalHours: 0,
        dailyTimeSpent: 0,
        isRoutine: false,
        color: '',
      };
      updatedProjects.push(standaloneProject);
    }

    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects, routines);
  };

  const updateTask = (projectId: string, taskId: string, updates: Partial<Task>) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          ),
        };
      }
      return project;
    });
    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects, routines);
  };

  const deleteTask = (projectId: string, taskId: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId),
        };
      }
      return project;
    });
    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects, routines);
  };

  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    if (currentProject?.id === projectId) {
      setCurrentProjectState(null);
    }
    saveToLocalStorage(updatedProjects, routines);
  };

  const setCurrentProject = (projectId: string | null) => {
    const project = projectId ? projects.find(p => p.id === projectId) || null : null;
    setCurrentProjectState(project);
    if (projectId) {
      localStorage.setItem('currentProject', projectId);
    } else {
      localStorage.removeItem('currentProject');
    }
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return { ...project, ...updates };
      }
      return project;
    });
    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects, routines);
  };

  const updateProjectTimeSpent = (projectId: string, additionalHours: number) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          dailyTimeSpent: project.dailyTimeSpent + additionalHours,
          // Only update tasks if it's not a routine
          tasks: project.isRoutine ? project.tasks : project.tasks.map(task => 
            !task.completed ? {
              ...task,
              completedTime: task.completedTime + (additionalHours * 60)
            } : task
          )
        };
      }
      return project;
    });
    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects, routines);
  };

  const setCurrentTask = (projectId: string | null, taskId: string | null) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => ({
        ...task,
        isCurrent: project.id === projectId && task.id === taskId
      }))
    }));
    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects, routines);
  };

  useEffect(() => {
    const resetDailyTimeSpent = () => {
      const updatedProjects = projects.map(project => ({
        ...project,
        dailyTimeSpent: 0,
        // Reset tasks based on whether they're routine or not
        tasks: project.tasks.map(task => ({
          ...task,
          completed: false,
          completedTime: 0,
          // Routine tasks are always for today, non-routine tasks need to be marked
          forToday: project.isRoutine ? true : false
        }))
      }));
      const updatedRoutines = routines.map(routine => ({
        ...routine,
        timeSpent: 0
      }));
      setProjects(updatedProjects);
      setRoutines(updatedRoutines);
      saveToLocalStorage(updatedProjects, updatedRoutines);
    };

    const checkNewDay = () => {
      const lastResetDate = localStorage.getItem('lastResetDate');
      const today = new Date().toDateString();
      
      if (lastResetDate !== today) {
        resetDailyTimeSpent();
        localStorage.setItem('lastResetDate', today);
      }
    };

    checkNewDay();
    
    const interval = setInterval(checkNewDay, 60000);
    return () => clearInterval(interval);
  }, [projects, routines]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        routines,
        addProject,
        addTask,
        updateTask,
        deleteTask,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        setCurrentTask,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
} 