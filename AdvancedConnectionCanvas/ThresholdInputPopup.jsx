/**
 * Threshold Input Popup Component
 * Inline popup for editing connection threshold values
 * Extracted from Canvas #5 selectPort() threshold input logic
 */

import React, { useState, useEffect, useRef } from 'react';

const PHI = 1.618;

export const ThresholdInputPopup = ({
  isOpen,
  position = { x: 0, y: 0 },
  initialValue = null,
  onSubmit,
  onClose,
  connectionInfo = null // { from, to, fromPort, toPort }
}) => {
  const [threshold, setThreshold] = useState(initialValue !== null ? initialValue.toString() : '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  /**
   * Focus input when opened
   */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  /**
   * Close popup when clicking outside
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate threshold
    if (threshold === '') {
      onSubmit(null);
      handleClose();
      return;
    }

    const value = parseFloat(threshold);
    if (isNaN(value)) {
      setError('Threshold must be a number');
      return;
    }

    onSubmit(value);
    handleClose();
  };

  /**
   * Handle cancel
   */
  const handleClose = () => {
    setThreshold('');
    setError('');
    onClose();
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="threshold-popup"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="popup-header">
          <h4>Set Threshold</h4>
          <button type="button" onClick={handleClose} className="close-btn">×</button>
        </div>

        {/* Connection Info */}
        {connectionInfo && (
          <div className="connection-info">
            <div className="info-item">
              <span className="info-label">From:</span>
              <span className="info-value">Port {connectionInfo.fromPort + 1}</span>
            </div>
            <div className="info-item">
              <span className="info-label">To:</span>
              <span className="info-value">Port {connectionInfo.toPort + 1}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="input-container">
          <label htmlFor="threshold-input">Threshold Value</label>
          <input
            ref={inputRef}
            id="threshold-input"
            type="text"
            value={threshold}
            onChange={(e) => {
              setThreshold(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter threshold (or leave empty)"
            className="threshold-input"
          />
          {error && <div className="error-message">{error}</div>}
          <div className="input-help">
            • Leave empty for no threshold<br />
            • Enter a number (e.g., 0.5, 1, 2.5)<br />
            • Signal must exceed threshold to pass
          </div>
        </div>

        {/* Binary Toggle */}
        <div className="binary-toggle-section">
          <div className="binary-label">Binary Mode (True/False)</div>
          <div className="binary-buttons">
            <button
              type="button"
              onClick={() => setThreshold('0')}
              className={`binary-btn binary-false ${threshold === '0' ? 'active' : ''}`}
            >
              <span className="binary-icon">✕</span>
              <span>False / 0</span>
            </button>
            <button
              type="button"
              onClick={() => setThreshold('1')}
              className={`binary-btn binary-true ${threshold === '1' ? 'active' : ''}`}
            >
              <span className="binary-icon">✓</span>
              <span>True / 1</span>
            </button>
          </div>
        </div>

        {/* Quick Fuzzy Presets */}
        <div className="fuzzy-section">
          <div className="fuzzy-label">Fuzzy Values (Optional)</div>
          <div className="preset-buttons">
            <button
              type="button"
              onClick={() => setThreshold('0.25')}
              className="preset-btn"
            >
              0.25
            </button>
            <button
              type="button"
              onClick={() => setThreshold('0.5')}
              className="preset-btn"
            >
              0.5
            </button>
            <button
              type="button"
              onClick={() => setThreshold('0.75')}
              className="preset-btn"
            >
              0.75
            </button>
            <button
              type="button"
              onClick={() => setThreshold('')}
              className="preset-btn"
            >
              None
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="popup-footer">
          <button type="button" onClick={handleClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
        </div>
      </form>

      <style jsx>{`
        .threshold-popup {
          position: fixed;
          width: ${280 / PHI}px;
          background: #1F2937;
          border: 2px solid #6366F1;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 2000;
          animation: popup-enter 0.2s ease-out;
        }

        @keyframes popup-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .popup-header {
          padding: ${12 / PHI}px 12px;
          border-bottom: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .popup-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #F9FAFB;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          line-height: 1;
        }

        .close-btn:hover {
          color: #F9FAFB;
        }

        .connection-info {
          padding: ${10 / PHI}px 12px;
          background: #374151;
          border-bottom: 1px solid #4B5563;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-size: 11px;
          color: #9CA3AF;
        }

        .info-value {
          font-size: 11px;
          color: #F9FAFB;
          font-weight: 500;
        }

        .input-container {
          padding: ${14 / PHI}px 14px;
        }

        .input-container label {
          display: block;
          margin-bottom: ${6 / PHI}px;
          color: #D1D5DB;
          font-size: 12px;
          font-weight: 500;
        }

        .threshold-input {
          width: 100%;
          padding: ${8 / PHI}px 10px;
          background: #374151;
          border: 2px solid #4B5563;
          border-radius: 6px;
          color: #F9FAFB;
          font-size: 14px;
          font-family: monospace;
          transition: border-color 0.2s;
        }

        .threshold-input:focus {
          outline: none;
          border-color: #6366F1;
        }

        .error-message {
          margin-top: 6px;
          color: #EF4444;
          font-size: 11px;
        }

        .input-help {
          margin-top: ${8 / PHI}px;
          padding: ${8 / PHI}px;
          background: #374151;
          border-left: 3px solid #6366F1;
          border-radius: 4px;
          font-size: 10px;
          color: #9CA3AF;
          line-height: 1.4;
        }

        .binary-toggle-section {
          padding: 0 ${14 / PHI}px;
          margin-bottom: ${12 / PHI}px;
        }

        .binary-label {
          font-size: 11px;
          color: #9CA3AF;
          margin-bottom: ${6 / PHI}px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .binary-buttons {
          display: flex;
          gap: 8px;
        }

        .binary-btn {
          flex: 1;
          padding: ${10 / PHI}px;
          border: 2px solid #4B5563;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .binary-icon {
          font-size: 18px;
          font-weight: bold;
        }

        .binary-false {
          background: #374151;
          color: #D1D5DB;
        }

        .binary-false:hover {
          background: #4B5563;
          border-color: #EF4444;
        }

        .binary-false.active {
          background: #991B1B;
          border-color: #EF4444;
          color: #FFFFFF;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
          transform: scale(1.05);
        }

        .binary-true {
          background: #374151;
          color: #D1D5DB;
        }

        .binary-true:hover {
          background: #4B5563;
          border-color: #10B981;
        }

        .binary-true.active {
          background: #065F46;
          border-color: #10B981;
          color: #FFFFFF;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
          transform: scale(1.05);
        }

        .fuzzy-section {
          padding: 0 ${14 / PHI}px;
          margin-bottom: ${14 / PHI}px;
          padding-top: ${12 / PHI}px;
          border-top: 1px solid #374151;
        }

        .fuzzy-label {
          font-size: 11px;
          color: #9CA3AF;
          margin-bottom: ${6 / PHI}px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preset-buttons {
          display: flex;
          gap: 6px;
        }

        .preset-btn {
          flex: 1;
          padding: ${6 / PHI}px;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 4px;
          color: #D1D5DB;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .preset-btn:hover {
          background: #4B5563;
          border-color: #6366F1;
          color: #F9FAFB;
        }

        .popup-footer {
          padding: ${12 / PHI}px 12px;
          border-top: 1px solid #374151;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn {
          padding: ${8 / PHI}px 16px;
          border-radius: 6px;
          font-size: 12px;
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
          color: #F9FAFB;
        }
      `}</style>
    </div>
  );
};

export default ThresholdInputPopup;
