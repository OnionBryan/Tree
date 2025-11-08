import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiPlus, FiMinus, FiMaximize, FiRefreshCw, FiGrid, FiZap, FiSettings, FiDownload, FiUpload, FiCpu, FiActivity, FiMove } from 'react-icons/fi';
import { useLogicStore } from '../../store/logicStore';
import { useGSUStore } from '../../store/gsuStore';
import { CanvasRenderer } from '../../lib/rendering/canvasRenderer';
import { AdvancedNode, Edge, LogicGraph } from '../../lib/logic/advancedNode';
import { GateEvaluator } from '../../lib/logic/gateEvaluator';
import { FuzzyGateEvaluator } from '../../lib/logic/fuzzyLogic';
import NodeConfigPanel from './NodeConfigPanel';
import TruthTableGenerator from '../TruthTable/TruthTableGenerator';
import TruthTablePanel from './TruthTablePanel';
import FuzzyTruthTable from './FuzzyTruthTable';
import { getMLXConnector } from '../../lib/mlx/MLXConnector';
import toast from 'react-hot-toast';

// Import GSU logic gate components
import FuzzyLogicGates from '../GSU/Visualizations/FuzzyLogicGates';
import TruthTableVisualizer from '../GSU/Visualizations/TruthTableVisualizer';
import GateMemorySystem from '../GSU/Visualizations/GateMemorySystem';
import CascadingLogicBuilder from '../GSU/Visualizations/CascadingLogicBuilder';

