// src/components/GhostPart.tsx
// Semi-transparent preview of the part being placed.
// Follows the cursor position; turns green when snapping to a port.
//
// Uses the same geometry as the real parts but with:
//   - 50% opacity (transparent = "this isn't placed yet")
//   - Snap highlight color when snapping, normal part color otherwise
//   - depthWrite=false to avoid z-fighting with other transparent objects

import * as THREE from 'three';
import type { PartType } from '../types/parts';
import {
  PART_COLORS, SNAP_HIGHLIGHT_COLOR,
  CONNECTOR_BODY_RADIUS, ARM_RADIUS, PORT_OFFSET,
  TUBE_RADIUS, TUBE_LENGTH,
} from '../constants/geometry';
import { getPortDefs } from '../geometry/portDefs';

interface GhostPartProps {
  type: PartType;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  isSnapping: boolean;
}

// Ghost connector: central sphere + arms (all semi-transparent)
function GhostConnector({ type, color }: { type: PartType; color: string }) {
  const portDefs = getPortDefs(type);

  return (
    <>
      <mesh>
        <sphereGeometry args={[CONNECTOR_BODY_RADIUS, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {portDefs.map(def => {
        const dir = new THREE.Vector3(...def.direction);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir
        );
        const mid: [number, number, number] = [
          def.position[0] / 2,
          def.position[1] / 2,
          def.position[2] / 2,
        ];

        return (
          <mesh
            key={def.id}
            position={mid}
            quaternion={[quat.x, quat.y, quat.z, quat.w]}
          >
            <cylinderGeometry args={[ARM_RADIUS, ARM_RADIUS, PORT_OFFSET, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

export function GhostPart({ type, position, quaternion, isSnapping }: GhostPartProps) {
  const color = isSnapping ? SNAP_HIGHLIGHT_COLOR : PART_COLORS[type];

  return (
    <group
      position={position}
      quaternion={[quaternion[0], quaternion[1], quaternion[2], quaternion[3]]}
    >
      {type === 'tube' ? (
        // Ghost tube: cylinder along Z (same rotation as real tube)
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ) : (
        <GhostConnector type={type} color={color} />
      )}
    </group>
  );
}
