import React, { useState, useEffect } from 'react';
import { FiGrid, FiGitBranch, FiLayers, FiZap, FiSettings, FiInfo, FiDownload, FiUpload } from 'react-icons/fi';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

// Import components
import TreeVisualization from './components/TreeVisualization.jsx';
import ConnectionCanvas from './components/Canvas/ConnectionCanvas.jsx';
import ConfigPanel from './components/ConfigPanel.jsx';
import FuzzyTruthTable from './components/FuzzyTruthTable.jsx';
import DependencyGraph from './components/DependencyGraph.jsx';

// Import contexts
import { useLogicStore, useGSUStore } from './contexts';

/**
 * Main Application Component
 * Comprehensive tree logic builder with advanced features
 */

function App() {
  const [activeTab, setActiveTab] = useState('builder');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showFuzzyTable, setShowFuzzyTable] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [treeReady, setTreeReady] = useState(false);

  const logicStore = useLogicStore();
  const gsuStore = useGSUStore();

  // Check if TreeVisualization is loaded
  useEffect(() => {
    const checkTreeViz = setInterval(() => {
      if (typeof window !== 'undefined' && window.TreeVisualization) {
        setTreeReady(true);
        clearInterval(checkTreeViz);
        console.log('[App] TreeVisualization library loaded');
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkTreeViz);
      if (!window.TreeVisualization) {
        console.warn('[App] TreeVisualization library not loaded within 5s');
        toast.error('Tree visualization library failed to load. Some features may be unavailable.');
      }
    }, 5000);

    return () => clearInterval(checkTreeViz);
  }, []);

  // Handle node selection
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    logicStore.setSelectedNode(node);
  };

  // Handle node double-click (open config)
  const handleNodeDoubleClick = (node) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  };

  // Handle graph export
  const handleExport = () => {
    try {
      const graphData = logicStore.exportGraph();
      const gsuData = gsuStore.exportGSUData();

      const exportData = {
        logic: graphData,
        gsu: gsuData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tree-logic-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Graph exported successfully!');
    } catch (error) {
      console.error('[App] Export failed:', error);
      toast.error('Failed to export graph');
    }
  };

  // Handle graph import
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.logic) {
          logicStore.importGraph(data.logic);
        }

        if (data.gsu) {
          gsuStore.importGSUData(data.gsu);
        }

        toast.success('Graph imported successfully!');
      } catch (error) {
        console.error('[App] Import failed:', error);
        toast.error('Failed to import graph');
      }
    };
    reader.readAsText(file);
  };

  // Tab configuration
  const tabs = [
    { id: 'builder', label: 'Logic Builder', icon: FiGrid },
    { id: 'visualization', label: 'Tree Visualization', icon: FiGitBranch },
    { id: 'canvas', label: 'Connection Canvas', icon: FiLayers },
    { id: 'dependencies', label: 'Dependencies', icon: FiZap },
    { id: 'about', label: 'About', icon: FiInfo }
  ];

  return (
    <div className="app-container">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#e4e7eb',
            border: '1px solid #334155'
          }
        }}
      />

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Tree Logic Builder</h1>
            <p>Advanced ML & Fuzzy Logic Analytics</p>
          </div>
          <div className="header-right">
            <button className="btn-icon" onClick={handleExport} title="Export Graph">
              <FiDownload />
            </button>
            <label className="btn-icon" title="Import Graph">
              <FiUpload />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className="btn-icon"
              onClick={() => setShowConfigPanel(true)}
              title="Settings"
            >
              <FiSettings />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="app-nav">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className={`status-indicator ${treeReady ? 'ready' : 'loading'}`} />
          <span>{treeReady ? 'TreeViz Ready' : 'Loading...'}</span>
        </div>
        <div className="status-item">
          <span>Nodes: {logicStore.nodes.size}</span>
        </div>
        <div className="status-item">
          <span>Edges: {logicStore.edges.size}</span>
        </div>
        <div className="status-item">
          <span>Zoom: {Math.round(logicStore.canvasState.zoom * 100)}%</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="app-main">
        {/* Logic Builder Tab */}
        {activeTab === 'builder' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Logic Builder</h2>
              <p>Design multi-branch decision trees with fuzzy logic gates</p>
            </div>
            <div className="builder-content">
              <div className="builder-info">
                <p>🚧 Logic Builder component coming soon...</p>
                <p>This will integrate node creation, logic gate configuration, and truth table generation.</p>
                <button
                  className="btn-primary"
                  onClick={() => toast.info('Opening fuzzy truth table')}
                >
                  Open Fuzzy Truth Table
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tree Visualization Tab */}
        {activeTab === 'visualization' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Tree Visualization</h2>
              <p>Interactive hierarchical tree rendering</p>
            </div>
            {logicStore.graph ? (
              <TreeVisualization
                graph={logicStore.graph}
                onNodeSelect={handleNodeSelect}
                onNodeDoubleClick={handleNodeDoubleClick}
                layout="hierarchical"
                className="tree-viz-container"
              />
            ) : (
              <div className="placeholder">
                <p>{treeReady ? 'No graph data available' : 'Waiting for TreeVisualization library...'}</p>
              </div>
            )}
          </div>
        )}

        {/* Connection Canvas Tab */}
        {activeTab === 'canvas' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Connection Canvas</h2>
              <p>Visual node connection builder with logic gates</p>
            </div>
            <div className="canvas-container">
              <ConnectionCanvas
                nodes={Array.from(logicStore.nodes.values())}
                onNodesChange={(nodes) => {
                  // Update nodes in store
                  nodes.forEach(node => {
                    logicStore.updateNode(node.id, node);
                  });
                }}
                onConnectionsChange={(connections) => {
                  // Handle connection changes
                  console.log('[App] Connections changed:', connections);
                }}
              />
            </div>
          </div>
        )}

        {/* Dependencies Tab */}
        {activeTab === 'dependencies' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Dependency Graph</h2>
              <p>Visualize node dependencies and circular references</p>
            </div>
            {logicStore.graph ? (
              <DependencyGraph
                graph={logicStore.graph}
                mappings={{}}
                surveyQuestions={gsuStore.surveyQuestions}
                circularDeps={[]}
                onNodeClick={handleNodeSelect}
              />
            ) : (
              <div className="placeholder">
                <p>No graph data available</p>
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>About Tree Logic Builder</h2>
            </div>
            <div className="about-content">
              <section className="about-section">
                <h3>Features</h3>
                <ul>
                  <li>✨ Multi-branch decision trees with customizable logic</li>
                  <li>🔮 Fuzzy logic gates with configurable membership functions</li>
                  <li>🎯 Advanced threshold-based decision nodes</li>
                  <li>🌊 Signal flow execution with loop detection</li>
                  <li>📊 Interactive tree visualization with multiple layouts</li>
                  <li>🎨 Connection canvas with drag-and-drop gate insertion</li>
                  <li>🔗 Dependency graph with circular reference detection</li>
                  <li>💾 Import/Export graph data as JSON</li>
                  <li>⚡ ML acceleration support (when available)</li>
                </ul>
              </section>

              <section className="about-section">
                <h3>Architecture</h3>
                <p>Built with modern React architecture:</p>
                <ul>
                  <li><strong>React 18</strong> - UI framework</li>
                  <li><strong>Vite</strong> - Build tool and dev server</li>
                  <li><strong>Context API</strong> - State management</li>
                  <li><strong>ReactFlow</strong> - Dependency graph visualization</li>
                  <li><strong>Custom Canvas Renderer</strong> - High-performance tree rendering</li>
                </ul>
              </section>

              <section className="about-section">
                <h3>Getting Started</h3>
                <ol>
                  <li>Switch to the <strong>Logic Builder</strong> tab to create nodes</li>
                  <li>Use the <strong>Connection Canvas</strong> to link nodes</li>
                  <li>View the <strong>Tree Visualization</strong> for hierarchical layout</li>
                  <li>Check <strong>Dependencies</strong> for circular references</li>
                  <li>Export your work using the download button</li>
                </ol>
              </section>

              <section className="about-section">
                <h3>System Status</h3>
                <div className="system-status">
                  <div className="status-row">
                    <span>TreeVisualization Library:</span>
                    <span className={treeReady ? 'status-ok' : 'status-error'}>
                      {treeReady ? '✓ Loaded' : '✗ Not Loaded'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span>Logic Store:</span>
                    <span className="status-ok">✓ Active</span>
                  </div>
                  <div className="status-row">
                    <span>GSU Store:</span>
                    <span className="status-ok">✓ Active</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Config Panel Modal */}
      {showConfigPanel && selectedNode && (
        <div className="modal-overlay" onClick={() => setShowConfigPanel(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ConfigPanel
              node={selectedNode}
              onClose={() => setShowConfigPanel(false)}
            />
          </div>
        </div>
      )}

      {/* Fuzzy Truth Table Modal */}
      {showFuzzyTable && (
        <div className="modal-overlay" onClick={() => setShowFuzzyTable(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <FuzzyTruthTable
              gateType="AND"
              onClose={() => setShowFuzzyTable(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>Tree Logic Builder v1.0 | React + Vite | {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
