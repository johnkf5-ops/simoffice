/**
 * Office Adapter — Bridges ClawX's AgentSummary to Claw3D's OfficeAgent format
 */

export interface OfficeAgent {
  id: string;
  name: string;
  status: 'working' | 'idle' | 'error';
  color: string;
  item: string;
}

const ITEMS = [
  'globe', 'books', 'coffee', 'palette', 'camera',
  'waveform', 'shield', 'fire', 'plant', 'laptop',
];

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function getDeterministicItem(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ITEMS[Math.abs(hash) % ITEMS.length];
}

export function mapAgentToOffice(agent: {
  id: string;
  name: string;
  [key: string]: unknown;
}, isWorking = false): OfficeAgent {
  return {
    id: agent.id,
    name: agent.name || 'Unknown',
    status: isWorking ? 'working' : 'idle',
    color: stringToColor(agent.id),
    item: getDeterministicItem(agent.id),
  };
}
