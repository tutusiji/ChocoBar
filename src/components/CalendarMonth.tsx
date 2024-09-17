import React from 'react';
import CalendarDay from './CalendarDay';
import { Task } from '../types';

interface CalendarMonthProps {
    currentDate: Date;
    today: Date;
    tasks: Task[];
    projects: string[];
    onTaskCreate: (title: string, project: string, startDate: Date, endDate: Date) => void;
    onTaskEdit: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;
    onTaskDelete: (taskId: string) => void;
    onAddProject: (project: string) => void;
    onDayClick: (date: Date, position: { x: number; y: number }) => void;
}

function CalendarMonth({ currentDate, today, tasks, projects, onTaskCreate, onTaskEdit, onTaskDelete, onAddProject, onDayClick }: CalendarMonthProps) {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const paddedDays = Array(firstDayOfMonth).fill(null).concat(days);

    return (
        <div className="calendar-month">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-day-header">{day}</div>
            ))}
            {paddedDays.map((day, index) => {
                const currentDay = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                return (
                    <CalendarDay
                        key={index}
                        date={currentDay}
                        isToday={!!currentDay && currentDay.toDateString() === today.toDateString()}
                        tasks={tasks}
                        projects={projects}
                        onTaskCreate={onTaskCreate}
                        onTaskEdit={onTaskEdit}
                        onTaskDelete={onTaskDelete}
                        onAddProject={onAddProject}
                        onDayClick={onDayClick}
                    />
                );
            })}
        </div>
    );
}

export default CalendarMonth;