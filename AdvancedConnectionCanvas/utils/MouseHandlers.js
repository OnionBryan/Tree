/**
 * Mouse Event Handlers for Canvas
 * All mouse interaction logic for dragging, connecting, and selecting
 * Extracted from Canvas #5 (tree-builder.html initializeConnectionCanvas)
 */

import { isPointInNode, isPointNearPort, isPointNearConnection } from './DrawingUtils.js';

/**
 * Transform screen coordinates to world coordinates
 * Accounts for pan and zoom
 */
function screenToWorld(screenX, screenY, canvasWidth, canvasHeight, zoom, panX, panY) {
  return {
    x: (screenX - canvasWidth / 2 - panX) / zoom,
    y: (screenY - canvasHeight / 2 - panY) / zoom
  };
}

/**
 * Create mouse handlers for a canvas
 * Returns object with all handler functions
 */
export function createMouseHandlers(canvasRef, getState, callbacks) {
  const {
    nodes,
    connections,
    onStateChange,
    onConnectionCreate,
    onNodeMove,
    onPortSelect,
    onConnectionDelete
  } = callbacks;

  /**
   * Mouse down handler
   * Detects clicks on nodes, ports, or canvas
   */
  function handleMouseDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = getState(); // Get fresh state
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Transform to world coordinates for hit detection
    const world = screenToWorld(screenX, screenY, canvas.width, canvas.height, state.zoom, state.panX, state.panY);
    const worldX = world.x;
    const worldY = world.y;

    // If a node is selected, only allow dragging that specific node
    if (state.selectedNode) {
      const selectedNodeEntry = Array.from(nodes).find(([id]) => id === state.selectedNode);
      if (selectedNodeEntry) {
        const [nodeId, node] = selectedNodeEntry;
        if (isPointInNode(worldX, worldY, node)) {
          // Start dragging the selected node
          onStateChange({
            ...state,
            isDragging: true,
            draggedNode: node,
            dragOffset: { x: worldX - node.x, y: worldY - node.y },
            mousePos: { x: worldX, y: worldY }
          });
          return;
        }
      }

      // Clicked outside selected node - deselect
      onStateChange({
        ...state,
        selectedNode: null,
        selectedConnection: null,
        mousePos: { x: worldX, y: worldY }
      });
      return;
    }

    // Check if clicking on a node (normal mode - no selection)
    for (const [nodeId, node] of nodes) {
      if (isPointInNode(worldX, worldY, node)) {
        // Check if clicking on an output port to start connection
        if (node.outputs) {
          for (let i = 0; i < node.outputs.length; i++) {
            const port = node.outputs[i];
            if (isPointNearPort(worldX, worldY, port)) {
              // Start connection from this port
              onStateChange({
                ...state,
                isConnecting: true,
                connectionStart: { nodeId, portIndex: i },
                mousePos: { x: worldX, y: worldY }
              });

              if (onPortSelect) {
                onPortSelect(nodeId, i, true); // true = start port
              }
              return;
            }
          }
        }

        // Check if clicking on an input port
        if (node.inputs) {
          for (let i = 0; i < node.inputs.length; i++) {
            const port = node.inputs[i];
            if (isPointNearPort(worldX, worldY, port)) {
              if (onPortSelect) {
                onPortSelect(nodeId, i, false); // false = end port
              }
              return;
            }
          }
        }

        // Otherwise start dragging the node
        onStateChange({
          ...state,
          isDragging: true,
          draggedNode: node,
          dragOffset: { x: worldX - node.x, y: worldY - node.y },
          mousePos: { x: worldX, y: worldY },
          selectedConnection: null // Deselect connection when dragging node
        });
        return;
      }
    }

    // Check if clicking on a connection
    for (const [connId, conn] of connections) {
      const fromNode = nodes.get(conn.from);
      const toNode = nodes.get(conn.to);

      if (fromNode && toNode) {
        const fromPort = fromNode.outputs?.[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
        const toPort = toNode.inputs?.[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

        if (isPointNearConnection(worldX, worldY, fromPort, toPort)) {
          // Select this connection
          onStateChange({
            ...state,
            selectedConnection: connId,
            selectedNode: null, // Deselect nodes
            mousePos: { x: worldX, y: worldY }
          });

          // Trigger connection select callback if provided
          if (callbacks.onConnectionSelect) {
            callbacks.onConnectionSelect(connId, conn);
          }
          return;
        }
      }
    }

    // Clicked on empty canvas - start panning (only if no node selected)
    // Use screen coordinates for panning
    onStateChange({
      ...state,
      isPanning: true,
      panStart: { x: screenX - state.panX, y: screenY - state.panY },
      mousePos: { x: worldX, y: worldY },
      selectedConnection: null // Deselect connection when clicking empty canvas
    });
  }

  /**
   * Mouse move handler
   * Updates dragging and connection preview
   */
  function handleMouseMove(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = getState(); // Get fresh state
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Transform to world coordinates
    const world = screenToWorld(screenX, screenY, canvas.width, canvas.height, state.zoom, state.panX, state.panY);
    const worldX = world.x;
    const worldY = world.y;

    // Update mouse position (use world coordinates)
    const newState = {
      ...state,
      mousePos: { x: worldX, y: worldY }
    };

    // Handle canvas panning (disabled when node is selected)
    // Use screen coordinates for panning
    if (state.isPanning && !state.selectedNode) {
      newState.panX = screenX - state.panStart.x;
      newState.panY = screenY - state.panStart.y;
      canvas.style.cursor = 'grabbing';
      onStateChange(newState);
      return;
    }

    // Handle node dragging (use world coordinates)
    if (state.isDragging && state.draggedNode) {
      const node = state.draggedNode;
      const newX = worldX - state.dragOffset.x;
      const newY = worldY - state.dragOffset.y;

      // Update node position
      node.x = newX;
      node.y = newY;

      // Update port positions
      if (node.inputs) {
        node.inputs = node.inputs.map((port, i) => ({
          ...port,
          x: newX - 40,
          y: newY - 10 + (i * 20)
        }));
      }

      if (node.outputs) {
        node.outputs = node.outputs.map((port, i) => ({
          ...port,
          x: newX + 40,
          y: newY - 10 + (i * 20)
        }));
      }

      if (onNodeMove) {
        onNodeMove(node.id, newX, newY);
      }

      newState.draggedNode = node;
    }

    // Handle connection drawing
    if (state.isConnecting) {
      // Just update mouse position for visual feedback
      // Drawing will happen in render loop
    }

    // Update cursor based on hover state
    let isHovering = false;
    let hoveredConnectionId = null;

    // Check if hovering over a node first
    for (const [nodeId, node] of nodes) {
      if (isPointInNode(worldX, worldY, node)) {
        canvas.style.cursor = 'pointer';
        isHovering = true;
        break;
      }
    }

    // If not hovering over node, check connections
    if (!isHovering && !state.isDragging && !state.isConnecting) {
      for (const [connId, conn] of connections) {
        const fromNode = nodes.get(conn.from);
        const toNode = nodes.get(conn.to);

        if (fromNode && toNode) {
          const fromPort = fromNode.outputs?.[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
          const toPort = toNode.inputs?.[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

          if (isPointNearConnection(worldX, worldY, fromPort, toPort)) {
            canvas.style.cursor = 'pointer';
            hoveredConnectionId = connId;
            isHovering = true;
            break;
          }
        }
      }
    }

    // Update hovered connection in state
    if (hoveredConnectionId !== state.hoveredConnection) {
      newState.hoveredConnection = hoveredConnectionId;
    }

    if (!isHovering) {
      canvas.style.cursor = state.isDragging ? 'grabbing' :
                            state.isConnecting ? 'crosshair' :
                            state.isPanning ? 'grabbing' :
                            'grab';
    }

    onStateChange(newState);
  }

  /**
   * Mouse up handler
   * Completes connections and stops dragging
   */
  function handleMouseUp(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = getState(); // Get fresh state
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Transform to world coordinates
    const world = screenToWorld(screenX, screenY, canvas.width, canvas.height, state.zoom, state.panX, state.panY);
    const worldX = world.x;
    const worldY = world.y;

    // Stop panning
    if (state.isPanning) {
      onStateChange({
        ...state,
        isPanning: false,
        panStart: { x: 0, y: 0 },
        mousePos: { x: worldX, y: worldY }
      });
      return;
    }

    // Complete connection if in connecting mode
    if (state.isConnecting && state.connectionStart) {
      // Check if releasing on an input port (use world coordinates)
      for (const [targetNodeId, targetNode] of nodes) {
        if (targetNodeId !== state.connectionStart.nodeId && targetNode.inputs) {
          for (let portIndex = 0; portIndex < targetNode.inputs.length; portIndex++) {
            const port = targetNode.inputs[portIndex];
            if (isPointNearPort(worldX, worldY, port)) {
              // Create connection
              const newConnection = {
                id: `conn_${Date.now()}_${Math.random()}`,
                from: state.connectionStart.nodeId,
                to: targetNodeId,
                fromPort: state.connectionStart.portIndex,
                toPort: portIndex,
                threshold: null // Can be set later
              };

              if (onConnectionCreate) {
                onConnectionCreate(newConnection);
              }

              // Reset state
              onStateChange({
                ...state,
                isConnecting: false,
                isDragging: false,
                connectionStart: null,
                draggedNode: null,
                mousePos: { x: worldX, y: worldY }
              });
              return;
            }
          }
        }
      }

      // Failed to connect - reset
      onStateChange({
        ...state,
        isConnecting: false,
        connectionStart: null,
        mousePos: { x: worldX, y: worldY }
      });
      return;
    }

    // Stop dragging
    if (state.isDragging) {
      onStateChange({
        ...state,
        isDragging: false,
        draggedNode: null,
        mousePos: { x: worldX, y: worldY }
      });
      return;
    }

    // Regular click - just update position
    onStateChange({
      ...state,
      mousePos: { x: worldX, y: worldY }
    });
  }

  /**
   * Mouse leave handler
   * Cancel operations when mouse leaves canvas
   */
  function handleMouseLeave(event) {
    const state = getState(); // Get fresh state

    // Don't cancel dragging - user might drag back
    // Only cancel if they haven't started yet
    if (!state.isDragging && !state.isConnecting && !state.isPanning) {
      return;
    }

    // If panning, stop panning
    if (state.isPanning) {
      onStateChange({
        ...state,
        isPanning: false,
        panStart: { x: 0, y: 0 }
      });
    }

    // If connecting, cancel the connection
    if (state.isConnecting) {
      onStateChange({
        ...state,
        isConnecting: false,
        connectionStart: null
      });
    }
  }

  /**
   * Double click handler
   * Selects node for exclusive dragging
   */
  function handleDoubleClick(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = getState();
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Transform to world coordinates
    const world = screenToWorld(screenX, screenY, canvas.width, canvas.height, state.zoom, state.panX, state.panY);
    const worldX = world.x;
    const worldY = world.y;

    // Check if double-clicking on a node
    for (const [nodeId, node] of nodes) {
      if (isPointInNode(worldX, worldY, node)) {
        // Select this node (disables canvas panning, enables exclusive dragging)
        onStateChange({
          ...state,
          selectedNode: nodeId,
          hoveredNode: nodeId,
          mousePos: { x: worldX, y: worldY }
        });

        // Also trigger edit callback if provided
        if (callbacks.onNodeEdit) {
          callbacks.onNodeEdit(nodeId, node);
        }
        return;
      }
    }

    // Double-click on empty canvas - no action
  }

  /**
   * Context menu handler (right-click)
   * Shows contextual menu for nodes/connections
   */
  function handleContextMenu(event) {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = getState();
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Transform to world coordinates
    const world = screenToWorld(screenX, screenY, canvas.width, canvas.height, state.zoom, state.panX, state.panY);
    const worldX = world.x;
    const worldY = world.y;

    // Check what was right-clicked
    // 1. Check nodes first
    for (const [nodeId, node] of nodes) {
      if (isPointInNode(worldX, worldY, node)) {
        if (callbacks.onNodeContextMenu) {
          callbacks.onNodeContextMenu(nodeId, node, { x: event.clientX, y: event.clientY });
        }
        return;
      }
    }

    // 2. Check connections
    for (const [connId, conn] of connections) {
      const fromNode = nodes.get(conn.from);
      const toNode = nodes.get(conn.to);

      if (fromNode && toNode) {
        const fromPort = fromNode.outputs?.[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
        const toPort = toNode.inputs?.[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

        if (isPointNearConnection(worldX, worldY, fromPort, toPort)) {
          // Show confirmation and delete connection
          if (onConnectionDelete && window.confirm('Delete this connection?')) {
            onConnectionDelete(connId, conn);
          }
          return;
        }
      }
    }

    // 3. Right-clicked on canvas
    if (callbacks.onCanvasContextMenu) {
      callbacks.onCanvasContextMenu({ x: event.clientX, y: event.clientY });
    }
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleDoubleClick,
    handleContextMenu
  };
}

/**
 * Attach mouse handlers to canvas element
 */
export function attachMouseHandlers(canvas, handlers) {
  if (!canvas) return () => {};

  canvas.addEventListener('mousedown', handlers.handleMouseDown);
  canvas.addEventListener('mousemove', handlers.handleMouseMove);
  canvas.addEventListener('mouseup', handlers.handleMouseUp);
  canvas.addEventListener('mouseleave', handlers.handleMouseLeave);
  canvas.addEventListener('dblclick', handlers.handleDoubleClick);
  canvas.addEventListener('contextmenu', handlers.handleContextMenu);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('mousedown', handlers.handleMouseDown);
    canvas.removeEventListener('mousemove', handlers.handleMouseMove);
    canvas.removeEventListener('mouseup', handlers.handleMouseUp);
    canvas.removeEventListener('mouseleave', handlers.handleMouseLeave);
    canvas.removeEventListener('dblclick', handlers.handleDoubleClick);
    canvas.removeEventListener('contextmenu', handlers.handleContextMenu);
  };
}
