import React from 'react';
import { useDrop } from 'react-dnd';
import TaskItem from './TaskItem';
import { Task } from '../types';

interface CalendarDayProps {
    date: Date | null;
    tasks: Task[];
    projects: string[];
    onTaskCreate: (title: string, project: string, startDate: Date, endDate: Date) => void;
    onTaskEdit: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;
    onTaskDelete: (taskId: string) => void;
    onAddProject: (project: string) => void;
    onDayClick: (date: Date, position: { x: number; y: number }) => void;
    isToday: boolean;
}

function CalendarDay({ date, tasks, projects, onTaskCreate, onTaskEdit, onTaskDelete, onAddProject, onDayClick, isToday }: CalendarDayProps) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ['TASK', 'RESIZE_LEFT', 'RESIZE_RIGHT'],
        drop: (item: { id: string, type: string }, monitor) => {
            if (date) {
                if (item.type === 'TASK') {
                    onTaskEdit(item.id, undefined, undefined, date, undefined);
                } else if (item.type === 'RESIZE_LEFT') {
                    onTaskEdit(item.id, undefined, undefined, date, undefined);
                } else if (item.type === 'RESIZE_RIGHT') {
                    onTaskEdit(item.id, undefined, undefined, undefined, date);
                }
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const handleDayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (date) {
            onDayClick(date, { x: e.clientX, y: e.clientY });
        }
    };

    return (
        <div
            ref={drop}
            className={`calendar-day ${isToday ? 'today' : ''} ${isOver ? 'over' : ''}`}
            onClick={handleDayClick}
        >
            {date && <div className="day-number">{date.getDate()}</div>}
            {tasks.map((task) => {
                const isStartDay = task.startDate.toDateString() === date?.toDateString();
                const isWithinRange = task.startDate <= date! && task.endDate >= date!;
                if (isStartDay) {
                    const startDay = task.startDate.getDate();
                    const endDay = task.endDate.getDate();
                    const span = endDay - startDay + 1;
                    return (
                        <div
                            key={task.id}
                            className="task-item"
                            style={{
                                width: `calc(${span} * 100% - 10px)`,
                                zIndex: 1,
                            }}
                            onClick={() => onTaskEdit(task.id)}
                        >
                            <TaskItem task={task} onEdit={onTaskEdit} />
                        </div>
                    );
                } else if (isWithinRange) {
                    return null;
                }
                return null;
            })}
        </div>
    );
}

export default CalendarDay;