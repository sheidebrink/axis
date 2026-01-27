import { useEffect, useState, useRef } from 'react';
import { WorkspaceContext, ContextKey } from '../../shared/types';
import { eventBus } from '../services/event-bus';

class WorkspaceContextManager {
  private context: WorkspaceContext = {
    vendor: null,
    recordId: null,
    userRole: null,
    activeWorkflow: null,
  };

  private listeners = new Map<ContextKey, Set<(value: any) => void>>();

  get(key: ContextKey) {
    return this.context[key];
  }

  getAll(): WorkspaceContext {
    return { ...this.context };
  }

  set(key: ContextKey, value: any): void {
    if (this.context[key] === value) return;
    
    this.context[key] = value;
    this.listeners.get(key)?.forEach(cb => cb(value));
    eventBus.emit('context.updated', { key, value });
  }

  subscribe(key: ContextKey, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => this.listeners.get(key)?.delete(callback);
  }
}

export const workspaceContext = new WorkspaceContextManager();

// React hook - only re-renders when specific keys change
export function useWorkspaceContext<K extends ContextKey>(
  key: K
): WorkspaceContext[K] {
  const [value, setValue] = useState(() => workspaceContext.get(key));

  useEffect(() => {
    return workspaceContext.subscribe(key, setValue);
  }, [key]);

  return value;
}

// Hook for multiple keys
export function useWorkspaceContextKeys<K extends ContextKey>(
  keys: K[]
): Pick<WorkspaceContext, K> {
  const [values, setValues] = useState(() => {
    const result = {} as Pick<WorkspaceContext, K>;
    keys.forEach(key => {
      result[key] = workspaceContext.get(key);
    });
    return result;
  });

  useEffect(() => {
    const unsubscribers = keys.map(key =>
      workspaceContext.subscribe(key, (value) => {
        setValues(prev => ({ ...prev, [key]: value }));
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, [keys.join(',')]);

  return values;
}
