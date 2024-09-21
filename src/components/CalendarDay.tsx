import React from 'react';
import { useDrop } from 'react-dnd';
import TaskItem from './TaskItem';
import { Task } from '../types';

// CalendarDay 组件的属性接口
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
    onEditTask: (taskId: string, position: { x: number; y: number }) => void;
}

// CalendarDay 组件：用于渲染日历中的单个日期格子
function CalendarDay({ date, tasks, projects, onTaskCreate, onTaskEdit, onTaskDelete, onAddProject, onDayClick, isToday, onEditTask }: CalendarDayProps) {
    // 使用 useDrop 钩子设置拖放功能
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ['TASK', 'RESIZE_LEFT', 'RESIZE_RIGHT'],
        drop: (item: { id: string, type: string }, monitor) => {
            if (date) {
                console.log('Drop date:', date.toISOString());
                // 根据拖拽类型执行不同的编辑操作
                if (item.type === 'TASK') {
                    onTaskEdit(item.id, undefined, undefined, date, undefined);
                } else if (item.type === 'RESIZE_LEFT') {
                    onTaskEdit(item.id, undefined, undefined, date, undefined);
                } else if (item.type === 'RESIZE_RIGHT') {
                    onTaskEdit(item.id, undefined, undefined, undefined, date);
                }
                return { date };
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: false }),
        }),
    }));

    // 处理日期点击事件的函数
    const handleDayClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止事件冒泡
        if (date) {
            // 如果有日期，则调用 onDayClick 函数，并传递日期和点击位置
            onDayClick(date, { x: e.clientX, y: e.clientY });
        }
    };

    // 处理任务点击事件的函数
    const handleTaskClick = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        onEditTask(taskId, { x: rect.left, y: rect.bottom });
    };

    return (
        <div
            ref={drop}
            className={`calendar-day ${isToday ? 'today' : ''} ${isOver ? 'over' : ''}`}
            onClick={handleDayClick}
        >
            {date && <div className="day-number">{date.getDate()}</div>}
            {tasks.map((task) => {
                // 判断任务是否在当前日期开始或范围内
                const isStartDay = task.startDate.toDateString() === date?.toDateString();
                const isWithinRange = task.startDate <= date! && task.endDate >= date!;
                if (isStartDay) {
                    // 计算任务跨越的天数
                    const startDay = task.startDate.getDate();
                    const endDay = task.endDate.getDate();
                    const span = endDay - startDay + 1;
                    return (
                        <div
                            key={task.id}
                            className="task-item"
                            style={{
                                width: `calc(${span} * 100% - 10px)`,
                            }}
                            onClick={(e) => handleTaskClick(e, task.id)}
                        >
                            <TaskItem
                                task={task}
                                onEdit={onEditTask}
                                onResize={onTaskEdit}
                                onMove={(taskId, newStartDate) => {
                                    // 处理任务移动
                                    const taskToMove = tasks.find(t => t.id === taskId);
                                    if (taskToMove) {
                                        const duration = taskToMove.endDate.getTime() - taskToMove.startDate.getTime();
                                        const newEndDate = new Date(newStartDate.getTime() + duration);
                                        onTaskEdit(taskId, undefined, undefined, newStartDate, newEndDate);
                                    }
                                }}
                            />
                        </div>
                    );
                } else if (isWithinRange) {
                    return null; // 如果任务在范围内但不是开始日，则不渲染
                }
                return null;
            })}
        </div>
    );
}

export default CalendarDay;