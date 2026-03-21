/**
 * OpenLobby — The Lobby
 * 3D office hero at top. AOL channel grid below. Buddy list on left.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { useChatStore } from '@/stores/chat';
import { StatusDot } from '@/components/common/StatusDot';
import { PixelOffice } from '@/components/lobby/PixelOffice';

/* ═══ 3D Office Components ═══ */

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 20]} />
      <meshStandardMaterial color="#c4a882" />
    </mesh>
  );
}

function Walls() {
  return (
    <group>
      <mesh position={[0, 1.5, -10]}>
        <boxGeometry args={[30, 3, 0.2]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[-15, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 20]} />
        <meshStandardMaterial color="#e0d4be" />
      </mesh>
      <mesh position={[15, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 20]} />
        <meshStandardMaterial color="#e0d4be" />
      </mesh>
    </group>
  );
}

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color="#8b6f4e" />
      </mesh>
      {[[-0.6, 0.375, -0.3], [0.6, 0.375, -0.3], [-0.6, 0.375, 0.3], [0.6, 0.375, 0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#5a4a3a" />
        </mesh>
      ))}
      <mesh position={[0, 1.1, -0.2]}>
        <boxGeometry args={[0.5, 0.35, 0.03]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 1.1, -0.18]}>
        <planeGeometry args={[0.44, 0.29]} />
        <meshStandardMaterial color="#4488ff" emissive="#4488ff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function AgentAvatar({ agent, position }: { agent: OfficeAgent; position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);
  const walkPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    walkPhase.current += delta * 2;
    meshRef.current.position.y = position[1] + Math.sin(walkPhase.current) * 0.02;
  });

  const color = new THREE.Color(agent.color);

  return (
    <group ref={meshRef} position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={color.clone().lerp(new THREE.Color('#ffffff'), 0.3)} />
      </mesh>
      <mesh position={[0.12, 1.1, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : '#fbbf24'}
          emissive={agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : '#fbbf24'}
          emissiveIntensity={0.5}
        />
      </mesh>
      <Billboard position={[0, 1.3, 0]}>
        <Text fontSize={0.12} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
          {agent.name}
        </Text>
      </Billboard>
    </group>
  );
}

function OfficeScene({ agents }: { agents: OfficeAgent[] }) {
  const deskPositions: [number, number, number][] = [
    [-4, 0, -3], [-1.5, 0, -3], [1.5, 0, -3], [4, 0, -3],
    [-4, 0, 0], [-1.5, 0, 0], [1.5, 0, 0], [4, 0, 0],
  ];

  const agentPositions: [number, number, number][] = agents.map((_, i) => {
    if (i < deskPositions.length) {
      const desk = deskPositions[i];
      return [desk[0], 0, desk[2] + 0.6];
    }
    return [8 + (i % 3) * 2, 0, -4 + Math.floor(i / 3) * 2];
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <hemisphereLight args={['#87CEEB', '#c4a882', 0.4]} />
      <Floor />
      <Walls />
      {deskPositions.slice(0, Math.max(agents.length, 4)).map((pos, i) => (
        <Desk key={i} position={pos} />
      ))}
      {agents.map((agent, i) => (
        <AgentAvatar key={agent.id} agent={agent} position={agentPositions[i] || [0, 0, 0]} />
      ))}
      <OrbitControls makeDefault minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={20} target={[0, 1, 0]} enablePan={false} />
      {/* Sky/ceiling color */}
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 20, 40]} />
    </>
  );
}

/* ═══ LOBBY PAGE ═══ */

