// src/store/useDesignStore.ts
// Global state management using Zustand.
//
// WHY ZUSTAND: minimal boilerplate, no Context wrapper needed, works seamlessly
// with R3F (React Three Fiber). Components simply call useDesignStore() to read/write state.
//
// STATE SHAPE:
//   parts[]           — all placed parts in the 3D scene
//   selectedPartType  — which part type is being placed (placement mode), null = not placing
//   selectedPartId    — which existing part is selected (for delete), null = none
//   ghostPosition/Quat— where the placement preview is shown
//   history/future    — undo/redo stacks (snapshots of parts[])
//
// UNDO/REDO:
//   Before every mutating action (place, delete, rotate), we push a deep copy of `parts` to `history`.
//   Undo pops from history, pushes current state to future. Redo does the reverse.

import { create } from 'zustand';
import * as THREE from 'three';
import type { PlacedPart, PartType, SnapResult, Connection } from '../types/parts';
import { isTubeType, isPanelType } from '../types/parts';
import { initConnections } from '../geometry/portDefs';
import { findAdditionalConnections } from '../utils/snap';
import { saveDesignByName, loadDesignByName } from '../utils/storage';
import {
  axisRotationQuat,
  canRotate,
  collectRigidSubtree,
  composeQuaternions,
  rotatePositionAroundPivot,
} from '../utils/rotation';

// Unique ID generator — simple counter, reset-safe via loadDesign
let _idCounter = 0;
function generateId(): string {
  return `part_${Date.now()}_${++_idCounter}`;
}

// Deep clone parts array for history snapshots
// (shallow clone each part + its connections record)
function cloneParts(parts: PlacedPart[]): PlacedPart[] {
  return parts.map(p => ({
    ...p,
    connections: { ...p.connections },
  }));
}

interface DesignStore {
  // Scene state
  parts: PlacedPart[];

  // Placement mode: which part type is currently being placed (null = not placing)
  selectedPartType: PartType | null;

  // Selection: which existing part is highlighted (null = none)
  selectedPartId: string | null;

  // Ghost preview state (position/rotation of the semi-transparent preview part)
  ghostPosition: [number, number, number];
  ghostQuaternion: [number, number, number, number];
  isSnapping: boolean;
  snapResult: SnapResult | null;

  // Pre-placement rotation: user's accumulated rotation for the ghost preview
  previewQuaternion: [number, number, number, number];

  // Fine rotation toggle: 45° steps instead of 90°
  fineRotation: boolean;

  // Undo/redo history stacks
  history: PlacedPart[][];
  future: PlacedPart[][];

  // Actions
  toggleFineRotation: () => void;
  selectPartType: (type: PartType | null) => void;
  selectExistingPart: (id: string | null) => void;
  updateGhost: (
    position: [number, number, number],
    quaternion: [number, number, number, number],
    snap: SnapResult | null
  ) => void;
  placePart: () => void;
  deleteSelectedPart: () => void;
  rotatePreview: (axis: 'x' | 'y' | 'z') => void;
  rotatePlacedPart: (axis: 'x' | 'y' | 'z') => void;
  undo: () => void;
  redo: () => void;
  saveByName: (name: string) => void;
  loadByName: (name: string) => boolean;
  loadFromParts: (parts: PlacedPart[]) => void;
  clearDesign: () => void;
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  parts: [],
  selectedPartType: null,
  selectedPartId: null,
  ghostPosition: [0, 0, 0],
  ghostQuaternion: [0, 0, 0, 1], // identity quaternion
  isSnapping: false,
  snapResult: null,
  previewQuaternion: [0, 0, 0, 1], // identity — reset on type change or placement
  fineRotation: false,
  history: [],
  future: [],

  // Toggle between 90° and 45° rotation steps
  toggleFineRotation: () => set(s => ({ fineRotation: !s.fineRotation })),

  // Enter/exit placement mode. Clears any existing selection + resets preview rotation.
  selectPartType: (type) =>
    set({ selectedPartType: type, selectedPartId: null, previewQuaternion: [0, 0, 0, 1] }),

