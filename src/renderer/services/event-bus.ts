import { EventType, EventPayload } from '../shared/types';

type EventHandler<T extends EventType> = (payload: EventPayload<T>) => void;

class EventBus {
  private handlers = new Map<EventType, Set<EventHandler<any>>>();
  private listenerCount = 0;

  on<T extends EventType>(event: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    this.listenerCount++;

    // Warn on potential leak
    if (this.listenerCount > 100) {
      console.warn(`EventBus: ${this.listenerCount} listeners registered. Possible memory leak.`);
    }

    return () => this.off(event, handler);
  }

  off<T extends EventType>(event: T, handler: EventHandler<T>): void {
    const removed = this.handlers.get(event)?.delete(handler);
    if (removed) this.listenerCount--;
  }

  emit<T extends EventType>(event: T, payload: EventPayload<T>): void {
    this.handlers.get(event)?.forEach(handler => handler(payload));
  }

  clear(): void {
    this.handlers.clear();
    this.listenerCount = 0;
  }

  getListenerCount(): number {
    return this.listenerCount;
  }
}

export const eventBus = new EventBus();
