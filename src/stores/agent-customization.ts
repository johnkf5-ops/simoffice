import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentCustomization {
  avatarUrl?: string;   // data URL from uploaded image
  color?: string;       // hex color for the circle
}

interface AgentCustomizationState {
  customizations: Record<string, AgentCustomization>;  // keyed by agent ID
  setCustomization: (agentId: string, data: Partial<AgentCustomization>) => void;
  getCustomization: (agentId: string) => AgentCustomization | undefined;
}

export const useAgentCustomizationStore = create<AgentCustomizationState>()(
  persist(
    (set, get) => ({
      customizations: {},
      setCustomization: (agentId, data) => {
        set((s) => ({
          customizations: {
            ...s.customizations,
            [agentId]: { ...s.customizations[agentId], ...data },
          },
        }));
      },
      getCustomization: (agentId) => get().customizations[agentId],
    }),
    { name: 'simoffice:agent-customization' },
  ),
);
