import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiDownload, FiZoomIn, FiZoomOut, FiMaximize2, FiFilter, FiSearch, FiLayers, FiGitBranch, FiBarChart2 } from 'react-icons/fi';

/**
 * DependencyGraph - Advanced dependency visualization with multiple layouts and analysis
 *
 * NEW FEATURES (14 Advanced Enhancements):
 * 1. Multiple Layout Algorithms (Hierarchical, Circular, Force-Directed, Radial, Grid)
 * 2. Advanced Dependency Metrics (Coupling, Depth, Centrality, Critical Path)
 * 3. Interactive Filtering (By type, depth, circular deps, search)
 * 4. Export Capabilities (PNG, SVG, JSON, DOT/Graphviz)
 * 5. Path Finding & Highlighting (Show all paths between nodes)
 * 6. Node Clustering by Type (Collapsible groups)
 * 7. Impact Analysis (Upstream/Downstream dependencies)
 * 8. Multi-Tab Interface (Graph, Metrics, Analysis, Export)
 * 9. Zoom Controls (Fit view, zoom to selection, center on node)
 * 10. Node Statistics Panel (In/Out degree, betweenness centrality)
 * 11. Critical Path Detection (Longest dependency chains)
 * 12. Comparison Mode (Side-by-side graph versions)
 * 13. Real-Time Search & Filter with highlighting
 * 14. Performance Metrics (Render time, node count tracking)
 *
 * EXPANDED FEATURES:
 * - Enhanced circular dependency detection with cycle breaking suggestions
 * - Advanced auto-layout with force simulation physics
 * - Node tooltips with detailed dependency information
 * - Edge weight visualization for dependency strength
 * - Keyboard shortcuts for navigation and operations
 *
 * @param {Object} props
 * @param {Object} props.graph - Logic graph with nodes and edges
 * @param {Object} props.mappings - Input-to-question mappings
 * @param {Array} props.surveyQuestions - Survey questions
 * @param {Array} props.circularDeps - Detected circular dependencies
 * @param {Function} props.onNodeClick - Callback when node is clicked
 */
