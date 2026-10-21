import React, { useState } from 'react';
import { Terminal, Copy, Check, CornerDownLeft } from 'lucide-react';

export interface LogEntry {
  id: string;
  type: 'system' | 'output' | 'success' | 'error';
  text: string;
}

interface TerminalPaneProps {
  logs: LogEntry[];
  title?: string;
  onRunCommand?: (cmd: string) => void;
  inputPlaceholder?: string;
  maxHeight?: number | string;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({
  logs,
  title = 'TERMINAL — zsh 80x24',
  onRunCommand,
  inputPlaceholder = 'Type command and press Enter...',
  maxHeight = 280
}) => {
  const [copied, setCopied] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const handleCopy = () => {
    const text = logs.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !onRunCommand) return;
    onRunCommand(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="terminal-window">
      {/* macOS Chrome Header */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" title="Close" />
          <span className="dot dot-yellow" title="Minimize" />
          <span className="dot dot-green" title="Expand" />
        </div>
        
        <span className="terminal-title">
          <Terminal size={13} style={{ color: '#38bdf8' }} />
          {title}
        </span>

        <div className="terminal-actions">
          <button
            onClick={handleCopy}
            className="btn btn-sm"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
            title="Copy logs"
          >
            {copied ? <Check size={12} style={{ color: '#4ade80' }} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div className="terminal-body" style={{ maxHeight }}>
        {logs.length === 0 ? (
          <div style={{ color: '#71717a', fontStyle: 'italic', padding: '8px 0' }}>
            No output yet. Run an action to stream events...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`terminal-line ${log.type}`}>
              <span className="glyph">
                {log.type === 'system' && '$'}
                {log.type === 'output' && '→'}
                {log.type === 'success' && '✓'}
                {log.type === 'error' && '✗'}
              </span>
              <span>{log.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Interactive Command Input Line (If Enabled) */}
      {onRunCommand && (
        <form onSubmit={handleSubmit} className="terminal-prompt-row" style={{ margin: '0 12px 12px' }}>
          <span className="terminal-prompt-glyph">→</span>
          <input
            type="text"
            className="terminal-prompt-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={inputPlaceholder}
          />
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6 }}
          >
            <CornerDownLeft size={11} />
            Run
          </button>
        </form>
      )}
    </div>
  );
};