export function Lobby() {
  const navigate = useNavigate();
  const gatewayStatus = useGatewayStore((s) => s.status);
  const startGateway = useGatewayStore((s) => s.start);
  const isOnline = gatewayStatus.state === 'running';

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const sessions = useChatStore((s) => s.sessions);
  const newSession = useChatStore((s) => s.newSession);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  const toolbarItems = [
    { icon: '💬', label: 'Chat', onClick: () => { newSession(); navigate('/chat'); } },
    { icon: '🤖', label: 'Assistants', onClick: () => navigate('/assistants') },
    { icon: '🔌', label: 'Connections', onClick: () => navigate('/connections') },
    { icon: '⚡', label: 'Skills', onClick: () => navigate('/powers') },
    { icon: '⏰', label: 'Automations', onClick: () => navigate('/automations') },
    { icon: '🧠', label: 'AI Setup', onClick: () => navigate('/ai-setup') },
    { icon: '⚙️', label: 'Settings', onClick: () => navigate('/settings') },
    { icon: '🚀', label: 'Setup', onClick: () => navigate('/onboarding') },
  ];

  return (
    <div className="flex flex-col h-full">

      {/* ═══ TOP TOOLBAR ═══ */}
      <div
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b-2"
        style={{ background: 'linear-gradient(180deg, #e8e8e8 0%, #c8c8c8 100%)', borderColor: '#999' }}
      >
        {toolbarItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md hover:bg-white/50 active:bg-black/5 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wide">{item.label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-3">
          <StatusDot status={isOnline ? 'online' : 'error'} size="sm" />
          <span className="text-[10px] font-semibold" style={{ color: isOnline ? '#16a34a' : '#dc2626' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ═══ MAIN: Buddy List + (3D Hero + Channels) ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* BUDDY LIST */}
        <div
          className="w-[200px] shrink-0 flex flex-col border-r-2"
          style={{ background: 'linear-gradient(180deg, #1a1a6e 0%, #0d0d3b 100%)', borderColor: '#333' }}
        >
          <div className="text-center py-4 px-3">
            <div className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Open<span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lobby</span>
            </div>
          </div>
          <div className="w-full h-px bg-white/10" />
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <div className="mb-3">
              <div className="px-2 py-1 text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider">
                Online ({isOnline ? (agents?.length ?? 0) : 0})
              </div>
              {isOnline && agents?.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => { newSession(); navigate('/chat'); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-white/10 transition-all"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                    {agent.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{agent.name}</div>
                    <div className="text-[9px] text-blue-200/40 truncate">{agent.modelDisplay || 'Ready'}</div>
                  </div>
                  <StatusDot status="online" size="sm" />
                </button>
              ))}
              {(!isOnline || !agents?.length) && (
                <div className="px-2 py-1.5 text-[10px] text-blue-200/30 italic">
                  {isOnline ? 'No assistants yet' : 'Engine offline'}
                </div>
              )}
            </div>
            {sessions?.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-blue-300/40 uppercase tracking-wider">Recent Chats</div>
                {sessions.slice(0, 8).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { useChatStore.getState().switchSession(s.key); navigate('/chat'); }}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left hover:bg-white/10 transition-all"
                  >
                    <span className="text-[10px] text-blue-300/30">💬</span>
                    <span className="text-[10px] text-blue-100/50 truncate">
                      {useChatStore.getState().sessionLabels[s.key] || s.label || s.displayName || 'Conversation'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: 3D Office Hero + Channel Grid */}
        <div className="flex-1 flex flex-col overflow-auto" style={{ background: 'linear-gradient(180deg, #d4d4d4 0%, #b8b8b8 100%)' }}>

          {/* ═══ PIXEL ART OFFICE HERO ═══ */}
          <div className="shrink-0 mx-4 mt-4">
            <PixelOffice />
          </div>

          {/* ═══ CHANNEL GRID ═══ */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-3 gap-3" style={{ gridAutoRows: 'minmax(80px, 1fr)' }}>

              {/* CHAT */}
              <button onClick={() => { newSession(); navigate('/chat'); }}
                className="col-span-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] cursor-pointer relative group"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)' }}>
                <div className="flex items-center justify-center h-full">
                  <div className="text-4xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '0 0 40px rgba(59,130,246,0.6), 2px 2px 4px rgba(0,0,0,0.5)' }}>💬 CHAT</div>
                </div>
                <div className="absolute top-0 right-0 w-40 h-40 opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />
              </button>

              {/* ASSISTANTS */}
              <button onClick={() => navigate('/assistants')}
                className="row-span-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 50%, #3b0764 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="text-xl font-black text-white text-center" style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>ASSISTANTS</div>
                  <div className="text-violet-200/40 text-[10px] mt-1 uppercase tracking-widest">{agents?.length ?? 0} active</div>
                </div>
              </button>

              {/* CONNECTIONS */}
              <button onClick={() => navigate('/connections')}
                className="col-span-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(90deg, #065f46 0%, #0d9488 50%, #2dd4bf 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center h-full px-6">
                  <div>
                    <div className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>🔌 CONNECTIONS</div>
                    <div className="text-teal-100/50 text-xs mt-0.5">Discord · WhatsApp · Slack · Telegram</div>
                  </div>
                </div>
              </button>

              {/* SKILLS */}
              <button onClick={() => navigate('/powers')}
                className="rounded-xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #be123c 0%, #e11d48 60%, #fb7185 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center"><div className="text-3xl">⚡</div><div className="text-lg font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>SKILLS</div></div>
                </div>
              </button>

              {/* AUTOMATE */}
              <button onClick={() => navigate('/automations')}
                className="rounded-xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center"><div className="text-3xl">⏰</div><div className="text-lg font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>AUTOMATE</div></div>
                </div>
              </button>

              {/* AI SETUP */}
              <button onClick={() => navigate('/ai-setup')}
                className="rounded-xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center"><div className="text-3xl">🧠</div><div className="text-lg font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>AI SETUP</div></div>
                </div>
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
