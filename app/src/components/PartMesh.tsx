// src/components/PartMesh.tsx
// Renders a single placed part (tube or connector) in the 3D scene.
//
// GEOMETRY:
//   - Tube: a cylinder aligned along Z axis (rotated from Three.js default Y-axis cylinder)
//   - Connectors: central sphere + cylindrical arms extending toward each port
//   - Port indicators: small yellow spheres at open (unconnected) ports
//
// SELECTION:
//   Clicking a part mesh selects it (yellow highlight). The onClick handler calls
//   stopPropagation() to prevent the ground plane from receiving the click too.
//
// NOTE on Three.js CylinderGeometry:
//   CylinderGeometry creates a cylinder along the Y axis by default.
//   We rotate tube geometry by 90° around X to align it with the Z axis,
//   matching our port convention where tube axis = Z.

import { useCallback } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { PlacedPart } from '../types/parts';
import {
  PART_COLORS, SELECTED_COLOR, PORT_OPEN_COLOR,
  CONNECTOR_BODY_RADIUS, ARM_RADIUS, PORT_OFFSET,
  TUBE_RADIUS, TUBE_LENGTH, TUBE_HALF_LENGTH,
  PORT_INDICATOR_RADIUS,
} from '../constants/geometry';
import { getPortDefs } from '../geometry/portDefs';
import { useDesignStore } from '../store/useDesignStore';

interface PartMeshProps {
  part: PlacedPart;
  isSelected: boolean;
}

// ─── Connector Arm ───────────────────────────────────────────
// One cylindrical arm pointing from the connector center toward a port.
// Also renders the port indicator sphere if the port is unconnected.
function ConnectorArm({ direction, portPosition, color, isConnected }: {
  direction: [number, number, number];
  portPosition: [number, number, number];
  color: string;
  isConnected: boolean;
}) {
  // CylinderGeometry is along Y. We rotate it to point in the arm direction.
  const dir = new THREE.Vector3(...direction);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir
  );

  // Arm midpoint = halfway between connector center and port tip
  const mid: [number, number, number] = [
    portPosition[0] / 2,
    portPosition[1] / 2,
    portPosition[2] / 2,
  ];

  return (
    <>
      <mesh
        position={mid}
        quaternion={[quat.x, quat.y, quat.z, quat.w]}
      >
        <cylinderGeometry args={[ARM_RADIUS, ARM_RADIUS, PORT_OFFSET, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Open port indicator: bright yellow sphere at port tip */}
      {!isConnected && (
        <mesh position={portPosition}>
          <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
          <meshBasicMaterial color={PORT_OPEN_COLOR} />
        </mesh>
      )}
    </>
  );
}

// ─── Tube Body ───────────────────────────────────────────────
function TubeBody({ part, isSelected, onClick }: {
  part: PlacedPart;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const color = isSelected ? SELECTED_COLOR : PART_COLORS.tube;

  return (
    <>
      {/* Main tube cylinder: rotate 90° around X to align with Z axis */}
      <mesh rotation={[Math.PI / 2, 0, 0]} onClick={onClick}>
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Port A indicator (Z = -TUBE_HALF_LENGTH) */}
      {!part.connections['A'] && (
        <mesh position={[0, 0, -TUBE_HALF_LENGTH]}>
          <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
          <meshBasicMaterial color={PORT_OPEN_COLOR} />
        </mesh>
      )}

      {/* Port B indicator (Z = +TUBE_HALF_LENGTH) */}
      {!part.connections['B'] && (
        <mesh position={[0, 0, TUBE_HALF_LENGTH]}>
          <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
          <meshBasicMaterial color={PORT_OPEN_COLOR} />
        </mesh>
      )}
    </>
  );
}

// ─── Connector Body ──────────────────────────────────────────
// Works for all connector types (elbow, T, cross, 5-way).
// Renders the central sphere, then iterates over port definitions to draw arms.
function ConnectorBody({ part, isSelected, onClick }: {
  part: PlacedPart;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const color = isSelected ? SELECTED_COLOR : PART_COLORS[part.type];
  const portDefs = getPortDefs(part.type);

  return (
    <>
      {/* Central sphere */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[CONNECTOR_BODY_RADIUS, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
      </mesh>

      {/* One arm per port */}
      {portDefs.map(def => (
        <ConnectorArm
          key={def.id}
          direction={def.direction}
          portPosition={def.position}
          color={color}
          isConnected={part.connections[def.id] !== null}
        />
      ))}
    </>
  );
}

// ─── Main PartMesh component ─────────────────────────────────
// Wraps the part geometry in a <group> with the part's world transform.
export function PartMesh({ part, isSelected }: PartMeshProps) {
  const selectExistingPart = useDesignStore(s => s.selectExistingPart);
  const selectedPartType = useDesignStore(s => s.selectedPartType);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); // don't let the ground plane also receive this
    if (selectedPartType) return; // in placement mode, clicking parts does nothing
    selectExistingPart(part.id);
  }, [part.id, selectExistingPart, selectedPartType]);

  return (
    <group
      position={part.position}
      quaternion={[part.quaternion[0], part.quaternion[1], part.quaternion[2], part.quaternion[3]]}
    >
      {part.type === 'tube' ? (
        <TubeBody part={part} isSelected={isSelected} onClick={handleClick} />
      ) : (
        <ConnectorBody part={part} isSelected={isSelected} onClick={handleClick} />
      )}
    </group>
  );
}
