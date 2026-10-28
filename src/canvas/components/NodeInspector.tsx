import React from 'react';
import { X, FileCode2 } from 'lucide-react';
import { CanvasNode } from '../types';
import { GeneratedSource, NODE_BLURB } from '../utils/codegen';

interface NodeInspectorProps {
  node: CanvasNode | null;
  source: GeneratedSource | null;
  onClose: () => void;
}

// Read-only: what this node is, and the code it runs given its current wires.
// (No hooks here: the old version called useState after an early return, which
// crashes React the moment the drawer closes.)
export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, source, onClose }) => {
  if (!node || !source) return null;

  return (
    <aside className="inspector" onMouseDown={(e) => e.stopPropagation()}>
      <header className="inspector-head">
        <div>
          <div className="inspector-eyebrow">{node.type === 'browser' ? 'client' : node.type}</div>
          <h3 className="inspector-title">{node.title}</h3>
        </div>
        <button className="icon-btn" onClick={onClose} title="Close (Esc)">
          <X size={16} />
        </button>
      </header>
      <p className="inspector-blurb">{NODE_BLURB[node.type]}</p>
      <div className="inspector-file">
        <FileCode2 size={12} /> {source.filename}
        <span className="inspector-live">updates as you rewire</span>
      </div>
      <pre className="inspector-code">
        <code>{source.code}</code>
      </pre>
    </aside>
  );
};
