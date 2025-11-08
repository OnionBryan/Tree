/**
 * Connection Manager
 * Manages connections between nodes with validation and operations
 * Extracted patterns from Canvas #5 and inspired by treeconfig.jsx
 */

import { CONNECTION_TYPES } from '../constants/gateConfig.js';

/**
 * Connection Manager Class
 * Handles connection CRUD operations, validation, and queries
 */
export class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.listeners = [];
    this.nextId = 1;
  }

  /**
   * Add a connection
   * @param {Object} connection - Connection data
   * @returns {Object} Created connection with ID
   */
  addConnection(connection) {
    // Validate connection
    const validation = this.validateConnection(connection);
    if (!validation.valid) {
      throw new Error(`Invalid connection: ${validation.errors.join(', ')}`);
    }

    // Generate ID if not provided
    const id = connection.id || `conn_${this.nextId++}`;

    // Create connection object
    const conn = {
      id,
      from: connection.from,
      to: connection.to,
      fromPort: connection.fromPort || 0,
      toPort: connection.toPort || 0,
      threshold: connection.threshold ?? null,
      label: connection.label || '',
      type: connection.type || CONNECTION_TYPES.NORMAL,
      weight: connection.weight ?? 1.0,
      active: connection.active ?? false,
      metadata: connection.metadata || {}
    };

    this.connections.set(id, conn);
    this.notifyListeners('add', conn);

    return conn;
  }

  /**
   * Remove a connection
   * @param {string} connectionId - Connection ID
   * @returns {boolean} Success
   */
  removeConnection(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) return false;

    this.connections.delete(connectionId);
    this.notifyListeners('remove', conn);

    return true;
  }

  /**
   * Update a connection
   * @param {string} connectionId - Connection ID
   * @param {Object} updates - Partial connection updates
   * @returns {Object} Updated connection
   */
  updateConnection(connectionId, updates) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const updated = {
      ...conn,
      ...updates,
      id: conn.id // Don't allow ID change
    };

    this.connections.set(connectionId, updated);
    this.notifyListeners('update', updated, conn);

    return updated;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections from a node
   */
  getConnectionsFrom(nodeId) {
    return this.getAllConnections().filter(conn => conn.from === nodeId);
  }

  /**
   * Get connections to a node
   */
  getConnectionsTo(nodeId) {
    return this.getAllConnections().filter(conn => conn.to === nodeId);
  }

  /**
   * Get all connections for a node (incoming + outgoing)
   */
  getNodeConnections(nodeId) {
    return {
      incoming: this.getConnectionsTo(nodeId),
      outgoing: this.getConnectionsFrom(nodeId),
      all: this.getAllConnections().filter(
        conn => conn.from === nodeId || conn.to === nodeId
      )
    };
  }

  /**
   * Get connections from specific port
   */
  getConnectionsFromPort(nodeId, portIndex) {
    return this.getConnectionsFrom(nodeId).filter(
      conn => conn.fromPort === portIndex
    );
  }

  /**
   * Get connections to specific port
   */
  getConnectionsToPort(nodeId, portIndex) {
    return this.getConnectionsTo(nodeId).filter(
      conn => conn.toPort === portIndex
    );
  }

  /**
   * Check if connection exists between two nodes
   */
  hasConnection(fromNodeId, toNodeId) {
    return this.getAllConnections().some(
      conn => conn.from === fromNodeId && conn.to === toNodeId
    );
  }

  /**
   * Check if specific port connection exists
   */
  hasPortConnection(fromNodeId, fromPort, toNodeId, toPort) {
    return this.getAllConnections().some(
      conn =>
        conn.from === fromNodeId &&
        conn.fromPort === fromPort &&
        conn.to === toNodeId &&
        conn.toPort === toPort
    );
  }

  /**
   * Remove all connections for a node
   */
  removeNodeConnections(nodeId) {
    const toRemove = this.getNodeConnections(nodeId).all;
    toRemove.forEach(conn => this.removeConnection(conn.id));
    return toRemove.length;
  }

  /**
   * Clear all connections
   */
  clearAll() {
    const allConnections = this.getAllConnections();
    this.connections.clear();
    this.notifyListeners('clear', { count: allConnections.length });
  }

  /**
   * Validate connection
   */
  validateConnection(connection) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!connection.from) {
      errors.push('Source node (from) is required');
    }

    if (!connection.to) {
      errors.push('Target node (to) is required');
    }

    // Port indices must be non-negative
    if (connection.fromPort !== undefined && connection.fromPort < 0) {
      errors.push('From port index must be non-negative');
    }

    if (connection.toPort !== undefined && connection.toPort < 0) {
      errors.push('To port index must be non-negative');
    }

    // Can't connect node to itself
    if (connection.from === connection.to) {
      errors.push('Cannot connect node to itself');
    }

    // Check for duplicate connections
    if (this.hasPortConnection(
      connection.from,
      connection.fromPort || 0,
      connection.to,
      connection.toPort || 0
    )) {
      warnings.push('Connection already exists between these ports');
    }

    // Validate threshold if provided
    if (connection.threshold !== undefined && connection.threshold !== null) {
      if (typeof connection.threshold !== 'number') {
        errors.push('Threshold must be a number');
      }
    }

    // Validate connection type
    if (connection.type && !Object.values(CONNECTION_TYPES).includes(connection.type)) {
      warnings.push(`Unknown connection type: ${connection.type}`);
    }

    // Validate weight
    if (connection.weight !== undefined) {
      if (typeof connection.weight !== 'number') {
        errors.push('Weight must be a number');
      } else if (connection.weight < 0) {
        warnings.push('Negative weight may cause unexpected behavior');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find cycles in connections (detects feedback loops)
   * Returns array of cycles, each cycle is an array of node IDs
   */
  findCycles() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoing = this.getConnectionsFrom(nodeId);
      for (const conn of outgoing) {
        if (recursionStack.has(conn.to)) {
          // Found a cycle
          const cycleStart = path.indexOf(conn.to);
          const cycle = path.slice(cycleStart);
          cycle.push(conn.to);
          cycles.push(cycle);
        } else if (!visited.has(conn.to)) {
          dfs(conn.to, [...path]);
        }
      }

      recursionStack.delete(nodeId);
    };

    // Get all unique node IDs
    const nodeIds = new Set();
    this.getAllConnections().forEach(conn => {
      nodeIds.add(conn.from);
      nodeIds.add(conn.to);
    });

    // Run DFS from each unvisited node
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Get topological sort of nodes (if no cycles)
   * Returns null if cycles exist
   */
  topologicalSort() {
    const inDegree = new Map();
    const nodeIds = new Set();

    // Calculate in-degrees
    this.getAllConnections().forEach(conn => {
      nodeIds.add(conn.from);
      nodeIds.add(conn.to);
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
    });

    // Initialize nodes with 0 in-degree
    nodeIds.forEach(id => {
      if (!inDegree.has(id)) {
        inDegree.set(id, 0);
      }
    });

    // Kahn's algorithm
    const queue = Array.from(nodeIds).filter(id => inDegree.get(id) === 0);
    const sorted = [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      sorted.push(nodeId);

      this.getConnectionsFrom(nodeId).forEach(conn => {
        const newDegree = inDegree.get(conn.to) - 1;
        inDegree.set(conn.to, newDegree);
        if (newDegree === 0) {
          queue.push(conn.to);
        }
      });
    }

    // If all nodes are sorted, no cycles
    return sorted.length === nodeIds.size ? sorted : null;
  }

  /**
   * Subscribe to connection changes
   * @param {Function} listener - (action, connection, prevConnection) => void
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
  notifyListeners(action, connection, prevConnection) {
    this.listeners.forEach(listener => {
      try {
        listener(action, connection, prevConnection);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Export connections to JSON
   */
  toJSON() {
    return {
      connections: this.getAllConnections(),
      count: this.connections.size
    };
  }

  /**
   * Import connections from JSON
   */
  fromJSON(json) {
    this.clearAll();
    if (json.connections && Array.isArray(json.connections)) {
      json.connections.forEach(conn => {
        try {
          this.addConnection(conn);
        } catch (error) {
          console.error('Error importing connection:', error);
        }
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const connections = this.getAllConnections();
    const byType = {};
    const byNode = {};

    connections.forEach(conn => {
      // By type
      byType[conn.type] = (byType[conn.type] || 0) + 1;

      // By node
      byNode[conn.from] = byNode[conn.from] || { outgoing: 0, incoming: 0 };
      byNode[conn.to] = byNode[conn.to] || { outgoing: 0, incoming: 0 };
      byNode[conn.from].outgoing++;
      byNode[conn.to].incoming++;
    });

    return {
      total: connections.length,
      byType,
      byNode,
      hasCycles: this.findCycles().length > 0
    };
  }
}

/**
 * Create a new connection manager
 */
export function createConnectionManager() {
  return new ConnectionManager();
}
