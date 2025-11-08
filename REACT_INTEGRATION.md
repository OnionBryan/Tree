# React Integration Guide

Complete guide for integrating tree-visualization.js with React components.

## Overview

This guide shows how to replace iframe-based components with direct React integration for better performance and simpler state management.

## Components

### 1. TreeVisualizationReact.jsx
Full-featured tree visualization with toolbar and controls.

```jsx
import TreeVisualizationReact from './TreeVisualizationReact';

// Usage
<TreeVisualizationReact
  graph={myGraph}
  layout="hierarchical"
  onNodeSelect={(node) => console.log('Selected:', node)}
  onGraphChange={(graph) => console.log('Graph updated:', graph)}
  className="h-full w-full"
/>
```

### 2. NodeLogicCanvasReact.jsx
**REPLACEMENT** for iframe-based NodeLogicCanvas.

```jsx
// OLD (iframe approach)
import NodeLogicCanvas from './NodeLogicCanvas';
<NodeLogicCanvas node={node} onLogicUpdate={handler} />

// NEW (direct React integration - recommended!)
import NodeLogicCanvasReact from './NodeLogicCanvasReact';
<NodeLogicCanvasReact node={node} onLogicUpdate={handler} />
```

**Benefits:**
- ✅ No iframe overhead
- ✅ Direct state management
- ✅ Faster rendering
- ✅ Better integration with React lifecycle
- ✅ No message passing needed

## Migration Guide

### Step 1: Load tree-visualization.js

Add to your `index.html` or main template:

```html
<script src="/tree-visualization.js"></script>
```

Or if using a build system:

```javascript
// In your main entry file
import '/tree-visualization.js';
```

### Step 2: Update TreeNodeLogicModal

Replace the Canvas tab in `TreeNodeLogicModal.jsx`:

```jsx
// OLD
{activeTab === 'canvas' && (
  <div className="h-full">
    <NodeLogicCanvas
      node={nodeConfig}
      onLogicUpdate={(updatedLogic) => {
        setNodeConfig(prev => ({ ...prev, ...updatedLogic }));
        toast.success('Logic updated from canvas');
      }}
    />
  </div>
)}

// NEW (just change the import!)
{activeTab === 'canvas' && (
  <div className="h-full">
    <NodeLogicCanvasReact
      node={nodeConfig}
      onLogicUpdate={(updatedLogic) => {
        setNodeConfig(prev => ({ ...prev, ...updatedLogic }));
        toast.success('Logic updated from canvas');
      }}
    />
  </div>
)}
```

### Step 3: Update TreeBuilderEmbed (Optional)

You can replace the tree builder iframe with a direct React visualization:

```jsx
// In TreeBuilderEmbed.jsx
import TreeVisualizationReact from './TreeVisualizationReact';
import { useLogicStore } from '../../store/logicStore';

const TreeBuilderEmbedNew = ({ pipelineData }) => {
  const [graph, setGraph] = useState(null);

  // Convert pipelineData to graph
  useEffect(() => {
    if (pipelineData?.tree) {
      const newGraph = convertTreeToGraph(pipelineData.tree);
      setGraph(newGraph);
    }
  }, [pipelineData]);

  return (
    <div className="h-full flex flex-col">
      <TreeVisualizationReact
        graph={graph}
        layout="hierarchical"
        onNodeSelect={handleNodeSelect}
        onGraphChange={handleGraphChange}
      />
    </div>
  );
};
```

## Helper Functions

### Converting Tree Data to Graph

