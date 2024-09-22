import React from 'react';
import { useDrag } from 'react-dnd';
import { Task } from '../types';

// TaskItem 组件的属性接口
interface TaskItemProps {
    task: Task;
    onEdit: (taskId: string, position: { x: number; y: number }) => void;
    onResize: (taskId: string, newTitle?: string, newProject?: string, newStartDate?: Date, newEndDate?: Date) => void;
    onMove: (taskId: string, newStartDate: Date) => void;
}

// TaskItem 组件：用于渲染单个任务项
function TaskItem({ task, onEdit, onResize, onMove }: TaskItemProps) {
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: 'TASK',
        item: { id: task.id, type: 'TASK' },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    // 设置左侧调整大小的拖拽
    const [, dragLeft] = useDrag(() => ({
        type: 'RESIZE_LEFT',
        item: { id: task.id, type: 'RESIZE_LEFT' },
    }));

    // 设置右侧调整大小的拖拽
    const [, dragRight] = useDrag(() => ({
        type: 'RESIZE_RIGHT',
        item: { id: task.id, type: 'RESIZE_RIGHT' },
    }));

    return (
        <div
            ref={preview}
            className={`task-content ${isDragging ? 'dragging' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            onClick={(e) => {
                e.stopPropagation();
                // 获取点击位置并调用编辑函数
                const rect = e.currentTarget.getBoundingClientRect();
                onEdit(task.id, { x: rect.left, y: rect.bottom });
            }}
        >
            {/* 任务内容 */}
            <div ref={drag} className="task-inner-content">
                <h4>{task.title}</h4>
            </div>
            {/* 左侧调整大小的手柄 */}
            <div ref={dragLeft} className="resize-handle left"></div>
            {/* 右侧调整大小的手柄 */}
            <div ref={dragRight} className="resize-handle right"></div>
        </div>
    );
}

export default TaskItem;