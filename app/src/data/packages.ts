// src/data/packages.ts
// Quadro package definitions — how many of each part come in each kit.
//
// Data source: Quadro_Parts_Overview.xlsx (master parts matrix).
// Includes tubes, connectors, panels, and double-tube-connectors.

import type { PartType } from '../types/parts';

/** Part counts per package, keyed by PartType */
export type PackageParts = Partial<Record<PartType, number>>;

export interface QuadroPackage {
  id: string;
  name: string;
  /** German name shown in parentheses */
  nameDe?: string;
  parts: PackageParts;
}

// ─── Package definitions ────────────────────────────────────
// Extracted from Quadro_Parts_Overview.xlsx, rows 4–21.
// Column mapping:
//   col 3 → 5-way, col 4 → 4-way-spatial, col 5 → 3-way-spatial,
//   col 7 → cross, col 8 → t-connector, col 9 → elbow,
//   col 10 → straight, col 11 → diagonal,
//   col 13 → tube-15, col 15 → tube

export const QUADRO_PACKAGES: QuadroPackage[] = [
  {
    id: 'my-first-quadro',
    name: 'My First QUADRO',
    parts: {
      '4-way-spatial': 4, '3-way-spatial': 7,
      't-connector': 9, 'elbow': 4, 'straight': 1, 'diagonal': 4,
      'tube': 30,
    },
  },
  {
    id: 'beginner',
    name: 'Beginner',
    parts: {
      '4-way-spatial': 4, '3-way-spatial': 6,
      't-connector': 5, 'elbow': 5, 'straight': 1, 'diagonal': 4,
      'tube-15': 8, 'tube': 19,
    },
  },
  {
    id: 'adventure',
    name: 'Adventure',
    parts: {
      '4-way-spatial': 8, '3-way-spatial': 4,
      't-connector': 4, 'elbow': 14, 'straight': 2, 'diagonal': 4,
      'tube-15': 10, 'tube': 34,
      'panel-40x40': 8, 'double-tube-connector': 2,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    parts: {
      '5-way': 2, '4-way-spatial': 7, '3-way-spatial': 6,
      't-connector': 8, 'elbow': 8, 'straight': 3,
      'tube': 48,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    parts: {
      '5-way': 2, '4-way-spatial': 10, '3-way-spatial': 6,
      'cross': 2, 't-connector': 8, 'elbow': 8, 'straight': 5, 'diagonal': 4,
      'tube-15': 8, 'tube': 46,
    },
  },
  {
    id: 'junior',
    name: 'Junior',
    parts: {
      '5-way': 2, '4-way-spatial': 10, '3-way-spatial': 6,
      'cross': 1, 't-connector': 10, 'elbow': 10, 'straight': 7, 'diagonal': 4,
      'tube-15': 2, 'tube': 66,
    },
  },
  {
    id: 'climbing-pyramid',
    name: 'Climbing Pyramid',
    nameDe: 'Kletterpyramide',
    parts: {
      '5-way': 3, '4-way-spatial': 8, '3-way-spatial': 15,
      'cross': 2, 't-connector': 6, 'elbow': 5,
      'tube': 64,
    },
  },
  {
    id: 'climbing-parkour',
    name: 'Climbing Parkour',
    nameDe: 'Kletterparkour',
    parts: {
      '4-way-spatial': 8, '3-way-spatial': 12,
      't-connector': 10, 'elbow': 10, 'straight': 2, 'diagonal': 8,
      'tube-15': 16, 'tube': 38,
    },
  },
  {
    id: 'universal',
    name: 'Universal',
    parts: {
      '5-way': 2, '4-way-spatial': 14, '3-way-spatial': 8,
      'cross': 1, 't-connector': 10, 'elbow': 10, 'straight': 11, 'diagonal': 4,
      'tube-15': 2, 'tube': 81,
    },
  },
  {
    id: 'evolution',
    name: 'Evolution',
    parts: {
      '5-way': 4, '4-way-spatial': 10, '3-way-spatial': 12,
      'cross': 1, 't-connector': 11, 'elbow': 12, 'straight': 4, 'diagonal': 4,
      'tube-15': 18, 'tube': 60,
      'panel-40x40': 8, 'panel-40x20': 9, 'double-tube-connector': 2,
    },
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    parts: {
      '5-way': 4, '4-way-spatial': 23, '3-way-spatial': 20,
      'cross': 2, 't-connector': 18, 'elbow': 17, 'straight': 10, 'diagonal': 8,
      'tube-15': 37, 'tube': 103,
      'panel-40x40': 16, 'panel-40x20': 14, 'double-tube-connector': 4,
    },
  },
  {
    id: 'upgrade-kit',
    name: 'Upgrade Kit',
    parts: {
      '4-way-spatial': 6,
      't-connector': 6, 'elbow': 8, 'straight': 4, 'diagonal': 4,
      'tube-15': 16, 'tube': 13,
      'panel-40x40': 10, 'panel-40x20': 2, 'double-tube-connector': 2,
    },
  },
  {
    id: 'moebel-kit-s',
    name: 'Möbel Kit S',
    parts: {
      '5-way': 1, '4-way-spatial': 6, '3-way-spatial': 9,
      't-connector': 2, 'elbow': 9, 'straight': 1,
      'tube-15': 6, 'tube': 35,
    },
  },
  {
    id: 'moebel-kit-l',
    name: 'Möbel Kit L',
    parts: {
      '5-way': 4, '4-way-spatial': 13, '3-way-spatial': 14,
      't-connector': 11, 'elbow': 13, 'straight': 3,
      'tube-15': 23, 'tube': 57,
    },
  },
  {
    id: 'pool-s',
    name: 'Pool S',
    parts: {
      '4-way-spatial': 2, '3-way-spatial': 6,
      't-connector': 2, 'elbow': 8, 'straight': 1,
      'tube-15': 13, 'tube': 9,
    },
  },
  {
    id: 'pool-l',
    name: 'Pool L',
    parts: {
      '4-way-spatial': 4, '3-way-spatial': 16,
      't-connector': 4, 'elbow': 4, 'straight': 4,
      'tube': 42,
    },
  },
  {
    id: 'pool-xxl',
    name: 'Pool XXL',
    parts: {
      '4-way-spatial': 12, '3-way-spatial': 20,
      'elbow': 4, 'straight': 8,
      'tube': 56,
    },
  },
  {
    id: 'curved-slide-frame',
    name: 'Curved Slide Frame',
    nameDe: 'Bogenrutschen-Rahmen',
    parts: {
      'tube': 4,
    },
  },
];

/** Look up a package by its id */
export function getPackageById(id: string): QuadroPackage | undefined {
  return QUADRO_PACKAGES.find(p => p.id === id);
}
