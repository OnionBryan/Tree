import React, { useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * DependencyGraph - Visualizes dependencies between survey questions and logic gates
 *
 * Features:
 * - Graph visualization using ReactFlow
 * - Circular dependency detection and highlighting
 * - Question nodes and gate nodes with different styles
 * - Edge coloring based on dependency type
 * - Auto-layout using Dagre algorithm
 * - Minimap for navigation
 * - Zoom/pan controls
 *
 * @param {Object} props
 * @param {Object} props.graph - Logic graph with nodes and edges
 * @param {Object} props.mappings - Input-to-question mappings
 * @param {Array} props.surveyQuestions - Survey questions
 * @param {Array} props.circularDeps - Detected circular dependencies
 * @param {Function} props.onNodeClick - Callback when node is clicked
 */
const DependencyGraph = ({
  graph,
  mappings = {},
  surveyQuestions = [],
  circularDeps = [],
  onNodeClick
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Create question ID lookup
  const questionMap = useMemo(() => {
    const map = new Map();
    surveyQuestions.forEach(q => map.set(q.id, q));
    return map;
  }, [surveyQuestions]);

  // Build dependency graph
  useEffect(() => {
    if (!graph) return;

    const newNodes = [];
    const newEdges = [];
    const circularSet = new Set(circularDeps.flat());

    // Add question nodes (inputs to the logic graph)
    const mappedQuestions = new Set(Object.values(mappings).filter(Boolean));
    mappedQuestions.forEach((questionId, index) => {
      const question = questionMap.get(questionId);
      if (!question) return;

      const isCircular = circularSet.has(questionId);

      newNodes.push({
        id: `question-${questionId}`,
        type: 'input',
        data: {
          label: question.text || question.title || questionId,
          questionType: question.type,
          isCircular
        },
        position: { x: 50, y: index * 100 },
        style: {
          background: isCircular ? '#fee2e2' : '#dbeafe',
          border: `2px solid ${isCircular ? '#ef4444' : '#3b82f6'}`,
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: isCircular ? '#991b1b' : '#1e40af',
          minWidth: '150px'
        }
      });
    });

    // Add logic gate nodes
    if (graph.nodes) {
      const gateNodes = Array.isArray(graph.nodes) ? graph.nodes : Array.from(graph.nodes.values());

      gateNodes.forEach((node, index) => {
        const isCircular = circularSet.has(node.id);

        newNodes.push({
          id: `gate-${node.id}`,
          type: node.type === 'output' ? 'output' : 'default',
          data: {
            label: node.data?.label || node.type || 'Gate',
            gateType: node.type,
            isCircular
          },
          position: { x: 400, y: index * 100 },
          style: {
            background: isCircular ? '#fef3c7' : node.type === 'output' ? '#d1fae5' : '#f3e8ff',
            border: `2px solid ${isCircular ? '#f59e0b' : node.type === 'output' ? '#10b981' : '#8b5cf6'}`,
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 500,
            color: isCircular ? '#92400e' : node.type === 'output' ? '#065f46' : '#5b21b6',
            minWidth: '120px'
          }
        });
      });
    }

    // Add edges from questions to gates (via mappings)
    Object.entries(mappings).forEach(([inputKey, questionId]) => {
      if (!questionId) return;

      // Parse input key to get gate node ID (format: "nodeId.inputName")
      const [gateNodeId] = inputKey.split('.');

      const sourceId = `question-${questionId}`;
      const targetId = `gate-${gateNodeId}`;

      // Check if this edge is part of a circular dependency
      const isCircular = circularDeps.some(cycle =>
        cycle.includes(questionId) && cycle.includes(gateNodeId)
      );

      newEdges.push({
        id: `${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: isCircular,
        style: {
          stroke: isCircular ? '#ef4444' : '#6b7280',
          strokeWidth: isCircular ? 3 : 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCircular ? '#ef4444' : '#6b7280'
        },
        label: isCircular ? '⚠ Circular' : undefined,
        labelStyle: {
          fill: '#ef4444',
          fontWeight: 700,
          fontSize: 11
        }
      });
    });

    // Add edges between logic gates (from graph.edges)
    if (graph.edges) {
      const gateEdges = Array.isArray(graph.edges) ? graph.edges : Array.from(graph.edges.values());

      gateEdges.forEach(edge => {
        const sourceId = `gate-${edge.source}`;
        const targetId = `gate-${edge.target}`;

        // Check if this edge is part of a circular dependency
        const isCircular = circularDeps.some(cycle =>
          cycle.includes(edge.source) && cycle.includes(edge.target)
        );

        newEdges.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          animated: isCircular,
          style: {
            stroke: isCircular ? '#f59e0b' : '#a855f7',
            strokeWidth: isCircular ? 3 : 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCircular ? '#f59e0b' : '#a855f7'
          },
          label: isCircular ? '⚠ Loop' : undefined,
          labelStyle: {
            fill: '#f59e0b',
            fontWeight: 700,
            fontSize: 11
          }
        });
      });
    }

    // Apply auto-layout using simple dagre-like positioning
    const layoutNodes = applyAutoLayout(newNodes, newEdges);

    setNodes(layoutNodes);
    setEdges(newEdges);
  }, [graph, mappings, questionMap, circularDeps, setNodes, setEdges]);

  // Simple auto-layout algorithm (Dagre-like)
  const applyAutoLayout = (nodes, edges) => {
    if (nodes.length === 0) return nodes;

    // Group nodes by type
    const questionNodes = nodes.filter(n => n.id.startsWith('question-'));
    const gateNodes = nodes.filter(n => n.id.startsWith('gate-'));

    // Position question nodes on the left in a column
    questionNodes.forEach((node, index) => {
      node.position = { x: 50, y: index * 120 + 50 };
    });

    // Position gate nodes on the right in a column
    gateNodes.forEach((node, index) => {
      node.position = { x: 400, y: index * 120 + 50 };
    });

    return [...questionNodes, ...gateNodes];
  };

  // Handle node click
  const handleNodeClick = (event, node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // Custom node click handler to highlight dependencies
  const onNodeClickHandler = (event, node) => {
    handleNodeClick(event, node);

    // Highlight connected edges
    setEdges(edges => edges.map(edge => {
      const isConnected = edge.source === node.id || edge.target === node.id;
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: isConnected ? 4 : edge.style.strokeWidth,
          opacity: isConnected ? 1 : 0.3
        }
      };
    }));
  };

  // Reset edge highlighting
  const onPaneClick = () => {
    setEdges(edges => edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: 1
      }
    })));
  };

  return (
    <div className="dependency-graph-container">
      <div className="graph-header">
        <h3>Dependency Graph</h3>
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#dbeafe', border: '2px solid #3b82f6' }} />
            <span>Questions</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f3e8ff', border: '2px solid #8b5cf6' }} />
            <span>Logic Gates</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#d1fae5', border: '2px solid #10b981' }} />
            <span>Output</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#fee2e2', border: '2px solid #ef4444' }} />
            <span>Circular Dependency</span>
          </div>
        </div>
      </div>

      <div className="graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClickHandler}
          onPaneClick={onPaneClick}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.isCircular) return '#ef4444';
              if (node.type === 'input') return '#3b82f6';
              if (node.type === 'output') return '#10b981';
              return '#8b5cf6';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {circularDeps.length > 0 && (
        <div className="circular-deps-warning">
          <div className="warning-header">
            <span className="warning-icon">⚠</span>
            <strong>{circularDeps.length} Circular Dependency Detected</strong>
          </div>
          <div className="warning-details">
            {circularDeps.map((cycle, index) => (
              <div key={index} className="cycle-detail">
                Cycle {index + 1}: {cycle.join(' → ')} → {cycle[0]}
              </div>
            ))}
          </div>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="empty-graph">
          <span className="empty-icon">🔗</span>
          <p>No dependencies to visualize</p>
          <p className="empty-hint">Map survey questions to logic gates to see the dependency graph</p>
        </div>
      )}

      <style jsx>{`
        .dependency-graph-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .graph-header {
          padding: 16px;
          border-bottom: 2px solid #e5e7eb;
          background: #f9fafb;
        }

        .graph-header h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .graph-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .graph-canvas {
          flex: 1;
          position: relative;
          min-height: 400px;
        }

        .circular-deps-warning {
          padding: 12px 16px;
          background: #fef3c7;
          border-top: 2px solid #f59e0b;
        }

        .warning-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #92400e;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .warning-icon {
          font-size: 18px;
        }

        .warning-details {
          margin-left: 26px;
        }

        .cycle-detail {
          font-size: 12px;
          color: #78350f;
          margin-bottom: 4px;
          font-family: monospace;
        }

        .empty-graph {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #9ca3af;
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        .empty-graph p {
          margin: 4px 0;
          font-size: 14px;
        }

        .empty-hint {
          font-size: 12px;
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default DependencyGraph;
