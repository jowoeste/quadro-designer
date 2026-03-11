// src/App.tsx
// Root component — lays out the sidebar and 3D canvas, handles global keyboard shortcuts.
//
// Layout: flexbox row — fixed-width sidebar on the left, canvas fills remaining space.
// Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Delete, Escape) are attached to `window`
// so they work regardless of which element has focus.

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

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on Mac

      if (ctrl && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();
        redo();
      } else if (ctrl && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if a part is selected (not when typing in an input)
        if (selectedPartId) {
          e.preventDefault();
          deleteSelectedPart();
        }
      } else if (e.key === 'Escape') {
        if (selectedPartType) {
          selectPartType(null);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteSelectedPart, selectedPartId, selectPartType, selectedPartType]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="canvas-container">
        <Scene />
        {/* Floating hint bar shown during placement mode */}
        {selectedPartType && (
          <div className="placement-hint">
            Placing: <strong>{selectedPartType}</strong> — Click to place · Esc to cancel
          </div>
        )}
      </div>
    </div>
  );
}
