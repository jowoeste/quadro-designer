// src/components/GhostPart.tsx
// Semi-transparent preview of the part being placed.
// Follows the cursor position; turns green when snapping to a port.

import type { PartType } from '../types/parts';
import { isTubeType } from '../types/parts';
import {
  PART_COLORS, SNAP_HIGHLIGHT_COLOR,
  CONNECTOR_BODY_RADIUS, TUBE_RADIUS,
  TUBE_LENGTH, TUBE_15_LENGTH,
  PORT_INDICATOR_RADIUS, PORT_OPEN_COLOR,
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
      ) : (
        <GhostConnector type={type} color={color} />
      )}
    </group>
  );
}
