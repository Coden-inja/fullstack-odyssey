import { CanvasNode, CanvasWire, NodeType } from '../types';
import { PERSONA } from './story';

// One input dot on the left and at most one output dot on the right per card.
// Several wires may share a dot; nodes that never start a conversation have no output.
export const portsFor = (type: NodeType): CanvasNode['ports'] => {
  switch (type) {
    case 'browser':
      return { inputs: [], outputs: ['out-req'] };
    case 'server':
    case 'balancer':
    case 'pool':
      return { inputs: ['in'], outputs: ['out'] };
    default:
      return { inputs: ['in'], outputs: [] };
  }
};

export const makeNode = (
  id: string,
  type: NodeType,
  title: string,
  x: number,
  y: number,
  data: Record<string, any> = {}
): CanvasNode => ({ id, type, title, position: { x, y }, ports: portsFor(type), data });

export const makeWire = (from: string, to: string): CanvasWire => ({
  id: `wire-${from}-${to}`,
  sourceNodeId: from,
  sourcePortId: from === 'node-browser' ? 'out-req' : 'out',
  targetNodeId: to,
  targetPortId: 'in',
  status: 'active'
});

export const browserNode = () => makeNode('node-browser', 'browser', `${PERSONA.name}’s browser`, 0, 40);
