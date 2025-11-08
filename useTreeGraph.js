import { useState, useEffect, useCallback } from 'react';

/**
 * Custom React Hook for managing TreeVisualization graphs
 *
 * Usage:
 * const { graph, ready, addNode, addEdge, removeNode, applyLayout, exportJSON } = useTreeGraph(initialData);
 *
 * @param {Object} initialData - Initial tree data (optional)
 * @returns {Object} Graph management utilities
 */
export function useTreeGraph(initialData = null) {
  const [graph, setGraph] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize graph
  useEffect(() => {
    if (typeof window === 'undefined' || !window.TreeVisualization) {
      setError('TreeVisualization module not loaded');
      console.error('[useTreeGraph] TreeVisualization not available on window');
      return;
    }

    try {
      const newGraph = new window.TreeVisualization.LogicGraph({
        name: 'Tree Graph',
        type: 'dag',
        metadata: { createdAt: new Date().toISOString() }
      });

      if (initialData) {
        // Convert initial data to graph
        if (initialData.tree) {
          // Hierarchical format
          convertHierarchicalToGraph(initialData.tree, newGraph);
        } else if (initialData.layers) {
          // Layer-based format
          convertLayersToGraph(initialData.layers, initialData.edges, newGraph);
        } else if (initialData.nodes) {
          // Direct nodes/edges format
          convertNodesToGraph(initialData.nodes, initialData.edges, newGraph);
        }
      }

      setGraph(newGraph);
      setReady(true);
      setError(null);

      console.log('[useTreeGraph] Graph initialized with', newGraph.nodes.size, 'nodes');
    } catch (err) {
      console.error('[useTreeGraph] Failed to initialize graph:', err);
      setError(err.message);
    }
  }, []); // Only run once on mount

  /**
   * Add a node to the graph
   */
  const addNode = useCallback((nodeConfig) => {
    if (!graph) {
      console.warn('[useTreeGraph] Cannot add node: graph not ready');
      return null;
    }

    try {
      const node = new window.TreeVisualization.AdvancedNode(nodeConfig);
      graph.addNode(node);

      // Force re-render by updating state
      setGraph({ ...graph });

      console.log('[useTreeGraph] Added node:', node.id);
      return node;
    } catch (err) {
      console.error('[useTreeGraph] Failed to add node:', err);
      setError(err.message);
      return null;
    }
  }, [graph]);

  /**
   * Add an edge between two nodes
   */
  const addEdge = useCallback((sourceId, targetId, edgeConfig = {}) => {
    if (!graph) {
      console.warn('[useTreeGraph] Cannot add edge: graph not ready');
      return null;
    }

    try {
      const edge = graph.addEdge(sourceId, targetId, edgeConfig);

      // Force re-render
      setGraph({ ...graph });

      console.log('[useTreeGraph] Added edge:', edge.id);
      return edge;
    } catch (err) {
      console.error('[useTreeGraph] Failed to add edge:', err);
      setError(err.message);
      return null;
    }
  }, [graph]);

  /**
   * Remove a node from the graph
   */
  const removeNode = useCallback((nodeId) => {
    if (!graph) return;

    try {
      graph.removeNode(nodeId);

      // Force re-render
      setGraph({ ...graph });

      console.log('[useTreeGraph] Removed node:', nodeId);
    } catch (err) {
      console.error('[useTreeGraph] Failed to remove node:', err);
      setError(err.message);
    }
  }, [graph]);

  /**
   * Remove an edge from the graph
   */
  const removeEdge = useCallback((edgeId) => {
    if (!graph) return;

    try {
      graph.removeEdge(edgeId);

      // Force re-render
      setGraph({ ...graph });

      console.log('[useTreeGraph] Removed edge:', edgeId);
    } catch (err) {
      console.error('[useTreeGraph] Failed to remove edge:', err);
      setError(err.message);
    }
  }, [graph]);

  /**
   * Apply a layout algorithm to the graph
   */
  const applyLayout = useCallback((layoutType = 'hierarchical', options = {}) => {
    if (!graph || !window.TreeVisualization) {
      console.warn('[useTreeGraph] Cannot apply layout: graph or TreeVisualization not ready');
      return;
    }

    try {
      const defaultOptions = {
        hierarchical: {
          levelSeparation: 150,
          nodeSeparation: 100,
          direction: 'TB'
        },
        radial: {
          radius: 100,
          centerX: 0,
          centerY: 0
        },
        force: {
          iterations: 300,
          idealLength: 150,
          temperature: 100
        }
      };

      const layoutOptions = { ...defaultOptions[layoutType], ...options };

      switch (layoutType) {
        case 'hierarchical':
          window.TreeVisualization.TreeLayout.hierarchical(graph, layoutOptions);
          break;
        case 'radial':
          window.TreeVisualization.TreeLayout.radial(graph, layoutOptions);
          break;
        case 'force':
          const positions = window.TreeVisualization.TreeLayout.forceDirected(graph, layoutOptions);
          // Apply positions to nodes
          for (const [nodeId, pos] of positions) {
            const node = graph.nodes.get(nodeId);
            if (node) {
              node.position = pos;
            }
          }
          break;
        default:
          console.warn('[useTreeGraph] Unknown layout type:', layoutType);
      }

      // Force re-render
      setGraph({ ...graph });

      console.log('[useTreeGraph] Applied', layoutType, 'layout');
    } catch (err) {
      console.error('[useTreeGraph] Failed to apply layout:', err);
      setError(err.message);
    }
  }, [graph]);

  /**
   * Export graph as JSON
   */
  const exportJSON = useCallback(() => {
    if (!graph) return null;

    try {
      return graph.toJSON();
    } catch (err) {
      console.error('[useTreeGraph] Failed to export JSON:', err);
      setError(err.message);
      return null;
    }
  }, [graph]);

  /**
   * Clear all nodes and edges
   */
  const clear = useCallback(() => {
    if (!graph) return;

    graph.nodes.clear();
    graph.edges.clear();

    // Force re-render
    setGraph({ ...graph });

    console.log('[useTreeGraph] Cleared graph');
  }, [graph]);

  /**
   * Get graph statistics
   */
  const getStats = useCallback(() => {
    if (!graph) return null;

    return {
      nodeCount: graph.nodes.size,
      edgeCount: graph.edges.size,
      nodeTypes: Array.from(graph.nodes.values()).reduce((acc, node) => {
        acc[node.nodeType] = (acc[node.nodeType] || 0) + 1;
        return acc;
      }, {}),
      logicTypes: Array.from(graph.nodes.values()).reduce((acc, node) => {
        if (node.logicType) {
          acc[node.logicType] = (acc[node.logicType] || 0) + 1;
        }
        return acc;
      }, {})
    };
  }, [graph]);

  return {
    graph,
    ready,
    error,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    applyLayout,
    exportJSON,
    clear,
    getStats
  };
}