```javascript
/**
 * Convert tree structure to TreeVisualization.LogicGraph
 */
function convertTreeToGraph(treeData) {
  const graph = new window.TreeVisualization.LogicGraph({
    name: 'Decision Tree',
    type: 'dag'
  });

  // Helper: Recursively add nodes and edges
  function addNode(nodeData, depth = 0, parentId = null) {
    const node = new window.TreeVisualization.AdvancedNode({
      id: nodeData.id,
      name: nodeData.question || nodeData.label || 'Node',
      nodeType: nodeData.nodeType || 'decision',
      logicType: nodeData.logicType || nodeData.gateType || 'threshold',
      branchCount: nodeData.numBranches || 2,
      branchLabels: nodeData.branchLabels || [],
      position: {
        x: (nodeData.x || 0),
        y: (nodeData.y || depth * 150)
      },
      metadata: {
        threshold: nodeData.threshold,
        thresholdK: nodeData.thresholdK,
        fuzzyMembership: nodeData.fuzzyMembership
      }
    });

    graph.addNode(node);

    // Add edge from parent if exists
    if (parentId) {
      graph.addEdge(parentId, node.id, {
        label: nodeData.condition || ''
      });
    }

    // Recurse for children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      nodeData.children.forEach(child => {
        addNode(child, depth + 1, node.id);
      });
    }

    return node;
  }

  // Handle different tree formats
  if (treeData.tree) {
    // Hierarchical format
    addNode(treeData.tree);
  } else if (treeData.layers) {
    // Layer-based format
    const nodeMap = new Map();

    // First pass: create all nodes
    treeData.layers.forEach((layer, layerIndex) => {
      layer.nodes.forEach(nodeData => {
        const node = new window.TreeVisualization.AdvancedNode({
          id: nodeData.id,
          name: nodeData.question || 'Node',
          nodeType: nodeData.nodeType || 'decision',
          logicType: nodeData.logicType,
          position: {
            x: nodeData.x || 0,
            y: layerIndex * 150
          }
        });
        graph.addNode(node);
        nodeMap.set(nodeData.id, node);
      });
    });

    // Second pass: create edges
    if (treeData.edges) {
      treeData.edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target, {
          label: edge.label || ''
        });
      });
    }
  }

  return graph;
}
```

### Converting Graph Back to Tree Format

```javascript
/**
 * Convert TreeVisualization.LogicGraph back to tree structure
 */
function convertGraphToTree(graph) {
  const nodes = Array.from(graph.nodes.values());
  const edges = Array.from(graph.edges.values());

  // Find root nodes (no parents)
  const roots = nodes.filter(node => node.parents.length === 0);

  function buildTree(nodeId) {
    const node = graph.nodes.get(nodeId);
    if (!node) return null;

    return {
      id: node.id,
      question: node.name,
      nodeType: node.nodeType,
      logicType: node.logicType,
      threshold: node.metadata?.threshold,
      thresholdK: node.metadata?.thresholdK,
      branchCount: node.branchCount,
      branchLabels: node.branchLabels,
      children: node.children.map(childId => buildTree(childId)).filter(Boolean)
    };
  }

  return {
    tree: roots.length > 0 ? buildTree(roots[0].id) : null,
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.nodeType,
      x: n.position.x,
      y: n.position.y
    })),
    edges: edges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label
    }))
  };
}
```

## Custom Hooks

### useTreeGraph Hook

```javascript
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing TreeVisualization graphs
 */
export function useTreeGraph(initialData) {
  const [graph, setGraph] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.TreeVisualization) {
      console.warn('TreeVisualization not loaded');
      return;
    }

    const newGraph = new window.TreeVisualization.LogicGraph({
      name: 'Tree Graph',
      type: 'dag'
    });

    if (initialData) {
      // Convert initial data to graph
      const converted = convertTreeToGraph(initialData);
      setGraph(converted);
    } else {
      setGraph(newGraph);
    }

    setReady(true);
  }, [initialData]);

  const addNode = (nodeConfig) => {
    if (!graph) return;

    const node = new window.TreeVisualization.AdvancedNode(nodeConfig);
    graph.addNode(node);
    setGraph(graph); // Trigger re-render
  };

  const addEdge = (sourceId, targetId, config = {}) => {
    if (!graph) return;

    graph.addEdge(sourceId, targetId, config);
    setGraph(graph); // Trigger re-render
  };

  const removeNode = (nodeId) => {
    if (!graph) return;

    graph.removeNode(nodeId);
    setGraph(graph); // Trigger re-render
  };

  const applyLayout = (layoutType = 'hierarchical', options = {}) => {
    if (!graph || !window.TreeVisualization) return;

    switch (layoutType) {
      case 'hierarchical':
        window.TreeVisualization.TreeLayout.hierarchical(graph, options);
        break;
      case 'radial':
        window.TreeVisualization.TreeLayout.radial(graph, options);
        break;
      case 'force':
        window.TreeVisualization.TreeLayout.forceDirected(graph, options);
        break;
    }

    setGraph(graph); // Trigger re-render
  };

  const exportJSON = () => {
    if (!graph) return null;
    return graph.toJSON();
  };

  return {
    graph,
    ready,
    addNode,
    addEdge,
    removeNode,
    applyLayout,
    exportJSON
  };
}
```

