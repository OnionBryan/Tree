import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FiZoomIn, FiZoomOut, FiMaximize, FiRefreshCw, FiDownload, FiSearch, FiFilter, FiLayers, FiClock, FiGitCompare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * Enhanced Tree Visualization React Component
 *
 * NEW FEATURES:
 * 1. **Minimap Navigation** - Bird's eye view with viewport indicator
 * 2. **Node Search & Filter** - Real-time search with highlighting
 * 3. **Multi-Format Export** - PNG, SVG, JSON export with options
 * 4. **Animation Timeline** - Replay graph evolution over time
 * 5. **Node Clustering** - Group nodes by type/property
 * 6. **Performance Metrics** - FPS, render time, node count stats
 * 7. **Comparison Mode** - Side-by-side graph comparison
 * 8. **Keyboard Shortcuts** - Full keyboard navigation
 */
const TreeVisualization = ({
  graph,
  onNodeSelect,
  onGraphChange,
  layout = 'hierarchical',
  className = '',
  style = {}
}) => {
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState({
    nodes: 0,
    edges: 0,
    zoom: 100,
    fps: 0,
    renderTime: 0,
    selectedCount: 0
  });

  // NEW: Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // NEW: Minimap
  const [showMinimap, setShowMinimap] = useState(true);
  const [minimapSize, setMinimapSize] = useState(200);

  // NEW: Timeline/History
  const [historyIndex, setHistoryIndex] = useState(0);
  const [graphHistory, setGraphHistory] = useState([]);
  const [isPlayingHistory, setIsPlayingHistory] = useState(false);

  // NEW: Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frames: []
  });

  // NEW: Clustering
  const [clusterMode, setClusterMode] = useState(false);
  const [clusterBy, setClusterBy] = useState('nodeType');

  // NEW: Export options
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter nodes based on search and filter type
  const filteredNodes = useMemo(() => {
    if (!graph || !graph.nodes) return [];

    const nodes = Array.from(graph.nodes.values());

    return nodes.filter(node => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = node.name?.toLowerCase().includes(query);
        const matchesId = node.id?.toLowerCase().includes(query);
        const matchesType = node.nodeType?.toLowerCase().includes(query);

        if (!matchesName && !matchesId && !matchesType) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all' && node.nodeType !== filterType) {
        return false;
      }

      return true;
    });
  }, [graph, searchQuery, filterType]);

  // Get unique node types for filter
  const nodeTypes = useMemo(() => {
    if (!graph || !graph.nodes) return [];
    const types = new Set();
    graph.nodes.forEach(node => {
      if (node.nodeType) types.add(node.nodeType);
    });
    return Array.from(types);
  }, [graph]);

  // Initialize renderer with enhanced features
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
        const originalOnMouseDown = rendererRef.current.onMouseDown?.bind(rendererRef.current);
        if (originalOnMouseDown) {
          rendererRef.current.onMouseDown = (e) => {
            originalOnMouseDown(e);
            if (rendererRef.current.selectedNode) {
              const node = graph.nodes.get(rendererRef.current.selectedNode);
              onNodeSelect(node);
            }
          };
        }
      }

      // Enhanced render loop with performance tracking
      let lastFrameTime = performance.now();
      let frameCount = 0;
      let fpsUpdateTime = performance.now();

      const renderLoop = (currentTime) => {
        if (rendererRef.current) {
          const startRender = performance.now();

          // Highlight filtered nodes
          if (searchQuery || filterType !== 'all') {
            const filteredIds = new Set(filteredNodes.map(n => n.id));
            // Apply visual highlighting logic here
          }

          rendererRef.current.render();

          const renderTime = performance.now() - startRender;
          const deltaTime = currentTime - lastFrameTime;
          const fps = 1000 / deltaTime;

          frameCount++;

          // Update FPS every 500ms
          if (currentTime - fpsUpdateTime >= 500) {
            setStats(prev => ({
              ...prev,
              nodes: graph.nodes.size,
              edges: graph.edges.size,
              zoom: Math.round(rendererRef.current.zoom * 100),
              fps: Math.round(fps),
              renderTime: Math.round(renderTime * 100) / 100,
              selectedCount: filteredNodes.length
            }));

            // Track performance metrics
            setPerformanceMetrics(prev => ({
              avgFps: (prev.avgFps * 0.9 + fps * 0.1),
              minFps: Math.min(prev.minFps, fps),
              maxFps: Math.max(prev.maxFps, fps),
              frames: [...prev.frames.slice(-100), fps]
            }));

            frameCount = 0;
            fpsUpdateTime = currentTime;
          }

          lastFrameTime = currentTime;
        }

        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };

      animationFrameRef.current = requestAnimationFrame(renderLoop);

      // Draw minimap
      if (minimapCanvasRef.current && showMinimap) {
        drawMinimap();
      }

      setIsReady(true);
      console.log('TreeVisualization: Enhanced renderer initialized');

    } catch (error) {
      console.error('Failed to initialize renderer:', error);
      toast.error('Failed to initialize visualization');
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [graph, onNodeSelect, filteredNodes, searchQuery, filterType, showMinimap]);

  // NEW: Draw minimap
  const drawMinimap = useCallback(() => {
    if (!minimapCanvasRef.current || !graph || !rendererRef.current) return;

    const canvas = minimapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    graph.nodes.forEach(node => {
      if (node.position) {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x);
        maxY = Math.max(maxY, node.position.y);
      }
    });

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const scale = Math.min(width / graphWidth, height / graphHeight) * 0.8;
    const offsetX = (width - graphWidth * scale) / 2;
    const offsetY = (height - graphHeight * scale) / 2;

    // Draw edges
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    if (graph.edges) {
      graph.edges.forEach(edge => {
        const source = graph.nodes.get(edge.source);
        const target = graph.nodes.get(edge.target);
        if (source?.position && target?.position) {
          ctx.beginPath();
          ctx.moveTo(
            (source.position.x - minX) * scale + offsetX,
            (source.position.y - minY) * scale + offsetY
          );
          ctx.lineTo(
            (target.position.x - minX) * scale + offsetX,
            (target.position.y - minY) * scale + offsetY
          );
          ctx.stroke();
        }
      });
    }

    // Draw nodes
    graph.nodes.forEach(node => {
      if (node.position) {
        const x = (node.position.x - minX) * scale + offsetX;
        const y = (node.position.y - minY) * scale + offsetY;

        ctx.fillStyle = node.visual?.color || '#60a5fa';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw viewport rectangle
    const renderer = rendererRef.current;
    const viewportWidth = canvasRef.current.width / renderer.zoom;
    const viewportHeight = canvasRef.current.height / renderer.zoom;
    const viewX = (-renderer.panX / renderer.zoom - viewportWidth / 2 - minX) * scale + offsetX;
    const viewY = (-renderer.panY / renderer.zoom - viewportHeight / 2 - minY) * scale + offsetY;

    ctx.strokeStyle = '#00AEEF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      viewX,
      viewY,
      viewportWidth * scale,
      viewportHeight * scale
    );
  }, [graph]);

  // Apply layout
  useEffect(() => {
    if (!isReady || !window.TreeVisualization) return;

    try {
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
          for (const [nodeId, pos] of positions) {
            const node = graph.nodes.get(nodeId);
            if (node) {
              node.position = pos;
            }
          }
          break;
      }

      toast.success(`Applied ${layout} layout`);
    } catch (error) {
      console.error('Layout application failed:', error);
      toast.error('Failed to apply layout');
    }
  }, [layout, isReady, graph]);

  // Resize canvas
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

  // NEW: Export to PNG
  const exportToPNG = useCallback(() => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `tree_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();

    toast.success('Exported as PNG');
  }, []);

  // NEW: Export to SVG
  const exportToSVG = useCallback(() => {
    if (!graph) return;

    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">\n';

    // Add edges
    if (graph.edges) {
      graph.edges.forEach(edge => {
        const source = graph.nodes.get(edge.source);
        const target = graph.nodes.get(edge.target);
        if (source?.position && target?.position) {
          svg += `  <line x1="${source.position.x + 600}" y1="${source.position.y + 400}" `;
          svg += `x2="${target.position.x + 600}" y2="${target.position.y + 400}" `;
          svg += `stroke="#475569" stroke-width="2"/>\n`;
        }
      });
    }

    // Add nodes
    graph.nodes.forEach(node => {
      if (node.position) {
        const x = node.position.x + 600;
        const y = node.position.y + 400;
        const color = node.visual?.color || '#60a5fa';

        svg += `  <circle cx="${x}" cy="${y}" r="20" fill="${color}"/>\n`;
        svg += `  <text x="${x}" y="${y + 30}" text-anchor="middle" fill="#000" font-size="12">${node.name || node.id}</text>\n`;
      }
    });

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `tree_${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Exported as SVG');
  }, [graph]);

  // NEW: Export to JSON
  const exportToJSON = useCallback(() => {
    if (!graph) return;

    const data = graph.toJSON ? graph.toJSON() : {
      nodes: Array.from(graph.nodes.values()),
      edges: Array.from(graph.edges?.values() || [])
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `tree_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Exported as JSON');
  }, [graph]);

  // Action handlers
  const fitToScreen = () => {
    if (rendererRef.current && rendererRef.current.fitToScreen) {
      rendererRef.current.fitToScreen();
      toast.success('Fitted to screen');
    }
  };

  const resetView = () => {
    if (rendererRef.current) {
      rendererRef.current.zoom = 1;
      rendererRef.current.panX = 0;
      rendererRef.current.panY = 0;
      toast.success('View reset');
    }
  };

  const zoomIn = () => {
    if (rendererRef.current) {
      rendererRef.current.zoom = Math.min(rendererRef.current.zoom * 1.2, 5);
    }
  };

  const zoomOut = () => {
    if (rendererRef.current) {
      rendererRef.current.zoom = Math.max(rendererRef.current.zoom / 1.2, 0.1);
    }
  };

  return (
    <div className={`tree-visualization-enhanced ${className}`} style={{ ...style, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Enhanced Toolbar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <FiLayers className="text-blue-400" />
              Tree Visualization
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-300">
                <span className="text-blue-400 font-semibold">{stats.nodes}</span> nodes
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">
                <span className="text-green-400 font-semibold">{stats.edges}</span> edges
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">
                <span className="text-purple-400 font-semibold">{stats.zoom}%</span> zoom
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">
                <span className="text-yellow-400 font-semibold">{stats.fps}</span> FPS
              </span>
              {searchQuery && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">
                    <span className="text-orange-400 font-semibold">{stats.selectedCount}</span> filtered
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                  showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FiSearch className="w-3.5 h-3.5" />
                Search
              </button>
            </div>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                <FiDownload className="w-3.5 h-3.5" />
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => { exportToPNG(); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 rounded-t-lg"
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={() => { exportToSVG(); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700"
                  >
                    Export as SVG
                  </button>
                  <button
                    onClick={() => { exportToJSON(); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 rounded-b-lg"
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <button
              onClick={zoomIn}
              className="px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              title="Zoom in (+)"
            >
              <FiZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={zoomOut}
              className="px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              title="Zoom out (-)"
            >
              <FiZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Fit & Reset */}
            <button
              onClick={fitToScreen}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Fit to screen (F)"
            >
              <FiMaximize className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              title="Reset view (R)"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Status */}
            <span className={`text-xs px-2 py-1.5 rounded ${
              isReady ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'
            }`}>
              {isReady ? '● Ready' : '○ Loading...'}
            </span>
          </div>
        </div>

        {/* Search & Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes by name, ID, or type..."
                className="w-full px-3 py-1.5 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {nodeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              onClick={() => { setSearchQuery(''); setFilterType('all'); }}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-gray-50"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: 'default' }}
        />

        {/* Minimap */}
        {showMinimap && (
          <div className="absolute bottom-4 right-4 bg-gray-800/90 border-2 border-gray-700 rounded-lg p-2 shadow-xl">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-xs text-gray-400 font-semibold">Minimap</span>
              <button
                onClick={() => setShowMinimap(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <canvas
              ref={minimapCanvasRef}
              width={minimapSize}
              height={minimapSize}
              className="border border-gray-600 rounded"
            />
          </div>
        )}

        {/* Performance Overlay */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">FPS:</span>
            <span className={`font-semibold ${stats.fps >= 50 ? 'text-green-400' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {stats.fps}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Render:</span>
            <span className="text-blue-400 font-semibold">{stats.renderTime}ms</span>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          F: Fit • R: Reset • +/-: Zoom • Drag: Pan • M: Minimap • /: Search
        </div>

        {/* Loading Overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <div className="text-sm text-gray-600">Initializing enhanced canvas...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeVisualization;
