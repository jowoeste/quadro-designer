// src/components/Sidebar.tsx
// Left sidebar showing available parts and save/load controls.
//
// UI flow:
//   1. User clicks a part button → enters placement mode (selectedPartType is set)
//   2. Clicking the same button again → exits placement mode (toggle behavior)
//   3. Active part button is highlighted with blue border
//   4. Save/Load buttons persist the design to browser localStorage

import { useDesignStore } from '../store/useDesignStore';
import type { PartType } from '../types/parts';
import { PART_COLORS } from '../constants/geometry';

// Display labels for each part type
const PART_LIST: { type: PartType; label: string; desc: string }[] = [
  { type: 'tube',        label: 'Tube (35 cm)',     desc: 'Straight tube, 35 cm long' },
  { type: 'elbow',       label: 'Elbow (2-way)',    desc: '90° corner connector' },
  { type: 't-connector', label: 'T-Piece (3-way)',  desc: '3-way branch connector' },
  { type: 'cross',       label: 'Cross (4-way)',    desc: '4-way flat connector' },
  { type: '5-way',       label: '5-Way Connector',  desc: '4 horizontal + 1 vertical' },
];

export function Sidebar() {
  const selectedPartType = useDesignStore(s => s.selectedPartType);
  const selectPartType = useDesignStore(s => s.selectPartType);
  const parts = useDesignStore(s => s.parts);
  const save = useDesignStore(s => s.save);
  const load = useDesignStore(s => s.load);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Quadro Designer</h2>
      <p className="sidebar-subtitle">Phase 1 — Proof of Principle</p>

      {/* ── Parts palette ── */}
      <div className="sidebar-section">
        <h3>Parts</h3>
        <p className="hint">Click a part, then click in the 3D scene to place it.</p>
        {PART_LIST.map(({ type, label, desc }) => (
          <button
            key={type}
            className={`part-button ${selectedPartType === type ? 'active' : ''}`}
            onClick={() => selectPartType(selectedPartType === type ? null : type)}
            title={desc}
          >
            <span className="part-color-dot" style={{ backgroundColor: PART_COLORS[type] }} />
            <span className="part-label">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Keyboard shortcuts reference ── */}
      <div className="sidebar-section">
        <h3>Controls</h3>
        <div className="controls-hint">
          <div><kbd>Orbit</kbd> Left-drag</div>
          <div><kbd>Pan</kbd> Right-drag</div>
          <div><kbd>Zoom</kbd> Scroll wheel</div>
          <div><kbd>Delete</kbd> Remove selected part</div>
          <div><kbd>Ctrl+Z</kbd> Undo</div>
          <div><kbd>Ctrl+Shift+Z</kbd> Redo</div>
          <div><kbd>Esc</kbd> Cancel placement</div>
        </div>
      </div>

      {/* ── Save / Load ── */}
      <div className="sidebar-section">
        <h3>Design</h3>
        <p className="part-count">
          {parts.length} part{parts.length !== 1 ? 's' : ''} placed
        </p>
        <button className="action-button" onClick={save}>
          Save Design
        </button>
        <button className="action-button" onClick={load}>
          Load Design
        </button>
      </div>
    </div>
  );
}