### Usage Example with Hook

```jsx
import { useTreeGraph } from './hooks/useTreeGraph';
import TreeVisualizationReact from './TreeVisualizationReact';

function MyTreeComponent({ initialTreeData }) {
  const { graph, ready, addNode, applyLayout, exportJSON } = useTreeGraph(initialTreeData);

  const handleAddNode = () => {
    addNode({
      name: 'New Node',
      nodeType: 'decision',
      position: { x: 0, y: 0 }
    });
  };

  const handleExport = () => {
    const data = exportJSON();
    console.log('Exported:', data);
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white border-b">
        <button onClick={handleAddNode}>Add Node</button>
        <button onClick={() => applyLayout('hierarchical')}>Auto Layout</button>
        <button onClick={handleExport}>Export</button>
      </div>
      <div className="flex-1">
        <TreeVisualizationReact graph={graph} layout="hierarchical" />
      </div>
    </div>
  );
}
```

## TypeScript Support (Optional)

If using TypeScript, create type definitions:

```typescript
// tree-visualization.d.ts
declare namespace TreeVisualization {
  export class AdvancedNode {
    constructor(config: {
      id?: string;
      name?: string;
      nodeType?: 'decision' | 'logic_gate' | 'fuzzy_gate' | 'terminal';
      logicType?: string;
      branchCount?: number;
      branchLabels?: string[];
      position?: { x: number; y: number };
      metadata?: Record<string, any>;
    });

    id: string;
    name: string;
    nodeType: string;
    logicType: string;
    position: { x: number; y: number };
  }

  export class LogicGraph {
    constructor(config: { name: string; type: string });

    nodes: Map<string, AdvancedNode>;
    edges: Map<string, any>;

    addNode(node: AdvancedNode): AdvancedNode;
    removeNode(nodeId: string): void;
    addEdge(source: string, target: string, config?: any): any;
    toJSON(): any;
  }

  export class TreeLayout {
    static hierarchical(graph: LogicGraph, options?: any): Map<string, {x: number, y: number}>;
    static radial(graph: LogicGraph, options?: any): Map<string, {x: number, y: number}>;
    static forceDirected(graph: LogicGraph, options?: any): Map<string, {x: number, y: number}>;
  }

  export class CanvasRenderer {
    constructor(canvas: HTMLCanvasElement, graph: LogicGraph);
    render(): void;
    fitToScreen(): void;
  }
}

interface Window {
  TreeVisualization: typeof TreeVisualization;
  treeVisualizer: any;
}
```

## Performance Tips

1. **Memoize graph operations:**
```jsx
const graph = useMemo(() => convertTreeToGraph(treeData), [treeData]);
```

2. **Debounce updates:**
```jsx
const debouncedUpdate = useMemo(
  () => debounce((newGraph) => onGraphChange(newGraph), 300),
  [onGraphChange]
);
```

3. **Use requestAnimationFrame for smooth animations:**
```jsx
useEffect(() => {
  const animate = () => {
    if (rendererRef.current) {
      rendererRef.current.render();
    }
    requestAnimationFrame(animate);
  };
  const id = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(id);
}, []);
```

## Troubleshooting

### "TreeVisualization is not defined"

Make sure `tree-visualization.js` is loaded before your React app:

```html
<script src="/tree-visualization.js"></script>
<script src="/your-react-app.js"></script>
```

### Canvas not resizing

Ensure the container has explicit dimensions:

```jsx
<div className="h-screen w-full"> {/* h-screen or explicit height */}
  <TreeVisualizationReact graph={graph} />
</div>
```

### Graph updates not reflecting

Force re-render by creating a new graph reference:

```jsx
const handleUpdate = () => {
  // Clone the graph to trigger React re-render
  setGraph({ ...graph });
};
```

## Complete Example

See `tree-demo.html` for a complete standalone example, or check the React components:

- `TreeVisualizationReact.jsx` - Full-featured visualization
- `NodeLogicCanvasReact.jsx` - Node logic editor
- Integration with `TreeNodeLogicModal.jsx`

## Questions?

Check the main README.md or the source code comments for more details.
