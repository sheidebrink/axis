import React, { useState, useEffect, useRef } from 'react';
import { commandRegistry, Command } from '../services/command-registry';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Command[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setResults(commandRegistry.search(''));
    } else {
      setQuery('');
      setSelected(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setResults(commandRegistry.search(query));
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      commandRegistry.execute(results[selected].id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.palette} onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          style={styles.input}
          placeholder="Type a command..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div style={styles.results}>
          {results.map((cmd, idx) => (
            <div
              key={cmd.id}
              style={{
                ...styles.item,
                ...(idx === selected ? styles.itemSelected : {})
              }}
              onClick={() => {
                commandRegistry.execute(cmd.id);
                onClose();
              }}
            >
              <div style={styles.itemLabel}>{cmd.label}</div>
              <div style={styles.itemMeta}>
                <span style={styles.category}>{cmd.category}</span>
                {cmd.keybinding && <kbd style={styles.kbd}>{cmd.keybinding}</kbd>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
    zIndex: 9999,
  },
  palette: {
    width: 600,
    background: '#2d2d2d',
    borderRadius: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    fontSize: 16,
    border: 'none',
    background: '#1e1e1e',
    color: '#fff',
    outline: 'none',
  },
  results: {
    maxHeight: 400,
    overflowY: 'auto',
  },
  item: {
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSelected: {
    background: '#094771',
  },
  itemLabel: {
    color: '#fff',
    fontSize: 14,
  },
  itemMeta: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#888',
  },
  kbd: {
    padding: '2px 6px',
    background: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: 3,
    fontSize: 11,
    color: '#aaa',
  },
};
