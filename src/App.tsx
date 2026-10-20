import React, { useState } from 'react';
import { MODULES, ModuleId } from './types';
import { EventLoopSimulator } from './modules/EventLoopSimulator';
import { MiddlewareOnionSimulator } from './modules/MiddlewareOnionSimulator';
import { RestApiSimulator } from './modules/RestApiSimulator';
import { SqlJoinsSimulator } from './modules/SqlJoinsSimulator';
import { OrmQuerySimulator } from './modules/OrmQuerySimulator';
import { AuthJwtSimulator } from './modules/AuthJwtSimulator';
import { RedisQueueSimulator } from './modules/RedisQueueSimulator';
import { RscStreamingSimulator } from './modules/RscStreamingSimulator';
import { GitDagSimulator } from './modules/GitDagSimulator';
import { CicdPipelineSimulator } from './modules/CicdPipelineSimulator';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('event-loop');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'event-loop': return <EventLoopSimulator />;
      case 'middleware': return <MiddlewareOnionSimulator />;
      case 'rest-api': return <RestApiSimulator />;
      case 'sql-joins': return <SqlJoinsSimulator />;
      case 'orm-queries': return <OrmQuerySimulator />;
      case 'auth-jwt': return <AuthJwtSimulator />;
      case 'redis-queues': return <RedisQueueSimulator />;
      case 'rsc-streaming': return <RscStreamingSimulator />;
      case 'git-dag': return <GitDagSimulator />;
      case 'cicd-pipeline': return <CicdPipelineSimulator />;
      default: return <EventLoopSimulator />;
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-group">
          <div className="logo-badge">Ω</div>
          <div className="logo-text">
            <h1>Fullstack Odyssey</h1>
            <p>Interactive Systems Learning for the True Fullstack 10</p>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge active">● Live Simulation Engine</span>
          <span className="badge">10/10 Modules Ready</span>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          {MODULES.map((m) => (
            <button
              key={m.id}
              className={`module-nav-item ${activeModule === m.id ? 'active' : ''}`}
              onClick={() => setActiveModule(m.id)}
            >
              <span className="nav-num">{String(m.number).padStart(2, '0')}</span>
              <span className="nav-icon">{m.icon}</span>
              <div className="nav-info">
                <div className="nav-title">{m.title}</div>
                <div className="nav-tag">{m.tag}</div>
              </div>
            </button>
          ))}
        </aside>

        <main className="content-area">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};

export default App;
