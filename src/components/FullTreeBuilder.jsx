import React, { useState, useEffect } from 'react';
import { TreeBuilder, generateTreeTemplate } from '../lib/DecisionTree';
import D3TreeVisualization from './D3TreeVisualization';
import ScoreInputModal from './ScoreInputModal';
import { FiDownload, FiUpload, FiSettings, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './FullTreeBuilder.css';

const FullTreeBuilder = () => {
  const [treeBuilder] = useState(() => new TreeBuilder());
  const [, forceUpdate] = useState(0);
  const [vizMode, setVizMode] = useState('standard');
  const [currentScale, setCurrentScale] = useState({ min: -5, max: 5 });
  const [allowDecimals, setAllowDecimals] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderMode, setBuilderMode] = useState('build');
  const [nodeSize, setNodeSize] = useState(120);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [showTooltips, setShowTooltips] = useState(true);

  useEffect(() => {
    // Initialize with a simple template
    if (treeBuilder.layers.length === 0) {
      treeBuilder.addNodeToLayer(0, 'Overall Satisfaction', 0, 0);
      treeBuilder.addNodeToLayer(1, 'Product Quality', 0, 0);
      treeBuilder.addNodeToLayer(1, 'Service Quality', 0, 0);
      forceUpdate(prev => prev + 1);
    }
  }, [treeBuilder]);

  const handleNodeClick = (node) => {
    if (builderMode === 'test') {
      setCurrentNode(node);
      setShowScoreModal(true);
    } else {
      treeBuilder.selectedNode = node;
      toast.info(`Selected: ${node.question}`);
      forceUpdate(prev => prev + 1);
    }
  };

  const handleScoreSubmit = (node, score) => {
    node.userScore = score;
    node.score = score;
    setShowScoreModal(false);
    setCurrentNode(null);
    forceUpdate(prev => prev + 1);
    toast.success(`Score recorded: ${score}`);
  };

  const handleExport = () => {
    const json = treeBuilder.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tree exported!');
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = treeBuilder.importJSON(e.target.result);
        if (success) {
          forceUpdate(prev => prev + 1);
          toast.success('Tree imported successfully!');
        } else {
          toast.error('Failed to import tree');
        }
      } catch (error) {
        toast.error('Invalid tree file');
      }
    };
    reader.readAsText(file);
  };

  const handleSurveyUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          processSurveyData(data);
        } else if (file.name.endsWith('.csv')) {
          const rows = content.split('\n').map(row => row.split(','));
          const headers = rows[0];
          const data = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, i) => {
              obj[header.trim()] = row[i]?.trim();
            });
            return obj;
          });
          processSurveyData(data);
        }

        toast.success('Survey data processed!');
      } catch (error) {
        toast.error('Failed to process survey data');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const processSurveyData = (data) => {
    // Process survey data and update nodes
    treeBuilder.getAllNodes().forEach(node => {
      const nodeData = data.filter(d =>
        d.question === node.question || d.nodeId === node.id
      );

      if (nodeData.length > 0) {
        node.surveyData = nodeData.map(d => ({
          score: parseFloat(d.score || d.value || 0),
          timestamp: d.timestamp || Date.now()
        }));
        node.calculateStatistics();

        // Update threshold based on statistics
        if (node.thresholdMode === 'mean' && node.statistics) {
          node.threshold = node.statistics.mean;
        } else if (node.thresholdMode === 'median' && node.statistics) {
          node.threshold = node.statistics.median;
        }
      }
    });

    forceUpdate(prev => prev + 1);
  };

  const handleScaleChange = (event) => {
    const [min, max] = event.target.value.split(',').map(Number);
    setCurrentScale({ min, max });
    treeBuilder.currentScale = { min, max };
  };

  const handleAddNode = () => {
    const layerIndex = treeBuilder.layers.length;
    treeBuilder.addNodeToLayer(layerIndex, `Node ${Date.now()}`, 0, 0);
    forceUpdate(prev => prev + 1);
    toast.success('Node added!');
  };

  const handleAddLayer = () => {
    treeBuilder.addLayer();
    forceUpdate(prev => prev + 1);
    toast.success('Layer added!');
  };

  const handleRemoveNode = () => {
    if (treeBuilder.selectedNode) {
      treeBuilder.removeNode(treeBuilder.selectedNode.id);
      treeBuilder.selectedNode = null;
      forceUpdate(prev => prev + 1);
      toast.success('Node removed!');
    }
  };

  const handleUndo = () => {
    if (treeBuilder.undo()) {
      forceUpdate(prev => prev + 1);
      toast.success('Undo');
    }
  };

  const handleRedo = () => {
    if (treeBuilder.redo()) {
      forceUpdate(prev => prev + 1);
      toast.success('Redo');
    }
  };

  const handleLoadTemplate = (type) => {
    const newBuilder = generateTreeTemplate(type);
    Object.assign(treeBuilder, newBuilder);
    forceUpdate(prev => prev + 1);
    toast.success(`Loaded ${type} template!`);
  };

  const exportAsPNG = () => {
    toast.info('PNG export would use html2canvas library');
  };

  const exportAsPDF = () => {
    toast.info('PDF export would use jsPDF library');
  };

  const showStatistics = () => {
    const allNodes = treeBuilder.getAllNodes();
    const stats = allNodes.map(node => node.calculateStatistics()).filter(Boolean);

    if (stats.length === 0) {
      toast.error('No survey data available');
      return;
    }

    setShowStats(true);
  };

  return (
    <div className="full-tree-builder">
      <div className="tree-header">
        <div className="header-left">
          <h1>Decision Tree Builder</h1>
          <p className="subtitle">
            {currentScale.min < 0
              ? `Bipolar Scale: ${currentScale.min} to ${currentScale.max}`
              : `Scale: ${currentScale.min} to ${currentScale.max}`
            }
          </p>
        </div>

        <div className="header-controls">
          <select
            value={`${currentScale.min},${currentScale.max}`}
            onChange={handleScaleChange}
            className="scale-select"
          >
            <option value="-5,5">-5 to +5 (11 points)</option>
            <option value="-3,3">-3 to +3 (7 points)</option>
            <option value="-2,2">-2 to +2 (5 points)</option>
            <option value="0,10">0 to 10 (11 points)</option>
            <option value="0,7">0 to 7 (8 points)</option>
            <option value="1,7">1 to 7 (7 points)</option>
            <option value="1,5">1 to 5 (5 points)</option>
          </select>

          <select
            value={vizMode}
            onChange={(e) => setVizMode(e.target.value)}
            className="viz-select"
          >
            <option value="standard">Standard Tree</option>
            <option value="radial">Radial Layout</option>
            <option value="distribution">Score Distribution</option>
            <option value="heatmap">Path Heatmap</option>
            <option value="tanh">Tanh Curve</option>
            <option value="clustering">Clustering Analysis</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={allowDecimals}
              onChange={(e) => setAllowDecimals(e.target.checked)}
            />
            Allow Decimals
          </label>

          <button onClick={() => setShowBuilder(!showBuilder)} className="btn-icon">
            Builder
          </button>

          <button onClick={handleExport} className="btn-icon" title="Export Tree">
            <FiDownload />
          </button>

          <label className="btn-icon" title="Import Tree">
            <FiUpload />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>

          <label className="btn-icon" title="Upload Survey Data">
            <FiPieChart />
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleSurveyUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button onClick={showStatistics} className="btn-icon" title="Statistics">
            <FiBarChart2 />
          </button>

          <button onClick={() => setShowSettings(!showSettings)} className="btn-icon" title="Settings">
            <FiSettings />
          </button>
        </div>
      </div>

      <div className="tree-main">
        <D3TreeVisualization
          treeBuilder={treeBuilder}
          mode={vizMode}
          onNodeClick={handleNodeClick}
          currentScale={currentScale}
          showTooltips={showTooltips}
          nodeSize={nodeSize}
          animationSpeed={animationSpeed}
        />
      </div>

      <div className="tree-footer">
        <div className="status-info">
          <span>Nodes: {treeBuilder.nodes.size}</span>
          <span>Layers: {treeBuilder.layers.length}</span>
          <span>Mode: {builderMode}</span>
        </div>

        <div className="template-buttons">
          <button onClick={() => handleLoadTemplate('simple')} className="btn-template">
            Simple
          </button>
          <button onClick={() => handleLoadTemplate('customer-satisfaction')} className="btn-template">
            Customer Sat.
          </button>
          <button onClick={() => handleLoadTemplate('performance-review')} className="btn-template">
            Performance
          </button>
        </div>
      </div>

      {showBuilder && (
        <div className="builder-panel">
          <h3>Tree Builder</h3>

          <div className="mode-toggle">
            <button
              className={builderMode === 'build' ? 'active' : ''}
              onClick={() => setBuilderMode('build')}
            >
              Build Mode
            </button>
            <button
              className={builderMode === 'test' ? 'active' : ''}
              onClick={() => setBuilderMode('test')}
            >
              Test Mode
            </button>
          </div>

          <div className="builder-actions">
            <button onClick={handleAddLayer} className="btn-action">Add Layer</button>
            <button onClick={handleAddNode} className="btn-action">Add Node</button>
            <button onClick={handleRemoveNode} className="btn-action btn-danger">Remove Node</button>
          </div>

          <div className="history-controls">
            <button onClick={handleUndo} disabled={treeBuilder.historyIndex <= 0}>Undo</button>
            <button onClick={handleRedo} disabled={treeBuilder.historyIndex >= treeBuilder.history.length - 1}>Redo</button>
          </div>

          {treeBuilder.selectedNode && (
            <div className="selected-node-info">
              <h4>Selected Node</h4>
              <p><strong>Question:</strong> {treeBuilder.selectedNode.question}</p>
              <p><strong>Score:</strong> {treeBuilder.selectedNode.score}</p>
              <p><strong>Threshold:</strong> {treeBuilder.selectedNode.threshold}</p>
              <p><strong>Depth:</strong> {treeBuilder.selectedNode.depth}</p>
            </div>
          )}
        </div>
      )}

      {showSettings && (
        <div className="settings-panel">
          <h3>Settings</h3>

          <div className="setting-item">
            <label>Node Size: {nodeSize}px</label>
            <input
              type="range"
              min="50"
              max="200"
              value={nodeSize}
              onChange={(e) => setNodeSize(Number(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label>Animation Speed: {animationSpeed}ms</label>
            <input
              type="range"
              min="0"
              max="2000"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={showTooltips}
                onChange={(e) => setShowTooltips(e.target.checked)}
              />
              Show Tooltips
            </label>
          </div>

          <div className="export-section">
            <h4>Export Options</h4>
            <button onClick={exportAsPNG} className="btn-export">Export as PNG</button>
            <button onClick={exportAsPDF} className="btn-export">Export as PDF</button>
          </div>
        </div>
      )}

      {showStats && (
        <div className="stats-panel">
          <div className="stats-overlay" onClick={() => setShowStats(false)} />
          <div className="stats-content">
            <h3>Statistical Analysis</h3>
            <div className="stats-grid">
              {treeBuilder.getAllNodes().map(node => {
                const stats = node.statistics;
                if (!stats) return null;

                return (
                  <div key={node.id} className="stat-card">
                    <h4>{node.question}</h4>
                    <div className="stat-row">
                      <span>Mean:</span>
                      <span>{stats.mean.toFixed(2)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Median:</span>
                      <span>{stats.median.toFixed(2)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Std Dev:</span>
                      <span>{stats.stdDev.toFixed(2)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Range:</span>
                      <span>{stats.min.toFixed(1)} - {stats.max.toFixed(1)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Count:</span>
                      <span>{stats.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowStats(false)} className="btn-close">Close</button>
          </div>
        </div>
      )}

      <ScoreInputModal
        isOpen={showScoreModal}
        node={currentNode}
        currentScale={currentScale}
        allowDecimals={allowDecimals}
        onSubmit={handleScoreSubmit}
        onCancel={() => {
          setShowScoreModal(false);
          setCurrentNode(null);
        }}
      />
    </div>
  );
};

export default FullTreeBuilder;
