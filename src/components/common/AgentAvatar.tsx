import { useAgentCustomizationStore } from '@/stores/agent-customization';

interface AgentAvatarProps {
  agentId: string;
  name: string;
  size?: number;  // default 24
}

export function AgentAvatar({ agentId, name, size = 24 }: AgentAvatarProps) {
  const customization = useAgentCustomizationStore((s) => s.customizations[agentId]);
  const avatarUrl = customization?.avatarUrl;
  const color = customization?.color || '#7c3aed';  // default purple

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, color: 'white', flexShrink: 0,
    }}>
      {name?.charAt(0).toUpperCase() || 'A'}
    </div>
  );
}
