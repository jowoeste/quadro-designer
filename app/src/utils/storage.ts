// src/utils/storage.ts
// Save/load designs to browser localStorage as JSON.
// Simple serialization — PlacedPart[] maps directly to JSON.

import type { PlacedPart } from '../types/parts';

const STORAGE_KEY = 'quadro-design-v1';

interface SavedDesign {
  parts: PlacedPart[];
  savedAt: string;
  version: number;
}

export function saveDesign(parts: PlacedPart[]): void {
  const data: SavedDesign = {
    parts,
    savedAt: new Date().toISOString(),
    version: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadDesign(): PlacedPart[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as SavedDesign;
    return data.parts;
  } catch {
    console.error('Failed to parse saved design from localStorage');
    return null;
  }
}
