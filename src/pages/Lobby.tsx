/**
 * SimOffice — The Lobby
 * Full-screen 3D office. Your agents working. That's it.
 * Navigation lives in the toolbar.
 */
import { useEffect } from 'react';
import { useAgentsStore } from '@/stores/agents';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import { OfficeAdapter } from '@/components/lobby/OfficeAdapter';

export function Lobby() {
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <BuddyPanel hideBackButton currentPage="/" />

      {/* 3D Office */}
      <div style={{ flex: 1 }}>
        <OfficeAdapter />
      </div>
    </div>
  );
}
