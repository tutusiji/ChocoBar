import React from 'react';
import CalendarDay from './CalendarDay';
import { Task } from '../types';

// CalendarMonth 组件的属性接口
interface CalendarMonthProps {
    currentDate: Date;  // 当前显示的月份日期
    today: Date;  // 今天的日期
    tasks: Task[];  // 任务列表
    projects: string[];  // 项目列表
    onTaskCreate: (title: string, project: string, startDate: Date, endDate: Date) => void;  // 创建任务的回调函数
    onTaskEdit: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;  // 编辑任务的回调函数
    onTaskDelete: (taskId: string) => void;  // 删除任务的回调函数
    onAddProject: (project: string) => void;  // 添加项目的回调函数
    onDayClick: (date: Date, position: { x: number; y: number }) => void;  // 点击日期的回调函数
    onEditTask: (taskId: string, position: { x: number; y: number }) => void;  // 编辑任务的回调函数
}

// CalendarMonth 组件：用于渲染整个月份的日历
function CalendarMonth({ currentDate, today, tasks, projects, onTaskCreate, onTaskEdit, onTaskDelete, onAddProject, onDayClick, onEditTask }: CalendarMonthProps) {
    // 计算当前月份的天数
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    // 计算当前月份第一天是星期几（0-6，0表示星期日）
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    // 创建表示当前月份天数的数组
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    // 在月份开始前添加空白天数，使第一天对齐到正确的星期几
    const paddedDays = Array(firstDayOfMonth).fill(null).concat(days);

    return (
        <div className="calendar-month">
            {/* 渲染星期几的表头 */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-day-header">{day}</div>
            ))}
            {/* 渲染每一天的日历格子 */}
            {paddedDays.map((day, index) => {
                // 为每一天创建日期对象，如果是填充的空白天则为null
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
                        onEditTask={onEditTask}
                    />
                );
            })}
        </div>
    );
}

export default CalendarMonth;