  // Select an existing part (for delete/highlight). Exits placement mode.
  selectExistingPart: (id) =>
    set({ selectedPartId: id, selectedPartType: null }),

  // Update the ghost preview position (called on every mouse move during placement mode)
  updateGhost: (position, quaternion, snap) =>
    set({
      ghostPosition: position,
      ghostQuaternion: quaternion,
      isSnapping: snap !== null,
      snapResult: snap,
    }),

  // Place the current ghost part into the scene.
  // If snapping, also records bi-directional connections between the new part and the snap target.
  // CONNECTORS can only be placed when snapping to an open tube end.
  // TUBES can be placed freely (first part, or starting a new branch).
  placePart: () => {
    const state = get();
    if (!state.selectedPartType) return;

    // Connectors and panels require a snap target — can't float in empty space
    if (!isTubeType(state.selectedPartType) && !state.snapResult) return;

    const { ghostPosition, ghostQuaternion, snapResult, selectedPartType } = state;

    // Build the new part
    const newPart: PlacedPart = {
      id: generateId(),
      type: selectedPartType,
      position: [...ghostPosition],
      quaternion: [...ghostQuaternion],
      connections: initConnections(selectedPartType),
    };

    // Clone existing parts (we'll update connections on the snap target)
    let updatedParts = cloneParts(state.parts);

    if (isPanelType(selectedPartType)) {
      // Panels don't create port connections — they store clampedTo instead.
      // The snap result encodes tubeB id in targetPortId as "body:tubeBId"
      if (snapResult) {
        const tubeBId = snapResult.targetPortId.startsWith('body:')
          ? snapResult.targetPortId.slice(5)
          : '';
        newPart.clampedTo = { tubeAId: snapResult.targetPartId, tubeBId };
      }
    } else if (snapResult) {
      // Record connection on the NEW part's port
      newPart.connections[snapResult.localPortId] = {
        toPartId: snapResult.targetPartId,
        toPortId: snapResult.targetPortId,
      };

      // Record connection on the TARGET part's port
      updatedParts = updatedParts.map(p => {
        if (p.id === snapResult.targetPartId) {
          return {
            ...p,
            connections: {
              ...p.connections,
              [snapResult.targetPortId]: {
                toPartId: newPart.id,
                toPortId: snapResult.localPortId,
              } as Connection,
            },
          };
        }
        return p;
      });

      // Check for additional port alignments (e.g. tube placed between two connectors
      // snaps to one end, but the other end also aligns with another open port)
      const additionalConns = findAdditionalConnections(
        newPart,
        updatedParts,
        snapResult.localPortId
      );

      for (const ac of additionalConns) {
        newPart.connections[ac.localPortId] = {
          toPartId: ac.targetPartId,
          toPortId: ac.targetPortId,
        };

        updatedParts = updatedParts.map(p => {
          if (p.id === ac.targetPartId) {
            return {
              ...p,
              connections: {
                ...p.connections,
                [ac.targetPortId]: {
                  toPartId: newPart.id,
                  toPortId: ac.localPortId,
                } as Connection,
              },
            };
          }
          return p;
        });
      }
    }

    set({
      history: [...state.history, cloneParts(state.parts)], // save for undo
      future: [],                                            // clear redo stack
      parts: [...updatedParts, newPart],
      previewQuaternion: [0, 0, 0, 1],                      // reset rotation after placement
    });
  },

  // Delete the currently selected part and clean up any connections to it.
  deleteSelectedPart: () => {
    const state = get();
    if (!state.selectedPartId) return;

    const deletedId = state.selectedPartId!;

    // Remove the part + any panels/clamps clamped to it, and clear connections
    const updatedParts = state.parts
      .filter(p => {
        if (p.id === deletedId) return false;
        // Cascade: remove panels/clamps clamped to the deleted tube
        if (p.clampedTo && (p.clampedTo.tubeAId === deletedId || p.clampedTo.tubeBId === deletedId)) {
          return false;
        }
        return true;
      })
      .map(p => {
        const newConns = { ...p.connections };
        for (const [portId, conn] of Object.entries(newConns)) {
          if (conn && conn.toPartId === state.selectedPartId) {
            newConns[portId] = null; // break the connection
          }
        }
        return { ...p, connections: newConns };
      });

    set({
      history: [...state.history, cloneParts(state.parts)],
      future: [],
      parts: updatedParts,
      selectedPartId: null,
    });
  },

