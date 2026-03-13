// src/App.tsx
// Root component — lays out the sidebar and 3D canvas, handles global keyboard shortcuts.
//
// Layout: flexbox row — fixed-width sidebar on the left, canvas fills remaining space.
// Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Delete, Escape, X/Y/Z) are attached to `window`
// so they work regardless of which element has focus.
// A floating toolbar provides clickable buttons for all shortcuts (P6).

import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { useDesignStore } from './store/useDesignStore';

export default function App() {
  const undo = useDesignStore(s => s.undo);
  const redo = useDesignStore(s => s.redo);
  const deleteSelectedPart = useDesignStore(s => s.deleteSelectedPart);
  const selectedPartId = useDesignStore(s => s.selectedPartId);
  const selectPartType = useDesignStore(s => s.selectPartType);
  const selectedPartType = useDesignStore(s => s.selectedPartType);
  const rotatePreview = useDesignStore(s => s.rotatePreview);
  const rotatePlacedPart = useDesignStore(s => s.rotatePlacedPart);
  const previewQuaternion = useDesignStore(s => s.previewQuaternion);
  const selectExistingPart = useDesignStore(s => s.selectExistingPart);

  // Can we rotate right now? (used for toolbar button state)
  const canRotateNow =
    (selectedPartType !== null && selectedPartType !== 'tube') ||
    selectedPartId !== null;

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on Mac

      if (ctrl && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();
        redo();
      } else if (ctrl && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPartId) {
          e.preventDefault();
          deleteSelectedPart();
        }
      } else if (e.key === 'Escape') {
        if (selectedPartType) {
          selectPartType(null);
        } else if (selectedPartId) {
          selectExistingPart(null);
        }
      }

      // X/Y/Z: rotate connector (preview mode or post-placement)
      if (e.key === 'x' || e.key === 'X') {
        if (selectedPartType && selectedPartType !== 'tube') {
          e.preventDefault();
          rotatePreview('x');
        } else if (selectedPartId) {
          e.preventDefault();
          rotatePlacedPart('x');
        }
      }
      if (e.key === 'y' || e.key === 'Y') {
        if (selectedPartType && selectedPartType !== 'tube') {
          e.preventDefault();
          rotatePreview('y');
        } else if (selectedPartId) {
          e.preventDefault();
          rotatePlacedPart('y');
        }
      }
      if (e.key === 'z' || e.key === 'Z') {
        if (!ctrl) {
          if (selectedPartType && selectedPartType !== 'tube') {
            e.preventDefault();
            rotatePreview('z');
          } else if (selectedPartId) {
            e.preventDefault();
            rotatePlacedPart('z');
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteSelectedPart, selectedPartId, selectPartType, selectedPartType, rotatePreview, rotatePlacedPart, selectExistingPart]);

  // Handlers for toolbar buttons (same logic as keyboard shortcuts)
  function handleRotate(axis: 'x' | 'y' | 'z') {
    if (selectedPartType && selectedPartType !== 'tube') {
      rotatePreview(axis);
    } else if (selectedPartId) {
      rotatePlacedPart(axis);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="canvas-container">
        <Scene />

        {/* ── Floating toolbar (P6) ── */}
        <div className="toolbar">
          <button className="toolbar-btn" onClick={undo} title="Undo (Ctrl+Z)">
            Undo
          </button>
          <button className="toolbar-btn" onClick={redo} title="Redo (Ctrl+Shift+Z)">
            Redo
          </button>
          <span className="toolbar-sep" />
          <button
            className={`toolbar-btn ${canRotateNow ? '' : 'disabled'}`}
            onClick={() => handleRotate('x')}
            title="Rotate X axis"
            disabled={!canRotateNow}
          >
            Rot X
          </button>
          <button
            className={`toolbar-btn ${canRotateNow ? '' : 'disabled'}`}
            onClick={() => handleRotate('y')}
            title="Rotate Y axis"
            disabled={!canRotateNow}
          >
            Rot Y
          </button>
          <button
            className={`toolbar-btn ${canRotateNow ? '' : 'disabled'}`}
            onClick={() => handleRotate('z')}
            title="Rotate Z axis"
            disabled={!canRotateNow}
          >
            Rot Z
          </button>
          <span className="toolbar-sep" />
          <button
            className={`toolbar-btn delete-toolbar-btn ${selectedPartId ? '' : 'disabled'}`}
            onClick={deleteSelectedPart}
            title="Delete selected part (Delete)"
            disabled={!selectedPartId}
          >
            Delete
          </button>
        </div>

        {/* Floating hint bar shown during placement mode */}
        {selectedPartType && (
          <div className="placement-hint">
            Placing: <strong>{selectedPartType}</strong>
            {selectedPartType !== 'tube' && (
              <span className="rotation-hint"> · X/Y/Z to rotate</span>
            )}
            {selectedPartType !== 'tube' &&
             (previewQuaternion[0] !== 0 || previewQuaternion[1] !== 0 ||
              previewQuaternion[2] !== 0 || previewQuaternion[3] !== 1) && (
              <span className="rotation-active"> (rotated)</span>
            )}
            <span> · Click to place · Esc to cancel</span>
          </div>
        )}
      </div>
    </div>
  );
}
