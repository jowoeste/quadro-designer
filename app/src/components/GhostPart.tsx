// src/components/GhostPart.tsx
// Semi-transparent preview of the part being placed.
// Follows the cursor position; turns green when snapping to a port.

import * as THREE from 'three';
import type { PartType } from '../types/parts';
import { isTubeType } from '../types/parts';
import {
  PART_COLORS, SNAP_HIGHLIGHT_COLOR,
  CONNECTOR_BODY_RADIUS, TUBE_RADIUS,
  TUBE_LENGTH, TUBE_15_LENGTH,
  PORT_INDICATOR_RADIUS, PORT_OPEN_COLOR,
  DIAG_CROSSING_TO_CLOSED, DIAG_PORT_A_OFFSET,
  DIAG_ARM_TOTAL,
} from '../constants/geometry';
import { getPortDefs } from '../geometry/portDefs';

interface GhostPartProps {
  type: PartType;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  isSnapping: boolean;
}

// Ghost connector: central sphere + port indicators (all semi-transparent)
function GhostConnector({ type, color }: { type: PartType; color: string }) {
  const portDefs = getPortDefs(type);

  return (
    <>
      <mesh>
        <sphereGeometry args={[CONNECTOR_BODY_RADIUS, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* Show port positions as small dots */}
      {portDefs.map(def => (
        <mesh key={def.id} position={def.position}>
          <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
          <meshBasicMaterial color={PORT_OPEN_COLOR} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// Ghost diagonal: two cylinders (sleeve + diagonal body) — semi-transparent
const S45 = Math.SQRT1_2;
const DIAG_DIR = new THREE.Vector3(0, S45, S45);
const DIAG_QUAT = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(0, 1, 0),
  DIAG_DIR
);

function GhostDiagonal({ type, color }: { type: PartType; color: string }) {
  const portDefs = getPortDefs(type);

  const sleeveStart = DIAG_CROSSING_TO_CLOSED;
  const sleeveEnd = DIAG_PORT_A_OFFSET;
  const sleeveLength = sleeveEnd - sleeveStart;
  const sleeveCenterZ = (sleeveStart + sleeveEnd) / 2;

  const diagStartT = DIAG_CROSSING_TO_CLOSED / S45;
  const diagEndT = DIAG_ARM_TOTAL;
  const diagLength = diagEndT - diagStartT;
  const diagMidT = (diagStartT + diagEndT) / 2;

  return (
    <>
      {/* Horizontal sleeve */}
      <mesh position={[0, 0, sleeveCenterZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, sleeveLength, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* Diagonal section */}
      <mesh
        position={[0, diagMidT * S45, diagMidT * S45]}
        quaternion={[DIAG_QUAT.x, DIAG_QUAT.y, DIAG_QUAT.z, DIAG_QUAT.w]}
      >
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, diagLength, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* Port indicators */}
      {portDefs.map(def => (
        <mesh key={def.id} position={def.position}>
          <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
          <meshBasicMaterial color={PORT_OPEN_COLOR} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// Disable raycasting so the ghost doesn't block pointer events on the ground plane
const noRaycast = () => null;

export function GhostPart({ type, position, quaternion, isSnapping }: GhostPartProps) {
  const color = isSnapping ? SNAP_HIGHLIGHT_COLOR : PART_COLORS[type];

  return (
    <group
      position={position}
      quaternion={[quaternion[0], quaternion[1], quaternion[2], quaternion[3]]}
      raycast={noRaycast}
    >
      {isTubeType(type) ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[
            TUBE_RADIUS, TUBE_RADIUS,
            type === 'tube-15' ? TUBE_15_LENGTH : TUBE_LENGTH,
            16
          ]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ) : type === 'diagonal' ? (
        <GhostDiagonal type={type} color={color} />
      ) : (
        <GhostConnector type={type} color={color} />
      )}
    </group>
  );
}
