'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useChatTexture, type ChatShot } from '../chat';
import { Blk, canvasTexture, Flat } from '../kit';

/**
 * Scene 3: the clip is in three chats now. Three big phones stand on a dark table, each showing the clip in a different
 * group, and a chain of paper links joins them. Small prints of the clip slide along the chain from one phone to the next.
 */
const CHATS: { x: number; chat: ChatShot }[] = [
  { x: -1.5, chat: { title: 'Close Friends', people: 12, items: [{ who: 'Lisa', text: '', photo: true }, { who: 'Lisa', text: "Haha, I can't stop watching this." }] } },
  { x: 0, chat: { title: 'Housemates', people: 8, items: [{ who: 'Dev', text: '', photo: true }, { who: 'Dev', text: 'Haha, you have to watch this.' }] } },
  { x: 1.5, chat: { title: 'Football Group', people: 24, items: [{ who: 'Marco', text: '', photo: true }, { who: 'Marco', text: 'Guys, you have to see this.' }] } },
];

function BigPhone({ x, chat, tilt }: { x: number; chat: ChatShot; tilt: number }) {
  const tex = useChatTexture(chat);
  return (
    <group position={[x, 0.5, 0]} rotation={[-0.14, tilt, 0]}>
      <Blk size={[0.62, 1.0, 0.05]} color="#0B171C" />
      <Flat size={[0.56, 0.93]} pos={[0, 0, 0.03]} map={tex} opacity={1} />
      <Blk size={[0.24, 0.05, 0.04]} pos={[0, 0.46, 0.0]} color="#0B171C" line={false} />
    </group>
  );
}

export function PhonesSet() {
  const { scene } = useThree();
  useEffect(() => { scene.background = new THREE.Color('#0A141A'); scene.fog = new THREE.Fog('#0A141A', 6, 14); return () => { scene.fog = null; }; }, [scene]);
  const glow = useMemo(() => canvasTexture(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(207,232,239,.55)'); r.addColorStop(1, 'rgba(207,232,239,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  }), []);
  // the chain of paper links, and the prints sliding along it
  const links = useRef<(THREE.Group | null)[]>([]);
  const prints = useRef<(THREE.Group | null)[]>([]);
  const N = 22;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    links.current.forEach((l, i) => {
      if (!l) return;
      const k = i / (N - 1);
      const pulse = 1 + 0.35 * Math.max(0, Math.sin(t * 2.2 - k * 7));
      l.scale.setScalar(pulse);
    });
    prints.current.forEach((p, i) => {
      if (!p) return;
      const k = (((t * 0.16 + i / 3) % 1) + 1) % 1;
      p.position.set(-1.5 + k * 3.0, 0.28 + Math.sin(k * Math.PI) * 0.22, 0.45);
      p.rotation.z = Math.sin(k * 6 + i) * 0.25;
      p.visible = true;
    });
  });
  const chain = Array.from({ length: N }, (_, i) => i);
  const colours = ['#F0C75E', '#E7DFCE', '#CFE8EF'];
  return (
    <group>
      <ambientLight color="#8FB2C4" intensity={0.7} />
      <directionalLight color="#E8F4F8" intensity={0.8} position={[1, 3, 4]} />
      <Blk size={[12, 0.1, 7]} pos={[0, -0.05, -1]} color="#0E1F25" />
      {CHATS.map(({ x, chat }, i) => (
        <group key={x}>
          <Flat size={[1.8, 1.8]} pos={[x, 0.55, -0.15]} map={glow} blend="add" opacity={0.9} />
          <BigPhone x={x} chat={chat} tilt={i === 0 ? 0.12 : i === 2 ? -0.12 : 0} />
        </group>
      ))}
      {chain.map((i) => {
        const k = i / (N - 1);
        return (
          <group key={i} ref={(o) => { links.current[i] = o; }} position={[-1.5 + k * 3.0, 0.1 + Math.sin(k * Math.PI) * 0.05, 0.5]} rotation={[0, 0, (i % 2 ? 0.15 : -0.15)]}>
            <Blk size={[0.2, 0.09, 0.03]} color={colours[i % 3]} line={0.012} />
          </group>
        );
      })}
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(o) => { prints.current[i] = o; }} visible={false}>
          <Blk size={[0.12, 0.085, 0.012]} color="#B8864F" line={0.01} />
        </group>
      ))}
    </group>
  );
}
