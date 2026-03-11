// src/components/Scene.tsx
// The 3D viewport — wraps the R3F Canvas and all scene objects.
//
// ARCHITECTURE:
//   <Canvas>              – R3F sets up WebGL, camera, render loop
//     <SceneContent>      – all 3D content (lights, grid, parts, ghost)
//       <OrbitControls>   – left-drag orbit, right-drag pan, scroll zoom
//       ground plane mesh – invisible, captures pointer events for part placement
//       <PartMesh> × N    – each placed part
//       <GhostPart>       – semi-transparent placement preview (shown during placement mode)
//
// CLICK VS DRAG:
//   OrbitControls captures drag for camera movement, but a click event fires even after drags.
//   To distinguish real clicks from drag-releases, we compare the pointer's screen position
//   between pointerdown and click. If it moved more than 5px, it was a drag → ignore the click.

import { useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignStore } from '../store/useDesignStore';
import { PartMesh } from './PartMesh';
import { GhostPart } from './GhostPart';
import { checkSnap } from '../utils/snap';

// ─── Scene Content (rendered inside the R3F Canvas) ──────────

function SceneContent() {
  const parts = useDesignStore(s => s.parts);
  const selectedPartType = useDesignStore(s => s.selectedPartType);
  const selectedPartId = useDesignStore(s => s.selectedPartId);
  const ghostPosition = useDesignStore(s => s.ghostPosition);
  const ghostQuaternion = useDesignStore(s => s.ghostQuaternion);
  const isSnapping = useDesignStore(s => s.isSnapping);
  const updateGhost = useDesignStore(s => s.updateGhost);
  const placePart = useDesignStore(s => s.placePart);
  const selectExistingPart = useDesignStore(s => s.selectExistingPart);

  // Track pointer-down screen position to distinguish clicks from drag-releases.
  // If the pointer moved more than 5px between pointerdown and click, it was a drag.
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  // Pointer move on ground plane → update ghost position + snap check
  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!selectedPartType) return;
      e.stopPropagation();

      const cursor = e.point; // world-space intersection with ground plane

      // Check if the cursor is near an open port (snap check)
      const snap = checkSnap(cursor, selectedPartType, parts);

      if (snap) {
        updateGhost(snap.position, snap.quaternion, snap);
      } else {
        // No snap: show ghost at cursor position, default orientation (identity quaternion)
        updateGhost([cursor.x, cursor.y, cursor.z], [0, 0, 0, 1], null);
      }
    },
    [selectedPartType, parts, updateGhost]
  );

  // Record screen position on pointer down (for drag detection)
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
  }, []);

  // Click on ground plane → place part (or deselect if not in placement mode)
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      // Drag detection: if pointer moved more than 5px since pointerdown, ignore this click
      if (pointerDownPos.current) {
        const dx = e.nativeEvent.clientX - pointerDownPos.current.x;
        const dy = e.nativeEvent.clientY - pointerDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) return; // was a drag, not a click
      }

      e.stopPropagation();

      if (selectedPartType) {
        // Placement mode: drop the current ghost part into the scene
        placePart();
      } else if (selectedPartId) {
        // Not in placement mode: clicking empty space deselects
        selectExistingPart(null);
      }
    },
    [selectedPartType, selectedPartId, placePart, selectExistingPart]
  );

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* ── Ground reference grid ── */}
      {/* 4m × 4m grid. 12 divisions = ~0.33m cells ≈ one tube length for visual alignment. */}
      <gridHelper args={[4, 12, '#718096', '#4a5568']} position={[0, 0, 0]} />

      {/* ── Invisible ground plane for pointer events ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Placed parts ── */}
      {parts.map(part => (
        <PartMesh
          key={part.id}
          part={part}
          isSelected={part.id === selectedPartId}
        />
      ))}

      {/* ── Ghost (placement preview) ── */}
      {selectedPartType && (
        <GhostPart
          type={selectedPartType}
          position={ghostPosition}
          quaternion={ghostQuaternion}
          isSnapping={isSnapping}
        />
      )}

      {/* ── Camera controls ── */}
      <OrbitControls enableDamping dampingFactor={0.08} />
    </>
  );
}

// ─── Exported Scene wrapper ──────────────────────────────────

export function Scene() {
  return (
    <Canvas
      camera={{
        position: [1.2, 1.0, 1.2],  // Close enough to see Quadro-scale parts clearly
        fov: 55,
        near: 0.001,
        far: 50,
      }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a202c');
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
