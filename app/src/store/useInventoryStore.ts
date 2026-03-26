// src/store/useInventoryStore.ts
// Inventory management — tracks which Quadro packages the user owns,
// any extra individual parts, and computes available/used/remaining counts.
//
// Persisted to localStorage under the key 'quadro-inventory'.

import { create } from 'zustand';
import type { PartType } from '../types/parts';
import { QUADRO_PACKAGES, type PackageParts } from '../data/packages';

// ─── Types ──────────────────────────────────────────────────

/** A package the user owns, with quantity */
export interface OwnedPackage {
  packageId: string;
  quantity: number;
}

/** Full inventory state */
interface InventoryState {
  /** Whether inventory mode is active (limits placement to available parts) */
  enabled: boolean;

  /** Packages the user owns (id + quantity) */
  ownedPackages: OwnedPackage[];

  /** Extra individual parts not from any package */
  extraParts: PackageParts;

  // ─── Actions ────────────────────────────────────────────

  /** Toggle inventory constraints on/off */
  toggleEnabled: () => void;

  /** Add a package (or increment its quantity) */
  addPackage: (packageId: string) => void;

  /** Remove one instance of a package (decrement quantity, remove at 0) */
  removePackage: (packageId: string) => void;

  /** Set exact quantity for a package */
  setPackageQuantity: (packageId: string, quantity: number) => void;

  /** Set extra parts count for a specific part type */
  setExtraParts: (partType: PartType, count: number) => void;

  /** Get total available count for a part type (from all packages + extras) */
  getAvailable: (partType: PartType) => number;

  /** Reset inventory to empty */
  resetInventory: () => void;
}

// ─── localStorage persistence ───────────────────────────────

const STORAGE_KEY = 'quadro-inventory';

interface PersistedInventory {
  enabled: boolean;
  ownedPackages: OwnedPackage[];
  extraParts: PackageParts;
}

function loadFromStorage(): Partial<PersistedInventory> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedInventory;
  } catch {
    return {};
  }
}

function saveToStorage(state: PersistedInventory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ─── Helpers ────────────────────────────────────────────────

/** Sum up all parts from owned packages + extras for a given part type */
function computeAvailable(
  ownedPackages: OwnedPackage[],
  extraParts: PackageParts,
  partType: PartType
): number {
  let total = 0;

  for (const op of ownedPackages) {
    const pkg = QUADRO_PACKAGES.find(p => p.id === op.packageId);
    if (pkg && pkg.parts[partType]) {
      total += pkg.parts[partType]! * op.quantity;
    }
  }

  total += extraParts[partType] ?? 0;
  return total;
}

// ─── Store ──────────────────────────────────────────────────

const persisted = loadFromStorage();

export const useInventoryStore = create<InventoryState>((set, get) => ({
  enabled: persisted.enabled ?? false,
  ownedPackages: persisted.ownedPackages ?? [],
  extraParts: persisted.extraParts ?? {},

  toggleEnabled: () => {
    set(state => {
      const next = { ...state, enabled: !state.enabled };
      saveToStorage({ enabled: next.enabled, ownedPackages: next.ownedPackages, extraParts: next.extraParts });
      return next;
    });
  },

  addPackage: (packageId: string) => {
    set(state => {
      const existing = state.ownedPackages.find(p => p.packageId === packageId);
      let ownedPackages: OwnedPackage[];
      if (existing) {
        ownedPackages = state.ownedPackages.map(p =>
          p.packageId === packageId ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        ownedPackages = [...state.ownedPackages, { packageId, quantity: 1 }];
      }
      saveToStorage({ enabled: state.enabled, ownedPackages, extraParts: state.extraParts });
      return { ownedPackages };
    });
  },

  removePackage: (packageId: string) => {
    set(state => {
      const existing = state.ownedPackages.find(p => p.packageId === packageId);
      if (!existing) return state;

      let ownedPackages: OwnedPackage[];
      if (existing.quantity <= 1) {
        ownedPackages = state.ownedPackages.filter(p => p.packageId !== packageId);
      } else {
        ownedPackages = state.ownedPackages.map(p =>
          p.packageId === packageId ? { ...p, quantity: p.quantity - 1 } : p
        );
      }
      saveToStorage({ enabled: state.enabled, ownedPackages, extraParts: state.extraParts });
      return { ownedPackages };
    });
  },

  setPackageQuantity: (packageId: string, quantity: number) => {
    set(state => {
      let ownedPackages: OwnedPackage[];
      if (quantity <= 0) {
        ownedPackages = state.ownedPackages.filter(p => p.packageId !== packageId);
      } else {
        const existing = state.ownedPackages.find(p => p.packageId === packageId);
        if (existing) {
          ownedPackages = state.ownedPackages.map(p =>
            p.packageId === packageId ? { ...p, quantity } : p
          );
        } else {
          ownedPackages = [...state.ownedPackages, { packageId, quantity }];
        }
      }
      saveToStorage({ enabled: state.enabled, ownedPackages, extraParts: state.extraParts });
      return { ownedPackages };
    });
  },

  setExtraParts: (partType: PartType, count: number) => {
    set(state => {
      const extraParts = { ...state.extraParts };
      if (count <= 0) {
        delete extraParts[partType];
      } else {
        extraParts[partType] = count;
      }
      saveToStorage({ enabled: state.enabled, ownedPackages: state.ownedPackages, extraParts });
      return { extraParts };
    });
  },

  getAvailable: (partType: PartType) => {
    const state = get();
    return computeAvailable(state.ownedPackages, state.extraParts, partType);
  },

  resetInventory: () => {
    const reset = { enabled: false, ownedPackages: [], extraParts: {} };
    saveToStorage(reset);
    set(reset);
  },
}));

// ─── Selector helpers (for use in components) ───────────────

/** Count how many of a given part type are currently placed in the design */
export function countUsedParts(parts: { type: PartType }[], partType: PartType): number {
  return parts.filter(p => p.type === partType).length;
}