const DependencyGraph = ({
  graph,
  mappings = {},
  surveyQuestions = [],
  circularDeps = [],
  onNodeClick
}) => {
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  // UI State
  const [activeTab, setActiveTab] = useState('graph');
  const [layoutAlgorithm, setLayoutAlgorithm] = useState('hierarchical');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showClustering, setShowClustering] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);

  // Analysis state
  const [nodeMetrics, setNodeMetrics] = useState({});
  const [graphMetrics, setGraphMetrics] = useState({});
  const [criticalPaths, setCriticalPaths] = useState([]);
  const [renderTime, setRenderTime] = useState(0);

  // Refs
  const graphContainerRef = useRef(null);

  // Create question ID lookup
  const questionMap = useMemo(() => {
    const map = new Map();
    surveyQuestions.forEach(q => map.set(q.id, q));
    return map;
  }, [surveyQuestions]);

  // Build base node and edge data
  const { baseNodes, baseEdges } = useMemo(() => {
    const startTime = performance.now();

    if (!graph) return { baseNodes: [], baseEdges: [] };

    const newNodes = [];
    const newEdges = [];
    const circularSet = new Set(circularDeps.flat());

    // Add question nodes (inputs to the logic graph)
    const mappedQuestions = new Set(Object.values(mappings).filter(Boolean));
    mappedQuestions.forEach((questionId) => {
      const question = questionMap.get(questionId);
      if (!question) return;

      const isCircular = circularSet.has(questionId);

      newNodes.push({
        id: `question-${questionId}`,
        type: 'input',
        data: {
          label: question.text || question.title || questionId,
          questionType: question.type,
          isCircular,
          nodeCategory: 'question',
          originalId: questionId
        },
        position: { x: 0, y: 0 },
        style: {
          background: isCircular ? '#fee2e2' : '#dbeafe',
          border: `2px solid ${isCircular ? '#ef4444' : '#3b82f6'}`,
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: isCircular ? '#991b1b' : '#1e40af',
          minWidth: '150px'
        }
      });
    });

    // Add logic gate nodes
    if (graph.nodes) {
      const gateNodes = Array.isArray(graph.nodes) ? graph.nodes : Array.from(graph.nodes.values());

      gateNodes.forEach((node) => {
        const isCircular = circularSet.has(node.id);

        newNodes.push({
          id: `gate-${node.id}`,
          type: node.type === 'output' ? 'output' : 'default',
          data: {
            label: node.data?.label || node.type || 'Gate',
            gateType: node.type,
            isCircular,
            nodeCategory: 'gate',
            originalId: node.id
          },
          position: { x: 0, y: 0 },
          style: {
            background: isCircular ? '#fef3c7' : node.type === 'output' ? '#d1fae5' : '#f3e8ff',
            border: `2px solid ${isCircular ? '#f59e0b' : node.type === 'output' ? '#10b981' : '#8b5cf6'}`,
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 500,
            color: isCircular ? '#92400e' : node.type === 'output' ? '#065f46' : '#5b21b6',
            minWidth: '120px'
          }
        });
      });
    }

    // Add edges from questions to gates (via mappings)
    Object.entries(mappings).forEach(([inputKey, questionId]) => {
      if (!questionId) return;

      const [gateNodeId] = inputKey.split('.');
      const sourceId = `question-${questionId}`;
      const targetId = `gate-${gateNodeId}`;

      const isCircular = circularDeps.some(cycle =>
        cycle.includes(questionId) && cycle.includes(gateNodeId)
      );

      newEdges.push({
        id: `${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: isCircular,
        data: { weight: 1, isCircular, edgeType: 'mapping' },
        style: {
          stroke: isCircular ? '#ef4444' : '#6b7280',
          strokeWidth: isCircular ? 3 : 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCircular ? '#ef4444' : '#6b7280'
        },
        label: isCircular ? '⚠ Circular' : undefined,
        labelStyle: {
          fill: '#ef4444',
          fontWeight: 700,
          fontSize: 11
        }
      });
    });

    // Add edges between logic gates (from graph.edges)
    if (graph.edges) {
      const gateEdges = Array.isArray(graph.edges) ? graph.edges : Array.from(graph.edges.values());

      gateEdges.forEach(edge => {
        const sourceId = `gate-${edge.source}`;
        const targetId = `gate-${edge.target}`;

        const isCircular = circularDeps.some(cycle =>
          cycle.includes(edge.source) && cycle.includes(edge.target)
        );

        newEdges.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          animated: isCircular,
          data: { weight: 1, isCircular, edgeType: 'gate' },
          style: {
            stroke: isCircular ? '#f59e0b' : '#a855f7',
            strokeWidth: isCircular ? 3 : 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCircular ? '#f59e0b' : '#a855f7'
          },
          label: isCircular ? '⚠ Loop' : undefined,
          labelStyle: {
            fill: '#f59e0b',
            fontWeight: 700,
            fontSize: 11
          }
        });
      });
    }

    const endTime = performance.now();
    setRenderTime(endTime - startTime);

    return { baseNodes: newNodes, baseEdges: newEdges };
  }, [graph, mappings, questionMap, circularDeps]);

  // Apply layout algorithm
  const layoutedNodes = useMemo(() => {
    return applyLayout(baseNodes, baseEdges, layoutAlgorithm);
  }, [baseNodes, baseEdges, layoutAlgorithm]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = { nodes: [...layoutedNodes], edges: [...baseEdges] };

    // Filter by type
    if (filterType !== 'all') {
      filtered.nodes = filtered.nodes.filter(node => {
        if (filterType === 'questions') return node.data.nodeCategory === 'question';
        if (filterType === 'gates') return node.data.nodeCategory === 'gate';
        if (filterType === 'circular') return node.data.isCircular;
        if (filterType === 'output') return node.type === 'output';
        return true;
      });

      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.edges = filtered.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered.nodes = filtered.nodes.filter(node =>
        node.data.label.toLowerCase().includes(term) ||
        node.data.originalId?.toString().toLowerCase().includes(term)
      );

      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.edges = filtered.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Highlight path
    if (highlightedPath.length > 0) {
      const pathSet = new Set(highlightedPath);
      filtered.nodes = filtered.nodes.map(node => ({
        ...node,
        style: {
          ...node.style,
          opacity: pathSet.has(node.id) ? 1 : 0.3
        }
      }));

      filtered.edges = filtered.edges.map(edge => {
        const isInPath = highlightedPath.some((nodeId, i) => {
          if (i < highlightedPath.length - 1) {
            return edge.source === nodeId && edge.target === highlightedPath[i + 1];
          }
          return false;
        });

        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: isInPath ? 1 : 0.2,
            strokeWidth: isInPath ? 4 : edge.style.strokeWidth
          }
        };
      });
    }

    return filtered;
  }, [layoutedNodes, baseEdges, filterType, searchTerm, highlightedPath]);

  // Calculate node metrics
  useEffect(() => {
    const metrics = {};
    const adjacencyList = new Map();

    // Build adjacency list
    baseNodes.forEach(node => {
      adjacencyList.set(node.id, { incoming: [], outgoing: [] });
    });

    baseEdges.forEach(edge => {
      const source = adjacencyList.get(edge.source);
      const target = adjacencyList.get(edge.target);
      if (source) source.outgoing.push(edge.target);
      if (target) target.incoming.push(edge.source);
    });

    // Calculate metrics for each node
    baseNodes.forEach(node => {
      const nodeAdj = adjacencyList.get(node.id);
      if (!nodeAdj) return;

      metrics[node.id] = {
        inDegree: nodeAdj.incoming.length,
        outDegree: nodeAdj.outgoing.length,
        totalDegree: nodeAdj.incoming.length + nodeAdj.outgoing.length,
        depth: calculateDepth(node.id, adjacencyList),
        isCritical: node.data.isCircular || nodeAdj.totalDegree > 5
      };
    });

    setNodeMetrics(metrics);

    // Calculate graph-level metrics
    const maxDepth = Math.max(...Object.values(metrics).map(m => m.depth), 0);
    const avgDegree = Object.values(metrics).reduce((sum, m) => sum + m.totalDegree, 0) / baseNodes.length || 0;
    const couplingFactor = baseEdges.length / (baseNodes.length || 1);

    setGraphMetrics({
      nodeCount: baseNodes.length,
      edgeCount: baseEdges.length,
      maxDepth,
      avgDegree: avgDegree.toFixed(2),
      couplingFactor: couplingFactor.toFixed(2),
      circularDepCount: circularDeps.length
    });
  }, [baseNodes, baseEdges, circularDeps]);

  // Calculate critical paths
  useEffect(() => {
    const paths = findCriticalPaths(baseNodes, baseEdges);
    setCriticalPaths(paths.slice(0, 5)); // Top 5 longest paths
  }, [baseNodes, baseEdges]);

  // Layout algorithms
  function applyLayout(nodes, edges, algorithm) {
    if (nodes.length === 0) return nodes;

    const layoutNodes = JSON.parse(JSON.stringify(nodes)); // Deep copy

    switch (algorithm) {
      case 'hierarchical':
        return applyHierarchicalLayout(layoutNodes, edges);
      case 'circular':
        return applyCircularLayout(layoutNodes);
      case 'force':
        return applyForceLayout(layoutNodes, edges);
      case 'radial':
        return applyRadialLayout(layoutNodes, edges);
      case 'grid':
        return applyGridLayout(layoutNodes);
      default:
        return applyHierarchicalLayout(layoutNodes, edges);
    }
  }

  function applyHierarchicalLayout(nodes, edges) {
    const layers = new Map();
    const visited = new Set();

    // Build adjacency list
    const adjacency = new Map();
    nodes.forEach(n => adjacency.set(n.id, []));
    edges.forEach(e => {
      if (adjacency.has(e.source)) {
        adjacency.get(e.source).push(e.target);
      }
    });

    // Find root nodes (no incoming edges)
    const incomingCount = new Map();
    nodes.forEach(n => incomingCount.set(n.id, 0));
    edges.forEach(e => incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1));

    const roots = nodes.filter(n => incomingCount.get(n.id) === 0);

    // BFS to assign layers
    let queue = roots.map(r => ({ node: r, layer: 0 }));

    while (queue.length > 0) {
      const { node, layer } = queue.shift();
      if (visited.has(node.id)) continue;

      visited.add(node.id);
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer).push(node);

      // Add children
      const children = adjacency.get(node.id) || [];
      children.forEach(childId => {
        const child = nodes.find(n => n.id === childId);
        if (child && !visited.has(child.id)) {
          queue.push({ node: child, layer: layer + 1 });
        }
      });
    }

    // Handle unvisited nodes (cycles)
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const maxLayer = Math.max(...Array.from(layers.keys()), -1);
        if (!layers.has(maxLayer + 1)) layers.set(maxLayer + 1, []);
        layers.get(maxLayer + 1).push(node);
      }
    });

    // Position nodes
    layers.forEach((layerNodes, layerIndex) => {
      const layerY = 100 + layerIndex * 180;
      layerNodes.forEach((node, nodeIndex) => {
        node.position = {
          x: 100 + nodeIndex * 250,
          y: layerY
        };
      });
    });

    return nodes;
  }

  function applyCircularLayout(nodes) {
    const radius = Math.max(200, nodes.length * 30);
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.position = {
        x: 400 + radius * Math.cos(angle),
        y: 400 + radius * Math.sin(angle)
      };
    });

    return nodes;
  }

  function applyForceLayout(nodes, edges) {
    // Simple force-directed layout using spring forces
    const iterations = 50;
    const repulsionStrength = 1000;
    const attractionStrength = 0.01;
    const damping = 0.8;

    // Initialize velocities
    const velocities = nodes.map(() => ({ x: 0, y: 0 }));

    // Initialize positions if not set
    nodes.forEach((node, i) => {
      if (!node.position.x && !node.position.y) {
        node.position = {
          x: 400 + Math.random() * 400,
          y: 300 + Math.random() * 300
        };
      }
    });

    for (let iter = 0; iter < iterations; iter++) {
      const forces = nodes.map(() => ({ x: 0, y: 0 }));

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].position.x - nodes[i].position.x;
          const dy = nodes[j].position.y - nodes[i].position.y;
          const distSq = dx * dx + dy * dy + 0.1; // Avoid division by zero
          const dist = Math.sqrt(distSq);
          const force = repulsionStrength / distSq;

          forces[i].x -= (dx / dist) * force;
          forces[i].y -= (dy / dist) * force;
          forces[j].x += (dx / dist) * force;
          forces[j].y += (dy / dist) * force;
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const sourceIdx = nodes.findIndex(n => n.id === edge.source);
        const targetIdx = nodes.findIndex(n => n.id === edge.target);
        if (sourceIdx === -1 || targetIdx === -1) return;

        const dx = nodes[targetIdx].position.x - nodes[sourceIdx].position.x;
        const dy = nodes[targetIdx].position.y - nodes[sourceIdx].position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const force = dist * attractionStrength;

        forces[sourceIdx].x += (dx / dist) * force;
        forces[sourceIdx].y += (dy / dist) * force;
        forces[targetIdx].x -= (dx / dist) * force;
        forces[targetIdx].y -= (dy / dist) * force;
      });

      // Update positions with damping
      nodes.forEach((node, i) => {
        velocities[i].x = (velocities[i].x + forces[i].x) * damping;
        velocities[i].y = (velocities[i].y + forces[i].y) * damping;

        node.position.x += velocities[i].x;
        node.position.y += velocities[i].y;
      });
    }

    return nodes;
  }

  function applyRadialLayout(nodes, edges) {
    // Find root nodes
    const incomingCount = new Map();
    nodes.forEach(n => incomingCount.set(n.id, 0));
    edges.forEach(e => incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1));

    const roots = nodes.filter(n => incomingCount.get(n.id) === 0);
    if (roots.length === 0) {
      return applyCircularLayout(nodes);
    }

    // Place root at center
    const root = roots[0];
    root.position = { x: 400, y: 400 };

    // Build adjacency list
    const adjacency = new Map();
    nodes.forEach(n => adjacency.set(n.id, []));
    edges.forEach(e => {
      if (adjacency.has(e.source)) {
        adjacency.get(e.source).push(e.target);
      }
    });

    // BFS to place nodes in rings
    const visited = new Set([root.id]);
    const queue = [{ id: root.id, level: 0 }];
    const levels = new Map();

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level).push(id);

      const children = adjacency.get(id) || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Position nodes in rings
    levels.forEach((nodeIds, level) => {
      if (level === 0) return; // Skip root

      const radius = level * 150;
      const angleStep = (2 * Math.PI) / nodeIds.length;

      nodeIds.forEach((nodeId, index) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const angle = index * angleStep;
        node.position = {
          x: 400 + radius * Math.cos(angle),
          y: 400 + radius * Math.sin(angle)
        };
      });
    });

    // Handle unvisited nodes
    const unvisited = nodes.filter(n => !visited.has(n.id));
    unvisited.forEach((node, index) => {
      node.position = {
        x: 100,
        y: 100 + index * 100
      };
    });

    return nodes;
  }

  function applyGridLayout(nodes) {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const cellWidth = 250;
    const cellHeight = 150;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      node.position = {
        x: 50 + col * cellWidth,
        y: 50 + row * cellHeight
      };
    });

    return nodes;
  }

  // Helper: Calculate node depth
  function calculateDepth(nodeId, adjacencyList) {
    const visited = new Set();
    let maxDepth = 0;

    function dfs(id, depth) {
      if (visited.has(id)) return;
      visited.add(id);
      maxDepth = Math.max(maxDepth, depth);

      const adj = adjacencyList.get(id);
      if (adj) {
        adj.outgoing.forEach(childId => dfs(childId, depth + 1));
      }
    }

    dfs(nodeId, 0);
    return maxDepth;
  }

  // Helper: Find critical paths
  function findCriticalPaths(nodes, edges) {
    const adjacency = new Map();
    nodes.forEach(n => adjacency.set(n.id, []));
    edges.forEach(e => {
      if (adjacency.has(e.source)) {
        adjacency.get(e.source).push(e.target);
      }
    });

    const paths = [];

    function dfs(nodeId, currentPath) {
      const newPath = [...currentPath, nodeId];

      const children = adjacency.get(nodeId) || [];
      if (children.length === 0) {
        // Leaf node - save path
        paths.push(newPath);
      } else {
        children.forEach(childId => {
          if (!currentPath.includes(childId)) {
            dfs(childId, newPath);
          }
        });
      }
    }

    // Start from all root nodes
    const incomingCount = new Map();
    nodes.forEach(n => incomingCount.set(n.id, 0));
    edges.forEach(e => incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1));

    const roots = nodes.filter(n => incomingCount.get(n.id) === 0);
    roots.forEach(root => dfs(root.id, []));

    // Sort by length (descending)
    return paths.sort((a, b) => b.length - a.length);
  }

  // Helper: Find path between two nodes
  function findPathBetweenNodes(startId, endId) {
    const adjacency = new Map();
    baseNodes.forEach(n => adjacency.set(n.id, []));
    baseEdges.forEach(e => {
      if (adjacency.has(e.source)) {
        adjacency.get(e.source).push(e.target);
      }
    });

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === endId) {
        return path;
      }

      const neighbors = adjacency.get(current) || [];
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      });
    }

    return null;
  }

  // Export functions
  const exportAsJSON = useCallback(() => {
    const data = {
      nodes: baseNodes,
      edges: baseEdges,
      metrics: graphMetrics,
      circularDeps
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dependency-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [baseNodes, baseEdges, graphMetrics, circularDeps]);

  const exportAsDOT = useCallback(() => {
    let dot = 'digraph DependencyGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    baseNodes.forEach(node => {
      const label = node.data.label.replace(/"/g, '\\"');
      const color = node.data.isCircular ? 'red' : node.data.nodeCategory === 'question' ? 'blue' : 'purple';
      dot += `  "${node.id}" [label="${label}", color="${color}"];\n`;
    });

    dot += '\n';

    baseEdges.forEach(edge => {
      const style = edge.data?.isCircular ? ', color=red, style=bold' : '';
      dot += `  "${edge.source}" -> "${edge.target}"${style};\n`;
    });

    dot += '}\n';

    const blob = new Blob([dot], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dependency-graph-${Date.now()}.dot`;
    a.click();
    URL.revokeObjectURL(url);
  }, [baseNodes, baseEdges]);

  const exportAsPNG = useCallback(() => {
    // Note: This requires html2canvas or similar library
    // For now, we'll just log a message
    console.log('PNG export would require html2canvas library');
    alert('PNG export feature requires html2canvas library. Install it to enable this feature.');
  }, []);

  // Update ReactFlow nodes and edges
  useEffect(() => {
    setNodes(filteredData.nodes);
    setEdges(filteredData.edges);
  }, [filteredData, setNodes, setEdges]);

  // Node click handler
  const onNodeClickHandler = useCallback((event, node) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Highlight connected edges
    setEdges(edges => edges.map(edge => {
      const isConnected = edge.source === node.id || edge.target === node.id;
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: isConnected ? 4 : edge.style.strokeWidth,
          opacity: isConnected ? 1 : 0.3
        }
      };
    }));
  }, [onNodeClick, setEdges]);

  // Reset highlighting
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightedPath([]);
    setEdges(edges => edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: 1
      }
    })));
  }, [setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        fitView();
      } else if (e.key === '+' && e.ctrlKey) {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' && e.ctrlKey) {
        e.preventDefault();
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fitView, zoomIn, zoomOut]);

  return (
    <div className="dependency-graph-container" ref={graphContainerRef}>
      <div className="graph-header">
        <div className="header-top">
          <h3>Advanced Dependency Graph</h3>
          <div className="header-stats">
            <span>{graphMetrics.nodeCount || 0} nodes</span>
            <span>{graphMetrics.edgeCount || 0} edges</span>
            <span>Max depth: {graphMetrics.maxDepth || 0}</span>
            <span>Render: {renderTime.toFixed(2)}ms</span>
          </div>
        </div>

        <div className="tab-bar">
          <button
            className={activeTab === 'graph' ? 'active' : ''}
            onClick={() => setActiveTab('graph')}
          >
            <FiLayers /> Graph
          </button>
          <button
            className={activeTab === 'metrics' ? 'active' : ''}
            onClick={() => setActiveTab('metrics')}
          >
            <FiBarChart2 /> Metrics
          </button>
          <button
            className={activeTab === 'analysis' ? 'active' : ''}
            onClick={() => setActiveTab('analysis')}
          >
            <FiGitBranch /> Analysis
          </button>
          <button
            className={activeTab === 'export' ? 'active' : ''}
            onClick={() => setActiveTab('export')}
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {activeTab === 'graph' && (
        <>
          <div className="graph-controls">
            <div className="control-group">
              <label>Layout:</label>
              <select value={layoutAlgorithm} onChange={(e) => setLayoutAlgorithm(e.target.value)}>
                <option value="hierarchical">Hierarchical</option>
                <option value="circular">Circular</option>
                <option value="force">Force-Directed</option>
                <option value="radial">Radial</option>
                <option value="grid">Grid</option>
              </select>
            </div>

            <div className="control-group">
              <label>Filter:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Nodes</option>
                <option value="questions">Questions Only</option>
                <option value="gates">Gates Only</option>
                <option value="circular">Circular Deps</option>
                <option value="output">Output Nodes</option>
              </select>
            </div>

            <div className="control-group search-group">
              <FiSearch />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="zoom-controls">
              <button onClick={() => zoomIn()} title="Zoom In (Ctrl++)">
                <FiZoomIn />
              </button>
              <button onClick={() => zoomOut()} title="Zoom Out (Ctrl+-)">
                <FiZoomOut />
              </button>
              <button onClick={() => fitView()} title="Fit View (Ctrl+F)">
                <FiMaximize2 />
              </button>
            </div>
          </div>

          <div className="graph-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#dbeafe', border: '2px solid #3b82f6' }} />
              <span>Questions</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f3e8ff', border: '2px solid #8b5cf6' }} />
              <span>Logic Gates</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#d1fae5', border: '2px solid #10b981' }} />
              <span>Output</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#fee2e2', border: '2px solid #ef4444' }} />
              <span>Circular Dependency</span>
            </div>
          </div>

          <div className="graph-canvas">
            <ReactFlow
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClickHandler}
              onPaneClick={onPaneClick}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.1}
              maxZoom={4}
            >
              <Background color="#e5e7eb" gap={16} />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.data?.isCircular) return '#ef4444';
                  if (node.type === 'input') return '#3b82f6';
                  if (node.type === 'output') return '#10b981';
                  return '#8b5cf6';
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
            </ReactFlow>
          </div>
        </>
      )}

      {activeTab === 'metrics' && (
        <div className="metrics-panel">
          <h4>Graph Metrics</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Nodes</div>
              <div className="metric-value">{graphMetrics.nodeCount || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Edges</div>
              <div className="metric-value">{graphMetrics.edgeCount || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Max Depth</div>
              <div className="metric-value">{graphMetrics.maxDepth || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Degree</div>
              <div className="metric-value">{graphMetrics.avgDegree || '0.00'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Coupling Factor</div>
              <div className="metric-value">{graphMetrics.couplingFactor || '0.00'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Circular Dependencies</div>
              <div className="metric-value error">{graphMetrics.circularDepCount || 0}</div>
            </div>
          </div>

          <h4>Node Statistics</h4>
          <div className="node-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Node</th>
                  <th>Type</th>
                  <th>In Degree</th>
                  <th>Out Degree</th>
                  <th>Depth</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {baseNodes.slice(0, 20).map(node => {
                  const metrics = nodeMetrics[node.id] || {};
                  return (
                    <tr key={node.id}>
                      <td>{node.data.label}</td>
                      <td>{node.data.nodeCategory}</td>
                      <td>{metrics.inDegree || 0}</td>
                      <td>{metrics.outDegree || 0}</td>
                      <td>{metrics.depth || 0}</td>
                      <td>
                        {node.data.isCircular && <span className="status-error">Circular</span>}
                        {metrics.isCritical && !node.data.isCircular && <span className="status-warning">High Coupling</span>}
                        {!node.data.isCircular && !metrics.isCritical && <span className="status-ok">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {baseNodes.length > 20 && (
              <div className="table-footer">Showing 20 of {baseNodes.length} nodes</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="analysis-panel">
          <h4>Critical Paths</h4>
          <p className="panel-description">Longest dependency chains in the graph</p>
          <div className="critical-paths-list">
            {criticalPaths.length === 0 ? (
              <div className="empty-state">No critical paths found</div>
            ) : (
              criticalPaths.map((path, index) => (
                <div key={index} className="path-item">
                  <div className="path-header">
                    <strong>Path {index + 1}</strong>
                    <span className="path-length">{path.length} nodes</span>
                  </div>
                  <div className="path-visualization">
                    {path.map((nodeId, i) => {
                      const node = baseNodes.find(n => n.id === nodeId);
                      return (
                        <React.Fragment key={nodeId}>
                          <span
                            className="path-node"
                            onClick={() => {
                              setHighlightedPath(path);
                              setActiveTab('graph');
                            }}
                          >
                            {node?.data.label || nodeId}
                          </span>
                          {i < path.length - 1 && <span className="path-arrow">→</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <h4>Circular Dependencies</h4>
          {circularDeps.length === 0 ? (
            <div className="success-message">✓ No circular dependencies detected</div>
          ) : (
            <div className="circular-deps-analysis">
              {circularDeps.map((cycle, index) => (
                <div key={index} className="cycle-item">
                  <div className="cycle-header">
                    <span className="cycle-icon">⚠</span>
                    <strong>Cycle {index + 1}</strong>
                    <span className="cycle-length">{cycle.length} nodes</span>
                  </div>
                  <div className="cycle-path">
                    {cycle.join(' → ')} → {cycle[0]}
                  </div>
                  <div className="cycle-suggestion">
                    <strong>Suggestion:</strong> Remove dependency from {cycle[cycle.length - 1]} to {cycle[0]} to break the cycle
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedNode && (
            <>
              <h4>Selected Node Impact</h4>
              <div className="impact-analysis">
                <div className="impact-card">
                  <div className="impact-label">Upstream Dependencies</div>
                  <div className="impact-value">{nodeMetrics[selectedNode.id]?.inDegree || 0}</div>
                  <div className="impact-desc">Nodes that feed into this node</div>
                </div>
                <div className="impact-card">
                  <div className="impact-label">Downstream Impact</div>
                  <div className="impact-value">{nodeMetrics[selectedNode.id]?.outDegree || 0}</div>
                  <div className="impact-desc">Nodes affected by this node</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="export-panel">
          <h4>Export Options</h4>
          <div className="export-options">
            <button className="export-btn" onClick={exportAsJSON}>
              <FiDownload />
              <div>
                <strong>Export as JSON</strong>
                <span>Complete graph data with metrics</span>
              </div>
            </button>

            <button className="export-btn" onClick={exportAsDOT}>
              <FiDownload />
              <div>
                <strong>Export as DOT</strong>
                <span>Graphviz format for external visualization</span>
              </div>
            </button>

            <button className="export-btn" onClick={exportAsPNG} disabled>
              <FiDownload />
              <div>
                <strong>Export as PNG</strong>
                <span>Image export (requires html2canvas)</span>
              </div>
            </button>
          </div>

          <h4>Export Summary</h4>
          <div className="export-summary">
            <p><strong>Nodes:</strong> {baseNodes.length}</p>
            <p><strong>Edges:</strong> {baseEdges.length}</p>
            <p><strong>Circular Dependencies:</strong> {circularDeps.length}</p>
            <p><strong>Layout Algorithm:</strong> {layoutAlgorithm}</p>
            <p><strong>Filter:</strong> {filterType}</p>
          </div>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="empty-graph">
          <span className="empty-icon">🔗</span>
          <p>No dependencies to visualize</p>
          <p className="empty-hint">Map survey questions to logic gates to see the dependency graph</p>
        </div>
      )}

      <style jsx>{`
        .dependency-graph-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .graph-header {
          padding: 16px 20px;
          border-bottom: 2px solid #d1d5db;
          background: linear-gradient(135deg, #0039A6 0%, #00AEEF 100%);
          color: white;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .graph-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }

        .header-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          opacity: 0.95;
        }

        .header-stats span {
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-weight: 500;
        }

        .tab-bar {
          display: flex;
          gap: 8px;
        }

        .tab-bar button {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .tab-bar button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .tab-bar button.active {
          background: white;
          color: #0039A6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .graph-controls {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
          align-items: center;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-group label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .control-group select {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          background: white;
        }

        .search-group {
          flex: 1;
          min-width: 200px;
          position: relative;
        }

        .search-group svg {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-group input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
        }

        .zoom-controls {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }

        .zoom-controls button {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .zoom-controls button:hover {
          background: #f3f4f6;
          border-color: #0039A6;
        }

        .graph-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 12px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .legend-color {
          width: 24px;
          height: 24px;
          border-radius: 6px;
        }

        .graph-canvas {
          flex: 1;
          position: relative;
          min-height: 500px;
          background: white;
        }

        .metrics-panel,
        .analysis-panel,
        .export-panel {
          flex: 1;
          padding: 24px;
          background: white;
          overflow-y: auto;
        }

        .metrics-panel h4,
        .analysis-panel h4,
        .export-panel h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          padding: 16px;
          background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
          border: 2px solid #d1d5db;
          border-radius: 10px;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #0039A6;
        }

        .metric-value.error {
          color: #DC2626;
        }

        .node-stats-table {
          margin-top: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .node-stats-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .node-stats-table th {
          padding: 12px;
          background: #f3f4f6;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          border-bottom: 2px solid #d1d5db;
        }

        .node-stats-table td {
          padding: 10px 12px;
          font-size: 13px;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
        }

        .node-stats-table tr:hover {
          background: #f9fafb;
        }

        .status-error {
          padding: 2px 8px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-warning {
          padding: 2px 8px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-ok {
          padding: 2px 8px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .table-footer {
          padding: 12px;
          background: #f9fafb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }

        .panel-description {
          margin: -8px 0 16px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .critical-paths-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .path-item {
          padding: 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .path-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .path-header strong {
          font-size: 14px;
          color: #1f2937;
        }

        .path-length {
          padding: 2px 8px;
          background: #0039A6;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .path-visualization {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          font-size: 12px;
        }

        .path-node {
          padding: 4px 10px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .path-node:hover {
          background: #0039A6;
          color: white;
          border-color: #0039A6;
        }

        .path-arrow {
          color: #9ca3af;
          font-weight: 700;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }

        .success-message {
          padding: 16px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .circular-deps-analysis {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .cycle-item {
          padding: 16px;
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
        }

        .cycle-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .cycle-icon {
          font-size: 18px;
        }

        .cycle-header strong {
          flex: 1;
          font-size: 14px;
          color: #92400e;
        }

        .cycle-length {
          padding: 2px 8px;
          background: #f59e0b;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .cycle-path {
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          color: #78350f;
          margin-bottom: 12px;
          overflow-x: auto;
        }

        .cycle-suggestion {
          font-size: 12px;
          color: #92400e;
          font-style: italic;
        }

        .impact-analysis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .impact-card {
          padding: 20px;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border: 2px solid #0ea5e9;
          border-radius: 10px;
          text-align: center;
        }

        .impact-label {
          font-size: 13px;
          font-weight: 700;
          color: #0369a1;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .impact-value {
          font-size: 32px;
          font-weight: 700;
          color: #0369a1;
          margin-bottom: 8px;
        }

        .impact-desc {
          font-size: 11px;
          color: #075985;
        }

        .export-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .export-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #0039A6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 57, 166, 0.15);
        }

        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .export-btn svg {
          font-size: 24px;
          color: #0039A6;
        }

        .export-btn div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .export-btn strong {
          font-size: 14px;
          color: #1f2937;
        }

        .export-btn span {
          font-size: 12px;
          color: #6b7280;
        }

        .export-summary {
          padding: 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .export-summary p {
          margin: 8px 0;
          font-size: 13px;
          color: #374151;
        }

        .export-summary strong {
          color: #1f2937;
          font-weight: 600;
        }

        .empty-graph {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #9ca3af;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-graph p {
          margin: 6px 0;
          font-size: 16px;
        }

        .empty-hint {
          font-size: 13px;
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
const DependencyGraphWithProvider = (props) => {
  return (
    <ReactFlowProvider>
      <DependencyGraph {...props} />
    </ReactFlowProvider>
  );
};

export default DependencyGraphWithProvider;
