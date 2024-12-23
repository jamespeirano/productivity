# Pomodoro Timer Application

A modern Pomodoro Timer application built with Next.js, TypeScript, and Tailwind CSS. This app helps you manage your time effectively using the Pomodoro Technique while tracking your daily goals and tasks.

## Features

### Timer
- Customizable Pomodoro, short break, and long break durations
- Visual and intuitive timer interface
- Automatic switching between work and break sessions
- Session tracking and statistics

### Task Management
- Create and manage projects and tasks
- Set daily time goals for projects
- Mark projects as daily routines
- Track estimated vs actual time spent
- Add standalone tasks or project subtasks

### Statistics and Tracking
- Daily work hour tracking
- Visual graph showing work patterns
- Streak tracking for consecutive days worked
- Progress bars for daily goals
- Time remaining calculations

### Calendar View
- Weekly calendar display
- Task overview by day
- Daily goal progress tracking
- Visual progress indicators

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Chart.js - Data visualization
- date-fns - Date handling
- Local Storage - Data persistence

## Project Structure

- `src/app/components/` - React components
- `src/app/contexts/` - React context providers
- `src/app/` - Main application pages

## Features in Detail

### Timer Modes
- Pomodoro (default: 25 minutes)
- Short Break (default: 5 minutes)
- Long Break (default: 15 minutes)

### Project Management
- Create multiple projects
- Set daily time goals
- Track time spent per project
- Manage tasks and subtasks
- Set estimated completion times

### Settings
- Customize timer durations
- Adjust daily goals
- Configure break intervals

## Learn More

The Pomodoro Technique is a time management method developed by Francesco Cirillo that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. This application enhances the traditional technique with modern features for better productivity tracking and task management.
