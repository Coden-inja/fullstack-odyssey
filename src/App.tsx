import React from 'react';
import './canvas/canvas.css';
import './canvas/workbench.css';
import { CanvasWorkbench } from './canvas/CanvasWorkbench';

// Until a second game is ready, the whole site is game 1 (the landing page waits on its branch).
export const App: React.FC = () => <CanvasWorkbench />;

export default App;
