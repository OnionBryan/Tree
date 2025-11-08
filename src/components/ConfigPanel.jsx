import React from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Config Panel Stub Component
 * TODO: Integrate with ConfigPanel.jsx from root
 */
const ConfigPanel = ({ node, onClose }) => {
  return (
    <div style={{ minWidth: '400px', maxWidth: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #475569' }}>
        <h2 style={{ margin: 0, color: '#00AEEF' }}>Node Configuration</h2>
        <button
          onClick={onClose}
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid #475569', borderRadius: '4px', color: '#e4e7eb', cursor: 'pointer' }}
        >
          <FiX />
        </button>
      </div>

      <div style={{ color: '#94a3b8' }}>
        <p><strong>Node ID:</strong> {node?.id || 'N/A'}</p>
        <p><strong>Node Name:</strong> {node?.name || 'Untitled'}</p>
        <p><strong>Node Type:</strong> {node?.nodeType || 'decision'}</p>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#0a0e17', borderRadius: '8px', border: '1px solid #475569' }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            🚧 <strong>Configuration Panel Coming Soon</strong>
          </p>
          <p style={{ fontSize: '0.75rem', margin: 0 }}>
            To integrate: Copy logic from /ConfigPanel.jsx at root
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
