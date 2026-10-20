import React from 'react';

export interface LogEntry {
  id: string;
  type: 'system' | 'output' | 'success' | 'error';
  text: string;
}

interface TerminalPaneProps {
  logs: LogEntry[];
  title?: string;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ logs, title = 'Runtime Output / Syslog' }) => {
  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="dot dot-red"></div>
          <div className="dot dot-yellow"></div>
          <div className="dot dot-green"></div>
        </div>
        <span className="terminal-title">{title}</span>
      </div>
      <div className="terminal-body">
        {logs.map((log) => (
          <div key={log.id} className={`terminal-line ${log.type}`}>
            {log.type === 'system' && '$ '}
            {log.type === 'output' && '→ '}
            {log.type === 'success' && '✓ '}
            {log.type === 'error' && '✗ '}
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
};
