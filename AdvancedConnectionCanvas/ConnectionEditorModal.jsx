/**
 * Connection Editor Modal Component
 * Full-screen modal for editing connection properties
 * Extracted from Canvas #5 openAdvancedConnectionEditor() function
 */

import React, { useState, useEffect } from 'react';
import { CONNECTION_TYPES } from './constants/gateConfig.js';

const PHI = 1.618;

export const ConnectionEditorModal = ({
  isOpen,
  connection,
  nodes = [],
  onSave,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    fromPort: 0,
    toPort: 0,
    threshold: null,
    label: '',
    type: CONNECTION_TYPES.NORMAL,
    weight: 1.0,
    active: false
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Load connection data when opened
   */
  useEffect(() => {
    if (connection) {
      setFormData({
        from: connection.from || '',
        to: connection.to || '',
        fromPort: connection.fromPort || 0,
        toPort: connection.toPort || 0,
        threshold: connection.threshold,
        label: connection.label || '',
        type: connection.type || CONNECTION_TYPES.NORMAL,
        weight: connection.weight ?? 1.0,
        active: connection.active ?? false
      });
      setHasChanges(false);
    }
  }, [connection]);

  /**
   * Handle input change
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.from) {
      newErrors.from = 'Source node is required';
    }

    if (!formData.to) {
      newErrors.to = 'Target node is required';
    }

    if (formData.from === formData.to) {
      newErrors.to = 'Cannot connect node to itself';
    }

    if (formData.threshold !== null && isNaN(formData.threshold)) {
      newErrors.threshold = 'Threshold must be a number';
    }

    if (isNaN(formData.weight)) {
      newErrors.weight = 'Weight must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle save
   */
  const handleSave = () => {
    if (validate()) {
      onSave({
        ...connection,
        ...formData
      });
      onClose();
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      onDelete(connection.id);
      onClose();
    }
  };

  /**
   * Handle close with unsaved changes check
   */
  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  /**
   * Get node by ID
   */
  const getNode = (nodeId) => {
    return nodes.find(n => n.id === nodeId);
  };

  /**
   * Get available ports for a node
   */
  const getNodePorts = (nodeId, portType) => {
    const node = getNode(nodeId);
    if (!node) return [];
    return portType === 'output' ? (node.outputs || []) : (node.inputs || []);
  };

  if (!isOpen || !connection) return null;

  const fromNode = getNode(formData.from);
  const toNode = getNode(formData.to);

  return (
    <div className="editor-overlay">
      <div className="editor-modal">
        {/* Header */}
        <div className="editor-header">
          <h2>Connection Editor</h2>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        {/* Content */}
        <div className="editor-content">
          {/* Left Column: Connection Details */}
          <div className="editor-column">
            <h3>Connection Details</h3>

            {/* Source Node */}
            <div className="form-section">
              <h4>Source Node</h4>
              {fromNode && (
                <div className="node-display">
                  <div className="node-icon" style={{ backgroundColor: fromNode.color }}>
                    {fromNode.label?.charAt(0) || 'N'}
                  </div>
                  <div className="node-info">
                    <div className="node-label">{fromNode.label || fromNode.id}</div>
                    <div className="node-type">{fromNode.type}</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Output Port</label>
                <select
                  value={formData.fromPort}
                  onChange={(e) => handleChange('fromPort', parseInt(e.target.value))}
                  className="form-control"
                >
                  {getNodePorts(formData.from, 'output').map((port, i) => (
                    <option key={i} value={i}>
                      Port {i + 1}: {port.label || `Output ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Node */}
            <div className="form-section">
              <h4>Target Node</h4>
              {toNode && (
                <div className="node-display">
                  <div className="node-icon" style={{ backgroundColor: toNode.color }}>
                    {toNode.label?.charAt(0) || 'N'}
                  </div>
                  <div className="node-info">
                    <div className="node-label">{toNode.label || toNode.id}</div>
                    <div className="node-type">{toNode.type}</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Input Port</label>
                <select
                  value={formData.toPort}
                  onChange={(e) => handleChange('toPort', parseInt(e.target.value))}
                  className="form-control"
                >
                  {getNodePorts(formData.to, 'input').map((port, i) => (
                    <option key={i} value={i}>
                      Port {i + 1}: {port.label || `Input ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Properties */}
          <div className="editor-column">
            <h3>Properties</h3>

            <div className="form-group">
              <label>Connection Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="form-control"
              >
                {Object.entries(CONNECTION_TYPES).map(([key, value]) => (
                  <option key={value} value={value}>{key}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-control"
                placeholder="Optional label"
              />
            </div>

            <div className="form-group">
              <label>Threshold</label>
              <input
                type="number"
                step="0.1"
                value={formData.threshold === null ? '' : formData.threshold}
                onChange={(e) => handleChange('threshold', e.target.value === '' ? null : parseFloat(e.target.value))}
                className="form-control"
                placeholder="No threshold"
              />
              <small className="help-text">
                Signal must exceed this value to pass (leave empty for no threshold)
              </small>
              {errors.threshold && <div className="error-message">{errors.threshold}</div>}
            </div>

            <div className="form-group">
              <label>Weight</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 1.0)}
                className="form-control"
              />
              <small className="help-text">
                Multiplier applied to signals passing through this connection
              </small>
              {errors.weight && <div className="error-message">{errors.weight}</div>}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleChange('active', e.target.checked)}
                />
                <span>Active Connection</span>
              </label>
              <small className="help-text">
                Inactive connections won't pass signals
              </small>
            </div>

            {/* Connection Info */}
            <div className="info-panel">
              <h4>Connection Info</h4>
              <div className="info-row">
                <span className="info-label">ID:</span>
                <span className="info-value">{connection.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  <span className={`status-badge ${formData.active ? 'active' : 'inactive'}`}>
                    {formData.active ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <button onClick={handleDelete} className="btn btn-danger">
            Delete Connection
          </button>
          <div className="footer-right">
            <button onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={!hasChanges}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .editor-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: overlay-enter 0.2s ease-out;
        }

        @keyframes overlay-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .editor-modal {
          width: ${900 / PHI}px;
          max-width: 95vw;
          max-height: 90vh;
          background: #1F2937;
          border-radius: 8px;
          border: 1px solid #374151;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modal-enter 0.3s ease-out;
        }

        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .editor-header {
          padding: ${20 / PHI}px 20px;
          border-bottom: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .editor-header h2 {
          margin: 0;
          color: #F9FAFB;
          font-size: 20px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 32px;
          cursor: pointer;
          padding: 0;
          width: 36px;
          height: 36px;
          line-height: 1;
        }

        .close-btn:hover {
          color: #F9FAFB;
        }

        .editor-content {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${20 / PHI}px;
          padding: ${20 / PHI}px 20px;
        }

        .editor-column h3 {
          margin: 0 0 ${16 / PHI}px 0;
          color: #F9FAFB;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 2px solid #6366F1;
          padding-bottom: ${8 / PHI}px;
        }

        .form-section {
          margin-bottom: ${20 / PHI}px;
          padding: ${16 / PHI}px;
          background: #374151;
          border-radius: 6px;
        }

        .form-section h4 {
          margin: 0 0 ${12 / PHI}px 0;
          color: #D1D5DB;
          font-size: 14px;
          font-weight: 600;
        }

        .node-display {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: ${12 / PHI}px;
          background: #1F2937;
          border-radius: 6px;
          margin-bottom: ${12 / PHI}px;
        }

        .node-icon {
          width: ${40 / PHI}px;
          height: ${40 / PHI}px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 16px;
        }

        .node-info {
          flex: 1;
        }

        .node-label {
          font-size: 14px;
          font-weight: 600;
          color: #F9FAFB;
          margin-bottom: 2px;
        }

        .node-type {
          font-size: 12px;
          color: #9CA3AF;
        }

        .form-group {
          margin-bottom: ${16 / PHI}px;
        }

        .form-group label {
          display: block;
          margin-bottom: ${6 / PHI}px;
          color: #D1D5DB;
          font-size: 13px;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: ${8 / PHI}px 10px;
          background: #1F2937;
          border: 1px solid #4B5563;
          border-radius: 4px;
          color: #F9FAFB;
          font-size: 13px;
        }

        .form-control:focus {
          outline: none;
          border-color: #6366F1;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .help-text {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #6B7280;
        }

        .error-message {
          margin-top: 4px;
          color: #EF4444;
          font-size: 12px;
        }

        .info-panel {
          padding: ${14 / PHI}px;
          background: #374151;
          border-radius: 6px;
          border-left: 3px solid #6366F1;
        }

        .info-panel h4 {
          margin: 0 0 ${10 / PHI}px 0;
          color: #D1D5DB;
          font-size: 13px;
          font-weight: 600;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: ${6 / PHI}px 0;
          border-bottom: 1px solid #4B5563;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 12px;
          color: #9CA3AF;
        }

        .info-value {
          font-size: 12px;
          color: #F9FAFB;
          font-weight: 500;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #10B981;
          color: #FFFFFF;
        }

        .status-badge.inactive {
          background: #6B7280;
          color: #FFFFFF;
        }

        .editor-footer {
          padding: ${16 / PHI}px 16px;
          border-top: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-right {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: ${10 / PHI}px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #6366F1;
          border: none;
          color: #FFFFFF;
        }

        .btn-primary:hover {
          background: #4F46E5;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #374151;
          border: 1px solid #4B5563;
          color: #D1D5DB;
        }

        .btn-secondary:hover {
          background: #4B5563;
          color: #F9FAFB;
        }

        .btn-danger {
          background: #EF4444;
          border: none;
          color: #FFFFFF;
        }

        .btn-danger:hover {
          background: #DC2626;
        }

        /* Scrollbar */
        .editor-content::-webkit-scrollbar {
          width: 8px;
        }

        .editor-content::-webkit-scrollbar-track {
          background: #1F2937;
        }

        .editor-content::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 4px;
        }

        .editor-content::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default ConnectionEditorModal;
