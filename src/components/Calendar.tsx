import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CalendarMonth from './CalendarMonth';
import ProjectManager from './ProjectManager';
import CreateTaskModal from './CreateTaskModal';
import { Task } from '../types';
import '../styles/Calendar.css';

// 日历组件
function Calendar() {
    // 初始化任务状态，从本地存储中加载
    const [tasks, setTasks] = useState<Task[]>(() => {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            return JSON.parse(savedTasks).map((task: any) => ({
                ...task,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            }));
        }
        return [];
    });

    // 初始化项目状态，从本地存储中加载
    const [projects, setProjects] = useState<string[]>(() => {
        const savedProjects = localStorage.getItem('projects');
        return savedProjects ? JSON.parse(savedProjects) : ['默认项目'];
    });

    // 当前显示的日期
    const [currentDate, setCurrentDate] = useState(new Date());

    // 今天的日期
    const [today] = useState(new Date());

    // 模态框状态
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        date: Date | null;
        position: { x: number; y: number };
    }>({
        isOpen: false,
        date: null,
        position: { x: 0, y: 0 },
    });

    // 正在编辑的任务
    const [editTask, setEditTask] = useState<Task | null>(null);

    // 创建新任务的处理函数
    const handleTaskCreate = (title: string, project: string, startDate: Date, endDate: Date) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            project,
            startDate,
            endDate,
        };
        setTasks([...tasks, newTask]);
    };

    // 编辑任务的处理函数
    const handleTaskEdit = (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => {
        setTasks(prevTasks => prevTasks.map(task =>
            task.id === taskId
                ? {
                    ...task,
                    title: newTitle ?? task.title,
                    project: newProject ?? task.project,
                    startDate: newStartDate ?? task.startDate,
                    endDate: newEndDate ?? task.endDate
                }
                : task
        ));
    };

    // 打开编辑任务模态框的处理函数
    const handleTaskEditModal = (taskId: string, position: { x: number; y: number }) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setEditTask(task);
            setModalState({ isOpen: true, date: task.startDate, position });
        }
    };

    // 删除任务的处理函数
    const handleTaskDelete = (taskId: string) => {
        setTasks(tasks.filter(task => task.id !== taskId));
    };

    // 添加新项目的处理函数
    const handleAddProject = (project: string) => {
        setProjects([...projects, project]);
    };

    // 切换到上一个月的处理函数
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // 切换到下一个月的处理函数
    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // 切换到今天的处理函数
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // 点击日期的处理函数
    const handleDayClick = (date: Date, position: { x: number; y: number }) => {
        setModalState({ isOpen: true, date, position });
    };

    // 关闭模态框的处理函数
    const handleCloseModal = () => {
        setModalState({ isOpen: false, date: null, position: { x: 0, y: 0 } });
        setEditTask(null);
    };

    // 保存任务到本地存储
    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks.map(task => ({
            ...task,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString()
        }))));
    }, [tasks]);

    // 保存项目到本地存储
    useEffect(() => {
        localStorage.setItem('projects', JSON.stringify(projects));
    }, [projects]);

    // 点击模态框外部关闭模态框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalState.isOpen && !(event.target as Element).closest('.modal')) {
                handleCloseModal();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modalState.isOpen]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="calendar-container" onClick={handleCloseModal}>
                <ProjectManager projects={projects} onAddProject={handleAddProject} />
                <div className="calendar-header">
                    <button onClick={handlePrevMonth}>&lt;</button>
                    <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth}>&gt;</button>
                    <button onClick={handleToday}>今天</button>
                </div>
                <CalendarMonth
                    currentDate={currentDate}
                    today={today}
                    tasks={tasks}
                    projects={projects}
                    onTaskCreate={handleTaskCreate}
                    onTaskEdit={handleTaskEdit}
                    onTaskDelete={handleTaskDelete}
                    onAddProject={handleAddProject}
                    onDayClick={handleDayClick}
                    onEditTask={handleTaskEditModal}
                />
                {modalState.isOpen && modalState.date && (
                    <CreateTaskModal
                        date={modalState.date}
                        projects={projects}
                        onCreateTask={handleTaskCreate}
                        onClose={handleCloseModal}
                        onAddProject={handleAddProject}
                        position={modalState.position}
                        task={editTask}
                        onEditTask={handleTaskEdit}
                        onDeleteTask={handleTaskDelete}
                    />
                )}
            </div>
        </DndProvider>
    );
}

export default Calendar;