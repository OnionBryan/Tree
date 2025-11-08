/**
 * Node Manager
 * Manages nodes with CRUD operations, port calculations, and queries
 * Extracted patterns from Canvas #5 and inspired by treeconfig.jsx
 */

import { GATE_TYPES, GATE_COLORS } from '../constants/gateConfig.js';
import { NODE_CONFIG, PORT_CONFIG } from '../constants/canvasConfig.js';

/**
 * Node Manager Class
 * Handles node CRUD operations, port positioning, and queries
 */
export class NodeManager {
  constructor() {
    this.nodes = new Map();
    this.listeners = [];
    this.nextId = 1;
  }

  /**
   * Add a node
   * @param {Object} node - Node data
   * @returns {Object} Created node with ID and ports
   */
  addNode(node) {
    // Validate node
    const validation = this.validateNode(node);
    if (!validation.valid) {
      throw new Error(`Invalid node: ${validation.errors.join(', ')}`);
    }

    // Generate ID if not provided
    const id = node.id || `node_${this.nextId++}`;

    // Create node object
    const newNode = {
      id,
      x: node.x || 0,
      y: node.y || 0,
      type: node.type || GATE_TYPES.AND,
      label: node.label || this.getDefaultLabel(node.type),
      logicType: node.logicType || node.type,
      color: node.color || GATE_COLORS[node.type] || '#6366F1',
      width: node.width || NODE_CONFIG.width,
      height: node.height || NODE_CONFIG.height,
      inputs: node.inputs || this.createDefaultPorts('input', node.inputCount || 2),
      outputs: node.outputs || this.createDefaultPorts('output', node.outputCount || 1),
      properties: node.properties || {},
      metadata: node.metadata || {},
      active: node.active ?? false,
      error: node.error || null
    };

    // Calculate port positions
    this.updatePortPositions(newNode);

    this.nodes.set(id, newNode);
    this.notifyListeners('add', newNode);

    return newNode;
  }

  /**
   * Remove a node
   * @param {string} nodeId - Node ID
   * @returns {boolean} Success
   */
  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    this.nodes.delete(nodeId);
    this.notifyListeners('remove', node);

