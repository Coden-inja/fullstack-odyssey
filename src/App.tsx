import React from 'react';
import './canvas/canvas.css';
import './canvas/workbench.css';
import { CanvasWorkbench } from './canvas/CanvasWorkbench';
import { Landing } from './landing/Landing';

// One path per game; each game page only talks about its own game.
const path = window.location.pathname.replace(/\/+$/, '') || '/';

export const App: React.FC = () => {
  if (path === '/tatkal') return <CanvasWorkbench />;
  return <Landing />;
};

export default App;
