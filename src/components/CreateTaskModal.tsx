import React, { useState } from 'react';

interface CreateTaskModalProps {
    date: Date;
    projects: string[];
    onCreateTask: (title: string, project: string, startDate: Date, endDate: Date) => void;
    onClose: () => void; // 移除参数要求
    onAddProject: (project: string) => void;
    position: { x: number, y: number };
}

function CreateTaskModal({ date, projects, onCreateTask, onClose, onAddProject, position }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [project, setProject] = useState(projects[0]);
    const [newProject, setNewProject] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateTask(title, project, date, date);
        onClose();
    };

    const handleAddProject = () => {
        if (newProject.trim()) {
            onAddProject(newProject.trim());
            setProject(newProject.trim());
            setNewProject('');
        }
    };

    const handleClose = () => {
        setTitle('');
        setProject(projects[0]);
        setNewProject('');
        onClose();
    };

    return (
        <div className="modal" style={{ top: position.y, left: position.x }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
                <h2>创建新事项</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="事项名称"
                        required
                    />
                    <select value={project} onChange={(e) => setProject(e.target.value)}>
                        {projects.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <div>
                        <input
                            type="text"
                            value={newProject}
                            onChange={(e) => setNewProject(e.target.value)}
                            placeholder="新项目名称"
                        />
                        <button type="button" onClick={handleAddProject}>
                            添加新项目
                        </button>
                    </div>
                    <button type="submit">创建</button>
                    <button type="button" onClick={handleClose}>取消</button>
                </form>
            </div>
        </div>
    );
}

export default CreateTaskModal;