import React from 'react';
import { useDrag } from 'react-dnd';
import { Task } from '../types';

interface TaskItemProps {
    task: Task;
    onEdit: (taskId: string) => void;
}

function TaskItem({ task, onEdit }: TaskItemProps) {
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: 'TASK',
        item: { id: task.id, type: 'TASK' },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [, dragLeft] = useDrag(() => ({
        type: 'RESIZE_LEFT',
        item: { id: task.id, type: 'RESIZE_LEFT' },
    }));

    const [, dragRight] = useDrag(() => ({
        type: 'RESIZE_RIGHT',
        item: { id: task.id, type: 'RESIZE_RIGHT' },
    }));

    return (
        <div
            ref={preview}
            className={`task-content ${isDragging ? 'dragging' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            onClick={() => onEdit(task.id)}
        >
            <div ref={drag} className="task-inner-content">
                <h4>{task.title}</h4>
            </div>
            <div ref={dragLeft} className="resize-handle left"></div>
            <div ref={dragRight} className="resize-handle right"></div>
        </div>
    );
}

export default TaskItem;