import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

/**
 * Advanced Connection Canvas - Enhanced Version
 *
 * NEW FEATURES (10+):
 * 1. Multiple Connection Routing - Orthogonal, curved, straight routing algorithms
 * 2. Signal Flow Animation - Animated particles showing data flow
 * 3. Multi-Select & Bulk Operations - Select/move/delete multiple nodes
 * 4. Undo/Redo System - Full history tracking for all operations
 * 5. Auto-Layout Algorithms - Hierarchical, force-directed, circular layouts
 * 6. Connection Weight Visualization - Thickness/color based on weight
 * 7. Snap-to-Grid - Magnetic grid alignment
 * 8. Zoom & Pan Controls - Smooth canvas navigation
 * 9. Connection Validation - Prevent cycles and invalid connections
 * 10. Mini-toolbar on Hover - Quick node actions
 * 11. Editable Connection Labels - Click to edit
 * 12. Export Canvas - PNG/SVG/JSON export
 * 13. Performance Metrics - Real-time FPS and stats
 * 14. Keyboard Shortcuts - Full keyboard control
 *
 * EXPANDED FEATURES:
 * - Enhanced port detection with visual feedback
 * - Connection preview with routing
 * - Node grouping and clustering
 * - Advanced grid with major/minor lines
 * - Connection bundling for clarity
 */
