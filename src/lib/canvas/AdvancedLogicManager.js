/**
 * Advanced Logic Manager
 * Wraps all functions from adLog.jsx in a clean React-friendly API
 *
 * This manager provides a singleton interface to all advanced logic functions
 * extracted from tree-builder.html, including:
 * - Fuzzy logic configuration
 * - Branch management
 * - Node type updates
 * - Advanced mode toggles
 * - Logic settings panels
 *
 * NOTE: adLog.jsx functions are accessed via window globals since the file
 * has duplicate declarations and can't be imported as ES module
 */

// Functions are available on window after adLog.jsx is loaded in tree-builder.html
const getAdLogFunction = (name) => {
  if (typeof window !== 'undefined' && typeof window[name] === 'function') {
    return window[name];
  }
  return null;
};

class AdvancedLogicManager {
  constructor() {
    this.enabled = false;
    this.currentNode = null;
    this.listeners = [];

    // Initialize global state
    if (typeof window !== 'undefined') {
      window.AdvancedTreeLogic = window.AdvancedTreeLogic || {
        enabled: false,
        currentNode: null,
        currentGate: null,
        graph: null,
        evaluator: null,
        fuzzyEvaluator: null,
        renderer: null
      };
    }
  }

  // ============================================================================
  // Fuzzy Logic Configuration
  // ============================================================================

  /**
   * Update fuzzy threshold for current node
   */
  updateFuzzyThreshold(value) {
    const fn = getAdLogFunction('updateFuzzyThreshold');
    if (fn) {
      fn(value);
    }
    this.notifyListeners('fuzzyThreshold', value / 100);
  }

  /**
   * Update T-norm for fuzzy operations
   */
  updateTNorm(tNorm) {
    const fn = getAdLogFunction('updateTNorm'); if (fn) {
      fn(tNorm);
    }
    this.notifyListeners('tNorm', tNorm);
  }

  /**
   * Update fuzzy operation for a node
   */
  updateFuzzyOperation(nodeId, operation) {
    const fn = getAdLogFunction('updateFuzzyOperation'); if (fn) {
      fn(nodeId, operation);
    }
    this.notifyListeners('fuzzyOperation', { nodeId, operation });
  }

  // ============================================================================
  // Branch Management
  // ============================================================================

  /**
   * Update branch count for current node
   */
  updateBranchCount(count) {
    const fn = getAdLogFunction('updateBranchCount'); if (fn) {
      fn(count);
    }
    this.notifyListeners('branchCount', count);
  }

  /**
   * Update label for specific branch
   */
  updateBranchLabel(index, label) {
    const fn = getAdLogFunction('updateBranchLabel'); if (fn) {
      fn(index, label);
    }
    this.notifyListeners('branchLabel', { index, label });
  }

  /**
   * Update advanced branch count
   */
  updateAdvancedBranchCount() {
    const fn = getAdLogFunction('updateAdvancedBranchCount'); if (fn) {
      fn();
    }
    this.notifyListeners('advancedBranchCount');
  }

  // ============================================================================
  // Node Type & Configuration
  // ============================================================================

  /**
   * Update node type in layer
   */
  updateNodeType(nodeId, nodeType) {
    const fn = getAdLogFunction('updateNodeTypeInLayer');
    if (fn) {
      fn(nodeId, nodeType);
    } else {
      const fn2 = getAdLogFunction('updateAdvancedNodeType');
      if (fn2) {
        fn2(nodeType);
      }
    }
    this.notifyListeners('nodeType', { nodeId, nodeType });
  }

  /**
   * Update gate type for node
   */
  updateGateType(nodeId, gateType) {
    const fn = getAdLogFunction('updateGateTypeForNode'); if (fn) {
      fn(nodeId, gateType);
    }
    this.notifyListeners('gateType', { nodeId, gateType });
  }

