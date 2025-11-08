/**
 * Port Selector Popup Component
 * Inline popup for selecting input/output ports during connection creation
 * Extracted from Canvas #5 showPortSelector() function
 */

import React, { useEffect, useRef } from 'react';

const PHI = 1.618;

export const PortSelectorPopup = ({
  isOpen,
  position = { x: 0, y: 0 },
  node,
  portType = 'output', // 'input' or 'output'
  onSelectPort,
  onClose
}) => {
  const popupRef = useRef(null);

  /**
   * Close popup when clicking outside
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  /**
   * Close popup on Escape key
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !node) return null;

  const ports = portType === 'output' ? (node.outputs || []) : (node.inputs || []);

  if (ports.length === 0) {
    return null;
  }

  // If only one port, auto-select it
  if (ports.length === 1) {
    setTimeout(() => onSelectPort(0), 0);
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="port-selector-popup"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {/* Header */}
      <div className="popup-header">
        <h4>Select {portType === 'output' ? 'Output' : 'Input'} Port</h4>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {/* Node Info */}
      <div className="node-info">
        <div className="node-icon" style={{ backgroundColor: node.color }}>
          {node.label?.charAt(0) || 'N'}
        </div>
        <div className="node-details">
          <div className="node-label">{node.label || node.id}</div>
          <div className="node-type">{node.type}</div>
        </div>
      </div>

      {/* Port List */}
      <div className="port-list">
        {ports.map((port, index) => (
          <div
            key={index}
            className="port-item"
            onClick={() => {
              onSelectPort(index);
              onClose();
            }}
          >
            <div className="port-indicator" style={{
              backgroundColor: port.active ? '#10B981' : '#6B7280'
            }}>
              {index + 1}
            </div>
            <div className="port-details">
              <div className="port-label">{port.label || `Port ${index + 1}`}</div>
              {port.value !== null && port.value !== undefined && (
                <div className="port-value">Value: {port.value}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .port-selector-popup {
          position: fixed;
          width: ${240 / PHI}px;
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
          font-size: 13px;
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

        .node-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: ${12 / PHI}px 12px;
          background: #374151;
          border-bottom: 1px solid #4B5563;
        }

        .node-icon {
          width: ${32 / PHI}px;
          height: ${32 / PHI}px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 14px;
        }

        .node-details {
          flex: 1;
        }

        .node-label {
          font-size: 12px;
          font-weight: 600;
          color: #F9FAFB;
          margin-bottom: 2px;
        }

        .node-type {
          font-size: 11px;
          color: #9CA3AF;
        }

        .port-list {
          max-height: ${300 / PHI}px;
          overflow-y: auto;
          padding: ${8 / PHI}px;
        }

        .port-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: ${10 / PHI}px;
          margin-bottom: 6px;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .port-item:hover {
          background: #4B5563;
          border-color: #6366F1;
          transform: translateX(4px);
        }

        .port-item:last-child {
          margin-bottom: 0;
        }

        .port-indicator {
          width: ${28 / PHI}px;
          height: ${28 / PHI}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 12px;
        }

        .port-details {
          flex: 1;
        }

        .port-label {
          font-size: 12px;
          font-weight: 500;
          color: #F9FAFB;
          margin-bottom: 2px;
        }

        .port-value {
          font-size: 10px;
          color: #9CA3AF;
        }

        /* Scrollbar */
        .port-list::-webkit-scrollbar {
          width: 6px;
        }

        .port-list::-webkit-scrollbar-track {
          background: #1F2937;
        }

        .port-list::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
        }

        .port-list::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default PortSelectorPopup;
