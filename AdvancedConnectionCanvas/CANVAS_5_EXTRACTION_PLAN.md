# Canvas #5 Complete Extraction Plan

## Overview
Canvas #5 is the **Advanced Connection Editor** system (lines 8701-11518) in tree-builder.html.
Total: **~2,800 lines** of JavaScript code including:
- Modal UI with gate palette and canvas
- Port selection popups
- Connection builder wizard
- Signal flow execution engine
- Loop detection system
- Full node/gate/connection management

## Complete Function Inventory

### Modal & UI Management (8701-8850, ~150 lines)
- `openAdvancedConnectionEditor(nodeId)` - Creates full modal with gate palette, canvas, properties
- `closeConnectionEditor()` - Closes and removes modal

### Connection Builder Wizard (8852-9048, ~200 lines)
- `showConnectionBuilder()` - Comprehensive wizard UI with:
  - Source node dropdown
  - Target node dropdown
  - Port selection
  - Threshold input
  - Connection type (normal/conditional/feedback/bypass)
  - Edge label
- `createConnectionFromBuilder()` - Creates connection from wizard inputs

### Edge Drawing Mode (9050-9072, ~25 lines)
- `toggleEdgeMode()` - Toggles edge drawing mode
- `clearAllConnections()` - Clears all connections

### Port Selection System (9077-9266, ~190 lines)
- `showPortSelector(node, nodeId, isStartNode, event)` - Dynamic popup showing available ports
  - Single port auto-confirm
  - Multi-port selection UI with visual display
- `selectPort(nodeId, portIndex, isStartNode)` - Handles port clicks
  - Shows threshold input popup for target ports
  - Creates connections with thresholds
- `cancelPortSelection()` - Cancels port selection

### Drag & Drop (9288-9316, ~30 lines)
- `initializeDragAndDrop()` - Sets up drag-drop for gate palette
- `handleEdgeModeClick()` - Edge mode click handler

### Canvas Engine (9318-10110, ~792 LINES!)
- `initializeConnectionCanvas(nodeId)` - Main canvas initialization
  - Syncs with tree builder nodes
  - Sets up mouse tracking state
  - Main drawing function with:
    - Grid drawing
    - Bezier curve connections
    - Node rendering with shadows
    - Port rendering
    - Connection labels
    - Threshold editing on click
  - Mouse event handlers:
    - mousedown (node/port clicking)
    - mousemove (dragging + hover)
    - mouseup (connection creation)

### Gate Management (10110-10251, ~140 lines)
- `addGateToCanvas(gateType, x, y)` - Creates gate node
  - Calculates input/output port positions
  - Stores complete node data
  - Draws gate with proper colors
  - Makes node draggable

### Connection Drawing (10253-10349, ~100 lines)
- `drawExistingConnections(ctx, nodeId)` - Draws all connections for a node

### Node Dragging (10350-10417, ~70 lines)
- `enableNodeDragging(canvas, nodeData)` - Global mouse handlers for dragging
  - Updates port positions dynamically
  - Cursor management

### Canvas Utilities (10419-10497, ~80 lines)
- `redrawCanvas()` - Full canvas redraw with:
  - Grid rendering
  - Node rendering with gate colors
  - Port rendering
  - Connection rendering

### Advanced Logic Integration (10498-10593, ~100 lines)
- `updateIntegrationStatus(status)` - Shows integration status indicator
- `window.onNodeSelected(node)` - Node selection handler
- `window.evaluateWithAdvancedLogic(node, inputs)` - Evaluates nodes with:
  - Logic gate evaluation
  - Fuzzy gate evaluation
  - Probabilistic evaluation

### Signal Flow Execution Engine (10594-10957, ~360 LINES!)
Class: `SignalFlowEngine`
- `executeFlow(startNodeId, initialInput)` - Main execution loop
- `executeNode(node)` - Executes single node
- `executeLogicGate(node, inputs)` - Logic gate evaluation (AND, OR, XOR, NAND, NOR, NOT, MAJORITY)
- `executeFuzzyGate(node, inputs)` - Fuzzy logic (fuzzy_and, fuzzy_or, fuzzy_not)
- `executeThresholdGate(node, inputs)` - Multi-threshold evaluation
- `executeRouter(node, inputs)` - Routes signal to specific output
- `executeMerge(node, inputs)` - Merges multiple inputs (AND, OR, SUM, AVG, MAX, MIN)
- `executeProcess(node, inputs)` - Process node (multiply, add, modulo, clamp)
- `executeDecision(node, inputs)` - Standard decision node
- `gatherInputs(node)` - Gets inputs from parent nodes
- `determineNextNodes(node, result)` - Determines next nodes based on result
- `handleMergeNode(node)` - Waits for all inputs
- `handleRouterNode(node, result)` - Router output handling
- `detectLoop(nodeId)` - Detects loops in execution
- `getNode(nodeId)` - Gets node from tree builder
- `findNodeParents(nodeId)` - Finds parent nodes
- `findSkipTarget(node)` - Finds skip connection target
- `setDebugMode(enabled)` - Enables debug logging
- `visualizeExecutionPath()` - Console.table visualization

