// src/components/Sidebar.tsx
// Left sidebar showing available parts, save/load controls, and keyboard reference.
//
// UI flow:
//   1. User clicks a part button → enters placement mode (selectedPartType is set)
//   2. Clicking the same button again → exits placement mode (toggle behavior)
//   3. Active part button is highlighted with blue border
//   4. Save/Load uses named designs stored in browser localStorage

import { useState } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import type { PartType } from '../types/parts';
import { PART_COLORS } from '../constants/geometry';
import { listSavedDesigns, deleteSavedDesign } from '../utils/storage';
import type { SavedDesignInfo } from '../utils/storage';

// Display labels for each part type
const PART_LIST: { type: PartType; label: string; desc: string }[] = [
  { type: 'tube',            label: 'Tube (35 cm)',      desc: 'Straight tube, 35 cm long' },
  { type: 'elbow',           label: 'Elbow (2-way)',     desc: '90° corner connector' },
  { type: 't-connector',     label: 'T-Piece (3-way)',   desc: '3-way flat branch connector' },
  { type: '3-way-spatial',   label: '3-Way Spatial',     desc: '3 perpendicular arms (cube corner)' },
  { type: 'cross',           label: 'Cross (4-way)',     desc: '4-way flat connector' },
  { type: '5-way',           label: '5-Way Connector',   desc: '4 horizontal + 1 vertical' },
];

export function Sidebar() {
  const selectedPartType = useDesignStore(s => s.selectedPartType);
  const selectPartType = useDesignStore(s => s.selectPartType);
  const parts = useDesignStore(s => s.parts);
  const saveByName = useDesignStore(s => s.saveByName);
  const loadByName = useDesignStore(s => s.loadByName);
  const clearDesign = useDesignStore(s => s.clearDesign);

  // Save/Load UI state
  const [saveName, setSaveName] = useState('');
  const [showLoadList, setShowLoadList] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesignInfo[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  // Show a brief status message
  function flashMessage(msg: string) {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2000);
  }

  // Save the current design
  function handleSave() {
    const name = saveName.trim();
    if (!name) {
      flashMessage('Enter a name first');
      return;
    }
    saveByName(name);
    flashMessage(`Saved "${name}"`);
    setSaveName('');
  }

  // Open the load list
  function handleShowLoadList() {
    setSavedDesigns(listSavedDesigns());
    setShowLoadList(!showLoadList);
  }

  // Load a specific design
  function handleLoad(name: string) {
    const success = loadByName(name);
    if (success) {
      flashMessage(`Loaded "${name}"`);
      setShowLoadList(false);
    } else {
      flashMessage('Design not found');
    }
  }

  // Delete a saved design
  function handleDelete(name: string) {
    deleteSavedDesign(name);
    setSavedDesigns(listSavedDesigns()); // refresh list
    flashMessage(`Deleted "${name}"`);
  }

  // New design (clear)
  function handleNewDesign() {
    if (parts.length > 0) {
      if (!window.confirm('Clear current design? Unsaved changes will be lost.')) return;
    }
    clearDesign();
    flashMessage('New design started');
  }

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
          <div><kbd>X</kbd><kbd>Y</kbd><kbd>Z</kbd> Rotate connector</div>
        </div>
      </div>

      {/* ── Design management ── */}
      <div className="sidebar-section">
        <h3>Design</h3>
        <p className="part-count">
          {parts.length} part{parts.length !== 1 ? 's' : ''} placed
        </p>

        {/* Save input + button */}
        <div className="save-row">
          <input
            className="save-input"
            type="text"
            placeholder="Design name..."
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          />
          <button className="action-button save-btn" onClick={handleSave}>
            Save
          </button>
        </div>

        {/* Status message */}
        {saveMessage && <p className="save-message">{saveMessage}</p>}

        {/* Load / New buttons */}
        <button className="action-button" onClick={handleShowLoadList}>
          {showLoadList ? 'Hide Saved' : 'Load Design'}
        </button>
        <button className="action-button new-design-btn" onClick={handleNewDesign}>
          New Design
        </button>

        {/* Saved designs list */}
        {showLoadList && (
          <div className="saved-list">
            {savedDesigns.length === 0 ? (
              <p className="hint">No saved designs yet.</p>
            ) : (
              savedDesigns.map(d => (
                <div key={d.name} className="saved-item">
                  <div className="saved-item-info">
                    <span className="saved-item-name">{d.name}</span>
                    <span className="saved-item-meta">{d.partCount} parts</span>
                  </div>
                  <div className="saved-item-actions">
                    <button className="small-btn load-btn" onClick={() => handleLoad(d.name)}>
                      Load
                    </button>
                    <button className="small-btn delete-btn" onClick={() => handleDelete(d.name)}>
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
