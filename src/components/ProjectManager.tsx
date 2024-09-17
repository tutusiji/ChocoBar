import React, { useState } from 'react';

interface ProjectManagerProps {
    projects: string[];
    onAddProject: (project: string) => void;
}

function ProjectManager({ projects, onAddProject }: ProjectManagerProps) {
    const [newProject, setNewProject] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProject.trim()) {
            onAddProject(newProject.trim());
            setNewProject('');
        }
    };

    return (
        <div className="project-manager">
            <h2>项目管理</h2>
            <form onSubmit={handleSubmit}>
                <input
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    placeholder="新项目名称"
                />
                <button type="submit">添加项目</button>
            </form>
            <ul>
                {projects.map((project) => (
                    <li key={project}>{project}</li>
                ))}
            </ul>
        </div>
    );
}

export default ProjectManager;