/**
 * Matrix Network Graph Component
 *
 * Displays 20×20 GSU relationship matrix as an interactive force-directed network graph.
 * Shows participants as nodes and relationships as weighted edges.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';

const MatrixNetworkGraph = ({ matrix, participants = [] }) => {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // Graph dimensions
  const width = 800;
  const height = 600;

  // Build graph data from matrix
  const graphData = useMemo(() => {
    const nodes = matrix.map((_, idx) => ({
      id: idx,
      label: participants[idx]?.name || `P${idx + 1}`,
      x: width / 2 + Math.random() * 100 - 50,
      y: height / 2 + Math.random() * 100 - 50,
      vx: 0,
      vy: 0,
    }));

    const edges = [];
    const threshold = 0.1; // Only show edges above this value

    matrix.forEach((row, i) => {
      row.forEach((value, j) => {
        if (i !== j && value > threshold) {
          edges.push({
            source: i,
            target: j,
            weight: value,
          });
        }
      });
    });

    return { nodes, edges };
  }, [matrix, participants]);

  // Simple force simulation
  useEffect(() => {
    if (!canvasRef.current) return;

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];

    let animationFrame;
    let alpha = 1.0;
    const alphaDecay = 0.01;
    const alphaMin = 0.001;

    const tick = () => {
      if (alpha < alphaMin) return;

      // Apply forces
      nodes.forEach((node) => {
        // Center force
        node.vx += (width / 2 - node.x) * 0.001;
        node.vy += (height / 2 - node.y) * 0.001;

        // Repulsion from other nodes
        nodes.forEach((other) => {
          if (node.id !== other.id) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 500 / (distance * distance);

            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        });
      });

      // Link force
      edges.forEach((edge) => {
        const source = nodes[edge.source];
        const target = nodes[edge.target];

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDistance = 100 - edge.weight * 10; // Stronger connections = closer

        const force = (distance - targetDistance) * 0.01;

        const offsetX = (dx / distance) * force;
        const offsetY = (dy / distance) * force;

        source.vx += offsetX;
        source.vy += offsetY;
        target.vx -= offsetX;
        target.vy -= offsetY;
      });

      // Update positions
      nodes.forEach((node) => {
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;

        node.x += node.vx;
        node.y += node.vy;

        // Keep in bounds
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });

      alpha -= alphaDecay;

      // Draw
      draw(nodes, edges);

      animationFrame = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [graphData]);

  // Draw function
  const draw = (nodes, edges) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    edges.forEach((edge) => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `rgba(99, 102, 241, ${edge.weight / 7})`;
      ctx.lineWidth = edge.weight / 2;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      const radius = isHovered ? 12 : 8;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isHovered ? '#6366f1' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      if (isHovered) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - 20);
      }
    });
  };

  // Handle mouse move for hover detection
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundNode = null;
    graphData.nodes.forEach((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 12) {
        foundNode = node.id;
      }
    });

    setHoveredNode(foundNode);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Legend */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        <p>
          <strong>Nodes:</strong> Participants •{' '}
          <strong>Edges:</strong> Relationship strength (thickness + opacity)
        </p>
        <p className="text-xs mt-1">
          Hover over nodes to see labels • Stronger relationships pull nodes closer
        </p>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">Nodes</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {graphData.nodes.length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">Edges</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {graphData.edges.length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">Density</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {(
              (graphData.edges.length /
                (graphData.nodes.length * (graphData.nodes.length - 1))) *
              100
            ).toFixed(1)}
            %
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixNetworkGraph;
