import React, { useState, useRef } from 'react';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface BrowserPanelProps {
  panelId: string;
  config: any;
}

const BrowserPanel: React.FC<BrowserPanelProps> = ({ config }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'CBCS', url: config.metadata?.defaultUrl || 'about:blank' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [newTabUrl, setNewTabUrl] = useState('');
  const webviewRefs = useRef<Record<string, Electron.WebviewTag | null>>({});

  const addTab = () => {
    const url = newTabUrl || 'about:blank';
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'New Tab',
      url,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setNewTabUrl('');
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateTabTitle = (tabId: string, title: string) => {
    setTabs(tabs.map(t => t.id === tabId ? { ...t, title } : t));
  };

  const updateTabFavicon = (tabId: string, favicon: string) => {
    setTabs(tabs.map(t => t.id === tabId ? { ...t, favicon } : t));
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTabId === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.favicon ? (
                <img src={tab.favicon} style={styles.favicon} alt="" />
              ) : (
                <span style={styles.defaultIcon}>🌐</span>
              )}
              <span style={styles.tabTitle}>{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  style={styles.closeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={styles.newTabSection}>
          <input
            style={styles.urlInput}
            placeholder="Enter URL..."
            value={newTabUrl}
            onChange={e => setNewTabUrl(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addTab()}
          />
          <button style={styles.addButton} onClick={addTab}>+ New Tab</button>
        </div>
      </div>
      <div style={styles.webviewContainer}>
        {tabs.map(tab => (
          <webview
            key={tab.id}
            ref={el => webviewRefs.current[tab.id] = el}
            src={tab.url}
            partition={config.partition}
            style={{
              width: '100%',
              height: '100%',
              display: activeTabId === tab.id ? 'flex' : 'none',
              border: 'none',
            }}
            onPageTitleUpdated={(e: any) => updateTabTitle(tab.id, e.title)}
            onPageFaviconUpdated={(e: any) => {
              if (e.favicons && e.favicons.length > 0) {
                updateTabFavicon(tab.id, e.favicons[0]);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: '#1e1e1e',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    background: '#2d2d2d',
    borderBottom: '1px solid #444',
    padding: '8px 8px 0 8px',
  },
  tabs: {
    display: 'flex',
    flex: 1,
    gap: 4,
    overflowX: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#1e1e1e',
    border: '1px solid #444',
    borderBottom: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    minWidth: 150,
    maxWidth: 200,
  },
  tabActive: {
    background: '#094771',
    borderColor: '#0e639c',
  },
  tabTitle: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  favicon: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  defaultIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: 20,
    cursor: 'pointer',
    padding: 0,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTabSection: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    paddingBottom: 8,
  },
  urlInput: {
    padding: '6px 12px',
    background: '#1e1e1e',
    border: '1px solid #444',
    color: '#fff',
    fontSize: 13,
    borderRadius: 4,
    width: 200,
  },
  addButton: {
    padding: '6px 12px',
    background: '#0e639c',
    border: 'none',
    color: '#fff',
    fontSize: 13,
    borderRadius: 4,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    border: 'none',
  },
};

export default BrowserPanel;