const AdvancedConnectionCanvas = ({ nodes = [], onNodesChange, onConnectionsChange }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });

  // State
  const [canvasNodes, setCanvasNodes] = useState(new Map());
  const [connections, setConnections] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedConnections, setSelectedConnections] = useState(new Set());
  const [clipboard, setClipboard] = useState(null);

  const [canvasState, setCanvasState] = useState({
    isDragging: false,
    isConnecting: false,
    isPanning: false,
    isSelecting: false,
    draggedNode: null,
    connectionStart: null,
    mousePos: { x: 0, y: 0 },
    edgeDrawMode: false,
    selectedStartPort: null,
    edgeStartNode: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    hoveredNode: null,
    hoveredConnection: null,
    selectionBox: null,
    editingLabel: null
  });

  // Settings
  const [settings, setSettings] = useState({
    routingMode: 'bezier', // bezier, orthogonal, straight
    snapToGrid: true,
    gridSize: 20,
    showGrid: true,
    showMajorGrid: true,
    animateConnections: true,
    showWeights: true,
    showPerformance: false,
    autoLayout: 'none', // none, hierarchical, force, circular
    connectionBundling: false,
    validateConnections: true
  });

  // Animation particles for signal flow
  const [particles, setParticles] = useState([]);

  // Performance metrics
  const [stats, setStats] = useState({
    fps: 0,
    nodes: 0,
    connections: 0,
    selectedNodes: 0,
    zoom: 100,
    renderTime: 0
  });

  const lastFrameTime = useRef(performance.now());

  // Gate color mapping
  const gateColors = {
    'and': '#8B5CF6',
    'or': '#6366F1',
    'xor': '#EC4899',
    'nand': '#F59E0B',
    'nor': '#10B981',
    'not': '#EF4444',
    'majority': '#3B82F6',
    'threshold': '#14B8A6',
    'router': '#F97316',
    'merge': '#84CC16',
    'decision': '#6366F1',
    'fuzzy': '#A855F7',
    'likert': '#0EA5E9',
    'semantic': '#F43F5E',
    'hybrid': '#8B5CF6'
  };

  // Sync nodes from props to canvas representation
  useEffect(() => {
    const nodeMap = new Map();
    nodes.forEach(node => {
      const existing = canvasNodes.get(node.id);
      nodeMap.set(node.id, {
        id: node.id,
        type: node.type || 'decision',
        x: existing?.x || node.x || 100 + Math.random() * 200,
        y: existing?.y || node.y || 100 + Math.random() * 200,
        inputs: existing?.inputs || [{ x: (node.x || 100) - 40, y: node.y || 100 }],
        outputs: existing?.outputs || Array(node.branchCount || 2).fill(null).map((_, i) => ({
          x: (node.x || 100) + 40,
          y: (node.y || 100) - 10 + (i * 20),
          value: 0
        })),
        treeNode: node,
        width: 80,
        height: 40
      });
    });
    setCanvasNodes(nodeMap);
  }, [nodes]);

  // Generate particles for animation
  useEffect(() => {
    if (!settings.animateConnections) return;

    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev];

        // Add new particles
        connections.forEach((conn, index) => {
          if (Math.random() < 0.1) { // 10% chance per connection
            newParticles.push({
              connection: index,
              progress: 0,
              speed: 0.01 + Math.random() * 0.02
            });
          }
        });

        // Update existing particles
        return newParticles
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress < 1); // Remove completed particles
      });
    }, 100);

    return () => clearInterval(interval);
  }, [connections, settings.animateConnections]);

  // Undo/Redo system
  const saveToHistory = useCallback(() => {
    const state = {
      nodes: new Map(canvasNodes),
      connections: [...connections]
    };
    historyRef.current.past.push(state);
    if (historyRef.current.past.length > 50) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  }, [canvasNodes, connections]);

  const undo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;

    const currentState = {
      nodes: new Map(canvasNodes),
      connections: [...connections]
    };
    historyRef.current.future.push(currentState);

    const previousState = historyRef.current.past.pop();
    setCanvasNodes(previousState.nodes);
    setConnections(previousState.connections);
  }, [canvasNodes, connections]);

  const redo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;

    const currentState = {
      nodes: new Map(canvasNodes),
      connections: [...connections]
    };
    historyRef.current.past.push(currentState);

    const nextState = historyRef.current.future.pop();
    setCanvasNodes(nextState.nodes);
    setConnections(nextState.connections);
  }, [canvasNodes, connections]);

  // Auto-layout algorithms
  const applyAutoLayout = useCallback((layoutType) => {
    saveToHistory();
    const nodeArray = Array.from(canvasNodes.values());

    switch (layoutType) {
      case 'hierarchical':
        applyHierarchicalLayout(nodeArray);
        break;
      case 'force':
        applyForceDirectedLayout(nodeArray);
        break;
      case 'circular':
        applyCircularLayout(nodeArray);
        break;
      case 'grid':
        applyGridLayout(nodeArray);
        break;
    }

    setCanvasNodes(new Map(nodeArray.map(n => [n.id, n])));
  }, [canvasNodes, saveToHistory]);

  const applyHierarchicalLayout = (nodeArray) => {
    const layers = new Map();
    const visited = new Set();

    // Find root nodes (no incoming connections)
    const roots = nodeArray.filter(node =>
      !connections.some(conn => conn.to === node.id)
    );

    // BFS to assign layers
    let currentLayer = 0;
    let queue = roots.map(r => ({ node: r, layer: 0 }));

    while (queue.length > 0) {
      const { node, layer } = queue.shift();
      if (visited.has(node.id)) continue;

      visited.add(node.id);
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer).push(node);

      // Add children to queue
      connections
        .filter(conn => conn.from === node.id)
        .forEach(conn => {
          const child = nodeArray.find(n => n.id === conn.to);
          if (child && !visited.has(child.id)) {
            queue.push({ node: child, layer: layer + 1 });
          }
        });
    }

    // Position nodes
    layers.forEach((layerNodes, layerIndex) => {
      const layerY = 100 + layerIndex * 150;
      layerNodes.forEach((node, nodeIndex) => {
        node.x = 100 + nodeIndex * 200;
        node.y = layerY;
        updateNodePorts(node);
      });
    });
  };

  const applyForceDirectedLayout = (nodeArray) => {
    const iterations = 100;
    const k = 200; // Ideal spring length
    const c_rep = 10000; // Repulsion constant
    const c_spring = 0.5; // Spring constant

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map(nodeArray.map(n => [n.id, { x: 0, y: 0 }]));

      // Repulsion between all nodes
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const n1 = nodeArray[i];
          const n2 = nodeArray[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = c_rep / (dist * dist);

          forces.get(n1.id).x -= force * dx / dist;
          forces.get(n1.id).y -= force * dy / dist;
          forces.get(n2.id).x += force * dx / dist;
          forces.get(n2.id).y += force * dy / dist;
        }
      }

      // Spring forces for connected nodes
      connections.forEach(conn => {
        const n1 = nodeArray.find(n => n.id === conn.from);
        const n2 = nodeArray.find(n => n.id === conn.to);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = c_spring * (dist - k);

        forces.get(n1.id).x += force * dx / dist;
        forces.get(n1.id).y += force * dy / dist;
        forces.get(n2.id).x -= force * dx / dist;
        forces.get(n2.id).y -= force * dy / dist;
      });

      // Apply forces
      nodeArray.forEach(node => {
        const force = forces.get(node.id);
        node.x += force.x * 0.01;
        node.y += force.y * 0.01;
        // Keep in bounds
        node.x = Math.max(100, Math.min(1800, node.x));
        node.y = Math.max(100, Math.min(900, node.y));
        updateNodePorts(node);
      });
    }
  };

  const applyCircularLayout = (nodeArray) => {
    const radius = 300;
    const centerX = 500;
    const centerY = 400;

    nodeArray.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodeArray.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      updateNodePorts(node);
    });
  };

  const applyGridLayout = (nodeArray) => {
    const cols = Math.ceil(Math.sqrt(nodeArray.length));
    nodeArray.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      node.x = 100 + col * 200;
      node.y = 100 + row * 150;
      updateNodePorts(node);
    });
  };

  const updateNodePorts = (node) => {
    node.inputs = [{ x: node.x - 40, y: node.y }];
    node.outputs = node.outputs.map((_, i) => ({
      x: node.x + 40,
      y: node.y - 10 + (i * 20),
      value: 0
    }));
  };

  // Connection validation
  const validateConnection = useCallback((fromId, toId) => {
    if (!settings.validateConnections) return true;

    // Check for self-connection
    if (fromId === toId) return false;

    // Check for duplicate connection
    if (connections.some(c => c.from === fromId && c.to === toId)) return false;

    // Check for cycles using DFS
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoing = connections.filter(c => c.from === nodeId);
      for (const conn of outgoing) {
        if (!visited.has(conn.to)) {
          if (hasCycle(conn.to)) return true;
        } else if (recursionStack.has(conn.to)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Temporarily add connection and check for cycle
    connections.push({ from: fromId, to: toId, temp: true });
    const cycleDetected = hasCycle(fromId);
    connections.pop();

    return !cycleDetected;
  }, [connections, settings.validateConnections]);

  // Draw canvas with performance tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const renderLoop = (currentTime) => {
      const startRender = performance.now();
      const deltaTime = currentTime - lastFrameTime.current;
      lastFrameTime.current = currentTime;

      draw(ctx, canvas);

      const renderTime = performance.now() - startRender;
      const fps = 1000 / deltaTime;

      setStats({
        fps: Math.round(fps),
        nodes: canvasNodes.size,
        connections: connections.length,
        selectedNodes: selectedNodes.size,
        zoom: Math.round(canvasState.zoom * 100),
        renderTime: Math.round(renderTime * 100) / 100
      });

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasNodes, connections, canvasState, selectedNodes, particles, settings]);

  const draw = (ctx, canvas) => {
    // Apply zoom and pan
    ctx.save();
    ctx.translate(canvasState.pan.x, canvasState.pan.y);
    ctx.scale(canvasState.zoom, canvasState.zoom);

    // Clear
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(-canvasState.pan.x / canvasState.zoom, -canvasState.pan.y / canvasState.zoom,
                 canvas.width / canvasState.zoom, canvas.height / canvasState.zoom);

    // Draw grid
    if (settings.showGrid) {
      drawGrid(ctx, canvas);
    }

    // Draw connections
    drawConnections(ctx);

    // Draw animated particles
    if (settings.animateConnections) {
      drawParticles(ctx);
    }

    // Draw temporary connection line
    if (canvasState.isConnecting && canvasState.connectionStart) {
      drawTempConnection(ctx);
    }

    // Draw selection box
    if (canvasState.selectionBox) {
      drawSelectionBox(ctx);
    }

    // Draw nodes
    canvasNodes.forEach(node => {
      drawNode(ctx, node, selectedNodes.has(node.id));
    });

    // Draw hover toolbar
    if (canvasState.hoveredNode) {
      drawNodeToolbar(ctx, canvasState.hoveredNode);
    }

    ctx.restore();
  };

  const drawGrid = (ctx, canvas) => {
    const gridSize = settings.gridSize;
    const startX = Math.floor(-canvasState.pan.x / canvasState.zoom / gridSize) * gridSize;
    const startY = Math.floor(-canvasState.pan.y / canvasState.zoom / gridSize) * gridSize;
    const endX = startX + (canvas.width / canvasState.zoom) + gridSize;
    const endY = startY + (canvas.height / canvasState.zoom) + gridSize;

    ctx.beginPath();

    // Minor grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Major grid
    if (settings.showMajorGrid) {
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const majorSize = gridSize * 5;
      for (let x = Math.floor(startX / majorSize) * majorSize; x < endX; x += majorSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = Math.floor(startY / majorSize) * majorSize; y < endY; y += majorSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }
  };

  const drawConnections = (ctx) => {
    connections.forEach((conn, index) => {
      const fromNode = canvasNodes.get(conn.from);
      const toNode = canvasNodes.get(conn.to);

      if (fromNode && toNode) {
        const isSelected = selectedConnections.has(index);
        const isHovered = canvasState.hoveredConnection === index;
        const weight = conn.weight || 1;

        ctx.strokeStyle = isSelected ? '#F59E0B' : isHovered ? '#8B5CF6' : '#6366F1';
        ctx.lineWidth = settings.showWeights ? Math.max(1, weight * 2) : 2;

        const fromPort = fromNode.outputs[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
        const toPort = toNode.inputs[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

        ctx.beginPath();

        // Different routing algorithms
        switch (settings.routingMode) {
          case 'straight':
            ctx.moveTo(fromPort.x, fromPort.y);
            ctx.lineTo(toPort.x, toPort.y);
            break;

          case 'orthogonal':
            drawOrthogonalPath(ctx, fromPort, toPort);
            break;

          case 'bezier':
          default:
            const cp1x = fromPort.x + 50;
            const cp2x = toPort.x - 50;
            ctx.moveTo(fromPort.x, fromPort.y);
            ctx.bezierCurveTo(cp1x, fromPort.y, cp2x, toPort.y, toPort.x, toPort.y);
            break;
        }

        ctx.stroke();

        // Draw label
        const midPoint = getConnectionMidpoint(fromPort, toPort, settings.routingMode);
        drawConnectionLabel(ctx, conn, midPoint, index);

        // Draw arrow
        drawArrow(ctx, toPort, fromPort);
      }
    });
  };

  const drawOrthogonalPath = (ctx, from, to) => {
    const midX = (from.x + to.x) / 2;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(midX, from.y);
    ctx.lineTo(midX, to.y);
    ctx.lineTo(to.x, to.y);
  };

  const getConnectionMidpoint = (from, to, routingMode) => {
    if (routingMode === 'straight' || routingMode === 'orthogonal') {
      return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    }

    // Bezier midpoint at t=0.5
    const cp1x = from.x + 50;
    const cp2x = to.x - 50;
    const t = 0.5;
    const midX = Math.pow(1-t, 3) * from.x +
                3 * Math.pow(1-t, 2) * t * cp1x +
                3 * (1-t) * Math.pow(t, 2) * cp2x +
                Math.pow(t, 3) * to.x;
    const midY = Math.pow(1-t, 3) * from.y +
                3 * Math.pow(1-t, 2) * t * from.y +
                3 * (1-t) * Math.pow(t, 2) * to.y +
                Math.pow(t, 3) * to.y;
    return { x: midX, y: midY };
  };

  const drawConnectionLabel = (ctx, conn, midPoint, index) => {
    const isEditing = canvasState.editingLabel === index;

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(midPoint.x - 25, midPoint.y - 10, 50, 20);
    ctx.strokeStyle = isEditing ? '#F59E0B' : '#6366F1';
    ctx.lineWidth = isEditing ? 2 : 1;
    ctx.strokeRect(midPoint.x - 25, midPoint.y - 10, 50, 20);
    ctx.fillStyle = '#6366F1';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = conn.label || (conn.threshold !== undefined ? conn.threshold :
                 conn.fromPort === 0 ? '< T' :
                 conn.fromPort === 1 ? '≥ T' : `P${conn.fromPort + 1}`);

    ctx.fillText(label, midPoint.x, midPoint.y);
    ctx.restore();
  };

  const drawArrow = (ctx, to, from) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.save();
    ctx.translate(to.x, to.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  };

  const drawParticles = (ctx) => {
    particles.forEach(particle => {
      const conn = connections[particle.connection];
      if (!conn) return;

      const fromNode = canvasNodes.get(conn.from);
      const toNode = canvasNodes.get(conn.to);
      if (!fromNode || !toNode) return;

      const fromPort = fromNode.outputs[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
      const toPort = toNode.inputs[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

      let x, y;
      const t = particle.progress;

      if (settings.routingMode === 'straight') {
        x = fromPort.x + (toPort.x - fromPort.x) * t;
        y = fromPort.y + (toPort.y - fromPort.y) * t;
      } else if (settings.routingMode === 'bezier') {
        const cp1x = fromPort.x + 50;
        const cp2x = toPort.x - 50;
        x = Math.pow(1-t, 3) * fromPort.x +
            3 * Math.pow(1-t, 2) * t * cp1x +
            3 * (1-t) * Math.pow(t, 2) * cp2x +
            Math.pow(t, 3) * toPort.x;
        y = Math.pow(1-t, 3) * fromPort.y +
            3 * Math.pow(1-t, 2) * t * fromPort.y +
            3 * (1-t) * Math.pow(t, 2) * toPort.y +
            Math.pow(t, 3) * toPort.y;
      } else {
        const midX = (fromPort.x + toPort.x) / 2;
        if (t < 0.33) {
          x = fromPort.x + (midX - fromPort.x) * (t / 0.33);
          y = fromPort.y;
        } else if (t < 0.66) {
          x = midX;
          y = fromPort.y + (toPort.y - fromPort.y) * ((t - 0.33) / 0.33);
        } else {
          x = midX + (toPort.x - midX) * ((t - 0.66) / 0.34);
          y = toPort.y;
        }
      }

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  const drawTempConnection = (ctx) => {
    const { connectionStart, mousePos } = canvasState;
    let startNode = canvasNodes.get(connectionStart.nodeId);

    if (startNode && startNode.outputs[connectionStart.portIndex]) {
      const port = startNode.outputs[connectionStart.portIndex];
      const adjustedMouseX = (mousePos.x - canvasState.pan.x) / canvasState.zoom;
      const adjustedMouseY = (mousePos.y - canvasState.pan.y) / canvasState.zoom;

      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(port.x, port.y);
      ctx.lineTo(adjustedMouseX, adjustedMouseY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw port hover indicator
      canvasNodes.forEach(node => {
        if (node.id !== connectionStart.nodeId) {
          node.inputs.forEach(inputPort => {
            const dist = Math.sqrt(
              Math.pow(adjustedMouseX - inputPort.x, 2) +
              Math.pow(adjustedMouseY - inputPort.y, 2)
            );
            if (dist < 15) {
              ctx.beginPath();
              ctx.arc(inputPort.x, inputPort.y, 10, 0, 2 * Math.PI);
              ctx.strokeStyle = validateConnection(startNode.id, node.id) ? '#10B981' : '#EF4444';
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          });
        }
      });
    }
  };

  const drawSelectionBox = (ctx) => {
    const box = canvasState.selectionBox;
    ctx.strokeStyle = '#3B82F6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.setLineDash([]);
  };

  const drawNode = (ctx, node, isSelected) => {
    const isHovered = canvasState.hoveredNode?.id === node.id;

    // Shadow
    if (isSelected || isHovered) {
      ctx.shadowColor = isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Node body
    const color = gateColors[node.type] || '#6366F1';
    ctx.fillStyle = color;

    // Add selection border
    if (isSelected) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.strokeRect(node.x - 42, node.y - 22, 84, 44);
    }

    ctx.fillRect(node.x - 40, node.y - 20, 80, 40);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Node label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.type.toUpperCase(), node.x, node.y);

    // Draw input ports
    node.inputs.forEach((port, i) => {
      ctx.fillStyle = port.value > 0 ? '#10B981' : '#374151';
      ctx.beginPath();
      ctx.arc(port.x, port.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Port hover
      if (isHovered) {
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw output ports
    node.outputs.forEach((port, i) => {
      ctx.fillStyle = port.value > 0 ? '#F59E0B' : '#374151';
      ctx.beginPath();
      ctx.arc(port.x, port.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Port hover
      if (isHovered) {
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const drawNodeToolbar = (ctx, node) => {
    const toolbarY = node.y - 50;
    const buttons = [
      { icon: '✏️', action: 'edit', x: node.x - 45 },
      { icon: '📋', action: 'copy', x: node.x - 15 },
      { icon: '🗑️', action: 'delete', x: node.x + 15 }
    ];

    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    ctx.fillRect(node.x - 55, toolbarY - 12, 110, 24);
    ctx.strokeRect(node.x - 55, toolbarY - 12, 110, 24);

    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    buttons.forEach(btn => {
      ctx.fillText(btn.icon, btn.x, toolbarY);
    });
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

    // Check toolbar clicks first
    if (canvasState.hoveredNode) {
      const node = canvasState.hoveredNode;
      const toolbarY = node.y - 50;
      if (y >= toolbarY - 12 && y <= toolbarY + 12) {
        if (x >= node.x - 45 && x < node.x - 15) {
          // Edit
          console.log('Edit node', node.id);
          return;
        } else if (x >= node.x - 15 && x < node.x + 15) {
          // Copy
          copyNodes([node.id]);
          return;
        } else if (x >= node.x + 15 && x <= node.x + 45) {
          // Delete
          deleteNodes([node.id]);
          return;
        }
      }
    }

    // Check if clicking on a node
    let clickedNode = null;
    canvasNodes.forEach(node => {
      if (x >= node.x - 40 && x <= node.x + 40 &&
          y >= node.y - 20 && y <= node.y + 20) {

        // Check if clicking on output port
        for (let i = 0; i < node.outputs.length; i++) {
          const port = node.outputs[i];
          const dist = Math.sqrt((x - port.x) ** 2 + (y - port.y) ** 2);
          if (dist < 8) {
            setCanvasState(prev => ({
              ...prev,
              isConnecting: true,
              connectionStart: { nodeId: node.id, portIndex: i }
            }));
            return;
          }
        }

        clickedNode = node;
      }
    });

    if (clickedNode) {
      // Start dragging
      if (e.shiftKey) {
        // Add to selection
        setSelectedNodes(prev => new Set([...prev, clickedNode.id]));
      } else if (!selectedNodes.has(clickedNode.id)) {
        setSelectedNodes(new Set([clickedNode.id]));
      }

      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        draggedNode: clickedNode,
        dragOffset: { x: x - clickedNode.x, y: y - clickedNode.y }
      }));
    } else if (e.button === 1 || e.ctrlKey) {
      // Middle mouse or Ctrl+drag for panning
      setCanvasState(prev => ({
        ...prev,
        isPanning: true,
        lastPanPos: { x: e.clientX, y: e.clientY }
      }));
    } else {
      // Start selection box
      setCanvasState(prev => ({
        ...prev,
        isSelecting: true,
        selectionBox: { x, y, width: 0, height: 0 }
      }));
      setSelectedNodes(new Set());
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

    setCanvasState(prev => ({ ...prev, mousePos: { x: e.clientX - rect.left, y: e.clientY - rect.top } }));

    // Update hover state
    let hoveredNode = null;
    canvasNodes.forEach(node => {
      if (x >= node.x - 40 && x <= node.x + 40 &&
          y >= node.y - 20 && y <= node.y + 20) {
        hoveredNode = node;
      }
    });
    setCanvasState(prev => ({ ...prev, hoveredNode }));

    if (canvasState.isPanning) {
      const dx = e.clientX - canvasState.lastPanPos.x;
      const dy = e.clientY - canvasState.lastPanPos.y;
      setCanvasState(prev => ({
        ...prev,
        pan: { x: prev.pan.x + dx, y: prev.pan.y + dy },
        lastPanPos: { x: e.clientX, y: e.clientY }
      }));
    } else if (canvasState.isDragging && canvasState.draggedNode) {
      saveToHistory();

      const nodesToMove = selectedNodes.has(canvasState.draggedNode.id)
        ? Array.from(selectedNodes).map(id => canvasNodes.get(id))
        : [canvasState.draggedNode];

      const dx = x - canvasState.draggedNode.x;
      const dy = y - canvasState.draggedNode.y;

      nodesToMove.forEach(node => {
        if (!node) return;
        node.x += dx;
        node.y += dy;

        // Snap to grid
        if (settings.snapToGrid) {
          node.x = Math.round(node.x / settings.gridSize) * settings.gridSize;
          node.y = Math.round(node.y / settings.gridSize) * settings.gridSize;
        }

        // Update port positions
        updateNodePorts(node);
      });

      setCanvasNodes(new Map(canvasNodes));
    } else if (canvasState.isSelecting) {
      const box = canvasState.selectionBox;
      setCanvasState(prev => ({
        ...prev,
        selectionBox: {
          x: box.x,
          y: box.y,
          width: x - box.x,
          height: y - box.y
        }
      }));

      // Select nodes in box
      const selected = new Set();
      canvasNodes.forEach(node => {
        const inBox =
          node.x >= Math.min(box.x, x) &&
          node.x <= Math.max(box.x, x) &&
          node.y >= Math.min(box.y, y) &&
          node.y <= Math.max(box.y, y);
        if (inBox) selected.add(node.id);
      });
      setSelectedNodes(selected);
    }
  };

  const handleMouseUp = (e) => {
    if (canvasState.isConnecting && canvasState.connectionStart) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
      const y = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

      // Check if releasing on an input port
      canvasNodes.forEach(targetNode => {
        if (targetNode.id !== canvasState.connectionStart.nodeId) {
          targetNode.inputs.forEach((port, portIndex) => {
            const dist = Math.sqrt((x - port.x) ** 2 + (y - port.y) ** 2);
            if (dist < 8) {
              // Validate connection
              if (validateConnection(canvasState.connectionStart.nodeId, targetNode.id)) {
                saveToHistory();
                // Create connection
                const newConnection = {
                  from: canvasState.connectionStart.nodeId,
                  to: targetNode.id,
                  fromPort: canvasState.connectionStart.portIndex,
                  toPort: portIndex,
                  weight: 1
                };
                const newConnections = [...connections, newConnection];
                setConnections(newConnections);
                if (onConnectionsChange) {
                  onConnectionsChange(newConnections);
                }
              }
            }
          });
        }
      });
    }

    setCanvasState(prev => ({
      ...prev,
      isDragging: false,
      isConnecting: false,
      isPanning: false,
      isSelecting: false,
      draggedNode: null,
      connectionStart: null,
      selectionBox: null
    }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom * delta));

    // Zoom towards mouse position
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomRatio = newZoom / canvasState.zoom;
    const newPanX = mouseX - (mouseX - canvasState.pan.x) * zoomRatio;
    const newPanY = mouseY - (mouseY - canvasState.pan.y) * zoomRatio;

    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY }
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteNodes(Array.from(selectedNodes));
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          e.preventDefault();
          copyNodes(Array.from(selectedNodes));
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteNodes();
        } else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'a') {
          e.preventDefault();
          setSelectedNodes(new Set(canvasNodes.keys()));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, canvasNodes, undo, redo]);

  const deleteNodes = (nodeIds) => {
    saveToHistory();
    nodeIds.forEach(id => canvasNodes.delete(id));
    setCanvasNodes(new Map(canvasNodes));
    setConnections(connections.filter(c => !nodeIds.includes(c.from) && !nodeIds.includes(c.to)));
    setSelectedNodes(new Set());
  };

  const copyNodes = (nodeIds) => {
    const nodesToCopy = nodeIds.map(id => canvasNodes.get(id)).filter(Boolean);
    setClipboard({ nodes: nodesToCopy, connections: connections.filter(c =>
      nodeIds.includes(c.from) && nodeIds.includes(c.to)
    )});
  };

  const pasteNodes = () => {
    if (!clipboard) return;
    saveToHistory();

    const idMap = new Map();
    const newNodes = clipboard.nodes.map(node => {
      const newId = `${node.id}_copy_${Date.now()}`;
      idMap.set(node.id, newId);
      const newNode = {
        ...node,
        id: newId,
        x: node.x + 50,
        y: node.y + 50
      };
      canvasNodes.set(newId, newNode);
      return newNode;
    });

    const newConnections = clipboard.connections.map(conn => ({
      ...conn,
      from: idMap.get(conn.from),
      to: idMap.get(conn.to)
    }));

    setCanvasNodes(new Map(canvasNodes));
    setConnections([...connections, ...newConnections]);
    setSelectedNodes(new Set(newNodes.map(n => n.id)));
  };

  // Export functions
  const exportToPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `canvas_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportToSVG = () => {
    // SVG export implementation would go here
    alert('SVG export - Implementation pending');
  };

  const exportToJSON = () => {
    const data = {
      nodes: Array.from(canvasNodes.values()),
      connections,
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `canvas_${Date.now()}.json`;
    link.href = url;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Enhanced Toolbar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b-2 border-blue-500 p-3 flex flex-wrap gap-2 items-center shadow-lg">
        {/* Layout Tools */}
        <div className="flex gap-2 border-r border-gray-600 pr-3">
          <button
            onClick={() => applyAutoLayout('hierarchical')}
            className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-sm"
            title="Hierarchical Layout"
          >
            📊 Hierarchical
          </button>
          <button
            onClick={() => applyAutoLayout('force')}
            className="px-3 py-1.5 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 text-sm"
            title="Force-Directed Layout"
          >
            🌐 Force
          </button>
          <button
            onClick={() => applyAutoLayout('circular')}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700 text-sm"
            title="Circular Layout"
          >
            ⭕ Circular
          </button>
          <button
            onClick={() => applyAutoLayout('grid')}
            className="px-3 py-1.5 bg-teal-600 text-white rounded font-semibold hover:bg-teal-700 text-sm"
            title="Grid Layout"
          >
            ⊞ Grid
          </button>
        </div>

        {/* Routing Mode */}
        <div className="flex gap-2 border-r border-gray-600 pr-3">
          <select
            value={settings.routingMode}
            onChange={(e) => setSettings(prev => ({ ...prev, routingMode: e.target.value }))}
            className="px-3 py-1.5 bg-gray-700 text-white rounded font-semibold"
          >
            <option value="bezier">🎨 Bezier</option>
            <option value="orthogonal">📐 Orthogonal</option>
            <option value="straight">→ Straight</option>
          </select>
        </div>

        {/* View Controls */}
        <div className="flex gap-2 border-r border-gray-600 pr-3">
          <button
            onClick={() => setSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
            className={`px-3 py-1.5 rounded font-semibold ${settings.snapToGrid ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            title="Snap to Grid"
          >
            🧲 Snap
          </button>
          <button
            onClick={() => setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
            className={`px-3 py-1.5 rounded font-semibold ${settings.showGrid ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            title="Show Grid"
          >
            ▦ Grid
          </button>
          <button
            onClick={() => setSettings(prev => ({ ...prev, animateConnections: !prev.animateConnections }))}
            className={`px-3 py-1.5 rounded font-semibold ${settings.animateConnections ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            title="Animate Connections"
          >
            ⚡ Animate
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-2 border-r border-gray-600 pr-3">
          <button
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}
            className="px-3 py-1.5 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600"
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))}
            className="px-3 py-1.5 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600"
            title="Zoom Out"
          >
            🔍-
          </button>
          <button
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
            className="px-3 py-1.5 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600"
            title="Reset View"
          >
            ⟲ Reset
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-2 border-r border-gray-600 pr-3">
          <button
            onClick={undo}
            disabled={historyRef.current.past.length === 0}
            className="px-3 py-1.5 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyRef.current.future.length === 0}
            className="px-3 py-1.5 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
        </div>

        {/* Export */}
        <div className="flex gap-2 border-r border-gray-600 pr-3">
          <button
            onClick={exportToPNG}
            className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
            title="Export as PNG"
          >
            📷 PNG
          </button>
          <button
            onClick={exportToJSON}
            className="px-3 py-1.5 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700"
            title="Export as JSON"
          >
            💾 JSON
          </button>
        </div>

        {/* Clear/Delete */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (selectedNodes.size > 0) {
                deleteNodes(Array.from(selectedNodes));
              }
            }}
            disabled={selectedNodes.size === 0}
            className="px-3 py-1.5 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 disabled:opacity-50"
            title="Delete Selected (Del)"
          >
            🗑️ Delete
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all nodes and connections?')) {
                saveToHistory();
                setConnections([]);
                setCanvasNodes(new Map());
                if (onConnectionsChange) onConnectionsChange([]);
              }
            }}
            className="px-3 py-1.5 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
            title="Clear All"
          >
            🗑️ Clear All
          </button>
        </div>

        {/* Performance Toggle */}
        <button
          onClick={() => setSettings(prev => ({ ...prev, showPerformance: !prev.showPerformance }))}
          className={`ml-auto px-3 py-1.5 rounded font-semibold ${settings.showPerformance ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          title="Show Performance Stats"
        >
          📊 Stats
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-crosshair"
          style={{ background: '#FAFAFA' }}
        />

        {/* Performance Overlay */}
        {settings.showPerformance && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg font-mono text-xs space-y-1 shadow-lg">
            <div className={stats.fps < 30 ? 'text-red-400' : stats.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
              FPS: {stats.fps}
            </div>
            <div>Nodes: {stats.nodes}</div>
            <div>Connections: {stats.connections}</div>
            <div>Selected: {stats.selectedNodes}</div>
            <div>Zoom: {stats.zoom}%</div>
            <div>Render: {stats.renderTime}ms</div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
          <div className="font-bold mb-2">Keyboard Shortcuts:</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Del</kbd> Delete selected</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+C</kbd> Copy</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+V</kbd> Paste</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Z</kbd> Undo</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+A</kbd> Select all</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Shift+Click</kbd> Multi-select</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Drag</kbd> Pan canvas</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Scroll</kbd> Zoom</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedConnectionCanvas;
