/**
 * PixelOffice — 2D pixel art office hero with layered sprites and animated agents
 * Ported from virtual-office repo. Pure DOM, no Canvas/WebGL.
 * Agents pulled from ClawX's useAgentsStore.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';

const SCALE = 4;
const FRAME_W = 16;
const FRAME_H = 32;
const FRAMES_PER_DIR = 6;
const ROOM_W = 631;
const ROOM_H = 192;

// Direction offsets in sprite sheet
const DIR: Record<string, number> = { right: 0, up: 6, left: 12, down: 18 };

// Available character sprites
const CHAR_SPRITES = [
  { idle: '/office/chars/Adam_idle_anim_16x16.png', run: '/office/chars/Adam_run_16x16.png', sit: '/office/chars/Adam_sit_16x16.png' },
  { idle: '/office/chars/Alex_idle_anim_16x16.png', run: '/office/chars/Alex_run_16x16.png', sit: '/office/chars/Alex_sit_16x16.png' },
  { idle: '/office/chars/Amelia_idle_anim_16x16.png', run: '/office/chars/Amelia_run_16x16.png', sit: '/office/chars/Amelia_sit_16x16.png' },
  { idle: '/office/chars/Bob_idle_anim_16x16.png', run: '/office/chars/Bob_run_16x16.png', sit: '/office/chars/Bob_sit_16x16.png' },
  { idle: '/office/chars/Lucy_idle_anim_16x16.png', run: '/office/chars/Lucy_run_16x16.png', sit: '/office/chars/Lucy_sit_16x16.png' },
  { idle: '/office/chars/Dan_idle_anim_16x16.png', run: '/office/chars/Dan_run_16x16.png', sit: '/office/chars/Dan_sit_16x16.png' },
  { idle: '/office/chars/Molly_idle_anim_16x16.png', run: '/office/chars/Molly_run_16x16.png', sit: '/office/chars/Molly_sit_16x16.png' },
  { idle: '/office/chars/Edward_idle_anim_16x16.png', run: '/office/chars/Edward_run_16x16.png', sit: '/office/chars/Edward_sit_16x16.png' },
  { idle: '/office/chars/Samuel_idle_anim_16x16.png', run: '/office/chars/Samuel_run_16x16.png', sit: '/office/chars/Samuel_sit_16x16.png' },
  { idle: '/office/chars/Ash_idle_anim_16x16.png', run: '/office/chars/Ash_run_16x16.png', sit: '/office/chars/Ash_sit_16x16.png' },
];

// Desk positions where agents sit (pixel coordinates in the room)
const DESK_SEATS = [
  { x: 215, y: 28, dir: 'down' },
  { x: 265, y: 28, dir: 'down' },
  { x: 315, y: 28, dir: 'down' },
  { x: 365, y: 28, dir: 'down' },
  { x: 215, y: 68, dir: 'down' },
  { x: 265, y: 68, dir: 'down' },
  { x: 315, y: 68, dir: 'down' },
  { x: 365, y: 68, dir: 'down' },
  { x: 520, y: 56, dir: 'down' },
  { x: 560, y: 56, dir: 'down' },
];

function AgentSprite({ name, spriteSheet, x, y, dir, scale }: {
  name: string;
  spriteSheet: string;
  x: number;
  y: number;
  dir: string;
  scale: number;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES_PER_DIR);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const dirOffset = DIR[dir] || 0;
  const frameIdx = dirOffset + frame;
  const bgX = frameIdx * FRAME_W * SCALE;

  return (
    <div
      className="absolute"
      style={{
        left: x * scale,
        top: (y - FRAME_H + 16) * scale,
        width: FRAME_W * SCALE * (scale / SCALE),
        height: FRAME_H * SCALE * (scale / SCALE),
        zIndex: 15,
      }}
    >
      {/* Sprite */}
      <div
        style={{
          width: FRAME_W * SCALE,
          height: FRAME_H * SCALE,
          backgroundImage: `url(${spriteSheet})`,
          backgroundPosition: `-${bgX}px 0px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated' as const,
          transform: `scale(${scale / SCALE})`,
          transformOrigin: 'top left',
        }}
      />
      {/* Name label */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-black/30 bg-black/70 px-1.5 py-0.5 text-center"
        style={{
          bottom: -4 * (scale / SCALE),
          fontSize: 8 * (scale / SCALE),
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.1em',
          fontFamily: 'Space Grotesk, monospace',
          fontWeight: 700,
          textTransform: 'uppercase',
          zIndex: 20,
        }}
      >
        {name}
      </div>
    </div>
  );
}

export function PixelOffice() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderScale, setRenderScale] = useState(SCALE);

  const agents = useAgentsStore((s) => s.agents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  // Scale to fit container width
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const containerW = e.contentRect.width;
        setRenderScale(containerW / ROOM_W);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Map real agents to sprite characters at desk positions
  const officeChars = useMemo(() => {
    if (!agents?.length) return [];
    return agents.map((agent, i) => {
      const seat = DESK_SEATS[i % DESK_SEATS.length];
      const sprites = CHAR_SPRITES[i % CHAR_SPRITES.length];
      return {
        id: agent.id,
        name: agent.name,
        spriteSheet: sprites.idle,
        x: seat.x,
        y: seat.y,
        dir: seat.dir,
      };
    });
  }, [agents]);

  return (
    <div ref={containerRef} className="rounded-xl overflow-hidden border-2 border-[#666] bg-[#2a2a3a]">
      <div
        className="relative origin-top-left"
        style={{
          width: ROOM_W * renderScale,
          height: ROOM_H * renderScale,
        }}
      >
        {/* Layer 1: Background (floors, walls) */}
        <img
          src="/office/newsroom_layer1.png"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated', zIndex: 1 }}
        />

        {/* Layer 2: Furniture behind agents */}
        <img
          src="/office/newsroom_layer2.png"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated', zIndex: 10 }}
        />

        {/* Agents layer (between layer 2 and layer 3) */}
        {isOnline && officeChars.map((char) => (
          <AgentSprite
            key={char.id}
            name={char.name}
            spriteSheet={char.spriteSheet}
            x={char.x}
            y={char.y}
            dir={char.dir}
            scale={renderScale}
          />
        ))}

        {/* Layer 3: Foreground (stuff in front of agents) */}
        <img
          src="/office/newsroom_layer3.png"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated', zIndex: 25 }}
        />

        {/* Room label */}
        <div
          className="absolute left-2 top-2 rounded-sm border border-white/10 bg-black/60 px-2 py-1 font-mono text-white/70 uppercase"
          style={{ fontSize: 9, letterSpacing: '0.2em', zIndex: 30 }}
        >
          {isOnline ? 'The Office' : 'Office Offline'}
        </div>

        {/* Ticker */}
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/10 bg-black/80"
          style={{ height: 18 * (renderScale / SCALE), zIndex: 30 }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono animate-[ticker_30s_linear_infinite]"
            style={{ fontSize: 9 * (renderScale / SCALE), color: 'rgba(0,229,255,0.7)' }}
          >
            /// SIMOFFICE /// {agents?.length ?? 0} ASSISTANTS ONLINE /// ENGINE: {isOnline ? 'RUNNING' : 'OFFLINE'} /// ALL SYSTEMS NOMINAL ///&nbsp;&nbsp;&nbsp;
            /// SIMOFFICE /// {agents?.length ?? 0} ASSISTANTS ONLINE /// ENGINE: {isOnline ? 'RUNNING' : 'OFFLINE'} /// ALL SYSTEMS NOMINAL ///
          </div>
        </div>
      </div>
    </div>
  );
}
