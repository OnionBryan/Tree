/**
 * Gate Insertion Manager
 * Wraps all functions from gateInsert.jsx in a clean React-friendly API
 *
 * This manager provides a singleton interface to all gate insertion functions
 * extracted from tree-builder.html, including:
 * - Gate insertion (before/after nodes)
 * - Connection management
 * - Pattern creation (diamond, star, feedback)
 * - Canvas initialization & drawing
 * - Drag & drop
 * - Signal flow execution
 *
 * NOTE: gateInsert.jsx functions are accessed via window globals since the file
 * has duplicate declarations and can't be imported as ES module
 */

// Functions are available on window after gateInsert.jsx is loaded in tree-builder.html
const getGateInsertFunction = (name) => {
  if (typeof window !== 'undefined' && typeof window[name] === 'function') {
    return window[name];
  }
  return null;
};

class GateInsertionManager {
  constructor() {
    this.canvasInitialized = false;
    this.edgeMode = false;
    this.listeners = [];
    this.activeCanvas = null;
  }

  // ============================================================================
  // Gate Insertion
  // ============================================================================

  /**
   * Insert gate before a node
   */
  insertGateBefore(nodeId) {
    const fn = getGateInsertFunction('insertGateBefore');
    if (fn) fn(nodeId);
    this.notifyListeners('insertBefore', nodeId);
  }

  /**
   * Insert gate after a node
   */
  insertGateAfter(nodeId) {
    const fn = getGateInsertFunction('insertGateAfter');
    if (fn) fn(nodeId);
    this.notifyListeners('insertAfter', nodeId);
  }

  /**
   * Show gate selector modal
   */
  showGateSelector(callback) {
    const fn = getGateInsertFunction('showGateSelector');
    if (fn) fn(callback);
  }

  /**
   * Close gate selector modal
   */
  closeGateSelectorModal() {
    const fn = getGateInsertFunction('closeGateSelectorModal');
    if (fn) fn();
  }

