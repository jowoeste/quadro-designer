// src/components/PartMesh.tsx
// Renders a single placed part (tube or connector) in the 3D scene.
//
// GEOMETRY:
//   - Tube: a cylinder aligned along Z axis (rotated from Three.js default Y-axis cylinder)
//   - Connectors: central sphere (arms are hidden inside tubes, per real Quadro)
//   - Port indicators: small yellow spheres at open (unconnected) ports

import { useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { PlacedPart } from '../types/parts';
import { isTubeType } from '../types/parts';
import * as THREE from 'three';
import {
  PART_COLORS, SELECTED_COLOR, PORT_OPEN_COLOR,
  CONNECTOR_BODY_RADIUS, TUBE_RADIUS,
  TUBE_LENGTH, TUBE_15_LENGTH,
  PORT_INDICATOR_RADIUS,
  DIAG_CROSSING_TO_CLOSED, DIAG_PORT_A_OFFSET,
  DIAG_ARM_TOTAL,
} from '../constants/geometry';
import { getPortDefs } from '../geometry/portDefs';
import { useDesignStore } from '../store/useDesignStore';

interface PartMeshProps {
  part: PlacedPart;
  isSelected: boolean;
}

// ─── Tube Body ───────────────────────────────────────────────
// Parameterized by length to support both 35 cm and 15 cm tubes.
function TubeBody({ part, isSelected, onClick }: {
  part: PlacedPart;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const color = isSelected ? SELECTED_COLOR : PART_COLORS[part.type];
  const length = part.type === 'tube-15' ? TUBE_15_LENGTH : TUBE_LENGTH;
  const portDefs = getPortDefs(part.type);

  return (
    <>
      {/* Main tube cylinder: rotate 90° around X to align with Z axis */}
      <mesh rotation={[Math.PI / 2, 0, 0]} onClick={onClick}>
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, length, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Port indicators at each open port */}
      {portDefs.map(def => (
        !part.connections[def.id] && (
          <mesh key={def.id} position={def.position}>
            <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
            <meshBasicMaterial color={PORT_OPEN_COLOR} />
          </mesh>
        )
      ))}
    </>
  );
}

// ─── Connector Body ──────────────────────────────────────────
// Renders a central sphere + port indicators at open ports.
// Arms are not rendered — they're hidden inside tubes in real Quadro.
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

      {/* Port indicators at open ports */}
      {portDefs.map(def => (
        !part.connections[def.id] && (
          <mesh key={def.id} position={def.position}>
            <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
            <meshBasicMaterial color={PORT_OPEN_COLOR} />
          </mesh>
        )
      ))}
    </>
  );
}

// ─── Diagonal Connector Body ─────────────────────────────────
// Renders two cylinders: horizontal sleeve + diagonal body/arm section.
// The diagonal is unique: Port A is a sleeve, Port B is a standard arm.
const S45 = Math.SQRT1_2;
const DIAG_DIR = new THREE.Vector3(0, S45, S45);
const DIAG_QUAT = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(0, 1, 0), // Three.js cylinder default axis
  DIAG_DIR
);

function DiagonalBody({ part, isSelected, onClick }: {
  part: PlacedPart;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const color = isSelected ? SELECTED_COLOR : PART_COLORS[part.type];
  const portDefs = getPortDefs(part.type);

  // Horizontal sleeve: from +10mm to +80mm along +Z (length = 70mm)
  const sleeveStart = DIAG_CROSSING_TO_CLOSED; // 0.010
  const sleeveEnd = DIAG_PORT_A_OFFSET;         // 0.080
  const sleeveLength = sleeveEnd - sleeveStart;
  const sleeveCenterZ = (sleeveStart + sleeveEnd) / 2;

  // Diagonal section: from cut plane to arm end
  // Cut plane is at Z = +10mm from origin. Along the 45° diagonal axis,
  // the visible start is at t = 10mm / cos(45°) ≈ 14.14mm from origin.
  const diagStartT = DIAG_CROSSING_TO_CLOSED / S45; // ~0.01414
  const diagEndT = DIAG_ARM_TOTAL;                    // 0.110
  const diagLength = diagEndT - diagStartT;
  const diagMidT = (diagStartT + diagEndT) / 2;

  return (
    <>
      {/* Horizontal sleeve — cylinder along Z */}
      <mesh
        position={[0, 0, sleeveCenterZ]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={onClick}
      >
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, sleeveLength, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Diagonal section — cylinder along 45° direction */}
      <mesh
        position={[0, diagMidT * S45, diagMidT * S45]}
        quaternion={[DIAG_QUAT.x, DIAG_QUAT.y, DIAG_QUAT.z, DIAG_QUAT.w]}
        onClick={onClick}
      >
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, diagLength, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Port indicators at open ports */}
      {portDefs.map(def => (
        !part.connections[def.id] && (
          <mesh key={def.id} position={def.position}>
            <sphereGeometry args={[PORT_INDICATOR_RADIUS, 8, 8]} />
            <meshBasicMaterial color={PORT_OPEN_COLOR} />
          </mesh>
        )
      ))}
    </>
  );
}

// ─── Main PartMesh component ─────────────────────────────────
export function PartMesh({ part, isSelected }: PartMeshProps) {
  const selectExistingPart = useDesignStore(s => s.selectExistingPart);
  const selectedPartType = useDesignStore(s => s.selectedPartType);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (selectedPartType) return;
    selectExistingPart(part.id);
  }, [part.id, selectExistingPart, selectedPartType]);

  return (
    <group
      position={part.position}
      quaternion={[part.quaternion[0], part.quaternion[1], part.quaternion[2], part.quaternion[3]]}
    >
      {isTubeType(part.type) ? (
        <TubeBody part={part} isSelected={isSelected} onClick={handleClick} />
      ) : part.type === 'diagonal' ? (
        <DiagonalBody part={part} isSelected={isSelected} onClick={handleClick} />
      ) : (
        <ConnectorBody part={part} isSelected={isSelected} onClick={handleClick} />
      )}
    </group>
  );
}