### Loop Detection System (10959-11064, ~105 LINES!)
Class: `LoopDetector`
- `buildGraph(nodes)` - Builds adjacency list from nodes
- `detectAllLoops()` - Detects all loops using DFS
- `detectLoopsDFS(nodeId, path)` - Recursive DFS loop detection
- `analyzeLoopComplexity()` - Analyzes loop statistics
- `visualizeLoops()` - Console visualization of loops

### Flow Execution Controls (11066-11116, ~50 lines)
- `executeSignalFlow()` - Executes flow from start node
- `enableSignalFlowDebug()` - Enables debug mode

### Canvas Rendering (11118-11316, ~200 lines)
- `initializeCanvas()` - Initializes main tree canvas
- `handleCanvasClick(event)` - Canvas click handler
- `handleCanvasHover(event)` - Canvas hover handler
- `isPointInNode(x, y, nodeData)` - Hit detection
- `renderCanvasNodes()` - Renders all nodes on canvas
- `drawNode(x, y, node)` - Draws single node with:
  - Color based on node type
  - Node circle with stroke
  - Node text
  - Branch count indicator

### Node Configuration Modal (11318-11453, ~135 lines)
- `openNodeConfigModal(nodeId)` - Opens node config modal
- `closeNodeConfigModal()` - Closes modal
- `applyNodeConfig()` - Applies node configuration changes

### Tab Switching (11455-11496, ~40 lines)
- `switchConfigTab(tabName)` - Switches between config tabs
  - Sends postMessage when visual tab selected

### Visual Tab Drag Handlers (11498-11518+, ~20+ lines)
- `initializeVisualTabDragHandlers()` - Initializes drag handlers for visual tab

---

## Component Structure Plan

### Folder: `/src/components/AdvancedConnectionCanvas/`

#### Main Components (React)

1. **AdvancedConnectionCanvas.jsx** (Main component, ~150 lines)
   - Receives nodes from TreeBuilderEmbed
   - Opens ConnectionEditorModal
   - Manages global state

2. **ConnectionEditorModal.jsx** (~200 lines)
   - Full-screen modal with layout:
     - Header with close button
     - GatePalette sidebar (left)
     - ConnectionCanvas (center)
     - PropertiesPanel (right, optional)
   - Toolbar with connection builder, edge mode, clear buttons

3. **ConnectionCanvas.jsx** (~400 lines)
   - Canvas rendering engine
   - Mouse event handlers
   - Node/gate drawing
   - Connection drawing with Bezier curves
   - Port rendering
   - Grid background

4. **GatePalette.jsx** (~100 lines)
   - Draggable gate items
   - Gate categories
   - Search/filter

5. **PropertiesPanel.jsx** (~150 lines)
   - Selected node properties
   - Gate configuration
   - Connection properties
   - Threshold settings

6. **ConnectionBuilderWizard.jsx** (~200 lines)
   - Step-by-step connection creation
   - Source/target selection
   - Port selection
   - Threshold input
   - Connection type selection

7. **PortSelectorPopup.jsx** (~100 lines)
   - Dynamic port selection popup
   - Single/multi-port handling
   - Threshold input for target ports

8. **ThresholdInputPopup.jsx** (~50 lines)
   - Small popup for threshold value input
   - Positioned near connection point

#### Engine & Logic Classes (JavaScript/React)

9. **SignalFlowEngine.js** (~400 lines)
   - Complete signal flow execution
   - Node evaluation (logic, fuzzy, threshold, router, merge, process, decision)
   - Loop detection integration
   - Debug mode
   - Execution path visualization

10. **LoopDetector.js** (~150 lines)
    - Graph building
    - DFS loop detection
    - Loop complexity analysis
    - Visualization

