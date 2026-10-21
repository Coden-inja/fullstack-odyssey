import React from 'react';
import { MODULES, ModuleId } from '../types';

interface LabLayoutProps {
  moduleId: ModuleId;
  onBackToHome: () => void;
  onSelectModule: (id: ModuleId) => void;
  children: React.ReactNode;
}

export const LabLayout: React.FC<LabLayoutProps> = ({
  moduleId,
  onBackToHome,
  onSelectModule,
  children
}) => {
  const currentMeta = MODULES.find(m => m.id === moduleId) || MODULES[0];

  return (
    <div className="lab-fullscreen">
      {/* Top Header Bar */}
      <header className="lab-topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={onBackToHome} title="Return to catalog [Esc]">
            ← All Labs
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border-light)' }} />
          <div className="topbar-title">
            <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{currentMeta.number}</span>
            <span>{currentMeta.title}</span>
            <span className="badge badge-indigo" style={{ marginLeft: 6 }}>{currentMeta.category}</span>
            <span className="badge">{currentMeta.difficulty}</span>
          </div>
        </div>

        <div className="topbar-right">
          {/* Quick Module Switcher */}
          <select
            className="module-switcher"
            value={moduleId}
            onChange={(e) => onSelectModule(e.target.value as ModuleId)}
          >
            {MODULES.map(m => (
              <option key={m.id} value={m.id}>
                {m.number}. {m.title}
              </option>
            ))}
          </select>

          <button className="btn btn-secondary" onClick={onBackToHome}>
            Exit Lab
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="lab-body">
        {children}
      </main>
    </div>
  );
};
