import React from 'react';

/**
 * Dependency Graph Stub Component
 * TODO: Integrate with DependencyGraph.jsx from root (uses ReactFlow)
 */
const DependencyGraph = ({ graph, mappings, surveyQuestions, circularDeps, onNodeClick }) => {
  return (
    <div style={{ width: '100%', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #475569', borderRadius: '8px', background: '#0a0e17' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>📊 Dependency Graph</p>
        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Visualize node dependencies and detect circular references
        </p>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#1e293b', borderRadius: '8px', maxWidth: '400px' }}>
          <p style={{ fontSize: '0.75rem', margin: 0 }}>
            <strong>To integrate:</strong> Copy logic from /DependencyGraph.jsx<br />
            Uses ReactFlow library for graph visualization
          </p>
        </div>
      </div>
    </div>
  );
};

export default DependencyGraph;