  /**
   * Update node scale range
   */
  updateNodeScaleRange(nodeId) {
    const fn = getAdLogFunction('updateNodeScaleRange'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('scaleRange', nodeId);
  }

  // ============================================================================
  // Advanced Mode Management
  // ============================================================================

  /**
   * Toggle advanced features on/off
   */
  toggleAdvancedFeatures(enabled) {
    const fn = getAdLogFunction('toggleAdvancedFeatures'); if (fn) {
      fn(enabled);
    }
    this.enabled = enabled;
    this.notifyListeners('advancedFeatures', enabled);
  }

  /**
   * Toggle advanced mode
   */
  toggleAdvancedMode() {
    const fn = getAdLogFunction('toggleAdvancedMode'); if (fn) {
      fn();
    }
    this.notifyListeners('advancedMode');
  }

  /**
   * Restore advanced mode state
   */
  restoreAdvancedModeState() {
    const fn = getAdLogFunction('restoreAdvancedModeState'); if (fn) {
      fn();
    }
  }

  // ============================================================================
  // UI Panels & Popups
  // ============================================================================

  /**
   * Show advanced mode panel
   */
  showAdvancedModePanel() {
    const fn = getAdLogFunction('showAdvancedModePanel'); if (fn) {
      fn();
    }
  }

  /**
   * Hide advanced mode panel
   */
  hideAdvancedModePanel() {
    const fn = getAdLogFunction('hideAdvancedModePanel'); if (fn) {
      fn();
    }
  }

  /**
   * Open advanced logic popup for node
   */
  openAdvancedLogicPopup(nodeId) {
    const fn = getAdLogFunction('openAdvancedLogicPopup'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('openLogicPopup', nodeId);
  }

  /**
   * Close advanced logic popup
   */
  closeAdvancedLogicPopup() {
    const fn = getAdLogFunction('closeAdvancedLogicPopup'); if (fn) {
      fn();
    }
    this.notifyListeners('closeLogicPopup');
  }

  /**
   * Open fallback node settings
   */
  openFallbackNodeSettings(nodeId, node) {
    const fn = getAdLogFunction('openFallbackNodeSettings'); if (fn) {
      fn(nodeId, node);
    }
  }

  /**
   * Open global logic settings
   */
  openGlobalLogicSettings() {
    const fn = getAdLogFunction('openGlobalLogicSettings'); if (fn) {
      fn();
    }
  }

  // ============================================================================
  // Logic Settings Application
  // ============================================================================

  /**
   * Apply advanced logic settings to node
   */
  applyAdvancedLogicSettings(nodeId) {
    const fn = getAdLogFunction('applyAdvancedLogicSettings'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('applySettings', nodeId);
  }

  /**
   * Apply global logic settings
   */
  applyGlobalLogicSettings() {
    const fn = getAdLogFunction('applyGlobalLogicSettings'); if (fn) {
      fn();
    }
    this.notifyListeners('applyGlobalSettings');
  }

  /**
   * Apply logic template
   */
  applyLogicTemplate() {
    const fn = getAdLogFunction('applyLogicTemplate'); if (fn) {
      fn();
    }
    this.notifyListeners('applyTemplate');
  }

  // ============================================================================
  // Node Toggles & Operations
  // ============================================================================

  /**
   * Toggle node advanced mode
   */
  toggleNodeAdvanced(nodeId) {
    const fn = getAdLogFunction('toggleNodeAdvanced'); if (fn) {
      fn(nodeId);
    }
    this.notifyListeners('toggleNode', nodeId);
  }

  /**
   * Add logic layer
   */
  addLogicLayer() {
    const fn = getAdLogFunction('addLogicLayer'); if (fn) {
      fn();
    }
    this.notifyListeners('addLayer');
  }

  // ============================================================================
  // Signal Flow Controls
  // ============================================================================

  /**
   * Step signal through logic
   */
  stepSignal() {
    const fn = getAdLogFunction('stepSignal'); if (fn) {
      fn();
    }
    this.notifyListeners('stepSignal');
  }

  /**
   * Reset all signals
   */
  resetSignals() {
    const fn = getAdLogFunction('resetSignals'); if (fn) {
      fn();
    }
    this.notifyListeners('resetSignals');
  }

  // ============================================================================
  // Connection Mode
  // ============================================================================

  /**
   * Set connection mode
   */
  setConnectionMode(mode) {
    const fn = getAdLogFunction('setConnectionMode'); if (fn) {
      fn(mode);
    }
    this.notifyListeners('connectionMode', mode);
  }

  // ============================================================================
  // Utility & Helpers
  // ============================================================================

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const fn = getAdLogFunction('showToast'); if (fn) {
      fn(message, type);
    }
  }

  /**
   * Generate advanced logic HTML for node
   */
  generateAdvancedLogicHTML(node) {
    const fn = getAdLogFunction('generateAdvancedLogicHTML'); if (fn) {
      return fn(node);
    }
    return '';
  }

  /**
   * Generate branch label inputs
   */
  generateBranchLabelInputs(node) {
    const fn = getAdLogFunction('generateBranchLabelInputs'); if (fn) {
      return fn(node);
    }
    return '';
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Set current node
   */
  setCurrentNode(node) {
    this.currentNode = node;
    if (typeof window !== 'undefined' && window.AdvancedTreeLogic) {
      window.AdvancedTreeLogic.currentNode = node;
    }
    this.notifyListeners('currentNode', node);
  }

  /**
   * Get current node
   */
  getCurrentNode() {
    return this.currentNode || (typeof window !== 'undefined' && window.AdvancedTreeLogic?.currentNode);
  }

  /**
   * Check if advanced mode is enabled
   */
  isEnabled() {
    return this.enabled || (typeof window !== 'undefined' && window.AdvancedTreeLogic?.enabled);
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
        console.error('Error in AdvancedLogicManager listener:', error);
      }
    });
  }

  /**
   * Reset manager state
   */
  reset() {
    this.enabled = false;
    this.currentNode = null;
    if (typeof window !== 'undefined' && window.AdvancedTreeLogic) {
      window.AdvancedTreeLogic.enabled = false;
      window.AdvancedTreeLogic.currentNode = null;
    }
    this.notifyListeners('reset');
  }
}

// Export singleton instance
export const advancedLogicManager = new AdvancedLogicManager();

// Export class for testing
export default AdvancedLogicManager;
