/**
 * Canvas Controls Component
 * Toolbar for canvas zoom, view, grid, and mode controls
 * Ported from tree-builder.html control panel
 */

import React, { useState } from 'react';
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiGrid,
  FiMap,
  FiGitBranch,
  FiEdit3
} from 'react-icons/fi';

export const CanvasControls = ({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
  onToggleGrid,
  onToggleMinimap,
  onToggleConnectionMode,
  onToggleFreeDrawMode,
  showGrid = true,
  showMinimap = false,
  connectionMode = false,
  freeDrawMode = false,
  zoom = 1.0,
  canEnterFullscreen = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Toggle fullscreen mode
   */
  const handleFullscreen = () => {
    const container = document.getElementById('canvas-container') || document.documentElement;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  /**
   * Button component for consistency
   */
  const ControlButton = ({
    onClick,
    icon: Icon,
    label,
    active = false,
    disabled = false
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        canvas-control-btn
        ${active ? 'active' : ''}
        ${disabled ? 'disabled' : ''}
      `}
      style={{
        padding: '8px 12px',
        margin: '0 4px',
        border: 'none',
        borderRadius: '4px',
        background: active ? '#3B82F6' : '#374151',
        color: '#F9FAFB',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = '#4B5563';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#374151';
        }
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  return (
    <div
      className="canvas-controls-toolbar"
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: '#1F2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Zoom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ControlButton
          onClick={onZoomIn}
          icon={FiZoomIn}
          label="Zoom In"
        />
        <ControlButton
          onClick={onZoomOut}
          icon={FiZoomOut}
          label="Zoom Out"
        />
        <span
          style={{
            color: '#9CA3AF',
            fontSize: '12px',
            marginLeft: '4px',
            minWidth: '50px',
            textAlign: 'center'
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* View Controls */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <ControlButton
          onClick={onFitToScreen}
          icon={FiMaximize}
          label="Fit to Screen"
        />
        <ControlButton
          onClick={onResetView}
          icon={FiMaximize}
          label="Reset View"
        />
      </div>

      {/* Display Controls */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <ControlButton
          onClick={onToggleGrid}
          icon={FiGrid}
          label="Toggle Grid"
          active={showGrid}
        />
        <ControlButton
          onClick={onToggleMinimap}
          icon={FiMap}
          label="Minimap"
          active={showMinimap}
        />
      </div>

      {/* Mode Controls */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <ControlButton
          onClick={onToggleConnectionMode}
          icon={FiGitBranch}
          label="Connection Mode"
          active={connectionMode}
        />
        <ControlButton
          onClick={onToggleFreeDrawMode}
          icon={FiEdit3}
          label="Free Draw"
          active={freeDrawMode}
        />
      </div>

      {/* Fullscreen Control */}
      {canEnterFullscreen && (
        <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid #374151', paddingTop: '8px' }}>
          <ControlButton
            onClick={handleFullscreen}
            icon={FiMaximize}
            label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            active={isFullscreen}
          />
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div
        style={{
          fontSize: '11px',
          color: '#6B7280',
          borderTop: '1px solid #374151',
          paddingTop: '8px',
          maxWidth: '200px'
        }}
      >
        <div><kbd>F</kbd> - Fit to Screen</div>
        <div><kbd>R</kbd> - Reset View</div>
        <div><kbd>Del</kbd> - Delete Selected</div>
        <div><kbd>Esc</kbd> - Cancel</div>
        <div><kbd>⌘Z</kbd> - Undo</div>
      </div>
    </div>
  );
};

export default CanvasControls;
