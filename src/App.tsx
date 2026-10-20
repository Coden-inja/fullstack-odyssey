import React, { useState, useEffect } from 'react';
import { ModuleId } from './types';
import { LandingCatalog } from './catalog/LandingCatalog';
import { LabLayout } from './layout/LabLayout';

import { EventLoopLab } from './modules/event-loop/EventLoopLab';
import { MiddlewareLab } from './modules/middleware/MiddlewareLab';
import { RestApiLab } from './modules/rest-api/RestApiLab';
import { SqlJoinsLab } from './modules/sql-joins/SqlJoinsLab';
import { OrmQueriesLab } from './modules/orm-queries/OrmQueriesLab';
import { AuthJwtLab } from './modules/auth-jwt/AuthJwtLab';
import { RedisQueuesLab } from './modules/redis-queues/RedisQueuesLab';
import { RscStreamingLab } from './modules/rsc-streaming/RscStreamingLab';
import { GitDagLab } from './modules/git-dag/GitDagLab';
import { CicdPipelineLab } from './modules/cicd-pipeline/CicdPipelineLab';

export const App: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);

  // Keyboard shortcut: Press Escape to return to catalog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedModule !== null) {
        setSelectedModule(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModule]);

  const renderActiveLab = (id: ModuleId) => {
    switch (id) {
      case 'event-loop': return <EventLoopLab />;
      case 'middleware': return <MiddlewareLab />;
      case 'rest-api': return <RestApiLab />;
      case 'sql-joins': return <SqlJoinsLab />;
      case 'orm-queries': return <OrmQueriesLab />;
      case 'auth-jwt': return <AuthJwtLab />;
      case 'redis-queues': return <RedisQueuesLab />;
      case 'rsc-streaming': return <RscStreamingLab />;
      case 'git-dag': return <GitDagLab />;
      case 'cicd-pipeline': return <CicdPipelineLab />;
      default: return <EventLoopLab />;
    }
  };

  if (!selectedModule) {
    return <LandingCatalog onSelectModule={(id) => setSelectedModule(id)} />;
  }

  return (
    <LabLayout
      moduleId={selectedModule}
      onBackToHome={() => setSelectedModule(null)}
      onSelectModule={(id) => setSelectedModule(id)}
    >
      {renderActiveLab(selectedModule)}
    </LabLayout>
  );
};

export default App;
