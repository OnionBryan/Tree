import React, { useRef, useEffect, useState } from 'react';

/**
 * Advanced Connection Canvas
 * Extracted from tree-builder.html Canvas #5
 * Full-featured canvas for node connections with:
 * - Bezier curve connections
 * - Port selection UI
 * - Drag-and-drop gates
 * - Edge drawing mode
 * - Node syncing with tree data
 */
const AdvancedConnectionCanvas = ({ nodes = [], onNodesChange, onConnectionsChange }) => {
  const canvasRef = useRef(null);
  const [canvasNodes, setCanvasNodes] = useState(new Map());
  const [connections, setConnections] = useState([]);
  const [canvasState, setCanvasState] = useState({
    isDragging: false,
    isConnecting: false,
    draggedNode: null,
    connectionStart: null,
    mousePos: { x: 0, y: 0 },
    edgeDrawMode: false,
    selectedStartPort: null,
    edgeStartNode: null
  });

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
    'decision': '#6366F1'
  };

  // Sync nodes from props to canvas representation
  useEffect(() => {
    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        id: node.id,
        type: node.type || 'decision',
        x: node.x || 100,
        y: node.y || 100,
        inputs: [{ x: (node.x || 100) - 40, y: node.y || 100 }],
        outputs: Array(node.branchCount || 2).fill(null).map((_, i) => ({
          x: (node.x || 100) + 40,
          y: (node.y || 100) - 10 + (i * 20),
          value: 0
        })),
        treeNode: node
      });
    });
    setCanvasNodes(nodeMap);
  }, [nodes]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    draw(ctx, canvas);
  }, [canvasNodes, connections, canvasState]);

  const draw = (ctx, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw connections
    drawConnections(ctx);

    // Draw temporary connection line
    if (canvasState.isConnecting && canvasState.connectionStart) {
      drawTempConnection(ctx);
    }

    // Draw nodes
    canvasNodes.forEach(node => {
      drawNode(ctx, node);
    });
  };

  const drawGrid = (ctx, canvas) => {
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  };

  const drawConnections = (ctx) => {
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2;

    connections.forEach((conn, index) => {
      const fromNode = canvasNodes.get(conn.from);
      const toNode = canvasNodes.get(conn.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        const fromPort = fromNode.outputs[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
        const toPort = toNode.inputs[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

        // Draw bezier curve
        const cp1x = fromPort.x + 50;
        const cp2x = toPort.x - 50;
        ctx.moveTo(fromPort.x, fromPort.y);
        ctx.bezierCurveTo(cp1x, fromPort.y, cp2x, toPort.y, toPort.x, toPort.y);
        ctx.stroke();

        // Calculate midpoint for label
        const t = 0.5;
        const midX = Math.pow(1-t, 3) * fromPort.x +
                    3 * Math.pow(1-t, 2) * t * cp1x +
                    3 * (1-t) * Math.pow(t, 2) * cp2x +
                    Math.pow(t, 3) * toPort.x;
        const midY = Math.pow(1-t, 3) * fromPort.y +
                    3 * Math.pow(1-t, 2) * t * fromPort.y +
                    3 * (1-t) * Math.pow(t, 2) * toPort.y +
                    Math.pow(t, 3) * toPort.y;

        // Draw label
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - 25, midY - 10, 50, 20);
        ctx.strokeStyle = '#6366F1';
        ctx.strokeRect(midX - 25, midY - 10, 50, 20);
        ctx.fillStyle = '#6366F1';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const label = conn.threshold !== undefined ? conn.threshold :
                     conn.fromPort === 0 ? '< T' :
                     conn.fromPort === 1 ? '≥ T' : `P${conn.fromPort + 1}`;

        ctx.fillText(label, midX, midY);
        ctx.restore();

        // Draw arrow
        ctx.save();
        ctx.translate(toPort.x, toPort.y);
        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -4);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fillStyle = '#6366F1';
        ctx.fill();
        ctx.restore();
      }
    });
  };

  const drawTempConnection = (ctx) => {
    const { connectionStart, mousePos } = canvasState;
    let startNode = canvasNodes.get(connectionStart.nodeId);

    if (startNode && startNode.outputs[connectionStart.portIndex]) {
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      const port = startNode.outputs[connectionStart.portIndex];
      ctx.moveTo(port.x, port.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawNode = (ctx, node) => {
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Node body
    ctx.fillStyle = gateColors[node.type] || '#6366F1';
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
    });
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a node
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

        // Otherwise start dragging
        setCanvasState(prev => ({
          ...prev,
          isDragging: true,
          draggedNode: node,
          dragOffset: { x: x - node.x, y: y - node.y }
        }));
      }
    });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCanvasState(prev => ({ ...prev, mousePos: { x, y } }));

    if (canvasState.isDragging && canvasState.draggedNode) {
      const node = canvasState.draggedNode;
      node.x = x - canvasState.dragOffset.x;
      node.y = y - canvasState.dragOffset.y;

      // Update port positions
      node.inputs = [{ x: node.x - 40, y: node.y }];
      node.outputs = node.outputs.map((_, i) => ({
        x: node.x + 40,
        y: node.y - 10 + (i * 20),
        value: 0
      }));

      setCanvasNodes(new Map(canvasNodes));
    }
  };

  const handleMouseUp = (e) => {
    if (canvasState.isConnecting && canvasState.connectionStart) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if releasing on an input port
      canvasNodes.forEach(targetNode => {
        if (targetNode.id !== canvasState.connectionStart.nodeId) {
          targetNode.inputs.forEach((port, portIndex) => {
            const dist = Math.sqrt((x - port.x) ** 2 + (y - port.y) ** 2);
            if (dist < 8) {
              // Create connection
              const newConnection = {
                from: canvasState.connectionStart.nodeId,
                to: targetNode.id,
                fromPort: canvasState.connectionStart.portIndex,
                toPort: portIndex
              };
              setConnections([...connections, newConnection]);
              if (onConnectionsChange) {
                onConnectionsChange([...connections, newConnection]);
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
      draggedNode: null,
      connectionStart: null
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-3 flex gap-2">
        <button
          onClick={() => setCanvasState(prev => ({ ...prev, edgeDrawMode: !prev.edgeDrawMode }))}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            canvasState.edgeDrawMode
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {canvasState.edgeDrawMode ? '✓ Edge Mode' : '✏️ Edge Mode'}
        </button>
        <button
          onClick={() => {
            setConnections([]);
            if (onConnectionsChange) onConnectionsChange([]);
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
        >
          Clear All
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-crosshair"
          style={{ background: 'white' }}
        />
      </div>
    </div>
  );
};

export default AdvancedConnectionCanvas;
