import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Tree Visualization React Component
 * Direct integration with tree-visualization.js module (no iframe needed!)
 *
 * Usage:
 * <TreeVisualizationReact
 *   graph={graph}
 *   onNodeSelect={handleSelect}
 *   onGraphChange={handleChange}
 *   layout="hierarchical"
 * />
 */
const TreeVisualizationReact = ({
  graph,
  onNodeSelect,
  onGraphChange,
  layout = 'hierarchical',
  className = '',
  style = {}
}) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, edges: 0, zoom: 100 });

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current || !window.TreeVisualization) {
      console.warn('Canvas or TreeVisualization not available');
      return;
    }

    try {
      // Create renderer
      rendererRef.current = new window.TreeVisualization.CanvasRenderer(
        canvasRef.current,
        graph
      );

      // Setup event handlers
      if (onNodeSelect) {
        const originalOnMouseDown = rendererRef.current.onMouseDown.bind(rendererRef.current);
        rendererRef.current.onMouseDown = (e) => {
          originalOnMouseDown(e);
          if (rendererRef.current.selectedNode) {
            const node = graph.nodes.get(rendererRef.current.selectedNode);
            onNodeSelect(node);
          }
        };
      }

      // Start render loop
      const renderLoop = () => {
        if (rendererRef.current) {
          rendererRef.current.render();

          // Update stats
          setStats({
            nodes: graph.nodes.size,
            edges: graph.edges.size,
            zoom: Math.round(rendererRef.current.zoom * 100)
          });
        }
        requestAnimationFrame(renderLoop);
      };
      renderLoop();

      setIsReady(true);
      console.log('TreeVisualizationReact: Renderer initialized');

    } catch (error) {
      console.error('Failed to initialize renderer:', error);
    }

    return () => {
      if (rendererRef.current) {
        // Cleanup
        rendererRef.current = null;
      }
    };
  }, [graph, onNodeSelect]);

  // Apply layout when layout prop changes
  useEffect(() => {
    if (!isReady || !window.TreeVisualization) return;

    switch (layout) {
      case 'hierarchical':
        window.TreeVisualization.TreeLayout.hierarchical(graph, {
          levelSeparation: 150,
          nodeSeparation: 100,
          direction: 'TB'
        });
        break;
      case 'radial':
        window.TreeVisualization.TreeLayout.radial(graph, {
          radius: 120,
          centerX: 0,
          centerY: 0
        });
        break;
      case 'force':
        const positions = window.TreeVisualization.TreeLayout.forceDirected(graph, {
          iterations: 300,
          idealLength: 150
        });
        // Apply positions
        for (const [nodeId, pos] of positions) {
          const node = graph.nodes.get(nodeId);
          if (node) {
            node.position = pos;
          }
        }
        break;
    }
  }, [layout, isReady, graph]);

  // Notify parent of graph changes
  useEffect(() => {
    if (isReady && onGraphChange) {
      onGraphChange(graph);
    }
  }, [graph, isReady, onGraphChange]);

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && containerRef.current) {
      const container = containerRef.current;
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Action handlers
  const fitToScreen = () => {
    if (rendererRef.current) {
      rendererRef.current.fitToScreen();
    }
  };

  const resetView = () => {
    if (rendererRef.current) {
      rendererRef.current.zoom = 1;
      rendererRef.current.panX = 0;
      rendererRef.current.panY = 0;
    }
  };

  const exportAsJSON = () => {
    const data = graph.toJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`tree-visualization-react ${className}`} style={style}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-gray-700">
            Tree Visualization
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Nodes: {stats.nodes}</span>
            <span>•</span>
            <span>Edges: {stats.edges}</span>
            <span>•</span>
            <span>Zoom: {stats.zoom}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fitToScreen}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            title="Fit to screen (F)"
          >
            Fit
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            title="Reset view (R)"
          >
            Reset
          </button>
          <button
            onClick={exportAsJSON}
            className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
          >
            Export
          </button>
          <span className={`text-xs px-2 py-1 rounded ${
            isReady
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {isReady ? '● Ready' : '○ Loading...'}
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative bg-gray-50"
        style={{ height: 'calc(100% - 48px)' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: 'default' }}
        />

        {/* Loading Overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <div className="text-sm text-gray-600">Initializing canvas...</div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          F: Fit • R: Reset • Wheel: Zoom • Drag: Pan/Move
        </div>
      </div>
    </div>
  );
};

export default TreeVisualizationReact;