11. **GateEvaluators.js** (~200 lines)
    - Logic gate evaluation (AND, OR, XOR, NAND, NOR, NOT, MAJORITY)
    - Fuzzy logic evaluation (fuzzy_and, fuzzy_or, fuzzy_not)
    - Threshold gate evaluation
    - Router evaluation
    - Merge strategies (AND, OR, SUM, AVG, MAX, MIN)
    - Process operations (multiply, add, modulo, clamp)

#### Utilities

12. **DrawingUtils.js** (~150 lines)
    - Grid drawing
    - Node drawing with shadows and colors
    - Port drawing
    - Bezier curve drawing
    - Connection label drawing
    - Arrow drawing
    - Color mappings for gate types

13. **MouseHandlers.js** (~150 lines)
    - Mouse down/move/up handlers
    - Drag detection
    - Port click detection
    - Connection creation
    - Node dragging
    - Hover effects

14. **CanvasState.js** (~100 lines)
    - Canvas state management
    - Node map
    - Connection list
    - Drag state
    - Connection state
    - Edge draw mode

15. **ConnectionManager.js** (~100 lines)
    - Add/remove connections
    - Connection validation
    - Connection rendering data
    - Threshold management

16. **NodeManager.js** (~150 lines)
    - Add/remove nodes
    - Node position updates
    - Port calculation
    - Node type handling
    - Node syncing with tree builder

17. **DragDropHandler.js** (~80 lines)
    - Gate palette drag-drop
    - Drop target handling
    - Gate instantiation on canvas

#### Constants & Config

18. **gateConfig.js** (~100 lines)
    - Gate type definitions
    - Gate colors
    - Gate input/output counts
    - Gate icons
    - Gate categories

19. **canvasConfig.js** (~50 lines)
    - Grid settings
    - Canvas dimensions
    - Port sizes
    - Node sizes
    - Connection styles
    - Color palette

#### Hooks

20. **useCanvasDrawing.js** (~100 lines)
    - Canvas drawing hook
    - Redraw trigger management
    - Animation frame handling

21. **useNodeDragging.js** (~80 lines)
    - Node drag hook
    - Position update handling

22. **useConnectionCreation.js** (~100 lines)
    - Connection creation hook
    - Port selection handling
    - Threshold input handling

---

## Total Files: 22 files
## Total Lines: ~3,500 lines (extracted and organized)

## Extraction Order

1. Create folder structure
2. Extract constants and config (18, 19)
3. Extract utility classes (9, 10, 11)
4. Extract drawing/mouse/state utilities (12, 13, 14, 15, 16, 17)
5. Extract hooks (20, 21, 22)
6. Extract React components (8, 7) - simple ones first
7. Extract complex components (6, 5, 4)
8. Extract canvas component (3)
9. Extract modal (2)
10. Create main component (1)
11. Wire up to TreeBuilderEmbed
12. Delete old code from tree-builder.html
13. Test integration

---

## Integration with TreeBuilderEmbed

### postMessage Communication

**From tree-builder.html iframe:**
```javascript
window.parent.postMessage({
  type: 'OPEN_ADVANCED_CONNECTION_EDITOR',
  payload: {
    nodeId: nodeId,
    node: nodeData,
    allNodes: Array.from(treeBuilder.nodes.values())
  },
  source: 'tree-builder'
}, window.location.origin);
```

**In TreeBuilderEmbed.jsx:**
```javascript
case 'OPEN_ADVANCED_CONNECTION_EDITOR':
  setShowAdvancedConnectionCanvas(true);
  setConnectionEditorData(payload);
  break;
```

**Back to iframe (after edits):**
```javascript
// Send updated connections back
sendToIframe('UPDATE_NODE_CONNECTIONS', {
  nodeId: nodeId,
  connections: updatedConnections
});
```

---

## Notes

- Canvas #5 is the MOST feature-complete implementation
- Includes advanced features not in other canvases:
  - Signal flow execution
  - Loop detection
  - Multiple gate types (logic, fuzzy, threshold, router, merge, process)
  - Bezier curve connections
  - Dynamic port selection
  - Threshold editing
  - Connection builder wizard
  - Drag-drop gate palette
- All 2,800 lines must be extracted - no shortcuts!
- User explicitly said: "if it takes 40 files i guess oh well just make a folder"
- This is the reference implementation that should replace all other canvas systems
