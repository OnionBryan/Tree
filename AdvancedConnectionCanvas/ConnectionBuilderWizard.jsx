/**
 * Connection Builder Wizard Component
 * Step-by-step UI for creating complex connections
 * Extracted from Canvas #5 showConnectionBuilder() function
 */

import React, { useState, useEffect } from 'react';
import { CONNECTION_TYPES } from './constants/gateConfig.js';

const PHI = 1.618; // Golden ratio

export const ConnectionBuilderWizard = ({
  isOpen,
  onClose,
  nodes = [],
  onCreateConnection,
  initialData = {}
}) => {
  const [step, setStep] = useState(1);
  const [connection, setConnection] = useState({
    from: initialData.from || null,
    to: initialData.to || null,
    fromPort: initialData.fromPort || 0,
    toPort: initialData.toPort || 0,
    threshold: initialData.threshold ?? null,
    label: initialData.label || '',
    type: initialData.type || CONNECTION_TYPES.NORMAL,
    weight: initialData.weight ?? 1.0
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData.from) {
      setConnection(prev => ({ ...prev, from: initialData.from }));
      setStep(2); // Skip to port selection if source provided
    }
  }, [initialData.from]);

  /**
   * Validate current step
   */
  const validateStep = (stepNum) => {
    const newErrors = {};

    switch (stepNum) {
      case 1:
        if (!connection.from) {
          newErrors.from = 'Source node is required';
        }
        break;
      case 2:
        if (!connection.to) {
          newErrors.to = 'Target node is required';
        }
        if (connection.from === connection.to) {
          newErrors.to = 'Cannot connect node to itself';
        }
        break;
      case 3:
        if (connection.threshold !== null && isNaN(connection.threshold)) {
          newErrors.threshold = 'Threshold must be a number';
        }
        if (isNaN(connection.weight)) {
          newErrors.weight = 'Weight must be a number';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Go to next step
   */
  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleCreate();
      }
    }
  };

  /**
   * Go to previous step
   */
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  /**
   * Handle connection creation
   */
  const handleCreate = () => {
    if (validateStep(step)) {
      onCreateConnection(connection);
      onClose();
    }
  };

  /**
   * Get available ports for a node
   */
  const getNodePorts = (nodeId, portType) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];
    return portType === 'output' ? (node.outputs || []) : (node.inputs || []);
  };

  if (!isOpen) return null;

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal">
        {/* Header */}
        <div className="wizard-header">
          <h3>Connection Builder</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {/* Progress Indicator */}
        <div className="wizard-progress">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`progress-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}
            >
              <div className="step-number">{s}</div>
              <div className="step-label">
                {s === 1 && 'Source'}
                {s === 2 && 'Target'}
                {s === 3 && 'Properties'}
                {s === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {/* Step 1: Select Source Node */}
          {step === 1 && (
            <div className="step-container">
              <h4>Select Source Node</h4>
              <p className="step-description">Choose the node where the connection will start</p>

              <div className="node-list">
                {nodes.map(node => (
                  <div
                    key={node.id}
                    className={`node-option ${connection.from === node.id ? 'selected' : ''}`}
                    onClick={() => setConnection({ ...connection, from: node.id })}
                  >
                    <div className="node-icon" style={{ backgroundColor: node.color }}>
                      {node.label?.charAt(0) || 'N'}
                    </div>
                    <div className="node-details">
                      <div className="node-label">{node.label || node.id}</div>
                      <div className="node-type">{node.type}</div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.from && <div className="error-message">{errors.from}</div>}
            </div>
          )}

          {/* Step 2: Select Target Node */}
          {step === 2 && (
            <div className="step-container">
              <h4>Select Target Node</h4>
              <p className="step-description">Choose the node where the connection will end</p>

              <div className="node-list">
                {nodes.filter(n => n.id !== connection.from).map(node => (
                  <div
                    key={node.id}
                    className={`node-option ${connection.to === node.id ? 'selected' : ''}`}
                    onClick={() => setConnection({ ...connection, to: node.id })}
                  >
                    <div className="node-icon" style={{ backgroundColor: node.color }}>
                      {node.label?.charAt(0) || 'N'}
                    </div>
                    <div className="node-details">
                      <div className="node-label">{node.label || node.id}</div>
                      <div className="node-type">{node.type}</div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.to && <div className="error-message">{errors.to}</div>}
            </div>
          )}

          {/* Step 3: Configure Properties */}
          {step === 3 && (
            <div className="step-container">
              <h4>Configure Connection</h4>
              <p className="step-description">Set connection properties and behavior</p>

              <div className="form-group">
                <label>Connection Type</label>
                <select
                  value={connection.type}
                  onChange={(e) => setConnection({ ...connection, type: e.target.value })}
                  className="form-control"
                >
                  {Object.entries(CONNECTION_TYPES).map(([key, value]) => (
                    <option key={value} value={value}>{key}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Label (Optional)</label>
                <input
                  type="text"
                  value={connection.label}
                  onChange={(e) => setConnection({ ...connection, label: e.target.value })}
                  className="form-control"
                  placeholder="Connection label"
                />
              </div>

              <div className="form-group">
                <label>Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  value={connection.threshold === null ? '' : connection.threshold}
                  onChange={(e) => setConnection({
                    ...connection,
                    threshold: e.target.value === '' ? null : parseFloat(e.target.value)
                  })}
                  className="form-control"
                  placeholder="No threshold"
                />
                <small className="help-text">Leave empty for no threshold</small>
                {errors.threshold && <div className="error-message">{errors.threshold}</div>}
              </div>

              <div className="form-group">
                <label>Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={connection.weight}
                  onChange={(e) => setConnection({ ...connection, weight: parseFloat(e.target.value) || 1.0 })}
                  className="form-control"
                />
                {errors.weight && <div className="error-message">{errors.weight}</div>}
              </div>

              <div className="form-group">
                <label>Output Port</label>
                <select
                  value={connection.fromPort}
                  onChange={(e) => setConnection({ ...connection, fromPort: parseInt(e.target.value) })}
                  className="form-control"
                >
                  {getNodePorts(connection.from, 'output').map((port, i) => (
                    <option key={i} value={i}>{port.label || `Port ${i + 1}`}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Input Port</label>
                <select
                  value={connection.toPort}
                  onChange={(e) => setConnection({ ...connection, toPort: parseInt(e.target.value) })}
                  className="form-control"
                >
                  {getNodePorts(connection.to, 'input').map((port, i) => (
                    <option key={i} value={i}>{port.label || `Port ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="step-container">
              <h4>Review Connection</h4>
              <p className="step-description">Verify connection details before creating</p>

              <div className="review-section">
                <div className="review-item">
                  <span className="review-label">From:</span>
                  <span className="review-value">
                    {nodes.find(n => n.id === connection.from)?.label || connection.from}
                    {' '}(Port {connection.fromPort + 1})
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">To:</span>
                  <span className="review-value">
                    {nodes.find(n => n.id === connection.to)?.label || connection.to}
                    {' '}(Port {connection.toPort + 1})
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">Type:</span>
                  <span className="review-value">{connection.type}</span>
                </div>
                {connection.label && (
                  <div className="review-item">
                    <span className="review-label">Label:</span>
                    <span className="review-value">{connection.label}</span>
                  </div>
                )}
                {connection.threshold !== null && (
                  <div className="review-item">
                    <span className="review-label">Threshold:</span>
                    <span className="review-value">{connection.threshold}</span>
                  </div>
                )}
                <div className="review-item">
                  <span className="review-label">Weight:</span>
                  <span className="review-value">{connection.weight}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <button
            onClick={nextStep}
            className="btn btn-primary"
          >
            {step === 4 ? 'Create Connection' : 'Next'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .wizard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .wizard-modal {
          width: ${600 / PHI}px;
          max-width: 90vw;
          max-height: 90vh;
          background: #1F2937;
          border-radius: 8px;
          border: 1px solid #374151;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .wizard-header {
          padding: ${20 / PHI}px 20px;
          border-bottom: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .wizard-header h3 {
          margin: 0;
          color: #F9FAFB;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          line-height: 1;
        }

        .close-btn:hover {
          color: #F9FAFB;
        }

        .wizard-progress {
          display: flex;
          padding: ${20 / PHI}px;
          border-bottom: 1px solid #374151;
          gap: 10px;
        }

        .progress-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .step-number {
          width: ${32 / PHI}px;
          height: ${32 / PHI}px;
          border-radius: 50%;
          background: #374151;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .progress-step.active .step-number {
          background: #6366F1;
          color: #FFFFFF;
        }

        .progress-step.current .step-number {
          background: #F59E0B;
          color: #FFFFFF;
        }

        .step-label {
          font-size: 11px;
          color: #6B7280;
        }

        .progress-step.active .step-label {
          color: #9CA3AF;
        }

        .wizard-content {
          flex: 1;
          overflow-y: auto;
          padding: ${20 / PHI}px 20px;
        }

        .step-container h4 {
          margin: 0 0 ${8 / PHI}px 0;
          color: #F9FAFB;
          font-size: 16px;
          font-weight: 600;
        }

        .step-description {
          margin: 0 0 ${16 / PHI}px 0;
          color: #9CA3AF;
          font-size: 13px;
        }

        .node-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .node-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: ${12 / PHI}px;
          background: #374151;
          border: 2px solid #4B5563;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .node-option:hover {
          background: #4B5563;
          border-color: #6B7280;
        }

        .node-option.selected {
          background: #4B5563;
          border-color: #6366F1;
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

        .node-details {
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
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 4px;
          color: #F9FAFB;
          font-size: 13px;
        }

        .form-control:focus {
          outline: none;
          border-color: #6366F1;
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

        .review-section {
          background: #374151;
          border-radius: 6px;
          padding: ${16 / PHI}px;
        }

        .review-item {
          display: flex;
          justify-content: space-between;
          padding: ${10 / PHI}px 0;
          border-bottom: 1px solid #4B5563;
        }

        .review-item:last-child {
          border-bottom: none;
        }

        .review-label {
          color: #9CA3AF;
          font-size: 13px;
        }

        .review-value {
          color: #F9FAFB;
          font-size: 13px;
          font-weight: 500;
        }

        .wizard-footer {
          padding: ${16 / PHI}px 16px;
          border-top: 1px solid #374151;
          display: flex;
          justify-content: space-between;
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

        .btn-secondary {
          background: #374151;
          border: 1px solid #4B5563;
          color: #D1D5DB;
        }

        .btn-secondary:hover {
          background: #4B5563;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ConnectionBuilderWizard;
