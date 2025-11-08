import React from 'react';

/**
 * Tree Visualization Stub Component
 * TODO: Integrate with TreeVisualizationReact.jsx from root
 */
const TreeVisualization = ({ graph, onNodeSelect, layout, className }) => {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', border: '1px solid #475569', borderRadius: '8px', background: '#0a0e17' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <p>🌳 Tree Visualization Component</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Waiting for TreeVisualization library to load...
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
          <em>To integrate: Copy logic from /TreeVisualizationReact.jsx</em>
        </p>
      </div>
    </div>
  );
};

export default TreeVisualization;
