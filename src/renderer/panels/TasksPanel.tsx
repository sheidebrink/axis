import React, { useState, useEffect } from 'react';
import { eventBus } from '../services/event-bus';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  priority?: 'low' | 'medium' | 'high';
}

interface TasksPanelProps {
  panelId: string;
  config: any;
  api?: any; // Dockview panel API
}

const TasksPanel: React.FC<TasksPanelProps> = ({ panelId, api }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`axis-panel-collapsed-${panelId}`);
    return saved === 'true';
  });

  useEffect(() => {
    // Load tasks from localStorage
    const saved = localStorage.getItem('axis-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save tasks to localStorage
    localStorage.setItem('axis-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    // Emit initial collapsed state
    eventBus.emit('panel.collapsed' as any, { panelId, collapsed: isCollapsed });
    
    // Use API to hide tab if available
    if (api && isCollapsed) {
      setTimeout(() => {
        try {
          const group = (api as any)._group;
          if (group && group.element) {
            const tabsContainer = group.element.querySelector('.tabs-and-actions-container');
            if (tabsContainer) {
              (tabsContainer as HTMLElement).style.display = 'none';
            }
          }
        } catch (e) {
          console.error('Failed to hide tab on mount:', e);
        }
      }, 100);
    }
  }, [panelId, isCollapsed, api]);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem(`axis-panel-collapsed-${panelId}`, String(newCollapsed));
    
    // Emit event
    eventBus.emit('panel.collapsed' as any, { panelId, collapsed: newCollapsed });
    
    // Hide the tab and resize the panel using the group API
    if (api) {
      try {
        const group = (api as any)._group;
        if (group) {
          // Hide/show the tabs container
          if (group.element) {
            const tabsContainer = group.element.querySelector('.tabs-and-actions-container');
            if (tabsContainer) {
              (tabsContainer as HTMLElement).style.display = newCollapsed ? 'none' : '';
            }
          }
          
          // Set the group width
          if (newCollapsed) {
            // Collapse to minimal width
            group.api?.setSize({ width: 50 });
            // Lock the size
            if (group.api?.setConstraints) {
              group.api.setConstraints({ minimumWidth: 50, maximumWidth: 50 });
            }
          } else {
            // Restore to normal width
            group.api?.setSize({ width: 300 });
            // Unlock the size
            if (group.api?.setConstraints) {
              group.api.setConstraints({ minimumWidth: 200, maximumWidth: undefined });
            }
          }
        }
      } catch (e) {
        console.error('Failed to toggle panel:', e);
      }
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([task, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div 
      className={isCollapsed ? 'panel-collapsed' : ''}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: isCollapsed ? '50px' : '100%',
        minWidth: isCollapsed ? '50px' : '250px',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '70px',
      }}>
        {!isCollapsed && (
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Tasks</h2>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
              {activeCount} active {activeCount === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          style={{
            padding: '6px 12px',
            backgroundColor: '#3c3c3c',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#d4d4d4',
            cursor: 'pointer',
            fontSize: '12px',
            marginLeft: isCollapsed ? '0' : 'auto',
          }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '◀' : '▶'}
        </button>
      </div>

      {/* Add Task */}
      {!isCollapsed && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a new task..."
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#3c3c3c',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#d4d4d4',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={addTask}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0e639c',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      {!isCollapsed && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', gap: '8px' }}>
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                backgroundColor: filter === f ? '#0e639c' : '#3c3c3c',
                border: 'none',
                borderRadius: '4px',
                color: '#d4d4d4',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      {!isCollapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: '#888',
              fontSize: '14px',
            }}>
              No tasks {filter !== 'all' && `(${filter})`}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: '4px',
                  backgroundColor: '#2d2d2d',
                  borderRadius: '4px',
                  border: '1px solid #3c3c3c',
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? '#888' : '#d4d4d4',
                  }}>
                    {task.title}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#d4d4d4',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TasksPanel;
