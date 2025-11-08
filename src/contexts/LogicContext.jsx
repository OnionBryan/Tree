import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Logic Store Context
 * Manages the logic graph, nodes, edges, and canvas state
 */

const LogicContext = createContext(null);

export const useLogicStore = () => {
  const context = useContext(LogicContext);
  if (!context) {
    throw new Error('useLogicStore must be used within LogicProvider');
  }
  return context;
};

export const LogicProvider = ({ children }) => {
  const [graph, setGraph] = useState(null);
  const [nodes, setNodes] = useState(new Map());
  const [edges, setEdges] = useState(new Map());
  const [selectedNode, setSelectedNode] = useState(null);
  const [canvasState, setCanvasState] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    snapToGrid: true
  });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize graph
  useEffect(() => {
    if (typeof window !== 'undefined' && window.TreeVisualization) {
      const newGraph = new window.TreeVisualization.LogicGraph({
        name: 'Main Logic Graph',
        type: 'dag',
        allowCycles: false
      });
      setGraph(newGraph);
      console.log('[LogicStore] Graph initialized');
    }
  }, []);

  // Add node
  const addNode = useCallback((nodeConfig) => {
    if (!graph) return null;

    try {
      const node = new window.TreeVisualization.AdvancedNode(nodeConfig);
      graph.addNode(node);
      setNodes(new Map(graph.nodes));

      // Save to history
      saveToHistory();

      console.log('[LogicStore] Added node:', node.id);
      return node;
    } catch (error) {
      console.error('[LogicStore] Failed to add node:', error);
      return null;
    }
  }, [graph]);

  // Remove node
  const removeNode = useCallback((nodeId) => {
    if (!graph) return;

    try {
      graph.removeNode(nodeId);
      setNodes(new Map(graph.nodes));
      setEdges(new Map(graph.edges));

      // Clear selection if deleted node was selected
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }

      saveToHistory();
      console.log('[LogicStore] Removed node:', nodeId);
    } catch (error) {
      console.error('[LogicStore] Failed to remove node:', error);
    }
  }, [graph, selectedNode]);

  // Update node
  const updateNode = useCallback((nodeId, updates) => {
    if (!graph) return;

    try {
      const node = graph.nodes.get(nodeId);
      if (node) {
        Object.assign(node, updates);
        setNodes(new Map(graph.nodes));
        saveToHistory();
        console.log('[LogicStore] Updated node:', nodeId);
      }
    } catch (error) {
      console.error('[LogicStore] Failed to update node:', error);
    }
  }, [graph]);

  // Add edge
  const addEdge = useCallback((sourceId, targetId, edgeConfig = {}) => {
    if (!graph) return null;

    try {
      const edge = graph.addEdge(sourceId, targetId, edgeConfig);
      setEdges(new Map(graph.edges));
      saveToHistory();
      console.log('[LogicStore] Added edge:', edge.id);
      return edge;
    } catch (error) {
      console.error('[LogicStore] Failed to add edge:', error);
      return null;
    }
  }, [graph]);

  // Remove edge
  const removeEdge = useCallback((edgeId) => {
    if (!graph) return;

    try {
      graph.removeEdge(edgeId);
      setEdges(new Map(graph.edges));
      saveToHistory();
      console.log('[LogicStore] Removed edge:', edgeId);
    } catch (error) {
      console.error('[LogicStore] Failed to remove edge:', error);
    }
  }, [graph]);

  // Save to history (for undo/redo)
  const saveToHistory = useCallback(() => {
    if (!graph) return;

    const graphSnapshot = graph.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(graphSnapshot);

    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  }, [graph, history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const snapshot = history[historyIndex - 1];
      loadFromJSON(snapshot);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const snapshot = history[historyIndex + 1];
      loadFromJSON(snapshot);
    }
  }, [historyIndex, history]);

  // Export graph to JSON
  const exportGraph = useCallback(() => {
    if (!graph) return null;
    return graph.toJSON();
  }, [graph]);

  // Import graph from JSON
  const importGraph = useCallback((jsonData) => {
    if (!graph) return;

    try {
      graph.fromJSON(jsonData);
      setNodes(new Map(graph.nodes));
      setEdges(new Map(graph.edges));
      saveToHistory();
      console.log('[LogicStore] Imported graph');
    } catch (error) {
      console.error('[LogicStore] Failed to import graph:', error);
    }
  }, [graph]);

  // Load from JSON
  const loadFromJSON = useCallback((jsonData) => {
    if (!graph) return;

    try {
      graph.fromJSON(jsonData);
      setNodes(new Map(graph.nodes));
      setEdges(new Map(graph.edges));
      console.log('[LogicStore] Loaded graph from JSON');
    } catch (error) {
      console.error('[LogicStore] Failed to load from JSON:', error);
    }
  }, [graph]);

  // Clear graph
  const clearGraph = useCallback(() => {
    if (!graph) return;

    graph.nodes.clear();
    graph.edges.clear();
    setNodes(new Map());
    setEdges(new Map());
    setSelectedNode(null);
    saveToHistory();
    console.log('[LogicStore] Cleared graph');
  }, [graph]);

  // Set advanced graph (for compatibility with CanvasLogicBuilder)
  const setAdvancedGraph = useCallback((newGraph) => {
    setGraph(newGraph);
    setNodes(new Map(newGraph.nodes));
    setEdges(new Map(newGraph.edges));
  }, []);

  const value = {
    graph,
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    canvasState,
    setCanvasState,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    exportGraph,
    importGraph,
    clearGraph,
    setAdvancedGraph,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };

  return (
    <LogicContext.Provider value={value}>
      {children}
    </LogicContext.Provider>
  );
};
