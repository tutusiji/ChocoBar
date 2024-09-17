import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Task } from '../types';

interface TaskItemProps {
    task: Task;
    onEdit: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;
    onDelete: (taskId: string) => void;
}

function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [project, setProject] = useState(task.project);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'TASK',
        item: { id: task.id, startDate: task.startDate, endDate: task.endDate },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const leftHandleRef = useRef<HTMLDivElement>(null);
    const rightHandleRef = useRef<HTMLDivElement>(null);

    const [, dragLeft] = useDrag(() => ({
        type: 'RESIZE_LEFT',
        item: { id: task.id, startDate: task.startDate },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();
            if (dropResult) {
                onEdit(task.id, undefined, undefined, (dropResult as any).date, undefined);
            }
        },
    }));

    const [, dragRight] = useDrag(() => ({
        type: 'RESIZE_RIGHT',
        item: { id: task.id, endDate: task.endDate },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();
            if (dropResult) {
                onEdit(task.id, undefined, undefined, undefined, (dropResult as any).date);
            }
        },
    }));

    const handleSave = () => {
        onEdit(task.id, title, project);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="task-item">
                <input value={title} onChange={e => setTitle(e.target.value)} />
                <input value={project} onChange={e => setProject(e.target.value)} />
                <button onClick={handleSave}>保存</button>
                <button onClick={() => setIsEditing(false)}>取消</button>
            </div>
        );
    }

    return (
        <div
            ref={drag}
            className={`task-item ${isDragging ? 'dragging' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <div ref={dragLeft} className="resize-handle left"></div>
            <h4>{task.title}</h4>
            <p>项目: {task.project}</p>
            <button onClick={() => setIsEditing(true)}>编辑</button>
            <button onClick={() => onDelete(task.id)}>删除</button>
            <div ref={dragRight} className="resize-handle right"></div>
        </div>
    );
}

export default TaskItem;