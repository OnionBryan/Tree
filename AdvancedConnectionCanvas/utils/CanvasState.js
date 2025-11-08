/**
 * Canvas State Manager
 * Manages canvas state for nodes, connections, and interactions
 * Inspired by patterns from treeconfig.jsx and Canvas #5
 */

/**
 * Create initial canvas state
 */
export function createInitialState() {
  return {
    // Interaction state
    isDragging: false,
    isConnecting: false,
    isPanning: false,
    edgeDrawMode: false,

    // Current drag/connection state
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    connectionStart: null, // { nodeId, portIndex }
    panStart: { x: 0, y: 0 }, // Starting pan position

    // Mouse state
    mousePos: { x: 0, y: 0 },
    hoveredNode: null,
    selectedNode: null,
    hoveredConnection: null,
    selectedConnection: null,

    // View state
    zoom: 1.0,
    panX: 0,
    panY: 0,

    // Canvas dimensions
    canvasWidth: 800,
    canvasHeight: 600
  };
}

/**
 * Canvas State Manager Class
 * Provides methods to update and query canvas state
 */
export class CanvasStateManager {
  constructor(initialState = {}) {
    this.state = {
      ...createInitialState(),
      ...initialState
    };
    this.listeners = [];
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state
   * @param {Object} updates - Partial state updates
   * @param {boolean} trackHistory - Whether to add to undo history
   */
  setState(updates, trackHistory = false) {
    const prevState = { ...this.state };
    this.state = {
      ...this.state,
      ...updates
    };

    // Track history for undo/redo
    if (trackHistory) {
      this.addToHistory(prevState);
    }

    // Notify listeners
    this.notifyListeners(this.state, prevState);
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function (newState, prevState) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners(newState, prevState) {
    this.listeners.forEach(listener => {
      try {
        listener(newState, prevState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Add state to history for undo
   */
  addToHistory(state) {
    // Remove any history after current index (when undoing then making new change)
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add to history
    this.history.push({ ...state });
    this.historyIndex++;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last change
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = { ...this.history[this.historyIndex] };
      this.notifyListeners(this.state, this.history[this.historyIndex + 1]);
      return true;
    }
    return false;
  }

  /**
   * Redo last undone change
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = { ...this.history[this.historyIndex] };
      this.notifyListeners(this.state, this.history[this.historyIndex - 1]);
      return true;
    }
    return false;
  }

  /**
   * Check if can undo
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  // ============================================================================
  // Interaction State Methods
  // ============================================================================

  /**
   * Start dragging a node
   */
  startDragging(node, mouseX, mouseY) {
    this.setState({
      isDragging: true,
      draggedNode: node,
      dragOffset: {
        x: mouseX - node.x,
        y: mouseY - node.y
      },
      mousePos: { x: mouseX, y: mouseY }
    });
  }

  /**
   * Update dragging position
   */
  updateDragging(mouseX, mouseY) {
    if (!this.state.isDragging) return;

    this.setState({
      mousePos: { x: mouseX, y: mouseY }
    });
  }

  /**
   * Stop dragging
   */
  stopDragging() {
    this.setState({
      isDragging: false,
      draggedNode: null,
      dragOffset: { x: 0, y: 0 }
    }, true); // Track in history
  }

  /**
   * Start connecting from a port
   */
  startConnecting(nodeId, portIndex, mouseX, mouseY) {
    this.setState({
      isConnecting: true,
      connectionStart: { nodeId, portIndex },
      mousePos: { x: mouseX, y: mouseY }
    });
  }

  /**
   * Update connecting position
   */
  updateConnecting(mouseX, mouseY) {
    if (!this.state.isConnecting) return;

    this.setState({
      mousePos: { x: mouseX, y: mouseY }
    });
  }

  /**
   * Stop connecting
   */
  stopConnecting() {
    this.setState({
      isConnecting: false,
      connectionStart: null
    });
  }

  /**
   * Toggle edge draw mode
   */
  toggleEdgeDrawMode() {
    this.setState({
      edgeDrawMode: !this.state.edgeDrawMode
    });
  }

  /**
   * Set edge draw mode
   */
  setEdgeDrawMode(enabled) {
    this.setState({
      edgeDrawMode: enabled
    });
  }

  // ============================================================================
  // Selection State Methods
  // ============================================================================

  /**
   * Select a node
   */
  selectNode(nodeId) {
    this.setState({
      selectedNode: nodeId
    });
  }

  /**
   * Deselect node
   */
  deselectNode() {
    this.setState({
      selectedNode: null
    });
  }

  /**
   * Set hovered node
   */
  setHoveredNode(nodeId) {
    if (this.state.hoveredNode !== nodeId) {
      this.setState({
        hoveredNode: nodeId
      });
    }
  }

  /**
   * Clear hovered node
   */
  clearHoveredNode() {
    if (this.state.hoveredNode !== null) {
      this.setState({
        hoveredNode: null
      });
    }
  }

  /**
   * Select a connection
   */
  selectConnection(connectionId) {
    this.setState({
      selectedConnection: connectionId,
      selectedNode: null // Deselect node when selecting connection
    });
  }

  /**
   * Deselect connection
   */
  deselectConnection() {
    this.setState({
      selectedConnection: null
    });
  }

  /**
   * Set hovered connection
   */
  setHoveredConnection(connectionId) {
    if (this.state.hoveredConnection !== connectionId) {
      this.setState({
        hoveredConnection: connectionId
      });
    }
  }

  /**
   * Clear hovered connection
   */
  clearHoveredConnection() {
    if (this.state.hoveredConnection !== null) {
      this.setState({
        hoveredConnection: null
      });
    }
  }

  // ============================================================================
  // View State Methods
  // ============================================================================

  /**
   * Update mouse position
   */
  updateMousePos(x, y) {
    this.setState({
      mousePos: { x, y }
    });
  }

  /**
   * Set zoom level
   */
  setZoom(zoom) {
    this.setState({
      zoom: Math.max(0.1, Math.min(5, zoom))
    });
  }

  /**
   * Zoom in
   */
  zoomIn(factor = 1.1) {
    this.setZoom(this.state.zoom * factor);
  }

  /**
   * Zoom out
   */
  zoomOut(factor = 0.9) {
    this.setZoom(this.state.zoom * factor);
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom() {
    this.setState({
      zoom: 1.0,
      panX: 0,
      panY: 0
    });
  }

  /**
   * Set pan position
   */
  setPan(x, y) {
    this.setState({
      panX: x,
      panY: y
    });
  }

  /**
   * Update pan by delta
   */
  updatePan(dx, dy) {
    this.setState({
      panX: this.state.panX + dx,
      panY: this.state.panY + dy
    });
  }

  /**
   * Set canvas dimensions
   */
  setCanvasDimensions(width, height) {
    this.setState({
      canvasWidth: width,
      canvasHeight: height
    });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Transform screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    const { zoom, panX, panY, canvasWidth, canvasHeight } = this.state;
    return {
      x: (screenX - canvasWidth / 2 - panX) / zoom,
      y: (screenY - canvasHeight / 2 - panY) / zoom
    };
  }

  /**
   * Transform world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    const { zoom, panX, panY, canvasWidth, canvasHeight } = this.state;
    return {
      x: worldX * zoom + canvasWidth / 2 + panX,
      y: worldY * zoom + canvasHeight / 2 + panY
    };
  }

  /**
   * Check if currently interacting
   */
  isInteracting() {
    return this.state.isDragging || this.state.isConnecting;
  }

  /**
   * Reset all interaction state
   */
  resetInteraction() {
    this.setState({
      isDragging: false,
      isConnecting: false,
      isPanning: false,
      draggedNode: null,
      connectionStart: null,
      dragOffset: { x: 0, y: 0 },
      panStart: { x: 0, y: 0 }
    });
  }

  /**
   * Clear all state
   */
  clear() {
    this.state = createInitialState();
    this.history = [];
    this.historyIndex = -1;
    this.notifyListeners(this.state, {});
  }

  /**
   * Export state to JSON
   */
  toJSON() {
    return {
      ...this.state,
      // Exclude non-serializable fields
      draggedNode: null,
      connectionStart: null
    };
  }

  /**
   * Import state from JSON
   */
  fromJSON(json) {
    this.setState({
      ...createInitialState(),
      ...json,
      draggedNode: null,
      connectionStart: null
    }, true);
  }
}

/**
 * Create a new canvas state manager
 */
export function createCanvasState(initialState) {
  return new CanvasStateManager(initialState);
}
