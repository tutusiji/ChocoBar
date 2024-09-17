import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import TaskItem from './TaskItem';
import CreateTaskModal from './CreateTaskModal';
import { Task } from '../types';

interface CalendarDayProps {
    date: Date | null;
    tasks: Task[];
    projects: string[];
    onTaskCreate: (title: string, project: string, startDate: Date, endDate: Date) => void;
    onTaskEdit: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;
    onTaskDelete: (taskId: string) => void;
    onAddProject: (project: string) => void;
    isToday: boolean;
    onDayClick: (date: Date, position: { x: number; y: number }) => void;
}

function CalendarDay({ date, tasks, projects, onTaskCreate, onTaskEdit, onTaskDelete, onAddProject, isToday, onDayClick }: CalendarDayProps) {
    if (!date) {
        return <div className="calendar-day empty"></div>;
    }

    const handleDayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDayClick(date, { x: e.clientX, y: e.clientY });
    };

    return (
        <div
            className={`calendar-day ${isToday ? 'today' : ''}`}
            onClick={handleDayClick}
        >
            <div className="day-number">{date.getDate()}</div>
            {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onEdit={onTaskEdit} onDelete={onTaskDelete} />
            ))}
        </div>
    );
}

export default CalendarDay;