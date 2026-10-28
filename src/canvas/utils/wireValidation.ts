import { CanvasNode } from '../types';

export interface WireValidationResult {
  valid: boolean;
  warning?: string;
  rfcCitation?: string;
  protocol?: string;
}

export function validateSystemWire(
  sourceNode: CanvasNode,
  sourcePortId: string,
  targetNode: CanvasNode,
  targetPortId: string
): WireValidationResult {
  // 1. Self-referencing loop
  if (sourceNode.id === targetNode.id) {
    return {
      valid: false,
      warning: 'Self-referencing Loop: A system process cannot establish a network socket back to itself.',
      rfcCitation: 'RFC 9110 § 3.2'
    };
  }

  // 2. Client Browser -> Database directly
  if (sourceNode.type === 'browser' && targetNode.type === 'database') {
    return {
      valid: false,
      warning: 'Security Boundary Blocked: Public ingress to PostgreSQL Port 5432 is forbidden. Direct client browser-to-DB connections violate 3-tier architecture boundaries.',
      rfcCitation: 'RFC 9110 & OWASP Top 10 (A01: Broken Access Control)'
    };
  }

  // 3. Database -> Client Browser (backwards)
  if (sourceNode.type === 'database' && targetNode.type === 'browser') {
    return {
      valid: false,
      warning: 'Invalid Direction: Databases cannot initiate unsolicited socket connections to external client browsers.',
      rfcCitation: 'RFC 9110 (Client-Server Request/Response Paradigm)'
    };
  }

  // 4. Balancer -> Balancer (Infinite loop hazard)
  if (sourceNode.type === 'balancer' && targetNode.type === 'balancer') {
    return {
      valid: false,
      warning: 'Proxy Loop Hazard: Cascading load balancers without health routing can trigger infinite HTTP forwarding loops.',
      rfcCitation: 'RFC 9110 § 7.6.2 (Max-Forwards & Loop Detection)'
    };
  }

  // 5. Database -> Balancer
  if (sourceNode.type === 'database' && targetNode.type === 'balancer') {
    return {
      valid: false,
      warning: 'Protocol Mismatch: Database wire protocol (PostgreSQL frontend/backend) cannot terminate directly at an HTTP reverse proxy.',
      rfcCitation: 'PostgreSQL Section 53: Frontend/Backend Protocol'
    };
  }

  // 6. Redis -> Client Browser
  if (sourceNode.type === 'redis' && targetNode.type === 'browser') {
    return {
      valid: false,
      warning: 'Security Policy Blocked: Redis does not implement browser TLS authentication or CORS. Exposing Redis Port 6379 to browsers permits unauthorized memory exfiltration.',
      rfcCitation: 'Redis Security Documentation (Protected Mode & Trusted Environments)'
    };
  }

  // 7. Queue -> Database directly without worker
  if (sourceNode.type === 'queue' && targetNode.type === 'database') {
    return {
      valid: false,
      warning: 'Missing Worker Layer: Asynchronous message queues do not execute SQL queries directly. A worker process must consume messages from the queue and execute the write.',
      rfcCitation: 'Enterprise Integration Patterns: Consumer Worker Pattern'
    };
  }

  // Determine established protocol for valid connection
  let protocol = 'TCP Stream Socket';
  if (sourceNode.type === 'browser' || sourceNode.type === 'balancer') {
    protocol = 'HTTP/1.1 (TLS 1.3)';
  } else if (targetNode.type === 'database') {
    protocol = 'PostgreSQL Wire Protocol (Port 5432)';
  } else if (targetNode.type === 'redis') {
    protocol = 'Redis RESP Protocol (Port 6379)';
  } else if (targetNode.type === 'queue') {
    protocol = 'BullMQ Redis Job Stream';
  }

  return {
    valid: true,
    protocol
  };
}
