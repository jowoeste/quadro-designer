// src/components/Sidebar.tsx
// Left sidebar showing available parts, save/load controls, and keyboard reference.
//
// UI flow:
//   1. User clicks a part button → enters placement mode (selectedPartType is set)
//   2. Clicking the same button again → exits placement mode (toggle behavior)
//   3. Active part button is highlighted with blue border
//   4. Save/Load uses named designs stored in browser localStorage
//   5. Export/Import allows saving/loading designs as .quadro.json files

import { useState, useRef } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import type { PartType } from '../types/parts';
import { PART_COLORS } from '../constants/geometry';
import { listSavedDesigns, deleteSavedDesign, exportDesignToJSON, parseDesignFromJSON } from '../utils/storage';
import type { SavedDesignInfo } from '../utils/storage';

// Display labels for each part type, grouped: tubes first, then connectors
const PART_LIST: { type: PartType; label: string; desc: string }[] = [
  // Tubes
  { type: 'tube',            label: 'Tube (35 cm)',      desc: 'Standard tube, 35 cm long' },
  { type: 'tube-15',         label: 'Tube (15 cm)',      desc: 'Short tube, 15 cm long' },
  // Flat connectors
  { type: 'straight',        label: 'Straight (2-way)',  desc: '180° inline connector' },
  { type: 'elbow',           label: 'Elbow (2-way)',     desc: '90° corner connector' },
  { type: 'diagonal',        label: 'Diagonal (45°)',    desc: '135° angled connector' },
  { type: 't-connector',     label: 'T-Piece (3-way)',   desc: '3-way flat branch connector' },
  { type: 'cross',           label: 'Cross (4-way)',     desc: '4-way flat connector' },
  // Spatial connectors
  { type: '3-way-spatial',   label: '3-Way Spatial',     desc: '3 perpendicular arms (cube corner)' },
  { type: '4-way-spatial',   label: '4-Way Spatial',     desc: 'Horizontal T + 1 up' },
  { type: '5-way',           label: '5-Way Connector',   desc: '4 horizontal + 1 up' },
  { type: '6-way',           label: '6-Way Connector',   desc: 'All 6 directions' },
];

// Sanitize a name for use as a filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'untitled';
}

export function Sidebar() {
  const selectedPartType = useDesignStore(s => s.selectedPartType);
  const selectPartType = useDesignStore(s => s.selectPartType);
  const parts = useDesignStore(s => s.parts);
  const saveByName = useDesignStore(s => s.saveByName);
  const loadByName = useDesignStore(s => s.loadByName);
  const loadFromParts = useDesignStore(s => s.loadFromParts);
  const clearDesign = useDesignStore(s => s.clearDesign);

  // Save/Load UI state
  const [saveName, setSaveName] = useState('');
  const [showLoadList, setShowLoadList] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesignInfo[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  // Hidden file input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Bug fix: refresh the saved list if it's currently showing
    if (showLoadList) {
      setSavedDesigns(listSavedDesigns());
    }
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

  // Export design as .quadro.json file download
  function handleExport() {
    const name = saveName.trim() || 'Untitled';
    const json = exportDesignToJSON(name, parts);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(name)}.quadro.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashMessage(`Exported "${name}"`);
  }

  // Import design from .quadro.json file
  function handleImport() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseDesignFromJSON(text);

      if (!parsed) {
        flashMessage('Invalid file format');
        return;
      }

      // Confirm if current design has parts
      if (parts.length > 0) {
        if (!window.confirm('Replace current design? Unsaved changes will be lost.')) return;
      }

      loadFromParts(parsed.parts);
      flashMessage(`Imported "${parsed.name}"`);
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-imported
    e.target.value = '';
  }

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Quadro Designer</h2>
      <p className="sidebar-subtitle">Phase 2 — Full Designer</p>

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

        {/* Export / Import buttons */}
        <div className="save-row">
          <button
            className="action-button file-btn"
            onClick={handleExport}
            disabled={parts.length === 0}
            title="Download design as .quadro.json file"
          >
            Export JSON
          </button>
          <button
            className="action-button file-btn"
            onClick={handleImport}
            title="Load design from .quadro.json file"
          >
            Import JSON
          </button>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.quadro.json"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />

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
