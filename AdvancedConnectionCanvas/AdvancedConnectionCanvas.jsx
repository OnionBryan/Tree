/**
 * Advanced Connection Canvas - Main Component
 * Complete canvas system for building complex node connections with logic gates
 * Replaces Canvas #5 from tree-builder.html with clean React architecture
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConnectionCanvas from './ConnectionCanvas.jsx';
import GatePalette from './GatePalette.jsx';
import ConnectionBuilderWizard from './ConnectionBuilderWizard.jsx';
import PortSelectorPopup from './PortSelectorPopup.jsx';
import ThresholdInputPopup from './ThresholdInputPopup.jsx';
import ConnectionEditorModal from './ConnectionEditorModal.jsx';
import { SignalFlowEngine } from './engine/SignalFlowEngine.js';
import { LoopDetector } from './engine/LoopDetector.js';
import { advancedLogicManager } from './utils/AdvancedLogicManager.js';
import { gateInsertionManager } from './utils/GateInsertionManager.js';

const PHI = 1.618;

export const AdvancedConnectionCanvas = ({
  width = 1000,
  height = 700,
  initialNodes = [],
  initialConnections = [],
  onNodesChange,
  onConnectionsChange,
  onClose,
  className = ''
}) => {
  // State
  const [nodes, setNodes] = useState(initialNodes);
  const [connections, setConnections] = useState(initialConnections);
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });

  // UI State
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showPortSelector, setShowPortSelector] = useState(false);
  const [showThresholdInput, setShowThresholdInput] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Modal/Popup Data
  const [wizardData, setWizardData] = useState({});
  const [portSelectorData, setPortSelectorData] = useState({});
  const [thresholdData, setThresholdData] = useState({});
  const [editorConnection, setEditorConnection] = useState(null);

  // Engines
  const signalFlowRef = useRef(null);
  const loopDetectorRef = useRef(null);

  /**
   * Initialize engines
   */
  React.useEffect(() => {
    signalFlowRef.current = new SignalFlowEngine(nodes, connections);
    loopDetectorRef.current = new LoopDetector(nodes, connections);
  }, [nodes, connections]);

  /**
   * Handle connection create
   */
  const handleConnectionCreate = useCallback((connection) => {
    const updated = [...connections, connection];
    setConnections(updated);
    if (onConnectionsChange) onConnectionsChange(updated);
  }, [connections, onConnectionsChange]);

  /**
   * Initialize managers and subscribe to events
   */
  useEffect(() => {
    // Subscribe to advanced logic manager events
    const unsubLogic = advancedLogicManager.subscribe((event, data) => {
      console.log('[AdvancedLogic Event]', event, data);
      // Handle specific events if needed
    });

    // Subscribe to gate insertion manager events
    const unsubGate = gateInsertionManager.subscribe((event, data) => {
      console.log('[GateInsertion Event]', event, data);

      // Handle gate created events
      if (event === 'gateCreated' && data.node) {
        const updated = [...nodes, data.node];
        setNodes(updated);
        if (onNodesChange) onNodesChange(updated);
      }

      // Handle connection events
      if (event === 'nodesConnected') {
        const newConn = {
          id: `conn_${Date.now()}`,
          from: data.sourceId,
          to: data.targetId,
          fromPort: data.branchIndex || 0,
          toPort: 0
        };
        handleConnectionCreate(newConn);
      }
    });

    return () => {
      unsubLogic();
      unsubGate();
    };
  }, [nodes, onNodesChange, handleConnectionCreate]);

  /**
   * Handle gate drag start from palette
   */
  const handleGateDragStart = useCallback((gateType) => {
    console.log('Gate drag started:', gateType);
  }, []);

  /**
   * Clear canvas
   */
  const handleClearCanvas = useCallback(() => {
    if (window.confirm('Clear all nodes and connections?')) {
      setNodes([]);
      setConnections([]);
      if (onNodesChange) onNodesChange([]);
      if (onConnectionsChange) onConnectionsChange([]);
    }
  }, [onNodesChange, onConnectionsChange]);

  /**
   * Export canvas to JSON file
   */
  const handleExportFile = useCallback(() => {
    const exportData = {
      nodes: nodes,
      connections: connections,
      view: view,
      version: '1.0',
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logic-canvas-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, connections, view]);

  /**
   * Export to main canvas (LogicBuilder)
   */
  const handleExportToCanvas = useCallback(() => {
    const exportData = {
      nodes: nodes,
      connections: connections,
      view: view,
      timestamp: new Date().toISOString()
    };

    console.log('Exporting to main canvas:', exportData);

    // Try to import via logicStore
    if (window.logicStore && window.logicStore.importFromCanvas) {
      window.logicStore.importFromCanvas(exportData);
      alert('Exported to main Logic Builder canvas!');
    } else {
      console.error('logicStore not available on window');
      alert('Error: Main canvas not available. Make sure Logic Builder is open.');
    }
  }, [nodes, connections, view]);

  /**
   * Handle gate click from palette
   */
  const handleGateClick = useCallback((gateType) => {
    // Add gate at center of canvas
    const newNode = {
      id: `node_${Date.now()}`,
      type: gateType,
      label: gateType.toUpperCase(),
      x: 0,
      y: 0,
      inputs: [{ id: 'in_0', type: 'input', index: 0, x: 0, y: 0, label: 'In 1', value: null }],
      outputs: [{ id: 'out_0', type: 'output', index: 0, x: 0, y: 0, label: 'Out 1', value: null }]
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    if (onNodesChange) onNodesChange(updated);
  }, [nodes, onNodesChange]);

  /**
   * Handle node add (from drag-drop)
   */
  const handleNodeAdd = useCallback((node) => {
    const updated = [...nodes, node];
    setNodes(updated);
    if (onNodesChange) onNodesChange(updated);
  }, [nodes, onNodesChange]);

  /**
   * Handle node move
   */
  const handleNodeMove = useCallback((nodeIdOrNode, x, y) => {
    // Support both (nodeId, x, y) and (node) signatures
    let updated;
    if (typeof nodeIdOrNode === 'string' && x !== undefined && y !== undefined) {
      // Called with (nodeId, x, y)
      updated = nodes.map(n => n.id === nodeIdOrNode ? { ...n, x, y } : n);
    } else {
      // Called with (node)
      const node = nodeIdOrNode;
      updated = nodes.map(n => n.id === node.id ? node : n);
    }
    setNodes(updated);
    if (onNodesChange) onNodesChange(updated);
  }, [nodes, onNodesChange]);

  /**
   * Handle connection remove
   */
  const handleConnectionRemove = useCallback((connectionId) => {
    const updated = connections.filter(c => c.id !== connectionId);
    setConnections(updated);
    if (onConnectionsChange) onConnectionsChange(updated);
  }, [connections, onConnectionsChange]);

  /**
   * Handle connection update
   */
  const handleConnectionUpdate = useCallback((connection) => {
    const updated = connections.map(c => c.id === connection.id ? connection : c);
    setConnections(updated);
    if (onConnectionsChange) onConnectionsChange(updated);
  }, [connections, onConnectionsChange]);

  /**
   * Handle port selection
   */
  const handlePortSelect = useCallback((nodeId, portIndex, isStart) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setPortSelectorData({
      node,
      portType: isStart ? 'output' : 'input',
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    });
    setShowPortSelector(true);
  }, [nodes]);

  /**
   * Handle node edit
   */
  const handleNodeEdit = useCallback((nodeId, node) => {
    // TODO: Open node properties editor
    console.log('Edit node:', nodeId, node);
  }, []);

  /**
   * Handle view change
   */
  const handleViewChange = useCallback((newView) => {
    setView(newView);
  }, []);

  /**
   * Open connection wizard
   */
  const openWizard = useCallback((initialData = {}) => {
    setWizardData(initialData);
    setShowWizard(true);
  }, []);

  /**
   * Open connection editor
   */
  const openEditor = useCallback((connection) => {
    setEditorConnection(connection);
    setShowEditor(true);
  }, []);

  /**
   * Execute signal flow
   */
  const executeSignalFlow = useCallback((startNodeId, initialInput = {}) => {
    if (!signalFlowRef.current) return;

    try {
      const result = signalFlowRef.current.executeFlow(startNodeId, initialInput);
      console.log('Signal flow result:', result);
      return result;
    } catch (error) {
      console.error('Signal flow error:', error);
      return null;
    }
  }, []);

  /**
   * Detect loops
   */
  const detectLoops = useCallback(() => {
    if (!loopDetectorRef.current) return [];

    const loops = loopDetectorRef.current.detectAllLoops();
    console.log('Detected loops:', loops);
    return loops;
  }, []);

  /**
   * Fit to screen
   */
  const fitToScreen = useCallback(() => {
    // Trigger fit via ConnectionCanvas
    // Implementation depends on exposing method from child
  }, []);

  return (
    <div className={`advanced-connection-canvas ${className}`}>
      {/* Header */}
      <div className="canvas-header">
        <h2>Advanced Connection Editor</h2>
        <div className="header-controls">
          <button onClick={() => openWizard()} className="btn btn-primary" title="New Connection">
            + Connection
          </button>
          <button
            onClick={() => gateInsertionManager.showGateSelector((gateType, params) => {
              if (gateType) {
                const node = {
                  id: `gate_${Date.now()}`,
                  type: gateType,
                  label: gateType.toUpperCase(),
                  x: 0,
                  y: 0,
                  ...params
                };
                const updated = [...nodes, node];
                setNodes(updated);
                if (onNodesChange) onNodesChange(updated);
              }
            })}
            className="btn btn-primary"
            title="Insert Gate"
          >
            ⚡ Insert Gate
          </button>
          <button
            onClick={() => {
              const selected = nodes[0]; // Get first node for demo
              if (selected) {
                advancedLogicManager.openAdvancedLogicPopup(selected.id);
              }
            }}
            className="btn btn-secondary"
            title="Advanced Logic"
          >
            🔧 Logic
          </button>
          <button onClick={() => detectLoops()} className="btn btn-secondary" title="Detect Loops">
            🔍 Loops
          </button>
          <button
            onClick={() => {
              if (gateInsertionManager.executeSignalFlow) {
                gateInsertionManager.executeSignalFlow();
              }
            }}
            className="btn btn-secondary"
            title="Execute Signal Flow"
          >
            ▶ Execute
          </button>
          <button
            onClick={handleExportToCanvas}
            className="btn btn-primary"
            title="Export to Main Canvas"
          >
            ⬆ To Canvas
          </button>
          <button
            onClick={handleExportFile}
            className="btn btn-secondary"
            title="Export to JSON file"
          >
            💾 Save File
          </button>
          <button
            onClick={handleClearCanvas}
            className="btn btn-secondary"
            title="Clear Canvas"
          >
            🗑️ Clear
          </button>
          <button onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })} className="btn btn-secondary" title="Reset View">
            ↺ Reset View
          </button>
          {onClose && (
            <button onClick={onClose} className="btn btn-close" title="Close">×</button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="canvas-main">
        {/* Gate Palette */}
        <GatePalette
          isOpen={isPaletteOpen}
          onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
          onGateDragStart={handleGateDragStart}
          onGateClick={handleGateClick}
        />

        {/* Canvas */}
        <div className="canvas-container">
          <ConnectionCanvas
            width={width}
            height={height}
            nodes={nodes}
            connections={connections}
            onNodeMove={handleNodeMove}
            onNodeAdd={handleNodeAdd}
            onConnectionCreate={handleConnectionCreate}
            onConnectionRemove={handleConnectionRemove}
            onNodeSelect={(nodeId) => console.log('Node selected:', nodeId)}
            onPortSelect={handlePortSelect}
            onNodeEdit={handleNodeEdit}
            zoom={view.zoom}
            panX={view.panX}
            panY={view.panY}
            onViewChange={handleViewChange}
          />

          {/* Stats Overlay */}
          <div className="stats-overlay">
            <div className="stat">
              <span className="stat-label">Nodes:</span>
              <span className="stat-value">{nodes.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Connections:</span>
              <span className="stat-value">{connections.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Zoom:</span>
              <span className="stat-value">{(view.zoom * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals and Popups */}
      <ConnectionBuilderWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        nodes={nodes}
        onCreateConnection={(conn) => {
          handleConnectionCreate(conn);
          setShowWizard(false);
        }}
        initialData={wizardData}
      />

      <PortSelectorPopup
        isOpen={showPortSelector}
        position={portSelectorData.position}
        node={portSelectorData.node}
        portType={portSelectorData.portType}
        onSelectPort={(portIndex) => {
          console.log('Port selected:', portIndex);
          setShowPortSelector(false);
        }}
        onClose={() => setShowPortSelector(false)}
      />

      <ThresholdInputPopup
        isOpen={showThresholdInput}
        position={thresholdData.position}
        initialValue={thresholdData.initialValue}
        connectionInfo={thresholdData.connectionInfo}
        onSubmit={(threshold) => {
          console.log('Threshold set:', threshold);
          setShowThresholdInput(false);
        }}
        onClose={() => setShowThresholdInput(false)}
      />

      <ConnectionEditorModal
        isOpen={showEditor}
        connection={editorConnection}
        nodes={nodes}
        onSave={handleConnectionUpdate}
        onDelete={handleConnectionRemove}
        onClose={() => setShowEditor(false)}
      />

      <style jsx>{`
        .advanced-connection-canvas {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #111827;
        }

        .canvas-header {
          padding: ${16 / PHI}px 16px;
          background: #1F2937;
          border-bottom: 2px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .canvas-header h2 {
          margin: 0;
          color: #F9FAFB;
          font-size: 18px;
          font-weight: 600;
        }

        .header-controls {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: ${8 / PHI}px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #6366F1;
          border: none;
          color: #FFFFFF;
        }

        .btn-primary:hover {
          background: #4F46E5;
        }

        .btn-secondary {
          background: #374151;
          border: 1px solid #4B5563;
          color: #D1D5DB;
        }

        .btn-secondary:hover {
          background: #4B5563;
          color: #F9FAFB;
        }

        .btn-close {
          background: none;
          border: 1px solid #EF4444;
          color: #EF4444;
          font-size: 20px;
          width: 32px;
          height: 32px;
          padding: 0;
          line-height: 1;
        }

        .btn-close:hover {
          background: #EF4444;
          color: #FFFFFF;
        }

        .canvas-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .stats-overlay {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(31, 41, 55, 0.9);
          border: 1px solid #374151;
          border-radius: 6px;
          padding: ${10 / PHI}px 12px;
          display: flex;
          gap: 16px;
          backdrop-filter: blur(8px);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: #9CA3AF;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: #F9FAFB;
          font-family: monospace;
        }

        /* Fuzzy Logic Panel */
        .fuzzy-logic-panel {
          position: absolute;
          top: 70px;
          right: 16px;
          width: 300px;
          background: rgba(31, 41, 55, 0.95);
          border: 1px solid #374151;
          border-radius: 8px;
          padding: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #374151;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #F9FAFB;
        }

        .btn-close-panel {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-close-panel:hover {
          color: #EF4444;
        }

        .panel-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-group label {
          font-size: 12px;
          font-weight: 500;
          color: #D1D5DB;
        }

        .fuzzy-select {
          padding: 8px 12px;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 4px;
          color: #F9FAFB;
          font-size: 13px;
          cursor: pointer;
        }

        .fuzzy-select:focus {
          outline: none;
          border-color: #6366F1;
        }

        .fuzzy-slider {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #374151;
          outline: none;
          -webkit-appearance: none;
        }

        .fuzzy-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
        }

        .fuzzy-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: none;
        }

        .threshold-value {
          font-size: 12px;
          font-family: monospace;
          color: #9CA3AF;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AdvancedConnectionCanvas;
