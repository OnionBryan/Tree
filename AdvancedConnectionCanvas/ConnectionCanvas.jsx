/**
 * Connection Canvas Component
 * React wrapper around CanvasRenderer with full interaction support
 * Inspired by treeconfig.jsx patterns
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CanvasRenderer } from './utils/CanvasRenderer.js';
import { CanvasStateManager } from './utils/CanvasState.js';
import { ConnectionManager } from './utils/ConnectionManager.js';
import { NodeManager } from './utils/NodeManager.js';
import { createMouseHandlers, attachMouseHandlers } from './utils/MouseHandlers.js';
import IEEEGateRenderer from '/src/lib/tree/ieee_renderer.js';
import { FuzzyGateEvaluator } from '/src/lib/logic/fuzzyLogic.js';
import { GATE_METADATA } from './constants/gateConfig.js';
import { GRID_CONFIG } from './constants/canvasConfig.js';
import CanvasControls from './CanvasControls.jsx';
import TruthTableModal from './TruthTableModal.jsx';
import ConnectionTooltip from './ConnectionTooltip.jsx';

export const ConnectionCanvas = ({
  width = 800,
  height = 600,
  nodes = [],
  connections = [],
  onNodeMove,
  onNodeAdd,
  onConnectionCreate,
  onConnectionRemove,
  onNodeSelect,
  onPortSelect,
  onNodeEdit,
  zoom = 1,
  panX = 0,
  panY = 0,
  onViewChange,
  className = '',
  enableIEEEShapes = true,
  enableFuzzyLogic = true
}) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const stateRef = useRef(null);
  const nodeManagerRef = useRef(null);
  const connectionManagerRef = useRef(null);
  const animationRef = useRef(null);
  const ieeeRendererRef = useRef(null);
  const fuzzyEvaluatorRef = useRef(null);

  // UI Control State
  const [showGrid, setShowGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [freeDrawMode, setFreeDrawMode] = useState(false);

  // Truth Table Modal State
  const [truthTableNode, setTruthTableNode] = useState(null);

  // Tooltip State
  const [tooltipData, setTooltipData] = useState({
    visible: false,
    connection: null,
    fromNode: null,
    toNode: null,
    position: { x: 0, y: 0 }
  });

  /**
   * Initialize managers and renderer
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create managers
    stateRef.current = new CanvasStateManager({
      zoom,
      panX,
      panY,
      canvasWidth: width,
      canvasHeight: height
    });

    nodeManagerRef.current = new NodeManager();
    connectionManagerRef.current = new ConnectionManager();

    // Create IEEE renderer if enabled
    if (enableIEEEShapes) {
      ieeeRendererRef.current = new IEEEGateRenderer(canvasRef.current);
    }

    // Create fuzzy evaluator if enabled
    if (enableFuzzyLogic) {
      fuzzyEvaluatorRef.current = new FuzzyGateEvaluator();
    }

    // Create renderer
    rendererRef.current = new CanvasRenderer(canvasRef.current, {
      zoom,
      panX,
      panY,
      nodes: nodeManagerRef.current.nodes,
      connections: connectionManagerRef.current.connections
    });

    // Load initial data
    nodes.forEach(node => {
      try {
        nodeManagerRef.current.addNode(node);
      } catch (error) {
        console.error('Error adding node:', error);
      }
    });

    connections.forEach(conn => {
      try {
        connectionManagerRef.current.addConnection(conn);
      } catch (error) {
        console.error('Error adding connection:', error);
      }
    });

    // Start render loop
    const renderLoop = () => {
      if (rendererRef.current) {
        rendererRef.current.render();
      }
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  /**
   * Update canvas dimensions
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    if (stateRef.current) {
      stateRef.current.setCanvasDimensions(width, height);
    }
  }, [width, height]);

  /**
   * Sync external nodes to manager
   */
  useEffect(() => {
    if (!nodeManagerRef.current) return;

    // Clear and re-add all nodes
    const currentNodes = nodeManagerRef.current.getAllNodes();
    const currentIds = new Set(currentNodes.map(n => n.id));
    const newIds = new Set(nodes.map(n => n.id));

    // Remove deleted nodes
    currentIds.forEach(id => {
      if (!newIds.has(id)) {
        nodeManagerRef.current.removeNode(id);
      }
    });

    // Add or update nodes
    nodes.forEach(node => {
      if (currentIds.has(node.id)) {
        nodeManagerRef.current.updateNode(node.id, node);
      } else {
        nodeManagerRef.current.addNode(node);
      }
    });
  }, [nodes]);

  /**
   * Sync external connections to manager
   */
  useEffect(() => {
    if (!connectionManagerRef.current) return;

    // Clear and re-add all connections
    const currentConns = connectionManagerRef.current.getAllConnections();
    const currentIds = new Set(currentConns.map(c => c.id));
    const newIds = new Set(connections.map(c => c.id));

    // Remove deleted connections
    currentIds.forEach(id => {
      if (!newIds.has(id)) {
        connectionManagerRef.current.removeConnection(id);
      }
    });

    // Add or update connections
    connections.forEach(conn => {
      if (currentIds.has(conn.id)) {
        connectionManagerRef.current.updateConnection(conn.id, conn);
      } else {
        connectionManagerRef.current.addConnection(conn);
      }
    });
  }, [connections]);

  /**
   * Sync view changes
   */
  useEffect(() => {
    if (!rendererRef.current || !stateRef.current) return;

    rendererRef.current.setView(zoom, panX, panY);
    stateRef.current.setState({ zoom, panX, panY });
  }, [zoom, panX, panY]);

  /**
   * Handle state changes from interactions
   */
  const handleStateChange = useCallback((newState) => {
    if (!stateRef.current) return;

    stateRef.current.setState(newState);

    // Sync renderer state
    if (rendererRef.current) {
      rendererRef.current.setHoveredNode(newState.hoveredNode);
      rendererRef.current.setSelectedNode(newState.selectedNode);

      // Update temp connection during dragging
      if (newState.isConnecting && newState.connectionStart) {
        const fromNode = nodeManagerRef.current.getNode(newState.connectionStart.nodeId);
        if (fromNode && fromNode.outputs) {
          const fromPort = fromNode.outputs[newState.connectionStart.portIndex];
          if (fromPort) {
            rendererRef.current.setTempConnection(
              { x: fromPort.x, y: fromPort.y },
              { x: newState.mousePos.x, y: newState.mousePos.y }
            );
          }
        }
      } else {
        rendererRef.current.setTempConnection(null, null);
      }
    }

    // Update tooltip when connection hover changes
    if (newState.hoveredConnection) {
      const connection = connectionManagerRef.current?.getConnection(newState.hoveredConnection);
      if (connection) {
        const fromNode = nodeManagerRef.current?.getNode(connection.from);
        const toNode = nodeManagerRef.current?.getNode(connection.to);

        if (fromNode && toNode) {
          // Get screen coordinates from canvas element
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            setTooltipData({
              visible: true,
              connection,
              fromNode,
              toNode,
              position: {
                x: rect.left + newState.mousePos.x * newState.zoom + canvas.width / 2 + newState.panX,
                y: rect.top + newState.mousePos.y * newState.zoom + canvas.height / 2 + newState.panY
              }
            });
          }
        }
      }
    } else {
      setTooltipData(prev => ({ ...prev, visible: false }));
    }

    // Notify parent of view changes
    if (onViewChange && (
      newState.zoom !== zoom ||
      newState.panX !== panX ||
      newState.panY !== panY
    )) {
      onViewChange({
        zoom: newState.zoom,
        panX: newState.panX,
        panY: newState.panY
      });
    }
  }, [zoom, panX, panY, onViewChange]);

  /**
   * Handle connection creation
   */
  const handleConnectionCreate = useCallback((connection) => {
    try {
      const created = connectionManagerRef.current.addConnection(connection);
      if (onConnectionCreate) {
        onConnectionCreate(created);
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  }, [onConnectionCreate]);

  /**
   * Handle node move
   */
  const handleNodeMove = useCallback((nodeId, x, y) => {
    try {
      const updated = nodeManagerRef.current.moveNode(nodeId, x, y);
      if (onNodeMove) {
        onNodeMove(updated);
      }
    } catch (error) {
      console.error('Failed to move node:', error);
    }
  }, [onNodeMove]);

  /**
   * Handle node edit (double-click)
   * Opens truth table modal for the selected node
   */
  const handleNodeEdit = useCallback((nodeId, node) => {
    // Set node for truth table modal
    setTruthTableNode(node);

    // Also call parent callback if provided
    if (onNodeEdit) {
      onNodeEdit(nodeId, node);
    }
  }, [onNodeEdit]);

  /**
   * Handle connection delete (right-click on connection)
   */
  const handleConnectionDelete = useCallback((connectionId, connection) => {
    // Remove from ConnectionManager
    if (connectionManagerRef.current) {
      connectionManagerRef.current.removeConnection(connectionId);
    }

    // Re-render
    if (rendererRef.current) {
      rendererRef.current.render();
    }

    // Notify parent
    if (onConnectionRemove) {
      onConnectionRemove(connectionId, connection);
    }
  }, [onConnectionRemove]);

  /**
   * Handle port selection
   */
  const handlePortSelect = useCallback((nodeId, portIndex, isStart) => {
    if (onPortSelect) {
      onPortSelect(nodeId, portIndex, isStart);
    }
  }, [onPortSelect]);

  /**
   * Handle node context menu
   */
  const handleNodeContextMenu = useCallback((nodeId, node, position) => {
    // TODO: Show context menu for node operations (delete, edit, etc.)
    console.log('Node context menu:', nodeId, position);
  }, []);

  /**
   * Setup mouse handlers
   */
  useEffect(() => {
    if (!canvasRef.current || !stateRef.current) return;

    const handlers = createMouseHandlers(
      canvasRef,
      () => stateRef.current.getState(), // Pass getState function, not snapshot
      {
        nodes: nodeManagerRef.current.nodes,
        connections: connectionManagerRef.current.connections,
        onStateChange: handleStateChange,
        onConnectionCreate: handleConnectionCreate,
        onNodeMove: handleNodeMove,
        onPortSelect: handlePortSelect,
        onNodeEdit: handleNodeEdit,
        onNodeContextMenu: handleNodeContextMenu,
        onConnectionDelete: handleConnectionDelete
      }
    );

    const cleanup = attachMouseHandlers(canvasRef.current, handlers);

    return cleanup;
  }, [
    handleStateChange,
    handleConnectionCreate,
    handleNodeMove,
    handlePortSelect,
    handleNodeEdit,
    handleNodeContextMenu
  ]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!stateRef.current || !rendererRef.current) return;

      const state = stateRef.current.getState();

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (state.selectedNode) {
            nodeManagerRef.current.removeNode(state.selectedNode);
            stateRef.current.deselectNode();
          }
          break;

        case 'Escape':
          stateRef.current.deselectNode();
          stateRef.current.resetInteraction();
          break;

        case 'f':
          rendererRef.current.fitToScreen();
          const newState = stateRef.current.getState();
          if (onViewChange) {
            onViewChange({
              zoom: rendererRef.current.zoom,
              panX: rendererRef.current.panX,
              panY: rendererRef.current.panY
            });
          }
          break;

        case 'r':
          rendererRef.current.resetView();
          stateRef.current.resetZoom();
          if (onViewChange) {
            onViewChange({ zoom: 1, panX: 0, panY: 0 });
          }
          break;

        case 'z':
          if (e.metaKey || e.ctrlKey) {
            if (e.shiftKey) {
              stateRef.current.redo();
            } else {
              stateRef.current.undo();
            }
            e.preventDefault();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  /**
   * Handle drop event for dragging gates from palette
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (!canvasRef.current || !stateRef.current) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.gateType) {
        // Get canvas position
        const rect = canvasRef.current.getBoundingClientRect();
        const state = stateRef.current.getState();

        // Convert screen coordinates to canvas coordinates
        const x = (e.clientX - rect.left - state.panX) / state.zoom;
        const y = (e.clientY - rect.top - state.panY) / state.zoom;

        // Get gate metadata for proper input/output count
        const metadata = GATE_METADATA[data.gateType] || {};
        const numInputs = metadata.minInputs || 2;
        const numOutputs = metadata.outputCount || 1;

        // Create inputs
        const inputs = [];
        for (let i = 0; i < numInputs; i++) {
          inputs.push({
            id: `in_${i}`,
            type: 'input',
            index: i,
            x: x - 40,
            y: y - 10 + (i * 20),
            label: `In ${i + 1}`,
            value: null
          });
        }

        // Create outputs
        const outputs = [];
        for (let i = 0; i < numOutputs; i++) {
          outputs.push({
            id: `out_${i}`,
            type: 'output',
            index: i,
            x: x + 40,
            y: y - 10 + (i * 20),
            label: `Out ${i + 1}`,
            value: null
          });
        }

        // Create new node at drop position
        const newNode = {
          id: `node_${Date.now()}`,
          type: data.gateType,
          label: metadata.name || data.gateType.toUpperCase(),
          x: x,
          y: y,
          inputs: inputs,
          outputs: outputs,
          metadata: {
            ...metadata,
            hasParameters: metadata.hasParameters || false,
            category: metadata.category || 'logic',
            logicType: data.gateType
          }
        };

        nodeManagerRef.current.addNode(newNode);

        if (onNodeAdd) {
          onNodeAdd(newNode);
        }
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  }, [onNodeAdd]);

  /**
   * Handle drag over (required for drop to work)
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!stateRef.current) return;

    const state = stateRef.current.getState();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, state.zoom * delta));

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse position
    const newPanX = mouseX - (mouseX - state.panX) * (newZoom / state.zoom);
    const newPanY = mouseY - (mouseY - state.panY) * (newZoom / state.zoom);

    stateRef.current.setState({ zoom: newZoom, panX: newPanX, panY: newPanY });
    if (rendererRef.current) {
      rendererRef.current.setView(newZoom, newPanX, newPanY);
    }
    if (onViewChange) {
      onViewChange({ zoom: newZoom, panX: newPanX, panY: newPanY });
    }
  }, [onViewChange]);

  /**
   * Canvas control handlers
   */
  const handleZoomIn = useCallback(() => {
    if (!stateRef.current) return;
    const state = stateRef.current.getState();
    const newZoom = Math.min(state.zoom * 1.2, 5);
    stateRef.current.setState({ zoom: newZoom });
    if (rendererRef.current) {
      rendererRef.current.setView(newZoom, state.panX, state.panY);
    }
    if (onViewChange) {
      onViewChange({ zoom: newZoom, panX: state.panX, panY: state.panY });
    }
  }, [onViewChange]);

  const handleZoomOut = useCallback(() => {
    if (!stateRef.current) return;
    const state = stateRef.current.getState();
    const newZoom = Math.max(state.zoom / 1.2, 0.2);
    stateRef.current.setState({ zoom: newZoom });
    if (rendererRef.current) {
      rendererRef.current.setView(newZoom, state.panX, state.panY);
    }
    if (onViewChange) {
      onViewChange({ zoom: newZoom, panX: state.panX, panY: state.panY });
    }
  }, [onViewChange]);

  const handleFitToScreen = useCallback(() => {
    if (!rendererRef.current) return;
    rendererRef.current.fitToScreen();
    if (onViewChange) {
      onViewChange({
        zoom: rendererRef.current.zoom,
        panX: rendererRef.current.panX,
        panY: rendererRef.current.panY
      });
    }
  }, [onViewChange]);

  const handleResetView = useCallback(() => {
    if (!rendererRef.current || !stateRef.current) return;
    rendererRef.current.resetView();
    stateRef.current.setState({ zoom: 1, panX: 0, panY: 0 });
    if (onViewChange) {
      onViewChange({ zoom: 1, panX: 0, panY: 0 });
    }
  }, [onViewChange]);

  const handleToggleGrid = useCallback(() => {
    setShowGrid(prev => {
      const newValue = !prev;
      if (rendererRef.current) {
        rendererRef.current.showGrid = newValue;
      }
      return newValue;
    });
  }, []);

  const handleToggleMinimap = useCallback(() => {
    setShowMinimap(prev => !prev);
  }, []);

  const handleToggleConnectionMode = useCallback(() => {
    setConnectionMode(prev => {
      const newValue = !prev;
      if (stateRef.current) {
        stateRef.current.setEdgeDrawMode(newValue);
      }
      return newValue;
    });
  }, []);

  const handleToggleFreeDrawMode = useCallback(() => {
    setFreeDrawMode(prev => !prev);
  }, []);

  /**
   * Handle saving threshold configuration from TruthTableModal
   */
  const handleSaveThresholds = useCallback((config) => {
    const { nodeId, inputThresholds, outputThresholds } = config;

    // Find and update the node
    const nodeToUpdate = nodeManagerRef.current.nodes.get(nodeId);
    if (nodeToUpdate) {
      // Update input port thresholds/weights
      if (nodeToUpdate.inputs && inputThresholds) {
        nodeToUpdate.inputs.forEach((port, index) => {
          if (inputThresholds[index] !== undefined) {
            port.threshold = inputThresholds[index];
            port.weight = inputThresholds[index]; // Alias for ML contexts
          }
        });
      }

      // Update output port thresholds/weights
      if (nodeToUpdate.outputs && outputThresholds) {
        nodeToUpdate.outputs.forEach((port, index) => {
          if (outputThresholds[index] !== undefined) {
            port.threshold = outputThresholds[index];
            port.weight = outputThresholds[index];
          }
        });
      }

      // Re-render canvas to show updates
      if (rendererRef.current) {
        rendererRef.current.render();
      }
    }

    // Close modal
    setTruthTableNode(null);
  }, []);

  return (
    <div
      id="canvas-container"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      <CanvasControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onResetView={handleResetView}
        onToggleGrid={handleToggleGrid}
        onToggleMinimap={handleToggleMinimap}
        onToggleConnectionMode={handleToggleConnectionMode}
        onToggleFreeDrawMode={handleToggleFreeDrawMode}
        showGrid={showGrid}
        showMinimap={showMinimap}
        connectionMode={connectionMode}
        freeDrawMode={freeDrawMode}
        zoom={zoom}
      />
      <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onWheel={handleWheel}
      style={{
        display: 'block',
        cursor: 'grab',
        border: '1px solid #374151',
        borderRadius: '4px',
        background: '#1F2937'
      }}
    />

      {/* Truth Table Modal */}
      {truthTableNode && (
        <TruthTableModal
          node={truthTableNode}
          onClose={() => setTruthTableNode(null)}
          onSave={handleSaveThresholds}
        />
      )}

      {/* Connection Tooltip */}
      <ConnectionTooltip
        connection={tooltipData.connection}
        fromNode={tooltipData.fromNode}
        toNode={tooltipData.toNode}
        position={tooltipData.position}
        visible={tooltipData.visible}
      />
    </div>
  );
};

export default ConnectionCanvas;
