import { webviewLifecycle } from './webview-lifecycle';
import { eventBus } from './event-bus';

class PerformanceMonitor {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    this.intervalId = setInterval(() => {
      const metrics = {
        activeWebviews: webviewLifecycle.getActiveCount(),
        eventListeners: eventBus.getListenerCount(),
        memory: (performance as any).memory?.usedJSHeapSize || 0,
      };

      if (metrics.activeWebviews > 5) {
        console.warn(`Performance: ${metrics.activeWebviews} active webviews`);
      }

      if (metrics.eventListeners > 50) {
        console.warn(`Performance: ${metrics.eventListeners} event listeners`);
      }
    }, 30000); // Check every 30s
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
