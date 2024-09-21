import React, { useState } from 'react';

// ProjectManager 组件的属性接口
interface ProjectManagerProps {
    projects: string[];  // 现有项目列表
    onAddProject: (project: string) => void;  // 添加新项目的回调函数
}

// ProjectManager 组件：用于管理项目列表
function ProjectManager({ projects, onAddProject }: ProjectManagerProps) {
    // 状态变量，用于存储新项目名称的输入
    const [newProject, setNewProject] = useState('');

    // 处理表单提交的函数
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProject.trim()) {
            // 如果新项目名称不为空，则调用添加项目函数
            onAddProject(newProject.trim());
            // 清空输入框
            setNewProject('');
        }
    };

    return (
        <div className="project-manager">
            <h2>项目管理</h2>
            {/* 添加新项目的表单 */}
            <form onSubmit={handleSubmit}>
                <input
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    placeholder="新项目名称"
                />
                <button type="submit">添加项目</button>
            </form>
            {/* 显示现有项目列表 */}
            <ul>
                {projects.map((project) => (
                    <li key={project}>{project}</li>
                ))}
            </ul>
        </div>
    );
}

export default ProjectManager;