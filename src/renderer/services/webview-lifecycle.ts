class WebviewLifecycleManager {
  private activeWebviews = new Map<string, Electron.WebviewTag>();
  private suspendedStates = new Map<string, string>(); // panelId -> last URL
  private readonly MAX_ACTIVE = 5;

  register(panelId: string, webview: Electron.WebviewTag): void {
    this.activeWebviews.set(panelId, webview);
    this.enforceLimit();
  }

  unregister(panelId: string): void {
    const webview = this.activeWebviews.get(panelId);
    if (webview) {
      this.suspendedStates.set(panelId, webview.getURL());
      this.activeWebviews.delete(panelId);
    }
  }

  suspend(panelId: string): void {
    const webview = this.activeWebviews.get(panelId);
    if (!webview) return;

    this.suspendedStates.set(panelId, webview.getURL());
    
    // Stop rendering and JS execution
    webview.setAudioMuted(true);
    (webview as any).setBackgroundThrottling(true);
  }

  resume(panelId: string): void {
    const webview = this.activeWebviews.get(panelId);
    if (!webview) return;

    webview.setAudioMuted(false);
    (webview as any).setBackgroundThrottling(false);
  }

  private enforceLimit(): void {
    if (this.activeWebviews.size <= this.MAX_ACTIVE) return;

    // Suspend oldest inactive webview
    const [oldestId] = Array.from(this.activeWebviews.keys());
    this.suspend(oldestId);
  }

  getActiveCount(): number {
    return this.activeWebviews.size;
  }
}

export const webviewLifecycle = new WebviewLifecycleManager();
