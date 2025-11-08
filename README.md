# Tree Visualization Engine

Multi-Branch Tree Rendering with Interactive Features - Version 2.0

## Overview

This is an **additional visualization module** that complements the existing GSU Decision Tree Builder. It provides advanced canvas-based rendering and layout algorithms.

⚠️ **Note**: This module is separate from and does not replace the existing tree builder in `index.html`. Both tools can be used together.

This module provides comprehensive visualization capabilities for advanced tree logic systems, including:

- **Layout Algorithms**: Hierarchical, Radial, and Force-Directed layouts
- **Interactive Rendering**: Canvas-based rendering with zoom, pan, and drag
- **Logic Gates**: Support for AND, OR, NOT, XOR, MAJORITY, and more
- **Fuzzy Logic**: MIN, MAX, Product, Sum, and Average operations
- **Multi-Branch Support**: 2-16 branches with custom labels
- **Configuration Panel**: UI for node and gate configuration

## Files

- `tree-visualization.js` - Main visualization engine module
- `tree-demo.html` - Interactive demo and usage examples
- `index.html` - Main decision tree builder application (includes the module)

## Features

### Core Components

1. **AdvancedNode** - Multi-branch node with various logic types
2. **LogicGraph** - Graph structure for managing nodes and edges
3. **TreeLayout** - Layout algorithms (Hierarchical, Radial, Force-Directed)
4. **CanvasRenderer** - Interactive canvas-based renderer
5. **TreeConfigPanel** - Configuration UI for nodes and gates
6. **EnhancedTreeBuilder** - Complete tree building interface

### Supported Node Types

- **Decision Nodes**: Binary or multi-way decision points
- **Logic Gates**: AND, OR, NOT, NAND, NOR, XOR, XNOR
- **Threshold Gates**: MAJORITY, THRESHOLD-K, EXACTLY-K, AT-MOST-K
- **Fuzzy Operations**: MIN, MAX, Product, Sum, Average (Zadeh)
- **Multi-Valued Logic**: Ternary operations, Consensus, Łukasiewicz
- **Probabilistic**: Probability distribution-based branching
- **Terminal Nodes**: End points/outcomes

### Layout Algorithms

#### Hierarchical Layout
```javascript
TreeLayout.hierarchical(graph, {
    levelSeparation: 150,
    nodeSeparation: 100,
    direction: 'TB', // TB, BT, LR, RL
    centerRoot: true
});
```

#### Radial Layout
```javascript
TreeLayout.radial(graph, {
    radius: 100,
    startAngle: 0,
    endAngle: 2 * Math.PI,
    centerX: 0,
    centerY: 0
});
```

#### Force-Directed Layout
```javascript
TreeLayout.forceDirected(graph, {
    iterations: 500,
    idealLength: 100,
    temperature: 100,
    cooling: 0.95
});
```

## Usage

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Tree Visualization</title>
</head>
<body>
    <div id="treeContainer"></div>

    <script src="tree-visualization.js"></script>
    <script>
        // Create tree builder
        const builder = new TreeVisualization.EnhancedTreeBuilder('treeContainer');

        // Create nodes
        const node1 = new TreeVisualization.AdvancedNode({
            name: 'Start',
            nodeType: 'decision',
            branchCount: 2,
            position: { x: 0, y: 0 }
        });

        builder.graph.addNode(node1);

        // Apply layout
        TreeVisualization.TreeLayout.hierarchical(builder.graph);
    </script>
</body>
</html>
```

### Creating Nodes

```javascript
const decisionNode = new TreeVisualization.AdvancedNode({
    name: 'Question 1',
    nodeType: 'decision',
    branchCount: 3,
    branchLabels: ['Low', 'Medium', 'High'],
    position: { x: 0, y: 0 }
});

const logicGate = new TreeVisualization.AdvancedNode({
    name: 'AND Gate',
    nodeType: 'logic_gate',
    logicType: 'and',
    branchCount: 2
});

const fuzzyGate = new TreeVisualization.AdvancedNode({
    name: 'Fuzzy MIN',
    nodeType: 'fuzzy_gate',
    logicType: 'fuzzy_min',
    branchCount: 2
});
```

### Adding Edges

```javascript
builder.graph.addEdge(node1.id, node2.id, {
    label: 'True',
    weight: 1.0,
    color: '#666666',
    style: 'solid' // or 'dashed', 'dotted'
});
```

### Interactive Features

- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Click and drag on empty space
- **Move Nodes**: Click and drag nodes
- **Select**: Click on a node to select it
- **Delete**: Press Delete key with node selected
- **Fit to Screen**: Press 'F' key
- **Reset View**: Press 'R' key

## API Reference

### TreeVisualization.AdvancedNode

```javascript
new AdvancedNode({
    id: string,                    // Auto-generated if not provided
    name: string,                  // Node display name
    description: string,           // Optional description
    nodeType: string,              // 'decision', 'logic_gate', 'fuzzy_gate', etc.
    logicType: string,             // 'and', 'or', 'threshold', etc.
    branchCount: number,           // Number of branches (2-16)
    branchLabels: string[],        // Custom branch labels
    position: {x, y},              // Node position
    visual: {                      // Visual properties
        shape: string,             // 'circle', 'rectangle', 'diamond', etc.
        size: {width, height},
        color: string,
        icon: string
    }
})
```

### TreeVisualization.LogicGraph

```javascript
const graph = new LogicGraph({
    name: string,
    type: string  // 'dag', 'tree', etc.
});

// Methods
graph.addNode(node)
graph.removeNode(nodeId)
graph.addEdge(sourceId, targetId, config)
graph.removeEdge(edgeId)
graph.toJSON()
graph.execute()
```

### TreeVisualization.CanvasRenderer

```javascript
const renderer = new CanvasRenderer(canvas, graph);

// Methods
renderer.render()
renderer.fitToScreen()
renderer.getNodeAt(x, y)

// Properties
renderer.zoom
renderer.panX
renderer.panY
renderer.selectedNode
```

## Demo

Open `tree-demo.html` in a browser to see an interactive demo with:

- Sample tree creation
- Multiple node types
- Different layout algorithms
- Interactive controls
- Export/import functionality

## Integration with Existing Application

⚠️ **Important**: This visualization engine uses **separate variable names** to avoid conflicts with the existing tree builder.

The module is integrated into `index.html` and can be accessed via:

```javascript
// Access the visualization engine (NOT treeBuilder - that's the existing tool)
window.treeVisualizer

// Toggle visualization visibility
toggleTreeVisualization()

// Available classes from the TreeVisualization namespace
window.TreeVisualization.AdvancedNode
window.TreeVisualization.LogicGraph
window.TreeVisualization.TreeLayout
window.TreeVisualization.CanvasRenderer
window.TreeVisualization.TreeConfigPanel
window.TreeVisualization.EnhancedTreeBuilder
```

### Distinction Between Tools

- **Existing Tree Builder** (`window.treeBuilder`) - Your main decision tree builder with SVG rendering
- **Visualization Engine** (`window.treeVisualizer`) - New canvas-based visualization with advanced layouts

Both tools can coexist without conflicts.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Touch support enabled

## Future Enhancements

- Export to various formats (SVG, PNG, PDF)
- Undo/Redo functionality
- Collaborative editing
- Animation and transitions
- Custom themes
- Accessibility improvements
- Performance optimization for large trees

## License

Part of the GSU Decision Tree Builder project.

## Version History

- **2.0** - Multi-branch support, enhanced layouts, interactive features
- **1.0** - Initial release with basic visualization

---

For questions or issues, please refer to the project documentation.
