import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './LogicBuilder.css';

/**
 * Logic Builder Component
 * Create and manage logic nodes with fuzzy logic configuration
 */
const LogicBuilder = ({ logicStore, onOpenFuzzyTable }) => {
  const [nodeType, setNodeType] = useState('decision');
  const [logicType, setLogicType] = useState('threshold');
  const [branchCount, setBranchCount] = useState(2);
  const [nodeName, setNodeName] = useState('');
  const [editingNode, setEditingNode] = useState(null);

  const handleCreateNode = () => {
    if (!nodeName.trim()) {
      toast.error('Please enter a node name');
      return;
    }

    const nodeConfig = {
      name: nodeName,
      nodeType: nodeType,
      logicType: logicType,
      branchCount: parseInt(branchCount),
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200
      }
    };

    const node = logicStore.addNode(nodeConfig);

    if (node) {
      toast.success(`Node "${nodeName}" created`);
      setNodeName('');
    } else {
      toast.error('Failed to create node');
    }
  };

  const handleDeleteNode = (nodeId) => {
    logicStore.removeNode(nodeId);
    toast.success('Node deleted');
  };

  const handleEditNode = (node) => {
    setEditingNode(node.id);
    setNodeName(node.name);
    setNodeType(node.nodeType);
    setLogicType(node.logicType);
    setBranchCount(node.branchCount);
  };

  const handleUpdateNode = () => {
    if (!editingNode) return;

    logicStore.updateNode(editingNode, {
      name: nodeName,
      nodeType: nodeType,
      logicType: logicType,
      branchCount: parseInt(branchCount)
    });

    toast.success('Node updated');
    setEditingNode(null);
    setNodeName('');
    setNodeType('decision');
    setLogicType('threshold');
    setBranchCount(2);
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
    setNodeName('');
    setNodeType('decision');
    setLogicType('threshold');
    setBranchCount(2);
  };

  const nodes = Array.from(logicStore.nodes.values());

  return (
    <div className="logic-builder">
      <div className="builder-panel">
        <div className="panel-section">
          <h3>{editingNode ? 'Edit Node' : 'Create New Node'}</h3>

          <div className="form-group">
            <label>Node Name</label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="e.g., Age Check, Income Threshold"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Node Type</label>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value)}
              className="form-select"
            >
              <option value="decision">Decision Node</option>
              <option value="input">Input Node</option>
              <option value="output">Output Node</option>
              <option value="logic">Logic Gate</option>
            </select>
          </div>

          <div className="form-group">
            <label>Logic Type</label>
            <select
              value={logicType}
              onChange={(e) => setLogicType(e.target.value)}
              className="form-select"
            >
              <option value="threshold">Threshold</option>
              <option value="fuzzy">Fuzzy Logic</option>
              <option value="range">Range Check</option>
              <option value="comparison">Comparison</option>
              <option value="logical">Logical (AND/OR)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Number of Branches</label>
            <input
              type="number"
              min="2"
              max="10"
              value={branchCount}
              onChange={(e) => setBranchCount(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="button-group">
            {editingNode ? (
              <>
                <button onClick={handleUpdateNode} className="btn-primary">
                  <FiCheck /> Update Node
                </button>
                <button onClick={handleCancelEdit} className="btn-secondary">
                  <FiX /> Cancel
                </button>
              </>
            ) : (
              <button onClick={handleCreateNode} className="btn-primary">
                <FiPlus /> Create Node
              </button>
            )}
          </div>
        </div>

        <div className="panel-section">
          <h3>Quick Actions</h3>
          <button onClick={onOpenFuzzyTable} className="btn-action">
            Open Fuzzy Truth Table
          </button>
          <button
            onClick={() => toast.info('Export feature ready - use header button')}
            className="btn-action"
          >
            Export Graph Data
          </button>
        </div>
      </div>

      <div className="nodes-list">
        <div className="list-header">
          <h3>Nodes ({nodes.length})</h3>
        </div>

        {nodes.length === 0 ? (
          <div className="empty-state">
            <p>No nodes created yet</p>
            <p className="hint">Create your first node using the form above</p>
          </div>
        ) : (
          <div className="nodes-grid">
            {nodes.map(node => (
              <div key={node.id} className="node-card">
                <div className="node-header">
                  <div className="node-icon" style={{ background: node.visual.color }}>
                    {node.nodeType[0].toUpperCase()}
                  </div>
                  <div className="node-info">
                    <h4>{node.name}</h4>
                    <span className="node-meta">
                      {node.nodeType} · {node.logicType}
                    </span>
                  </div>
                </div>

                <div className="node-details">
                  <div className="detail-row">
                    <span className="label">Branches:</span>
                    <span className="value">{node.branchCount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">ID:</span>
                    <span className="value code">{node.id.slice(0, 12)}...</span>
                  </div>
                </div>

                <div className="node-actions">
                  <button
                    onClick={() => handleEditNode(node)}
                    className="btn-icon"
                    title="Edit"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    className="btn-icon danger"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogicBuilder;
