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
//   Before every mutating action (place, delete), we push a deep copy of `parts` to `history`.
//   Undo pops from history, pushes current state to future. Redo does the reverse.

import { create } from 'zustand';
import type { PlacedPart, PartType, SnapResult, Connection } from '../types/parts';
import { initConnections } from '../geometry/portDefs';
import { saveDesign, loadDesign } from '../utils/storage';

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

  // Undo/redo history stacks
  history: PlacedPart[][];
  future: PlacedPart[][];

  // Actions
  selectPartType: (type: PartType | null) => void;
  selectExistingPart: (id: string | null) => void;
  updateGhost: (
    position: [number, number, number],
    quaternion: [number, number, number, number],
    snap: SnapResult | null
  ) => void;
  placePart: () => void;
  deleteSelectedPart: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
  load: () => void;
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  parts: [],
  selectedPartType: null,
  selectedPartId: null,
  ghostPosition: [0, 0, 0],
  ghostQuaternion: [0, 0, 0, 1], // identity quaternion
  isSnapping: false,
  snapResult: null,
  history: [],
  future: [],

  // Enter/exit placement mode. Clears any existing selection.
  selectPartType: (type) =>
    set({ selectedPartType: type, selectedPartId: null }),

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
  placePart: () => {
    const state = get();
    if (!state.selectedPartType) return;

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

    if (snapResult) {
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
    }

    set({
      history: [...state.history, cloneParts(state.parts)], // save for undo
      future: [],                                            // clear redo stack
      parts: [...updatedParts, newPart],
    });
  },

  // Delete the currently selected part and clean up any connections to it.
  deleteSelectedPart: () => {
    const state = get();
    if (!state.selectedPartId) return;

    // Remove the part, and clear any connections other parts had to it
    const updatedParts = state.parts
      .filter(p => p.id !== state.selectedPartId)
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

  // Save current design to localStorage
  save: () => {
    const { parts } = get();
    saveDesign(parts);
    alert(`Design saved! (${parts.length} parts)`);
  },

  // Load a previously saved design from localStorage
  load: () => {
    const loaded = loadDesign();
    if (!loaded) {
      alert('No saved design found.');
      return;
    }
    set({
      parts: loaded,
      history: [],
      future: [],
      selectedPartId: null,
      selectedPartType: null,
    });
    alert(`Loaded ${loaded.length} parts.`);
  },
}));
