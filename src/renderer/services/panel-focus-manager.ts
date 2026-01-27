class PanelFocusManager {
  private focusHistory: string[] = [];
  private maxHistory = 10;

  recordFocus(panelId: string): void {
    this.focusHistory = this.focusHistory.filter(id => id !== panelId);
    this.focusHistory.unshift(panelId);
    
    if (this.focusHistory.length > this.maxHistory) {
      this.focusHistory.pop();
    }
  }

  getPreviousFocus(): string | undefined {
    return this.focusHistory[1];
  }

  focusPrevious(workspaceApi: any): void {
    const prevId = this.getPreviousFocus();
    if (!prevId) return;

    const panel = workspaceApi.panels.find((p: any) => p.id === prevId);
    panel?.api.setActive();
  }

  focusByDirection(direction: 'up' | 'down' | 'left' | 'right', workspaceApi: any): void {
    const active = workspaceApi.activePanel;
    if (!active) return;

    const activeRect = active.element.getBoundingClientRect();
    const candidates = workspaceApi.panels
      .filter((p: any) => p !== active)
      .map((p: any) => ({
        panel: p,
        rect: p.element.getBoundingClientRect(),
      }));

    let best = null;
    let bestScore = Infinity;

    for (const { panel, rect } of candidates) {
      const score = this.calculateDirectionScore(activeRect, rect, direction);
      if (score < bestScore) {
        bestScore = score;
        best = panel;
      }
    }

    best?.api.setActive();
  }

  private calculateDirectionScore(
    from: DOMRect,
    to: DOMRect,
    direction: string
  ): number {
    const fromCenter = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    const toCenter = { x: to.left + to.width / 2, y: to.top + to.height / 2 };

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    // Check if in correct direction
    if (direction === 'right' && dx <= 0) return Infinity;
    if (direction === 'left' && dx >= 0) return Infinity;
    if (direction === 'down' && dy <= 0) return Infinity;
    if (direction === 'up' && dy >= 0) return Infinity;

    // Distance score
    return Math.sqrt(dx * dx + dy * dy);
  }

  clear(): void {
    this.focusHistory = [];
  }
}

export const panelFocusManager = new PanelFocusManager();