  /**
   * Create gate node
   */
  createGateNode(gateType, referenceNode, params) {
    const fn = getGateInsertFunction('createGateNode');
    if (fn) {
      const node = fn(gateType, referenceNode, params);
      this.notifyListeners('gateCreated', { gateType, node });
      return node;
    }
    return null;
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect two nodes
   */
  connectNodes(sourceId, targetId, branchIndex = 0) {
    const fn = getGateInsertFunction('connectNodes'); if (fn) {
      fn(sourceId, targetId, branchIndex);
    }
    this.notifyListeners('nodesConnected', { sourceId, targetId, branchIndex });
  }

  /**
   * Disconnect two nodes
   */
  disconnectNodes(sourceId, targetId, branchIndex = null) {
    const fn = getGateInsertFunction('disconnectNodes'); if (fn) {
      fn(sourceId, targetId, branchIndex);
    }
    this.notifyListeners('nodesDisconnected', { sourceId, targetId, branchIndex });
  }

  /**
   * Find parent nodes
   */
  findNodeParents(nodeId) {
    const fn = getGateInsertFunction('findNodeParents'); if (fn) {
      return fn(nodeId);
    }
    return [];
  }

  /**
   * Update connection mode
   */
  updateConnectionMode(nodeId, mode) {
    const fn = getGateInsertFunction('updateConnectionMode'); if (fn) {
      fn(nodeId, mode);
    }
    this.notifyListeners('connectionMode', { nodeId, mode });
  }

  /**
   * Clear all connections
   */
  clearAllConnections() {
    const fn = getGateInsertFunction('clearAllConnections'); if (fn) {
      fn();
    }
    this.notifyListeners('connectionsCleared');
  }

  // ============================================================================
  // Pattern Creation
  // ============================================================================

  /**
   * Create diamond pattern
   */
  createDiamondPattern(nodeId) {
    const fn = getGateInsertFunction('createDiamondPattern'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('patternCreated', { type: 'diamond', nodeId });
  }

  /**
   * Create star pattern
   */
  createStarPattern(nodeId) {
    const fn = getGateInsertFunction('createStarPattern'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('patternCreated', { type: 'star', nodeId });
  }

  /**
   * Create feedback pattern
   */
  createFeedbackPattern(nodeId) {
    const fn = getGateInsertFunction('createFeedbackPattern'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('patternCreated', { type: 'feedback', nodeId });
  }

  /**
   * Apply routing pattern
   */
  applyRoutingPattern(nodeId, pattern) {
    const fn = getGateInsertFunction('applyRoutingPattern'); if (fn) {
      fn(nodeId, pattern);
    }
    this.notifyListeners('routingPatternApplied', { nodeId, pattern });
  }

  /**
   * Enable loop mode
   */
  enableLoopMode(nodeId) {
    const fn = getGateInsertFunction('enableLoopMode'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('loopModeEnabled', nodeId);
  }

  // ============================================================================
  // Canvas Management
  // ============================================================================

  /**
   * Initialize connection canvas
   */
  initializeConnectionCanvas(nodeId) {
    const fn = getGateInsertFunction('initializeConnectionCanvas'); if (fn) {
      fn(nodeId);
      this.canvasInitialized = true;
      this.activeCanvas = nodeId;
    }
    this.notifyListeners('canvasInitialized', nodeId);
  }

  /**
   * Add gate to canvas
   */
  addGateToCanvas(gateType, x, y) {
    const fn = getGateInsertFunction('addGateToCanvas'); if (fn) {
      const node = fn(gateType, x, y);
      this.notifyListeners('gateAddedToCanvas', { gateType, x, y, node });
      return node;
    }
    return null;
  }

  /**
   * Draw existing connections
   */
  drawExistingConnections(ctx, nodeId) {
    const fn = getGateInsertFunction('drawExistingConnections'); if (fn) {
      fn(ctx, nodeId);
    }
  }

  /**
   * Redraw canvas
   */
  redrawCanvas() {
    const fn = getGateInsertFunction('redrawCanvas'); if (fn) {
      fn();
    }
  }

  /**
   * Enable node dragging
   */
  enableNodeDragging(canvas, nodeData) {
    const fn = getGateInsertFunction('enableNodeDragging'); if (fn) {
      fn(canvas, nodeData);
    }
  }

  // ============================================================================
  // Advanced Connection Editor
  // ============================================================================

  /**
   * Open advanced connection editor
   */
  openAdvancedConnectionEditor(nodeId) {
    const fn = getGateInsertFunction('openAdvancedConnectionEditor'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('connectionEditorOpened', nodeId);
  }

  /**
   * Create connection from builder
   */
  createConnectionFromBuilder() {
    const fn = getGateInsertFunction('createConnectionFromBuilder'); if (fn) {
      fn();
    }
    this.notifyListeners('connectionBuilderUsed');
  }

  // ============================================================================
  // Port Selection
  // ============================================================================

  /**
   * Show port selector
   */
  showPortSelector(node, nodeId, isStartNode, event) {
    const fn = getGateInsertFunction('showPortSelector'); if (fn) {
      fn(node, nodeId, isStartNode, event);
    }
  }

  // ============================================================================
  // Edge Mode
  // ============================================================================

  /**
   * Toggle edge mode
   */
  toggleEdgeMode() {
    const fn = getGateInsertFunction('toggleEdgeMode'); if (fn) {
      fn();
    }
    this.edgeMode = !this.edgeMode;
    this.notifyListeners('edgeModeToggled', this.edgeMode);
  }

  /**
   * Handle edge mode click
   */
  handleEdgeModeClick(node, event) {
    const fn = getGateInsertFunction('handleEdgeModeClick'); if (fn) {
      fn(node, event);
    }
  }

  // ============================================================================
  // Drag & Drop
  // ============================================================================

  /**
   * Initialize drag and drop
   */
  initializeDragAndDrop() {
    const fn = getGateInsertFunction('initializeDragAndDrop'); if (fn) {
      fn();
    }
    this.notifyListeners('dragDropInitialized');
  }

  // ============================================================================
  // Signal Flow
  // ============================================================================

  /**
   * Execute signal flow
   */
  executeSignalFlow() {
    const fn = getGateInsertFunction('executeSignalFlow'); if (fn) {
      const result = fn();
      this.notifyListeners('signalFlowExecuted', result);
      return result;
    }
    return null;
  }

  /**
   * Enable signal flow debug
   */
  enableSignalFlowDebug() {
    const fn = getGateInsertFunction('enableSignalFlowDebug'); if (fn) {
      fn();
    }
    this.notifyListeners('signalFlowDebugEnabled');
  }

  // ============================================================================
  // Integration Status
  // ============================================================================

  /**
   * Update integration status
   */
  updateIntegrationStatus(status) {
    const fn = getGateInsertFunction('updateIntegrationStatus'); if (fn) {
      fn(status);
    }
    this.notifyListeners('integrationStatusUpdated', status);
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Check if canvas is initialized
   */
  isCanvasInitialized() {
    return this.canvasInitialized;
  }

  /**
   * Get active canvas
   */
  getActiveCanvas() {
    return this.activeCanvas;
  }

  /**
   * Check if edge mode is active
   */
  isEdgeMode() {
    return this.edgeMode;
  }

  /**
   * Set edge mode
   */
  setEdgeMode(enabled) {
    this.edgeMode = enabled;
    this.notifyListeners('edgeModeChanged', enabled);
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to manager events
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in GateInsertionManager listener:', error);
      }
    });
  }

  /**
   * Reset manager state
   */
  reset() {
    this.canvasInitialized = false;
    this.edgeMode = false;
    this.activeCanvas = null;
    this.notifyListeners('reset');
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Insert multiple gates in sequence
   */
  insertGateChain(startNodeId, gateTypes) {
    let currentNodeId = startNodeId;

    gateTypes.forEach(gateType => {
      this.showGateSelector((selectedType, params) => {
        if (selectedType) {
          const referenceNode = { id: currentNodeId };
          const newGate = this.createGateNode(selectedType, referenceNode, params);
          this.insertGateAfter(currentNodeId);
          currentNodeId = newGate.id;
        }
      });
    });

    this.notifyListeners('gateChainCreated', { startNodeId, gateTypes });
  }

  /**
   * Create multiple patterns in parallel
   */
  createPatternSet(nodeId, patterns) {
    patterns.forEach(pattern => {
      switch (pattern) {
        case 'diamond':
          this.createDiamondPattern(nodeId);
          break;
        case 'star':
          this.createStarPattern(nodeId);
          break;
        case 'feedback':
          this.createFeedbackPattern(nodeId);
          break;
        default:
          console.warn(`Unknown pattern: ${pattern}`);
      }
    });

    this.notifyListeners('patternSetCreated', { nodeId, patterns });
  }

  // ============================================================================
  // Utility Helpers
  // ============================================================================

  /**
   * Get all available gate types
   */
  getAvailableGateTypes() {
    // This would typically come from gateConfig
    return [
      'and', 'or', 'xor', 'nand', 'nor', 'not',
      'majority', 'threshold', 'router', 'merge',
      'decision', 'process'
    ];
  }

  /**
   * Validate gate insertion
   */
  validateGateInsertion(nodeId, gateType) {
    // Basic validation logic
    if (!nodeId) {
      console.error('Invalid node ID');
      return false;
    }

    const availableTypes = this.getAvailableGateTypes();
    if (!availableTypes.includes(gateType)) {
      console.error(`Invalid gate type: ${gateType}`);
      return false;
    }

    return true;
  }

  /**
   * Get insertion options for node
   */
  getInsertionOptions(nodeId) {
    const parents = this.findNodeParents(nodeId);

    return {
      canInsertBefore: parents.length > 0,
      canInsertAfter: true,
      canCreatePattern: true,
      parentCount: parents.length
    };
  }
}

// Export singleton instance
export const gateInsertionManager = new GateInsertionManager();

// Export class for testing
export default GateInsertionManager;
