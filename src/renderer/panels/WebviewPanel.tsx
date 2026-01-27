import React, { useEffect, useRef, useState } from 'react';
import { WebviewPanelConfig } from '../shared/types';
import { eventBus } from '../services/event-bus';
import { webviewLifecycle } from '../services/webview-lifecycle';

interface WebviewPanelProps {
  config: WebviewPanelConfig;
  panelId: string;
  isVisible?: boolean;
}

const WebviewPanel: React.FC<WebviewPanelProps> = ({ config, panelId, isVisible = true }) => {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    webviewLifecycle.register(panelId, webview);
    setIsMounted(true);

    return () => {
      webviewLifecycle.unregister(panelId);
    };
  }, [panelId]);

  // Suspend/resume based on visibility
  useEffect(() => {
    if (!isMounted) return;

    if (isVisible) {
      webviewLifecycle.resume(panelId);
    } else {
      webviewLifecycle.suspend(panelId);
    }
  }, [isVisible, isMounted, panelId]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleNewWindow = (e: Electron.NewWindowEvent) => {
      e.preventDefault();
      
      // Limit panel creation
      if (webviewLifecycle.getActiveCount() >= 10) {
        console.warn('Max panels reached');
        return;
      }

      eventBus.emit('record.opened', {
        recordId: extractRecordId(e.url),
        vendor: config.metadata?.vendor || 'unknown'
      });

      window.electron.createPanel({
        type: 'webview',
        url: e.url,
        partition: config.partition,
        title: 'New Window',
        capabilities: config.capabilities,
      });
    };

    const handleDidNavigate = (e: Electron.DidNavigateEvent) => {
      const recordId = extractRecordId(e.url);
      if (recordId && config.capabilities.canWriteContext) {
        eventBus.emit('record.changed', {
          recordId,
          field: 'url',
          value: e.url
        });
      }
    };

    webview.addEventListener('new-window', handleNewWindow as any);
    webview.addEventListener('did-navigate', handleDidNavigate as any);

    return () => {
      webview.removeEventListener('new-window', handleNewWindow as any);
      webview.removeEventListener('did-navigate', handleDidNavigate as any);
    };
  }, [config, panelId]);

  return (
    <webview
      ref={webviewRef}
      src={config.url}
      partition={config.partition}
      preload={config.preload}
      style={{ width: '100%', height: '100%', display: isVisible ? 'block' : 'none' }}
      allowpopups="false"
    />
  );
};

function extractRecordId(url: string): string {
  const match = url.match(/\/record\/([^\/\?]+)/);
  return match ? match[1] : '';
}

export default WebviewPanel;
