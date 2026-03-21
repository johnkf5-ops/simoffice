/**
 * 3D Office — Claw3D RetroOffice3D integration test
 */
import { useEffect, useMemo } from 'react';
import { RetroOffice3D } from '@/features/retro-office/RetroOffice3D';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { mapAgentToOffice } from '@/lib/office-adapter';

export function Office3D() {
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const gatewayStatus = useGatewayStore((s) => s.status);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  const officeAgents = useMemo(
    () => (agents ?? []).map(mapAgentToOffice),
    [agents],
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <RetroOffice3D
        agents={officeAgents}
        gatewayStatus={gatewayStatus.state === 'running' ? 'connected' : 'disconnected'}
      />
    </div>
  );
}
