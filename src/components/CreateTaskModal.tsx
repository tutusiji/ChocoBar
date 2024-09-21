import React, { useState } from 'react';
import { Task } from '../types';

// CreateTaskModal 组件：创建或编辑任务的模态框
interface CreateTaskModalProps {
    date: Date;  // 选中的日期
    projects: string[];  // 可选的项目列表
    onCreateTask: (title: string, project: string, startDate: Date, endDate: Date) => void;  // 创建任务的回调函数
    onClose: () => void;  // 关闭模态框的回调函数
    onAddProject: (project: string) => void;  // 添加新项目的回调函数
    position: { x: number; y: number };  // 模态框的显示位置
    task?: Task | null;  // 当前编辑的任务（如果是编辑模式）
    onEditTask?: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;  // 编辑任务的回调函数
    onDeleteTask?: (taskId: string) => void;  // 删除任务的回调函数
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ date, projects, onCreateTask, onClose, onAddProject, position, task, onEditTask, onDeleteTask }) => {
    // 状态变量，用于存储表单输入
    const [title, setTitle] = useState(task ? task.title : '');  // 任务标题
    const [project, setProject] = useState(task ? task.project : projects[0]);  // 所属项目
    const [startDate, setStartDate] = useState(task ? task.startDate.toISOString().substring(0, 10) : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10));  // 开始日期
    const [endDate, setEndDate] = useState(task ? task.endDate.toISOString().substring(0, 10) : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10));  // 结束日期

    // 处理表单提交
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (task && onEditTask) {
            // 如果是编辑模式，调用编辑任务函数
            onEditTask(task.id, title, project, new Date(startDate), new Date(endDate));
        } else {
            // 如果是创建模式，调用创建任务函数
            onCreateTask(title, project, new Date(startDate), new Date(endDate));
        }
        onClose();  // 关闭模态框
    };

    // 处理删除任务
    const handleDelete = () => {
        if (task && onDeleteTask) {
            onDeleteTask(task.id);
            onClose();  // 删除后关闭模态框
        }
    };

    // 阻止点击事件冒泡
    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal" style={{ top: position.y, left: position.x }} onClick={handleModalClick}>
            <div className="modal-content">
                <h2>{task ? '编辑任务' : '创建任务'}</h2>
                <form onSubmit={handleSubmit}>
                    {/* 任务标题输入框 */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="任务标题"
                        required
                    />
                    {/* 项目选择下拉框 */}
                    <select value={project} onChange={(e) => setProject(e.target.value)}>
                        {projects.map((proj) => (
                            <option key={proj} value={proj}>
                                {proj}
                            </option>
                        ))}
                    </select>
                    {/* 开始日期选择器 */}
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                    {/* 结束日期选择器 */}
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                    {/* 提交按钮 */}
                    <button type="submit">{task ? '保存' : '创建'}</button>
                    {/* 删除按钮（仅在编辑模式下显示） */}
                    {task && <button type="button" onClick={handleDelete}>删除</button>}
                    {/* 取消按钮 */}
                    <button type="button" onClick={onClose}>取消</button>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;