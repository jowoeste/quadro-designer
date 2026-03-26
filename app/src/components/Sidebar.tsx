// src/components/Sidebar.tsx
// Left sidebar showing available parts with inventory counters,
// inventory configuration, save/load controls, and keyboard reference.
//
// UI flow:
//   1. User clicks a part button → enters placement mode (selectedPartType is set)
//   2. Clicking the same button again → exits placement mode (toggle behavior)
//   3. Active part button is highlighted with blue border
//   4. When inventory is enabled, part buttons show "used / available" counts
//   5. Depleted parts are greyed out and cannot be selected
//   6. Save/Load uses named designs stored in browser localStorage
//   7. Export/Import allows saving/loading designs as .quadro.json files

import { useState, useRef } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import { useInventoryStore, countUsedParts } from '../store/useInventoryStore';
import type { PartType } from '../types/parts';
import { PART_COLORS } from '../constants/geometry';
import { QUADRO_PACKAGES } from '../data/packages';
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
  // Panels & clamps
  { type: 'panel-40x40',           label: 'Panel (40×40)',     desc: 'Flat panel, 40×40 cm' },
  { type: 'panel-40x20',           label: 'Panel (40×20)',     desc: 'Half panel, 40×20 cm' },
  { type: 'double-tube-connector', label: 'Tube Clamp',        desc: 'Connects two parallel tubes' },
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

  // Inventory store
  const inventoryEnabled = useInventoryStore(s => s.enabled);
  const toggleEnabled = useInventoryStore(s => s.toggleEnabled);
  const ownedPackages = useInventoryStore(s => s.ownedPackages);
  const extraParts = useInventoryStore(s => s.extraParts);
  const addPackage = useInventoryStore(s => s.addPackage);
  const removePackage = useInventoryStore(s => s.removePackage);
  const setExtraParts = useInventoryStore(s => s.setExtraParts);
  const getAvailable = useInventoryStore(s => s.getAvailable);

  // UI state
  const [saveName, setSaveName] = useState('');
  const [showLoadList, setShowLoadList] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesignInfo[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [showInventoryConfig, setShowInventoryConfig] = useState(false);
  const [showExtraParts, setShowExtraParts] = useState(false);

  // Hidden file input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show a brief status message
  function flashMessage(msg: string) {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2000);
  }

  // ── Part availability helpers ──

  function getUsedCount(partType: PartType): number {
    return countUsedParts(parts, partType);
  }

  function getAvailableCount(partType: PartType): number {
    return getAvailable(partType);
  }

  /** True when used count exceeds available inventory (need to buy more) */
  function isOverInventory(partType: PartType): boolean {
    if (!inventoryEnabled) return false;
    return getUsedCount(partType) > getAvailableCount(partType);
  }

  function handlePartClick(type: PartType) {
    selectPartType(selectedPartType === type ? null : type);
  }

  /** Build shopping list: parts where used > available */
  function getShoppingList(): { type: PartType; label: string; toBuy: number }[] {
    if (!inventoryEnabled) return [];
    return PART_LIST
      .map(({ type, label }) => ({
        type,
        label,
        toBuy: getUsedCount(type) - getAvailableCount(type),
      }))
      .filter(item => item.toBuy > 0);
  }

  // ── Save/Load handlers ──

  function handleSave() {
    const name = saveName.trim();
    if (!name) {
      flashMessage('Enter a name first');
      return;
    }
    saveByName(name);
    flashMessage(`Saved "${name}"`);
    setSaveName('');
    if (showLoadList) {
      setSavedDesigns(listSavedDesigns());
    }
  }

  function handleShowLoadList() {
    setSavedDesigns(listSavedDesigns());
    setShowLoadList(!showLoadList);
  }

  function handleLoad(name: string) {
    const success = loadByName(name);
    if (success) {
      flashMessage(`Loaded "${name}"`);
      setShowLoadList(false);
    } else {
      flashMessage('Design not found');
    }
  }

  function handleDelete(name: string) {
    deleteSavedDesign(name);
    setSavedDesigns(listSavedDesigns());
    flashMessage(`Deleted "${name}"`);
  }

  function handleNewDesign() {
    if (parts.length > 0) {
      if (!window.confirm('Clear current design? Unsaved changes will be lost.')) return;
    }
    clearDesign();
    flashMessage('New design started');
  }

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

      if (parts.length > 0) {
        if (!window.confirm('Replace current design? Unsaved changes will be lost.')) return;
      }

      loadFromParts(parsed.parts);
      flashMessage(`Imported "${parsed.name}"`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Render helper: package quantity for display ──

  function getOwnedQuantity(packageId: string): number {
    return ownedPackages.find(p => p.packageId === packageId)?.quantity ?? 0;
  }

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Quadro Designer</h2>
      <p className="sidebar-subtitle">Phase 2 — Full Designer</p>

      {/* ── Inventory toggle ── */}
      <div className="sidebar-section">
        <div className="inventory-header">
          <h3>Inventory</h3>
          <label className="toggle-switch" title={inventoryEnabled ? 'Inventory constraints ON' : 'Inventory constraints OFF'}>
            <input
              type="checkbox"
              checked={inventoryEnabled}
              onChange={toggleEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {inventoryEnabled && (
          <>
            <button
              className="action-button inventory-config-btn"
              onClick={() => setShowInventoryConfig(!showInventoryConfig)}
            >
              {showInventoryConfig ? 'Hide Packages' : 'Configure Packages'}
            </button>

            {showInventoryConfig && (
              <div className="inventory-config">
                {/* Package list */}
                <div className="package-list">
                  {QUADRO_PACKAGES.map(pkg => {
                    const qty = getOwnedQuantity(pkg.id);
                    return (
                      <div key={pkg.id} className={`package-row ${qty > 0 ? 'owned' : ''}`}>
                        <span className="package-name" title={pkg.nameDe || pkg.name}>
                          {pkg.name}
                        </span>
                        <div className="package-qty-controls">
                          <button
                            className="qty-btn"
                            onClick={() => removePackage(pkg.id)}
                            disabled={qty === 0}
                          >
                            −
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button
                            className="qty-btn"
                            onClick={() => addPackage(pkg.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra parts toggle */}
                <button
                  className="action-button extra-parts-btn"
                  onClick={() => setShowExtraParts(!showExtraParts)}
                >
                  {showExtraParts ? 'Hide Extra Parts' : 'Add Extra Parts'}
                </button>

                {showExtraParts && (
                  <div className="extra-parts-list">
                    {PART_LIST.map(({ type, label }) => (
                      <div key={type} className="extra-part-row">
                        <span className="extra-part-label">{label}</span>
                        <input
                          className="extra-part-input"
                          type="number"
                          min="0"
                          value={extraParts[type] ?? 0}
                          onChange={e => setExtraParts(type, Math.max(0, parseInt(e.target.value) || 0))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Parts palette ── */}
      <div className="sidebar-section">
        <h3>Parts</h3>
        <p className="hint">Click a part, then click in the 3D scene to place it.</p>
        {PART_LIST.map(({ type, label, desc }) => {
          const used = getUsedCount(type);
          const available = inventoryEnabled ? getAvailableCount(type) : -1;
          const over = isOverInventory(type);

          return (
            <button
              key={type}
              className={`part-button ${selectedPartType === type ? 'active' : ''} ${over ? 'over-inventory' : ''}`}
              onClick={() => handlePartClick(type)}
              title={desc}
            >
              <span className="part-color-dot" style={{ backgroundColor: PART_COLORS[type] }} />
              <span className="part-label">{label}</span>
              {inventoryEnabled && (
                <span className={`part-count-badge ${over ? 'over' : ''}`}>
                  {used}/{available}
                </span>
              )}
            </button>
          );
        })}

        {/* Shopping list: parts to buy */}
        {(() => {
          const shoppingList = getShoppingList();
          if (shoppingList.length === 0) return null;
          return (
            <div className="shopping-list">
              <div className="shopping-list-header">To buy:</div>
              {shoppingList.map(({ type, label, toBuy }) => (
                <div key={type} className="shopping-list-item">
                  <span>{label}</span>
                  <span className="shopping-list-qty">+{toBuy}</span>
                </div>
              ))}
            </div>
          );
        })()}
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
          <div><kbd>45°/90°</kbd> Toggle in toolbar</div>
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
