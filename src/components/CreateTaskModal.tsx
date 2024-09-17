import React, { useState } from 'react';
import { Task } from '../types';

interface CreateTaskModalProps {
    date: Date;
    projects: string[];
    onCreateTask: (title: string, project: string, startDate: Date, endDate: Date) => void;
    onClose: () => void;
    onAddProject: (project: string) => void;
    position: { x: number; y: number };
    task?: Task | null;
    onEditTask?: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;
    onDeleteTask?: (taskId: string) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ date, projects, onCreateTask, onClose, onAddProject, position, task, onEditTask, onDeleteTask }) => {
    const [title, setTitle] = useState(task ? task.title : '');
    const [project, setProject] = useState(task ? task.project : projects[0]);
    const [startDate, setStartDate] = useState(task ? task.startDate.toISOString().substring(0, 10) : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10));
    const [endDate, setEndDate] = useState(task ? task.endDate.toISOString().substring(0, 10) : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (task && onEditTask) {
            onEditTask(task.id, title, project, new Date(startDate), new Date(endDate));
        } else {
            onCreateTask(title, project, new Date(startDate), new Date(endDate));
        }
        onClose();
    };

    const handleDelete = () => {
        if (task && onDeleteTask) {
            onDeleteTask(task.id);
            onClose();
        }
    };

    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal" style={{ top: position.y, left: position.x }} onClick={handleModalClick}>
            <div className="modal-content">
                <h2>{task ? '编辑任务' : '创建任务'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="任务标题"
                        required
                    />
                    <select value={project} onChange={(e) => setProject(e.target.value)}>
                        {projects.map((proj) => (
                            <option key={proj} value={proj}>
                                {proj}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                    <button type="submit">{task ? '保存' : '创建'}</button>
                    {task && <button type="button" onClick={handleDelete}>删除</button>}
                    <button type="button" onClick={onClose}>取消</button>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;