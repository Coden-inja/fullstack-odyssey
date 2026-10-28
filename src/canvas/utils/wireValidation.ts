import { CanvasNode } from '../types';

export interface WireValidationResult {
  valid: boolean;
  warning?: string;
  rfcCitation?: string;
  protocol?: string;
}

// Which wires make sense, explained only with words the player has already met
// at the level where each node type first appears.
export function validateSystemWire(
  sourceNode: CanvasNode,
  _sourcePortId: string,
  targetNode: CanvasNode,
  _targetPortId: string
): WireValidationResult {
  const s = sourceNode.type;
  const t = targetNode.type;

  if (sourceNode.id === targetNode.id) {
    return { valid: false, warning: 'A wire needs two different programs at its ends.' };
  }

  if (t === 'browser') {
    return {
      valid: false,
      warning:
        'Nothing calls Bob’s browser. The browser always starts the conversation; replies come back along the wire it opened.'
    };
  }

  if (s === 'browser' && t === 'database') {
    return {
      valid: false,
      warning:
        'Bob’s browser can’t talk to PostgreSQL directly: the database only accepts connections from your own servers. Opening it to the internet would let anyone read every row.'
    };
  }

  if (s === 'browser' && t !== 'server' && t !== 'balancer') {
    return { valid: false, warning: `Bob’s browser speaks HTTP to a server. It can’t talk to ${targetNode.title} directly.` };
  }

  if (s === 'balancer' && t !== 'server') {
    return { valid: false, warning: 'A load balancer forwards requests to server instances only.' };
  }

  if (s === 'server' && (t === 'server' || t === 'balancer')) {
    return {
      valid: false,
      warning: 'Servers here don’t forward requests to each other. Put a load balancer in front of them instead.'
    };
  }

  if (s === 'pool' && t !== 'database') {
    return { valid: false, warning: 'PgBouncer only hands out connections to PostgreSQL.' };
  }

  if (t === 'pool' && s !== 'server') {
    return { valid: false, warning: 'Only your servers borrow connections from PgBouncer.' };
  }

  if (t === 'queue' && s !== 'server') {
    return { valid: false, warning: 'Only your servers add jobs to the queue.' };
  }

  if (t === 'redis' && s !== 'server') {
    return { valid: false, warning: 'Only your servers read and write Redis.' };
  }

  if (t === 'database' && s !== 'server' && s !== 'pool') {
    return { valid: false, warning: 'Only your servers (or PgBouncer) open connections to PostgreSQL.' };
  }

  let protocol = 'a connection';
  if (s === 'browser' || s === 'balancer') protocol = 'HTTP';
  else if (t === 'database') protocol = 'SQL, port 5432';
  else if (t === 'pool') protocol = 'SQL via PgBouncer, port 6432';
  else if (t === 'redis') protocol = 'Redis, port 6379';
  else if (t === 'queue') protocol = 'the job queue';

  return { valid: true, protocol };
}