    return true;
  }

  /**
   * Update a node
   * @param {string} nodeId - Node ID
   * @param {Object} updates - Partial node updates
   * @returns {Object} Updated node
   */
  updateNode(nodeId, updates) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const updated = {
      ...node,
      ...updates,
      id: node.id // Don't allow ID change
    };

    // Recalculate port positions if position or size changed
    if (updates.x !== undefined || updates.y !== undefined ||
        updates.width !== undefined || updates.height !== undefined) {
      this.updatePortPositions(updated);
    }

    this.nodes.set(nodeId, updated);
    this.notifyListeners('update', updated, node);

    return updated;
  }

  /**
   * Move node to new position
   */
  moveNode(nodeId, x, y) {
    return this.updateNode(nodeId, { x, y });
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type) {
    return this.getAllNodes().filter(node => node.type === type);
  }

  /**
   * Get nodes by property
   */
  getNodesBy(filterFn) {
    return this.getAllNodes().filter(filterFn);
  }

  /**
   * Check if node exists
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Clear all nodes
   */
  clearAll() {
    const allNodes = this.getAllNodes();
    this.nodes.clear();
    this.notifyListeners('clear', { count: allNodes.length });
  }

  /**
   * Validate node
   */
  validateNode(node) {
    const errors = [];
    const warnings = [];

    // Type validation
    if (!node.type) {
      errors.push('Node type is required');
    } else if (!Object.values(GATE_TYPES).includes(node.type)) {
      warnings.push(`Unknown node type: ${node.type}`);
    }

    // Position validation
    if (node.x !== undefined && typeof node.x !== 'number') {
      errors.push('Node x must be a number');
    }
    if (node.y !== undefined && typeof node.y !== 'number') {
      errors.push('Node y must be a number');
    }

    // Size validation
    if (node.width !== undefined && (typeof node.width !== 'number' || node.width <= 0)) {
      errors.push('Node width must be a positive number');
    }
    if (node.height !== undefined && (typeof node.height !== 'number' || node.height <= 0)) {
      errors.push('Node height must be a positive number');
    }

    // Port validation
    if (node.inputs && !Array.isArray(node.inputs)) {
      errors.push('Node inputs must be an array');
    }
    if (node.outputs && !Array.isArray(node.outputs)) {
      errors.push('Node outputs must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create default ports for a node
   */
  createDefaultPorts(type, count) {
    const ports = [];
    for (let i = 0; i < count; i++) {
      ports.push({
        id: `${type}_${i}`,
        type,
        index: i,
        x: 0, // Will be calculated
        y: 0,
        label: type === 'input' ? `In ${i + 1}` : `Out ${i + 1}`,
        value: null
      });
    }
    return ports;
  }

  /**
   * Update port positions based on node position and size
   */
  updatePortPositions(node) {
    const { width, height } = node;

    // Update input ports (left side)
    if (node.inputs) {
      const inputSpacing = node.inputs.length > 1
        ? height / (node.inputs.length + 1)
        : height / 2;

      node.inputs = node.inputs.map((port, i) => ({
        ...port,
        x: node.x - PORT_CONFIG.offset,
        y: node.y - height / 2 + inputSpacing * (i + 1)
      }));
    }

    // Update output ports (right side)
    if (node.outputs) {
      const outputSpacing = node.outputs.length > 1
        ? height / (node.outputs.length + 1)
        : height / 2;

      node.outputs = node.outputs.map((port, i) => ({
        ...port,
        x: node.x + PORT_CONFIG.offset,
        y: node.y - height / 2 + outputSpacing * (i + 1)
      }));
    }
  }

  /**
   * Get default label for node type
   */
  getDefaultLabel(type) {
    const labels = {
      [GATE_TYPES.AND]: 'AND',
      [GATE_TYPES.OR]: 'OR',
      [GATE_TYPES.XOR]: 'XOR',
      [GATE_TYPES.NAND]: 'NAND',
      [GATE_TYPES.NOR]: 'NOR',
      [GATE_TYPES.NOT]: 'NOT',
      [GATE_TYPES.MAJORITY]: 'MAJ',
      [GATE_TYPES.THRESHOLD]: 'THR',
      [GATE_TYPES.ROUTER]: 'ROUTE',
      [GATE_TYPES.MERGE]: 'MERGE',
      [GATE_TYPES.DECISION]: 'DECIDE',
      [GATE_TYPES.PROCESS]: 'PROC'
    };
    return labels[type] || 'NODE';
  }

  /**
   * Add input port to node
   */
  addInputPort(nodeId, portData = {}) {
    const node = this.getNode(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const newPort = {
      id: portData.id || `input_${node.inputs.length}`,
      type: 'input',
      index: node.inputs.length,
      x: 0,
      y: 0,
      label: portData.label || `In ${node.inputs.length + 1}`,
      value: null,
      ...portData
    };

    node.inputs.push(newPort);
    this.updatePortPositions(node);
    this.notifyListeners('update', node);

    return newPort;
  }

  /**
   * Add output port to node
   */
  addOutputPort(nodeId, portData = {}) {
    const node = this.getNode(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const newPort = {
      id: portData.id || `output_${node.outputs.length}`,
      type: 'output',
      index: node.outputs.length,
      x: 0,
      y: 0,
      label: portData.label || `Out ${node.outputs.length + 1}`,
      value: null,
      ...portData
    };

    node.outputs.push(newPort);
    this.updatePortPositions(node);
    this.notifyListeners('update', node);

    return newPort;
  }

  /**
   * Remove port from node
   */
  removePort(nodeId, portType, portIndex) {
    const node = this.getNode(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const ports = portType === 'input' ? node.inputs : node.outputs;
    if (portIndex < 0 || portIndex >= ports.length) {
      throw new Error(`Invalid port index ${portIndex}`);
    }

    ports.splice(portIndex, 1);

    // Reindex remaining ports
    ports.forEach((port, i) => {
      port.index = i;
      port.label = `${portType === 'input' ? 'In' : 'Out'} ${i + 1}`;
    });

    this.updatePortPositions(node);
    this.notifyListeners('update', node);
  }

  /**
   * Get port by node and index
   */
  getPort(nodeId, portType, portIndex) {
    const node = this.getNode(nodeId);
    if (!node) return null;

    const ports = portType === 'input' ? node.inputs : node.outputs;
    return ports[portIndex] || null;
  }

  /**
   * Subscribe to node changes
   * @param {Function} listener - (action, node, prevNode) => void
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of changes
   */
  notifyListeners(action, node, prevNode) {
    this.listeners.forEach(listener => {
      try {
        listener(action, node, prevNode);
      } catch (error) {
        console.error('Error in node listener:', error);
      }
    });
  }

  /**
   * Export nodes to JSON
   */
  toJSON() {
    return {
      nodes: this.getAllNodes(),
      count: this.nodes.size
    };
  }

  /**
   * Import nodes from JSON
   */
  fromJSON(json) {
    this.clearAll();
    if (json.nodes && Array.isArray(json.nodes)) {
      json.nodes.forEach(node => {
        try {
          this.addNode(node);
        } catch (error) {
          console.error('Error importing node:', error);
        }
      });
    }
  }

  /**
   * Get node statistics
   */
  getStats() {
    const nodes = this.getAllNodes();
    const byType = {};

    nodes.forEach(node => {
      byType[node.type] = (byType[node.type] || 0) + 1;
    });

    return {
      total: nodes.length,
      byType,
      totalInputs: nodes.reduce((sum, n) => sum + (n.inputs?.length || 0), 0),
      totalOutputs: nodes.reduce((sum, n) => sum + (n.outputs?.length || 0), 0)
    };
  }

  /**
   * Find nodes in area (for selection box)
   */
  findNodesInArea(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return this.getAllNodes().filter(node => {
      const halfWidth = (node.width || NODE_CONFIG.width) / 2;
      const halfHeight = (node.height || NODE_CONFIG.height) / 2;

      return node.x + halfWidth >= minX &&
             node.x - halfWidth <= maxX &&
             node.y + halfHeight >= minY &&
             node.y - halfHeight <= maxY;
    });
  }

  /**
   * Get node at position
   */
  getNodeAt(x, y) {
    for (const node of this.getAllNodes()) {
      const halfWidth = (node.width || NODE_CONFIG.width) / 2;
      const halfHeight = (node.height || NODE_CONFIG.height) / 2;

      if (x >= node.x - halfWidth &&
          x <= node.x + halfWidth &&
          y >= node.y - halfHeight &&
          y <= node.y + halfHeight) {
        return node;
      }
    }
    return null;
  }

  /**
   * Get bounds of all nodes
   */
  getBounds() {
    const nodes = this.getAllNodes();
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      const halfWidth = (node.width || NODE_CONFIG.width) / 2;
      const halfHeight = (node.height || NODE_CONFIG.height) / 2;

      minX = Math.min(minX, node.x - halfWidth);
      maxX = Math.max(maxX, node.x + halfWidth);
      minY = Math.min(minY, node.y - halfHeight);
      maxY = Math.max(maxY, node.y + halfHeight);
    });

    return {
      minX, maxX, minY, maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

/**
 * Create a new node manager
 */
export function createNodeManager() {
  return new NodeManager();
}