  // Rotate the preview ghost by 90° (or 45° when fineRotation is on) around the given axis.
  // Only works for connector types (tubes are symmetric and don't need rotation).
  rotatePreview: (axis) => {
    const state = get();
    if (!state.selectedPartType) return;
    if (isTubeType(state.selectedPartType!)) return; // tubes don't rotate

    const current = new THREE.Quaternion(
      state.previewQuaternion[0], state.previewQuaternion[1],
      state.previewQuaternion[2], state.previewQuaternion[3]
    );
    const rot = axisRotationQuat(axis, state.fineRotation);
    // newPreview = rot * current (apply new rotation on top of existing)
    const result = rot.multiply(current);
    set({ previewQuaternion: [result.x, result.y, result.z, result.w] });
  },

  // Rotate a placed connector by 90° around the given axis.
  // Checks connection constraints, pushes to history for undo, and
  // rigidly rotates all parts connected through non-axis ports.
  rotatePlacedPart: (axis) => {
    const state = get();
    if (!state.selectedPartId) return;

    const part = state.parts.find(p => p.id === state.selectedPartId);
    if (!part) return;
    if (isTubeType(part.type)) return; // tubes don't rotate independently

    // Check rotation constraint based on connected tube axes
    if (!canRotate(part, axis)) return;

    const rotQuat = axisRotationQuat(axis, state.fineRotation);

    // Collect all parts that should move rigidly with this rotation
    const subtreeIds = collectRigidSubtree(part, axis, state.parts);
    const subtreeSet = new Set(subtreeIds);

    // Build updated parts array with rotated transforms
    const updatedParts = state.parts.map(p => {
      if (p.id === part.id) {
        // The connector itself: only quaternion changes (it rotates in place)
        return {
          ...p,
          connections: { ...p.connections },
          quaternion: composeQuaternions(rotQuat, p.quaternion),
        };
      }
      if (subtreeSet.has(p.id)) {
        // Subtree part: both position and quaternion change (rigid rotation around connector center)
        return {
          ...p,
          connections: { ...p.connections },
          position: rotatePositionAroundPivot(p.position, part.position, rotQuat),
          quaternion: composeQuaternions(rotQuat, p.quaternion),
        };
      }
      return p;
    });

    set({
      history: [...state.history, cloneParts(state.parts)], // save for undo
      future: [],                                            // clear redo stack
      parts: updatedParts,
    });
  },

  // Undo: restore previous state, push current to future stack
  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const previous = state.history[state.history.length - 1];
    set({
      history: state.history.slice(0, -1),
      future: [cloneParts(state.parts), ...state.future],
      parts: previous,
      selectedPartId: null,
    });
  },

  // Redo: restore next state, push current to history stack
  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      history: [...state.history, cloneParts(state.parts)],
      future: state.future.slice(1),
      parts: next,
      selectedPartId: null,
    });
  },

  // Save current design by name to localStorage
  saveByName: (name) => {
    const { parts } = get();
    saveDesignByName(name, parts);
  },

  // Load a named design from localStorage. Returns true if found.
  loadByName: (name) => {
    const loaded = loadDesignByName(name);
    if (!loaded) return false;
    set({
      parts: loaded,
      history: [],
      future: [],
      selectedPartId: null,
      selectedPartType: null,
    });
    return true;
  },

  // Load an arbitrary parts array (used by file import)
  loadFromParts: (parts) => {
    set({
      parts,
      history: [],
      future: [],
      selectedPartId: null,
      selectedPartType: null,
    });
  },

  // Clear the current design (New Design)
  clearDesign: () => {
    set({
      parts: [],
      history: [],
      future: [],
      selectedPartId: null,
      selectedPartType: null,
    });
  },
}));
