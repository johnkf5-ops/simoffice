/**
 * WebGL Test — just a spinning cube to verify Three.js works in Electron
 */
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function SpinningCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export function WebGLTest() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#111' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          console.log('[WebGLTest] Canvas created');
          console.log('[WebGLTest] Renderer:', gl.getContext().getParameter(gl.getContext().VERSION));
        }}
        onError={(e) => console.error('[WebGLTest] Error:', e)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <SpinningCube />
      </Canvas>
    </div>
  );
}
