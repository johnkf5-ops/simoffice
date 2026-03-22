/**
 * SimOffice — The Office (3D)
 * Standalone 3D retro office. Renders agents walking around.
 * Uses Three.js + React Three Fiber directly without Claw3D's full stack.
 */
import { useEffect, useMemo, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { mapAgentToOffice, type OfficeAgent } from '@/lib/office-adapter';

/* ═══ 3D Components ═══ */

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 20]} />
      <meshStandardMaterial color="#c4a882" />
    </mesh>
  );
}

function Walls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.5, -10]}>
        <boxGeometry args={[30, 3, 0.2]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      {/* Left wall */}
      <mesh position={[-15, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 20]} />
        <meshStandardMaterial color="#e0d4be" />
      </mesh>
      {/* Right wall */}
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
      {/* Desktop */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color="#8b6f4e" />
      </mesh>
      {/* Legs */}
      {[[-0.6, 0.375, -0.3], [0.6, 0.375, -0.3], [-0.6, 0.375, 0.3], [0.6, 0.375, 0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#5a4a3a" />
        </mesh>
      ))}
      {/* Monitor */}
      <mesh position={[0, 1.1, -0.2]}>
        <boxGeometry args={[0.5, 0.35, 0.03]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 1.1, -0.18]}>
        <planeGeometry args={[0.44, 0.29]} />
        <meshStandardMaterial color="#4488ff" emissive="#4488ff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function AgentAvatar({ agent, position }: { agent: OfficeAgent; position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(...position));
  const walkPhase = useRef(Math.random() * Math.PI * 2);

  // Gentle idle animation
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    walkPhase.current += delta * 2;

    // Gentle bob
    meshRef.current.position.y = position[1] + Math.sin(walkPhase.current) * 0.02;
  });

  const color = new THREE.Color(agent.color);

  return (
    <group ref={meshRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={color.clone().lerp(new THREE.Color('#ffffff'), 0.3)} />
      </mesh>

      {/* Status dot */}
      <mesh position={[0.12, 1.1, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : '#fbbf24'}
          emissive={agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : '#fbbf24'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Name label */}
      <Billboard position={[0, 1.3, 0]}>
        <Text
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {agent.name}
        </Text>
      </Billboard>
    </group>
  );
}

function OfficeScene({ agents }: { agents: OfficeAgent[] }) {
  // Place desks in rows
  const deskPositions: [number, number, number][] = [
    [-4, 0, -3], [-1.5, 0, -3], [1.5, 0, -3], [4, 0, -3],
    [-4, 0, 0], [-1.5, 0, 0], [1.5, 0, 0], [4, 0, 0],
    [-4, 0, 3], [-1.5, 0, 3], [1.5, 0, 3], [4, 0, 3],
  ];

  // Place agents at desks or around the office
  const agentPositions: [number, number, number][] = agents.map((_, i) => {
    if (i < deskPositions.length) {
      const desk = deskPositions[i];
      return [desk[0], 0, desk[2] + 0.6]; // In front of desk
    }
    // Overflow agents go to the lounge area
    return [8 + (i % 3) * 2, 0, -4 + Math.floor(i / 3) * 2];
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <pointLight position={[-5, 4, -5]} intensity={0.3} color="#ffaa44" />
      <pointLight position={[5, 4, 5]} intensity={0.2} color="#4488ff" />

      <Floor />
      <Walls />

      {deskPositions.slice(0, Math.max(agents.length, 4)).map((pos, i) => (
        <Desk key={i} position={pos} />
      ))}

      {agents.map((agent, i) => (
        <AgentAvatar
          key={agent.id}
          agent={agent}
          position={agentPositions[i] || [0, 0, 0]}
        />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={3}
        maxDistance={25}
        target={[0, 0, 0]}
      />
      <Environment preset="apartment" />
    </>
  );
}

/* ═══ Page Component ═══ */

export function Office() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  const officeAgents = useMemo(
    () => (agents ?? []).map(mapAgentToOffice),
    [agents],
  );

  return (
    <div className="flex flex-col h-full -m-8 relative bg-black">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lobby
      </button>

      {/* Status */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-black/50 backdrop-blur-sm text-white">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-400'}`} />
        {isOnline ? 'Online' : 'Offline'}
        <span className="text-white/40 ml-1">
          {officeAgents.length} assistant{officeAgents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas
          shadows
          camera={{ position: [0, 12, 15], fov: 50 }}
          style={{ background: '#1a1a2e' }}
        >
          <Suspense fallback={null}>
            <OfficeScene agents={officeAgents} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
