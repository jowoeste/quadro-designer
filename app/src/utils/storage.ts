// src/utils/storage.ts
// Named save/load system using browser localStorage.
//
// Saves are stored as a dictionary keyed by design name.
// Each save contains: parts array, saved-at timestamp, and part count.
//
// STORAGE FORMAT:
//   localStorage key: 'quadro-designs-v2'
//   Value: JSON string of { designs: { [name]: { parts, savedAt, partCount } } }

import type { PlacedPart } from '../types/parts';

const STORAGE_KEY = 'quadro-designs-v2';

interface SavedDesignEntry {
  parts: PlacedPart[];
  savedAt: string;
  partCount: number;
}

interface DesignStorage {
  designs: Record<string, SavedDesignEntry>;
}

// Read the full design store from localStorage
function readStore(): DesignStorage {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { designs: {} };
  try {
    return JSON.parse(raw) as DesignStorage;
  } catch {
    console.error('Failed to parse saved designs from localStorage');
    return { designs: {} };
  }
}

// Write the full design store to localStorage
function writeStore(store: DesignStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// Save a design by name (overwrites if name already exists)
export function saveDesignByName(name: string, parts: PlacedPart[]): void {
  const store = readStore();
  store.designs[name] = {
    parts,
    savedAt: new Date().toISOString(),
    partCount: parts.length,
  };
  writeStore(store);
}

// Load a design by name — returns parts array or null if not found
export function loadDesignByName(name: string): PlacedPart[] | null {
  const store = readStore();
  const entry = store.designs[name];
  if (!entry) return null;
  return entry.parts;
}

// List all saved designs (name, savedAt, partCount)
export interface SavedDesignInfo {
  name: string;
  savedAt: string;
  partCount: number;
}

export function listSavedDesigns(): SavedDesignInfo[] {
  const store = readStore();
  return Object.entries(store.designs)
    .map(([name, entry]) => ({
      name,
      savedAt: entry.savedAt,
      partCount: entry.partCount,
    }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt)); // newest first
}

// Delete a saved design by name
export function deleteSavedDesign(name: string): void {
  const store = readStore();
  delete store.designs[name];
  writeStore(store);
}

// ── File-based export/import ──

export interface DesignFile {
  format: 'quadro-designer';
  version: '1.0';
  name: string;
  savedAt: string;
  partCount: number;
  parts: PlacedPart[];
}

// Serialize a design to a JSON string for file export
export function exportDesignToJSON(name: string, parts: PlacedPart[]): string {
  const file: DesignFile = {
    format: 'quadro-designer',
    version: '1.0',
    name,
    savedAt: new Date().toISOString(),
    partCount: parts.length,
    parts,
  };
  return JSON.stringify(file, null, 2);
}

// Parse and validate a JSON string from an imported file.
// Returns { name, parts } on success, or null if the file is invalid.
export function parseDesignFromJSON(json: string): { name: string; parts: PlacedPart[] } | null {
  try {
    const data = JSON.parse(json);
    // Must have a parts array
    if (!data || !Array.isArray(data.parts)) return null;
    // Basic validation: each part needs id, type, position, quaternion, connections
    for (const p of data.parts) {
      if (!p.id || !p.type || !Array.isArray(p.position) || !Array.isArray(p.quaternion) || !p.connections) {
        return null;
      }
    }
    return {
      name: typeof data.name === 'string' ? data.name : 'Imported design',
      parts: data.parts as PlacedPart[],
    };
  } catch {
    return null;
  }
}