// ============================================================================
// Helper Functions for Converting Data Formats
// ============================================================================

/**
 * Convert hierarchical tree to graph
 */
function convertHierarchicalToGraph(treeNode, graph, depth = 0, parentId = null) {
  const node = new window.TreeVisualization.AdvancedNode({
    id: treeNode.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: treeNode.question || treeNode.label || treeNode.name || 'Node',
    nodeType: treeNode.nodeType || treeNode.type || 'decision',
    logicType: treeNode.logicType || treeNode.gateType,
    branchCount: treeNode.numBranches || treeNode.children?.length || 2,
    branchLabels: treeNode.branchLabels || [],
    position: {
      x: treeNode.x || 0,
      y: treeNode.y || depth * 150
    },
    metadata: {
      threshold: treeNode.threshold,
      thresholdK: treeNode.thresholdK,
      fuzzyMembership: treeNode.fuzzyMembership,
      ...treeNode.metadata
    }
  });

  graph.addNode(node);

  // Add edge from parent
  if (parentId) {
    graph.addEdge(parentId, node.id, {
      label: treeNode.condition || ''
    });
  }

  // Recurse for children
  if (treeNode.children && Array.isArray(treeNode.children)) {
    treeNode.children.forEach(child => {
      convertHierarchicalToGraph(child, graph, depth + 1, node.id);
    });
  }

  return node;
}

/**
 * Convert layer-based structure to graph
 */
function convertLayersToGraph(layers, edges, graph) {
  const nodeMap = new Map();

  // First pass: create all nodes
  layers.forEach((layer, layerIndex) => {
    if (layer.nodes) {
      layer.nodes.forEach(nodeData => {
        const node = new window.TreeVisualization.AdvancedNode({
          id: nodeData.id,
          name: nodeData.question || nodeData.name || 'Node',
          nodeType: nodeData.nodeType || 'decision',
          logicType: nodeData.logicType,
          branchCount: nodeData.numBranches,
          branchLabels: nodeData.branchLabels,
          position: {
            x: nodeData.x || 0,
            y: layerIndex * 150
          },
          metadata: nodeData.metadata
        });

        graph.addNode(node);
        nodeMap.set(nodeData.id, node);
      });
    }
  });

  // Second pass: create edges
  if (edges && Array.isArray(edges)) {
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, {
        label: edge.label || '',
        weight: edge.weight || 1
      });
    });
  }
}

/**
 * Convert nodes/edges structure to graph
 */
function convertNodesToGraph(nodes, edges, graph) {
  // Create nodes
  if (nodes && Array.isArray(nodes)) {
    nodes.forEach(nodeData => {
      const node = new window.TreeVisualization.AdvancedNode({
        id: nodeData.id,
        name: nodeData.name || nodeData.question || 'Node',
        nodeType: nodeData.type || nodeData.nodeType || 'decision',
        logicType: nodeData.logicType,
        position: {
          x: nodeData.x || 0,
          y: nodeData.y || 0
        }
      });

      graph.addNode(node);
    });
  }

  // Create edges
  if (edges && Array.isArray(edges)) {
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, {
        label: edge.label || ''
      });
    });
  }
}

export default useTreeGraph;