const CanvasLogicBuilder = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const graphRef = useRef(null);
  const evaluatorRef = useRef(null);
  const fuzzyEvaluatorRef = useRef(null);
  const mlxConnectorRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showTruthTable, setShowTruthTable] = useState(false);
  const [selectedGateForTruthTable, setSelectedGateForTruthTable] = useState(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(true);
  const [mlxConnected, setMlxConnected] = useState(false);
  const [mlxMetrics, setMlxMetrics] = useState(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [nodeSelectorPos, setNodeSelectorPos] = useState(null);
  const [panMode, setPanMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [debugCollapsed, setDebugCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas', 'fuzzy', 'truth', 'memory', 'cascading'

  const {
    graph,
    setAdvancedGraph,
    setCanvasState,
    importGraph,
    exportGraph
  } = useLogicStore();

  const gsuStore = useGSUStore();
  const knowledgeGraphs = gsuStore.knowledgeGraphs || [];

  // Poll global debug logs (populated by main.jsx console interception)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (window.debugLogs && window.debugLogs.length > 0) {
        setDebugLogs([...window.debugLogs]);
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(pollInterval);
  }, []);

  // Initialize graph and renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create logic graph
    const graph = new LogicGraph({
      name: 'Survey Logic Tree',
      type: 'dag',
      allowCycles: false
    });
    graphRef.current = graph;

    // Create evaluators
    evaluatorRef.current = new GateEvaluator();
    fuzzyEvaluatorRef.current = new FuzzyGateEvaluator();

    // Initialize MLX connector
    mlxConnectorRef.current = getMLXConnector();
    mlxConnectorRef.current.connect().then(() => {
      setMlxConnected(true);
      toast.success('MLX accelerator connected');
    }).catch((error) => {
      console.log('MLX not available, using local evaluation');
    });

    // Create renderer
    const renderer = new CanvasRenderer(canvasRef.current, graph);
    rendererRef.current = renderer;

    // Setup renderer callbacks
    renderer.onNodeSelect = handleNodeSelect;
    renderer.onNodeDoubleClick = handleNodeDoubleClick;
    renderer.onNodeDelete = handleNodeDelete;
    renderer.onConnectionComplete = handleConnectionComplete;
    renderer.onCanvasDoubleClick = handleCanvasDoubleClick;

    // Initial render
    renderer.render();

    // Store graph in global store
    setAdvancedGraph(graph);
    setCanvasState({
      renderer,
      evaluator: evaluatorRef.current,
      fuzzyEvaluator: fuzzyEvaluatorRef.current
    });

    // Add some example nodes
    addExampleNodes();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
    };
  }, []);

  // Sync renderer when store graph changes (e.g., from GSU import)
  useEffect(() => {
    if (graph && graphRef.current !== graph && rendererRef.current) {
      console.log('Store graph updated, syncing renderer...', {
        nodes: graph.nodes.size,
        edges: graph.edges.size
      });

      graphRef.current = graph;
      rendererRef.current.graph = graph;
      rendererRef.current.render();
    }
  }, [graph]);

  // Add example nodes for demonstration
  const addExampleNodes = () => {
    if (!graphRef.current) return;

    // Add root decision node
    const rootNode = new AdvancedNode({
      name: 'Survey Start',
      nodeType: 'decision',
      logicType: 'threshold',
      branchCount: 3,
      branchLabels: ['Low', 'Medium', 'High'],
      position: { x: 0, y: -200 },
      thresholds: [0.33, 0.66]
    });
    graphRef.current.addNode(rootNode);

    // Add logic gate node
    const gateNode = new AdvancedNode({
      name: 'AND Gate',
      nodeType: 'logic_gate',
      logicType: 'and',
      branchCount: 2,
      position: { x: -150, y: 0 }
    });
    graphRef.current.addNode(gateNode);

    // Add fuzzy logic node
    const fuzzyNode = new AdvancedNode({
      name: 'Fuzzy Evaluator',
      nodeType: 'fuzzy_gate',
      logicType: 'fuzzy_min',
      branchCount: 2,
      position: { x: 150, y: 0 }
    });
    graphRef.current.addNode(fuzzyNode);

    // Add probabilistic node
    const probNode = new AdvancedNode({
      name: 'Random Branch',
      nodeType: 'probabilistic',
      logicType: 'weighted',
      branchCount: 4,
      branchLabels: ['Path A', 'Path B', 'Path C', 'Path D'],
      probabilityDistribution: [0.25, 0.25, 0.25, 0.25],
      position: { x: 0, y: 100 }
    });
    graphRef.current.addNode(probNode);

    // Add connections
    graphRef.current.addEdge(rootNode.id, gateNode.id, {
      label: 'Low',
      sourcePort: 0
    });
    graphRef.current.addEdge(rootNode.id, fuzzyNode.id, {
      label: 'High',
      sourcePort: 2
    });
    graphRef.current.addEdge(gateNode.id, probNode.id);
    graphRef.current.addEdge(fuzzyNode.id, probNode.id);

    // Render
    if (rendererRef.current) {
      rendererRef.current.render();
    }
  };

  // Handle node selection
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    if (advancedMode) {
      setShowConfigPanel(true);
    }
  }, [advancedMode]);

  // Handle node double click
  const handleNodeDoubleClick = useCallback((node) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, []);

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId) => {
    if (graphRef.current && window.confirm('Delete this node?')) {
      graphRef.current.removeNode(nodeId);
      rendererRef.current.render();
      setSelectedNode(null);
      setShowConfigPanel(false);
      toast.success('Node deleted');
    }
  }, []);

  // Handle connection complete
  const handleConnectionComplete = useCallback((sourceId, targetId) => {
    if (graphRef.current) {
      try {
        graphRef.current.addEdge(sourceId, targetId);
        rendererRef.current.render();
        toast.success('Connection created');
      } catch (error) {
        toast.error(error.message);
      }
    }
  }, []);

  // Handle canvas double click (show node type selector)
  const handleCanvasDoubleClick = useCallback((worldPos) => {
    setNodeSelectorPos(worldPos);
    setShowNodeSelector(true);
  }, []);

  // Toggle pan mode
  const togglePanMode = useCallback(() => {
    const newMode = !panMode;
    setPanMode(newMode);
    if (rendererRef.current) {
      rendererRef.current.setPanMode(newMode);
    }
  }, [panMode]);

  // Add node at position with selected type
  const addNodeAtPosition = useCallback((nodeType, worldPos) => {
    if (!graphRef.current) return;

    const node = new AdvancedNode({
      name: `${nodeType.label} ${graphRef.current.nodes.size + 1}`,
      position: worldPos,
      nodeType: nodeType.type,
      logicType: nodeType.type === 'logic_gate' ? 'and' :
                 nodeType.type === 'fuzzy_gate' ? 'fuzzy_min' :
                 nodeType.type === 'probabilistic' ? 'weighted' : 'threshold'
    });
    graphRef.current.addNode(node);
    rendererRef.current.render();
    toast.success(`${nodeType.label} node added`);
    setShowNodeSelector(false);
  }, []);

  // Node type palette
  const nodeTypes = [
    { type: 'decision', label: 'Decision', icon: '◆', color: '#4A90E2' },
    { type: 'logic_gate', label: 'Logic Gate', icon: '⚡', color: '#FFD700' },
    { type: 'fuzzy_gate', label: 'Fuzzy', icon: '〰️', color: '#9B59B6' },
    { type: 'probabilistic', label: 'Random', icon: '🎲', color: '#E74C3C' },
    { type: 'multi_valued', label: 'Multi-Val', icon: '🔢', color: '#2ECC71' }
  ];

  // Gate groups for organized sidebar
  const gateGroups = {
    basic: {
      label: 'Basic Logic',
      icon: '⚡',
      color: '#FFD700',
      gates: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']
    },
    threshold: {
      label: 'Threshold Gates',
      icon: '🎯',
      color: '#2ECC71',
      gates: ['MAJORITY', 'THRESHOLD', 'EXACTLY', 'AT_MOST', 'AT_LEAST', 'ODD_PARITY', 'EVEN_PARITY']
    },
    fuzzy: {
      label: 'Fuzzy Logic',
      icon: '〰️',
      color: '#9B59B6',
      gates: ['MIN', 'MAX', 'PRODUCT', 'AVERAGE', 'LUKASIEWICZ_AND', 'LUKASIEWICZ_OR']
    },
    advanced: {
      label: 'Advanced',
      icon: '🔬',
      color: '#E74C3C',
      gates: ['IMPLIES', 'IFF', 'BUFFER', 'INVERTER']
    }
  };

  // Gate group expansion state
  const [expandedGroups, setExpandedGroups] = useState({
    basic: true,      // Expanded by default
    threshold: false,
    fuzzy: false,
    advanced: false
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Drag-and-drop handlers for gates
  const handleGateDragStart = (e, gateType) => {
    e.dataTransfer.setData('gateType', gateType);
    e.dataTransfer.effectAllowed = 'copy';
    console.log(`[Drag] Started dragging ${gateType} gate`);
  };

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    const gateType = e.dataTransfer.getData('gateType');

    if (!gateType || !graphRef.current || !rendererRef.current) return;

    // Get canvas position
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - canvasRect.left;
    const screenY = e.clientY - canvasRect.top;

    // Convert to world coordinates
    const worldPos = rendererRef.current.screenToWorld(screenX, screenY);

    console.log(`[Drop] ${gateType} at screen (${screenX}, ${screenY}) → world (${worldPos.x.toFixed(0)}, ${worldPos.y.toFixed(0)})`);

    // Create gate node at drop position
    const node = new AdvancedNode({
      name: gateType,
      nodeType: 'logic_gate',
      logicType: gateType.toLowerCase(),
      position: worldPos
    });

    graphRef.current.addNode(node);
    rendererRef.current.render();
    toast.success(`${gateType} gate added`);
  }, []);

  const handleCanvasDragOver = (e) => {
    e.preventDefault(); // Required to allow drop
    e.dataTransfer.dropEffect = 'copy';
  };

  // Truth table generation utility
  const generateTruthTable = (gateType, inputCount = 2) => {
    // Import gate evaluators
    const { LogicGates, ThresholdGates, FuzzyGates } = require('../../lib/logic/gateEvaluator');

    // Find the evaluator function
    let evaluator = LogicGates[gateType] || ThresholdGates[gateType] || FuzzyGates[gateType];

    if (!evaluator) {
      console.warn(`No evaluator found for gate: ${gateType}`);
      return null;
    }

    const rows = [];

    // Determine if this is a fuzzy gate (needs continuous values)
    const isFuzzyGate = Object.keys(FuzzyGates).includes(gateType);

    if (isFuzzyGate) {
      // For fuzzy gates, use representative fuzzy values
      const fuzzyValues = [0, 0.25, 0.5, 0.75, 1];

      // Generate combinations for 2 inputs (5x5 = 25 rows is manageable)
      for (let i = 0; i < fuzzyValues.length; i++) {
        for (let j = 0; j < fuzzyValues.length; j++) {
          const inputs = [fuzzyValues[i], fuzzyValues[j]];
          try {
            const output = evaluator(inputs);
            rows.push({
              inputs,
              output: typeof output === 'number' ? output.toFixed(2) : output
            });
          } catch (err) {
            console.error(`Error evaluating ${gateType}:`, err);
          }
        }
      }
    } else {
      // For binary gates, use standard binary combinations
      const combinations = Math.pow(2, inputCount);

      for (let i = 0; i < combinations; i++) {
        const inputs = [];
        for (let j = inputCount - 1; j >= 0; j--) {
          inputs.push((i >> j) & 1);
        }

        try {
          const output = evaluator(inputs);
          rows.push({ inputs, output });
        } catch (err) {
          console.error(`Error evaluating ${gateType}:`, err);
        }
      }
    }

    return { gate: gateType, isFuzzy: isFuzzyGate, rows };
  };

  // Add new node of specific type
  const addNodeOfType = (nodeType) => {
    if (!graphRef.current) return;

    // Generate position with more spread to avoid overlap
    const existingNodesCount = graphRef.current.nodes.size;
    const angle = (existingNodesCount * 137.5) * (Math.PI / 180); // Golden angle
    const radius = 100 + existingNodesCount * 20;

    const node = new AdvancedNode({
      name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${existingNodesCount + 1}`,
      nodeType,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      }
    });
    graphRef.current.addNode(node);
    rendererRef.current.render();
    toast.success(`${nodeType} node added`);
  };

  // Execute logic graph
  const executeGraph = () => {
    if (!graphRef.current) return;

    const startTime = performance.now();
    const results = graphRef.current.execute({});
    const executionTime = performance.now() - startTime;

    console.log('Execution results:', results);
    console.log(`Execution time: ${executionTime.toFixed(2)}ms`);

    rendererRef.current.render();
    toast.success(`Execution complete in ${executionTime.toFixed(2)}ms`);
  };

  // Clear graph
  const clearGraph = () => {
    if (window.confirm('Clear all nodes and connections?')) {
      graphRef.current = new LogicGraph({
        name: 'Survey Logic Tree',
        type: 'dag',
        allowCycles: false
      });
      rendererRef.current.graph = graphRef.current;
      rendererRef.current.clear();
      setSelectedNode(null);
      setShowConfigPanel(false);
      toast.success('Graph cleared');
    }
  };

  // Export graph
  const handleExport = () => {
    if (!graphRef.current) return;
    const json = graphRef.current.toJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logic_graph.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Graph exported');
  };

  // Import graph
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target.result);
            graphRef.current = LogicGraph.fromJSON(json);
            rendererRef.current.graph = graphRef.current;
            rendererRef.current.render();
            toast.success('Graph imported');
          } catch (error) {
            toast.error('Failed to import graph');
            console.error(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Toggle connection mode
  const toggleConnectionMode = () => {
    const newMode = !connectionMode;
    setConnectionMode(newMode);
    if (rendererRef.current) {
      rendererRef.current.setConnectionMode(newMode);
    }
    toast.success(newMode ? 'Connection mode ON' : 'Connection mode OFF');
  };

  // Toggle grid
  const toggleGrid = () => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    if (rendererRef.current) {
      rendererRef.current.showGrid = newShowGrid;
      rendererRef.current.render();
    }
  };

  // Zoom controls
  const zoomIn = () => {
    if (rendererRef.current) {
      rendererRef.current.zoom *= 1.2;
      rendererRef.current.render();
    }
  };

  const zoomOut = () => {
    if (rendererRef.current) {
      rendererRef.current.zoom /= 1.2;
      rendererRef.current.render();
    }
  };

  const fitToScreen = () => {
    if (rendererRef.current) {
      rendererRef.current.fitToScreen();
    }
  };

  const resetView = () => {
    if (rendererRef.current) {
      rendererRef.current.resetView();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Logic Builder</h2>
            <span className="text-sm text-gray-500">
              ({graphRef.current?.nodes?.size || 0} nodes, {graphRef.current?.edges?.size || 0} edges)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View controls */}
            <div className="flex items-center gap-1 border-r pr-2">
              <button
                onClick={zoomOut}
                className="p-2 hover:bg-gray-100 rounded"
                title="Zoom Out"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <button
                onClick={zoomIn}
                className="p-2 hover:bg-gray-100 rounded"
                title="Zoom In"
              >
                <FiPlus className="w-4 h-4" />
              </button>
              <button
                onClick={fitToScreen}
                className="p-2 hover:bg-gray-100 rounded"
                title="Fit to Screen"
              >
                <FiMaximize className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-2 hover:bg-gray-100 rounded"
                title="Reset View"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleGrid}
                className={`p-2 rounded ${showGrid ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                title="Toggle Grid"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={togglePanMode}
                className={`p-2 rounded ${panMode ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                title="Pan Mode (Move Canvas)"
              >
                <FiMove className="w-4 h-4" />
              </button>
            </div>

            {/* Tool controls */}
            <div className="flex items-center gap-1 border-r pr-2">
              <button
                onClick={toggleConnectionMode}
                className={`px-3 py-2 rounded flex items-center gap-2 text-sm
                  ${connectionMode ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <FiZap className="w-4 h-4" />
                Connect
              </button>
              <button
                onClick={executeGraph}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm"
              >
                <FiZap className="w-4 h-4" />
                Execute
              </button>
              <button
                onClick={clearGraph}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Clear
              </button>
            </div>

            {/* File controls */}
            <div className="flex items-center gap-1 border-r pr-2">
              <button
                onClick={handleImport}
                className="p-2 hover:bg-gray-100 rounded"
                title="Import"
              >
                <FiUpload className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded"
                title="Export"
              >
                <FiDownload className="w-4 h-4" />
              </button>
            </div>

            {/* Truth Table toggle */}
            <button
              onClick={() => setShowTruthTable(!showTruthTable)}
              className={`px-3 py-2 rounded flex items-center gap-2 text-sm
                ${showTruthTable ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <FiCpu className="w-4 h-4" />
              Truth Table
            </button>

            {/* Advanced mode toggle */}
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`px-3 py-2 rounded flex items-center gap-2 text-sm
                ${advancedMode ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <FiSettings className="w-4 h-4" />
              Advanced
            </button>

            {/* MLX Status Indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs
              ${mlxConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              <FiActivity className="w-3 h-3" />
              <span>{mlxConnected ? 'MLX' : 'CPU'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-2 border-t pt-2">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-4 py-2 text-sm rounded-t ${activeTab === 'canvas' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Canvas Builder
          </button>
          <button
            onClick={() => setActiveTab('fuzzy')}
            className={`px-4 py-2 text-sm rounded-t ${activeTab === 'fuzzy' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Fuzzy Logic Gates
          </button>
          <button
            onClick={() => setActiveTab('truth')}
            className={`px-4 py-2 text-sm rounded-t ${activeTab === 'truth' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Truth Tables
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 text-sm rounded-t ${activeTab === 'memory' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Gate Memory
          </button>
          <button
            onClick={() => setActiveTab('cascading')}
            className={`px-4 py-2 text-sm rounded-t ${activeTab === 'cascading' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Cascading Logic
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Builder Tab */}
        {activeTab === 'canvas' && (
          <>
        {/* Node palette */}
        {advancedMode && (
          <div className="w-48 bg-white border-r border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Node Types</h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={() => addNodeOfType(nodeType.type)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition-colors"
                  style={{ borderLeft: `3px solid ${nodeType.color}` }}
                >
                  <span className="text-xl">{nodeType.icon}</span>
                  <span className="text-sm font-medium">{nodeType.label}</span>
                </button>
              ))}
            </div>

            {/* Logic gates - Grouped & Collapsible */}
            <h3 className="text-sm font-semibold text-gray-700 mt-6 mb-3">Logic Gates</h3>
            <div className="space-y-2">
              {Object.entries(gateGroups).map(([groupKey, group]) => (
                <div key={groupKey}>
                  {/* Group Header - Collapsible */}
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    style={{ borderLeft: `3px solid ${group.color}` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{expandedGroups[groupKey] ? '▼' : '▶'}</span>
                      <span className="text-sm">{group.icon}</span>
                      <span className="font-semibold text-xs">{group.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{group.gates.length}</span>
                  </button>

                  {/* Gates List - Show only if expanded */}
                  {expandedGroups[groupKey] && (
                    <div className="grid grid-cols-2 gap-1 mt-1 pl-3">
                      {group.gates.map(gate => (
                        <button
                          key={gate}
                          draggable={true}
                          onDragStart={(e) => handleGateDragStart(e, gate)}
                          onClick={() => {
                            const node = new AdvancedNode({
                              name: gate,
                              nodeType: 'logic_gate',
                              logicType: gate.toLowerCase(),
                              position: {
                                x: (Math.random() - 0.5) * 300,
                                y: (Math.random() - 0.5) * 300
                              }
                            });
                            graphRef.current?.addNode(node);
                            rendererRef.current?.render();
                            toast.success(`${gate} gate added`);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedGateForTruthTable(gate);
                            setShowTruthTable(true);
                          }}
                          title={`Left-click to add • Right-click for truth table • Drag to canvas`}
                          className="px-2 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded text-xs font-mono transition-colors cursor-grab active:cursor-grabbing"
                        >
                          {gate}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p className="font-semibold mb-1">Controls:</p>
              <ul className="space-y-1">
                <li>• <strong>Drag gate</strong> → drop on canvas at exact position</li>
                <li>• <strong>Left-click gate</strong> → add at random position</li>
                <li>• <strong>Right-click gate</strong> → show truth table</li>
                <li>• <strong>Click node</strong> → select & drag</li>
                <li>• <strong>Double-click</strong> node → cycle ports</li>
                <li>• <strong>Pan Mode</strong> (🔀) → drag canvas</li>
                <li>• <strong>Delete</strong> key → remove selected</li>
                <li>• <strong>Mouse wheel</strong> → zoom in/out</li>
              </ul>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            className="w-full h-full"
            style={{ cursor: connectionMode ? 'crosshair' : 'default' }}
          />

          {/* Node Type Selector Popup */}
          {showNodeSelector && nodeSelectorPos && (
            <>
              {/* Backdrop to close popup */}
              <div
                className="absolute inset-0 bg-transparent"
                onClick={() => setShowNodeSelector(false)}
              />

              {/* Node Type Menu */}
              <div
                className="absolute z-50 bg-white rounded-lg shadow-2xl border-2 border-primary-500 py-2 min-w-[200px]"
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">Select Node Type</h3>
                </div>
                {nodeTypes.map((nodeType) => (
                  <button
                    key={nodeType.type}
                    onClick={() => addNodeAtPosition(nodeType, nodeSelectorPos)}
                    className="w-full px-4 py-2.5 hover:bg-primary-50 text-left flex items-center gap-3 transition-colors"
                    style={{ borderLeft: `4px solid ${nodeType.color}` }}
                  >
                    <span className="text-2xl">{nodeType.icon}</span>
                    <div>
                      <div className="font-medium text-gray-800">{nodeType.label}</div>
                      <div className="text-xs text-gray-500">{nodeType.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Node config panel */}
        {showConfigPanel && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            graph={graphRef.current}
            evaluator={evaluatorRef.current}
            onClose={() => {
              setShowConfigPanel(false);
              setSelectedNode(null);
            }}
            onSave={(updatedNode) => {
              if (rendererRef.current) {
                rendererRef.current.render();
              }
              toast.success('Node updated');
            }}
            onDelete={(nodeId) => {
              handleNodeDelete(nodeId);
            }}
          />
        )}

        {/* Truth Table Panel */}
        {showTruthTable && (
          <div className="absolute right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Truth Table Analysis</h3>
              <button
                onClick={() => setShowTruthTable(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <TruthTableGenerator
                nodeId={selectedNode?.id}
                showKnowledgeBase={true}
                realTimeTest={true}
              />
            </div>
          </div>
        )}

        {/* Debug Console */}
        <div
          className="fixed bottom-5 right-5 w-96 bg-gray-900 border-2 border-green-500 rounded-lg z-[9999] font-mono text-xs shadow-2xl flex flex-col"
          style={{
            height: debugCollapsed ? '48px' : '320px',
            maxHeight: debugCollapsed ? '48px' : '320px'
          }}
        >
          <div className="bg-gray-800 px-3 py-2 border-b border-green-500 flex justify-between items-center">
            <div className="text-green-400 font-bold">🔍 Debug Console</div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDebugLogs([]);
                }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-green-400 rounded text-xs"
              >
                Clear
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDebugCollapsed(!debugCollapsed);
                }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-green-400 rounded text-xs font-bold"
              >
                {debugCollapsed ? '+' : '−'}
              </button>
            </div>
          </div>
          {!debugCollapsed && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-black">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No logs yet...</div>
              ) : (
                debugLogs.map((log, idx) => (
                  <div
                    key={`${log.timestamp}-${idx}`}
                    className={`text-xs p-1 rounded ${
                      log.type === 'error' ? 'text-red-400 bg-red-900/20' :
                      log.type === 'warn' ? 'text-yellow-400 bg-yellow-900/20' :
                      'text-green-400 bg-green-900/10'
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      {/* Truth Table Overlays */}
      {showTruthTable && selectedGateForTruthTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* Check if gate is fuzzy logic */}
          {gateGroups.fuzzy.gates.includes(selectedGateForTruthTable) ? (
            <FuzzyTruthTable
              gateType={selectedGateForTruthTable}
              onClose={() => {
                setShowTruthTable(false);
                setSelectedGateForTruthTable(null);
              }}
            />
          ) : (
            <TruthTablePanel
              gateType={selectedGateForTruthTable}
              inputCount={2}
              onClose={() => {
                setShowTruthTable(false);
                setSelectedGateForTruthTable(null);
              }}
            />
          )}
        </div>
      )}
    </>
  )}

        {/* Fuzzy Logic Gates Tab */}
        {activeTab === 'fuzzy' && (
          <div className="flex-1 overflow-auto">
            <FuzzyLogicGates knowledgeGraphs={knowledgeGraphs} />
          </div>
        )}

        {/* Truth Tables Tab */}
        {activeTab === 'truth' && (
          <div className="flex-1 overflow-auto">
            <TruthTableVisualizer knowledgeGraphs={knowledgeGraphs} />
          </div>
        )}

        {/* Gate Memory Tab */}
        {activeTab === 'memory' && (
          <div className="flex-1 overflow-auto">
            <GateMemorySystem knowledgeGraphs={knowledgeGraphs} />
          </div>
        )}

        {/* Cascading Logic Tab */}
        {activeTab === 'cascading' && (
          <div className="flex-1 overflow-auto">
            <CascadingLogicBuilder knowledgeGraphs={knowledgeGraphs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasLogicBuilder;