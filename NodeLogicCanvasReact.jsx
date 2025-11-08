import React, { useEffect, useRef, useState } from 'react';

/**
 * Node Logic Canvas React Component
 * REPLACEMENT for iframe-based NodeLogicCanvas
 * Direct integration with tree-visualization.js (no iframe!)
 *
 * Drop-in replacement:
 * OLD: <NodeLogicCanvas node={node} onLogicUpdate={handler} />
 * NEW: <NodeLogicCanvasReact node={node} onLogicUpdate={handler} />
 */
const NodeLogicCanvasReact = ({ node, onLogicUpdate }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [localGraph, setLocalGraph] = useState(null);

  // Initialize canvas and graph for this node
  useEffect(() => {
    if (!canvasRef.current || !window.TreeVisualization) {
      console.warn('[NodeLogicCanvasReact] TreeVisualization not loaded');
      return;
    }

    try {
      // Create a local graph for this node's logic
      const graph = new window.TreeVisualization.LogicGraph({
        name: `Logic for ${node.question || node.name || 'Node'}`,
        type: 'dag'
      });

      // Convert node to graph structure
      if (node.logicType || node.gateType) {
        const mainNode = new window.TreeVisualization.AdvancedNode({
          id: node.id,
          name: node.question || node.name || 'Main Node',
          nodeType: node.nodeType || 'logic_gate',
          logicType: node.logicType || node.gateType || 'threshold',
          branchCount: node.numBranches || 2,
          branchLabels: node.branchLabels || ['False', 'True'],
          position: { x: 0, y: 0 },
          metadata: {
            threshold: node.threshold,
            thresholdK: node.thresholdK,
            fuzzyMembership: node.fuzzyMembership
          }
        });

        graph.addNode(mainNode);

        // Add child nodes if they exist
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child, index) => {
            if (child && child.id) {
              const childNode = new window.TreeVisualization.AdvancedNode({
                id: child.id,
                name: child.question || child.name || `Child ${index + 1}`,
                nodeType: child.nodeType || 'decision',
                position: {
                  x: (index - (node.children.length - 1) / 2) * 150,
                  y: 150
                }
              });

              graph.addNode(childNode);
              graph.addEdge(mainNode.id, childNode.id, {
                label: node.branchLabels?.[index] || `Branch ${index}`
              });
            }
          });
        }
      }

      setLocalGraph(graph);

      // Create renderer
      rendererRef.current = new window.TreeVisualization.CanvasRenderer(
        canvasRef.current,
        graph
      );

      // Apply hierarchical layout
      window.TreeVisualization.TreeLayout.hierarchical(graph, {
        levelSeparation: 150,
        nodeSeparation: 100,
        direction: 'TB'
      });

      // Fit to screen
      setTimeout(() => {
        if (rendererRef.current) {
          rendererRef.current.fitToScreen();
        }
      }, 100);

      // Start render loop
      const renderLoop = () => {
        if (rendererRef.current) {
          rendererRef.current.render();
        }
        requestAnimationFrame(renderLoop);
      };
      renderLoop();

      setCanvasReady(true);
      console.log('[NodeLogicCanvasReact] Canvas initialized');

    } catch (error) {
      console.error('[NodeLogicCanvasReact] Failed to initialize:', error);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current = null;
      }
    };
  }, [node]);

  // Send updates back to parent when graph changes
  const handleGraphChange = () => {
    if (localGraph && onLogicUpdate) {
      // Extract updated node data from graph
      const updatedNodeData = {
        ...node,
        // Update logic configuration based on graph state
        nodes: Array.from(localGraph.nodes.values()),
        edges: Array.from(localGraph.edges.values())
      };

      onLogicUpdate(updatedNodeData);
    }
  };

  // Resize canvas to match container
  const resizeCanvas = () => {
    if (canvasRef.current && containerRef.current) {
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Actions
  const addInputNode = () => {
    if (!localGraph) return;

    const newNode = new window.TreeVisualization.AdvancedNode({
      name: `Input ${localGraph.nodes.size + 1}`,
      nodeType: 'decision',
      position: {
        x: Math.random() * 200 - 100,
        y: -150
      }
    });

    localGraph.addNode(newNode);
    handleGraphChange();
  };

  const addOutputNode = () => {
    if (!localGraph) return;

    const newNode = new window.TreeVisualization.AdvancedNode({
      name: `Output ${localGraph.nodes.size + 1}`,
      nodeType: 'terminal',
      position: {
        x: Math.random() * 200 - 100,
        y: 150
      }
    });

    localGraph.addNode(newNode);
    handleGraphChange();
  };

  const addLogicGate = (gateType) => {
    if (!localGraph) return;

    const newNode = new window.TreeVisualization.AdvancedNode({
      name: gateType,
      nodeType: 'logic_gate',
      logicType: gateType.toLowerCase(),
      position: {
        x: Math.random() * 200 - 100,
        y: 0
      }
    });

    localGraph.addNode(newNode);
    handleGraphChange();
  };

  const applyLayout = (layoutType) => {
    if (!localGraph || !window.TreeVisualization) return;

    switch (layoutType) {
      case 'hierarchical':
        window.TreeVisualization.TreeLayout.hierarchical(localGraph, {
          levelSeparation: 120,
          nodeSeparation: 80,
          direction: 'TB'
        });
        break;
      case 'radial':
        window.TreeVisualization.TreeLayout.radial(localGraph, {
          radius: 100
        });
        break;
    }

    if (rendererRef.current) {
      rendererRef.current.fitToScreen();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 rounded-lg overflow-hidden">
      {/* Canvas Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">
          Visual Logic Builder
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <button
            onClick={addInputNode}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            title="Add Input Node"
          >
            + Input
          </button>
          <button
            onClick={() => addLogicGate('AND')}
            className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
            title="Add AND Gate"
          >
            AND
          </button>
          <button
            onClick={() => addLogicGate('OR')}
            className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
            title="Add OR Gate"
          >
            OR
          </button>
          <button
            onClick={addOutputNode}
            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
            title="Add Output Node"
          >
            + Output
          </button>

          <div className="w-px h-4 bg-gray-300"></div>

          {/* Layout Options */}
          <button
            onClick={() => applyLayout('hierarchical')}
            className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
            title="Hierarchical Layout"
          >
            ⬇ Layout
          </button>
          <button
            onClick={() => applyLayout('radial')}
            className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
            title="Radial Layout"
          >
            ◎ Radial
          </button>

          <div className="w-px h-4 bg-gray-300"></div>

          {/* Status */}
          <span className={`text-xs px-2 py-1 rounded ${
            canvasReady
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {canvasReady ? '● Ready' : '○ Loading...'}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: 'default' }}
        />

        {/* Loading Overlay */}
        {!canvasReady && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <div className="text-sm text-gray-600">Loading canvas...</div>
            </div>
          </div>
        )}

        {/* Node Count */}
        {canvasReady && localGraph && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {localGraph.nodes.size} nodes • {localGraph.edges.size} connections
          </div>
        )}
      </div>

      {/* Canvas Instructions */}
      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
        <div className="text-xs text-blue-800">
          <strong>Tip:</strong> Click and drag nodes to move them. Use toolbar to add gates. Changes sync automatically.
        </div>
      </div>
    </div>
  );
};

export default NodeLogicCanvasReact;
