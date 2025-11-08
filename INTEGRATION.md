# Tree Logic Builder - Integration Guide

## 🎉 React Infrastructure Complete!

The Tree Logic Builder has been successfully converted to a modern React application with Vite. The skeleton is ready and working!

---

## 📋 What's Been Done

### ✅ Core Infrastructure
- **State Management**: Created LogicContext and GSUContext for global state
- **Directory Structure**: Organized src/ with components, lib, contexts, hooks
- **Build System**: Vite configured and building successfully
- **Styling**: GSU-branded theme with professional dark mode
- **Tree Visualization Library**: Moved to `public/tree-visualization.js` for global access

### ✅ Components Created
- **Stub Components** (in `src/components/`):
  - TreeVisualization.jsx
  - ConnectionCanvas.jsx
  - ConfigPanel.jsx
  - FuzzyTruthTable.jsx
  - DependencyGraph.jsx

- **Main App** (`src/App.jsx`):
  - Multi-tab interface (Builder, Visualization, Canvas, Dependencies, About)
  - Import/Export functionality
  - Status bar with real-time stats
  - Modal system for panels
  - Toast notifications

### ✅ State Management
- **LogicContext** (`src/contexts/LogicContext.jsx`):
  - Graph management (add/remove nodes and edges)
  - Canvas state (zoom, pan, grid settings)
  - Undo/Redo with history tracking
  - Import/Export graph as JSON

- **GSUContext** (`src/contexts/GSUContext.jsx`):
  - Participant management
  - Relationship matrices
  - Knowledge graphs
  - Survey questions and responses
  - ML models
  - Experiment tracking

### ✅ Libraries
- **Logic Evaluator** (`src/lib/logic/gateEvaluator.js`):
  - Boolean gates (AND, OR, NOT, XOR, NAND, NOR, XNOR)
  - Fuzzy gates (min, max, product, algebraic sum, Lukasiewicz, etc.)
  - Threshold gates (majority, at-least-k)
  - Membership functions (triangular, trapezoidal, Gaussian)

---

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Opens at `http://localhost:3000` with hot module replacement.

### Production Build
```bash
npm run build
npm run preview
```

### Test Build
```bash
npm run build
```
Should complete without errors.

---

## 📂 Project Structure

```
Tree/
├── public/
│   └── tree-visualization.js          # Core tree library (loaded globally)
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   └── ConnectionCanvas.jsx   # Stub canvas component
│   │   ├── ConfigPanel.jsx           # Stub config panel
│   │   ├── DependencyGraph.jsx       # Stub dependency graph
│   │   ├── FuzzyTruthTable.jsx       # Stub fuzzy truth table
│   │   └── TreeVisualization.jsx     # Stub tree visualization
│   ├── contexts/
│   │   ├── LogicContext.jsx          # Logic graph state
│   │   ├── GSUContext.jsx            # GSU data state
│   │   └── index.jsx                 # Combined providers
│   ├── hooks/
│   │   └── useTreeGraph.js           # Tree graph hook
│   ├── lib/
│   │   ├── logic/
│   │   │   └── gateEvaluator.js      # Logic gate evaluation
│   │   └── utils/                    # Utility functions
│   ├── store/                        # Compatibility re-exports
│   │   ├── logicStore.js
│   │   └── gsuStore.js
│   ├── App.jsx                       # Main application
│   ├── App.css                       # GSU-themed styles
│   ├── index.css                     # Global styles
│   └── main.jsx                      # Entry point
├── AdvancedConnectionCanvas/         # Full canvas implementation (to integrate)
├── questions/                        # Question components (to integrate)
├── visualization/                    # Visualization components (to integrate)
├── *.jsx                             # Root-level components (to integrate)
├── index-mvp.html                    # Original MVP (backup)
├── index.html                        # New Vite entry point
├── package.json                      # Dependencies
├── vite.config.js                    # Vite configuration
└── INTEGRATION.md                    # This file
```

---

## 🔧 Next Steps: Integration Roadmap

### Phase 1: Integrate Core Components (Priority)

#### 1.1 Tree Visualization
**Goal**: Replace stub with full TreeVisualizationReact.jsx

**Steps**:
1. Copy `/TreeVisualizationReact.jsx` → `src/components/TreeVisualization.jsx`
2. Update imports to use new paths:
   - Remove `window.TreeVisualization` checks (already loaded globally)
   - Update any relative imports
3. Test with sample graph data

**Files to integrate**:
- TreeVisualizationReact.jsx
- tree-visualization.js (already in public/)
- useTreeGraph.js (already in src/hooks/)

#### 1.2 Connection Canvas
**Goal**: Replace stub with full AdvancedConnectionCanvas

**Steps**:
1. Copy `/AdvancedConnectionCanvas.jsx` → `src/components/Canvas/ConnectionCanvas.jsx`
2. Copy utilities from `AdvancedConnectionCanvas/` folder:
   - `utils/` → `src/lib/canvas/`
   - `engine/` → `src/lib/engine/`
   - `constants/` → `src/lib/constants/`
3. Update all imports to use new paths
4. Wire up with LogicStore for node/edge management

**Files to integrate**:
- AdvancedConnectionCanvas.jsx
- AdvancedConnectionCanvas/utils/*.js
- AdvancedConnectionCanvas/engine/*.js
- AdvancedConnectionCanvas/constants/*.js
- All sub-components (GatePalette, ConnectionBuilderWizard, etc.)

#### 1.3 Configuration Panel
**Goal**: Replace stub with full ConfigPanel

**Steps**:
1. Copy `/ConfigPanel.jsx` → `src/components/ConfigPanel.jsx`
2. Verify it works with LogicStore
3. Add support for all node types (decision, fuzzy, gate, etc.)

### Phase 2: Node Components

**Goal**: Integrate all node type components

**Steps**:
1. Create `src/components/Nodes/` directory
2. Copy all *Node.jsx files from root:
   - CustomNode.jsx
   - FuzzyNode.jsx
   - GateNode.jsx
   - HybridNode.jsx
   - LikertNode.jsx
   - SemanticNode.jsx
   - TextInputNode.jsx
   - MultipleChoiceNode.jsx
   - SliderNode.jsx
   - CheckboxNode.jsx
   - MatrixNode.jsx
   - SemanticDifferentialNode.jsx
   - ComboNode.jsx
3. Update imports in each file
4. Export from `src/components/Nodes/index.js`

### Phase 3: Question Components

**Goal**: Integrate survey question components

**Steps**:
1. Copy `questions/` folder → `src/components/Questions/`
2. Update all imports
3. Wire up with GSUStore for survey management

**Files to integrate**:
- questions/ComboQuestion.jsx
- questions/SemanticDifferential.jsx
- questions/TextQuestion.jsx

### Phase 4: Visualization Components

**Goal**: Integrate matrix visualizations

**Steps**:
1. Copy `visualization/` folder → `src/components/Visualization/`
2. Update imports
3. Wire up with GSUStore for participant data

**Files to integrate**:
- visualization/MatrixVisualization.jsx
- visualization/MatrixHeatmap.jsx
- visualization/MatrixNetworkGraph.jsx

### Phase 5: Advanced Features

#### 5.1 Fuzzy Truth Table
1. Copy `/FuzzyTruthTable.jsx` → `src/components/FuzzyTruthTable.jsx`
2. Already has gateEvaluator imported correctly
3. Test fuzzy logic operations

#### 5.2 Dependency Graph
1. Copy `/DependencyGraph.jsx` → `src/components/DependencyGraph.jsx`
2. Ensure ReactFlow is installed (already in package.json)
3. Wire up with LogicStore graph

#### 5.3 Node Logic Canvas
1. Copy `/NodeLogicCanvasReact.jsx` → `src/components/NodeLogicCanvas.jsx`
2. Integrate with TreeVisualization library
3. Add to appropriate tab in App.jsx

#### 5.4 Canvas Logic Builder
1. Copy `/CanvasLogicBuilder.jsx` → `src/components/Canvas/CanvasLogicBuilder.jsx`
2. This is a comprehensive component - may want to extract features into App.jsx
3. Review what features are needed vs. already in App.jsx

---

## 🎨 Styling Guidelines

### GSU Brand Colors
- **Primary Blue**: `#0039A6`
- **Vibrant Blue**: `#00AEEF`
- **Light Blue**: `#97CAEB`
- **Accent Red**: `#CC0000`
- **Success Green**: `#10B981`
- **Warning Orange**: `#F59E0B`

### Dark Theme Colors
- **Background Primary**: `#0a0e17`
- **Background Secondary**: `#1e293b`
- **Background Tertiary**: `#334155`
- **Text Primary**: `#e4e7eb`
- **Text Secondary**: `#94a3b8`

### CSS Variables
All colors and spacing are defined in `src/App.css` as CSS variables. Use these for consistency:
```css
var(--gsu-primary)
var(--bg-primary)
var(--spacing-md)
var(--radius-sm)
var(--shadow-md)
var(--transition-fast)
```

---

## 🔍 Debugging Tips

### Check TreeVisualization Library
```javascript
// In browser console
window.TreeVisualization
```
Should show the TreeVisualization object with AdvancedNode, LogicGraph, etc.

### Check State
```javascript
// In React DevTools
// Look for LogicProvider and GSUProvider contexts
// Inspect graph, nodes, edges
```

### Common Issues

#### "TreeVisualization not loaded"
- Check that `public/tree-visualization.js` exists
- Check browser console for script errors
- Verify script tag in `index.html`

#### Import errors
- Ensure all imports use correct relative paths from `src/`
- Check that files exist at the import path
- Verify file extensions (.jsx vs .js)

#### Build errors
- Run `npm run build` to see detailed errors
- Check for missing dependencies in `package.json`
- Verify Vite config in `vite.config.js`

---

## 📦 Dependencies

### Core
- React 18.2
- React DOM 18.2
- Vite 5.0

### UI Libraries
- react-icons 4.12 (Icon components)
- react-hot-toast 2.4 (Toast notifications)
- reactflow 11.10 (Dependency graph - not yet used in stubs)

### Dev Dependencies
- @vitejs/plugin-react 4.2
- TypeScript type definitions

---

## 🧪 Testing Integration

After integrating each component:

1. **Visual Test**: Does it render correctly?
2. **Interaction Test**: Do clicks/drags/inputs work?
3. **State Test**: Does it update the store correctly?
4. **Build Test**: Does `npm run build` succeed?
5. **Performance Test**: Is it responsive and fast?

---

## 📝 Code Style Guidelines

### Imports
```javascript
// External libraries first
import React, { useState, useEffect } from 'react';
import { FiIcon } from 'react-icons/fi';

// Internal modules
import { useLogicStore } from '../contexts';
import SomeComponent from './SomeComponent.jsx';

// Styles last
import './styles.css';
```

### Component Structure
```javascript
const Component = ({ props }) => {
  // Hooks first
  const store = useLogicStore();
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // ...
  }, [deps]);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    // JSX
  );
};

export default Component;
```

### State Updates
```javascript
// Use store methods
logicStore.addNode(nodeConfig);
logicStore.updateNode(nodeId, updates);

// Not direct mutation
logicStore.nodes.set(id, node); // ❌ Don't do this
```

---

## 🎯 Success Criteria

The integration is complete when:

1. ✅ All tabs in the app show functional components (not stubs)
2. ✅ Users can create, edit, and delete nodes
3. ✅ Users can create connections between nodes
4. ✅ Tree visualization renders the graph hierarchically
5. ✅ Connection canvas supports drag-and-drop
6. ✅ Config panel can modify all node properties
7. ✅ Fuzzy truth tables generate correctly
8. ✅ Dependency graph detects circular references
9. ✅ Import/Export works with full graph data
10. ✅ Build succeeds without errors
11. ✅ No console errors in browser
12. ✅ Responsive design works on mobile

---

## 🤝 Getting Help

### File Locations
- **Original MVP**: `index-mvp.html` (backup of working version)
- **Documentation**: `SETUP.md` (infrastructure setup)
- **This Guide**: `INTEGRATION.md` (you are here)

### Key Files to Review
- `src/contexts/LogicContext.jsx` - Understand state management
- `src/App.jsx` - Main application structure
- `public/tree-visualization.js` - Core tree library
- `index-mvp.html` - Reference for original functionality

### Common Patterns
- State is managed through Context API
- Components are organized by feature
- Styling uses CSS variables for consistency
- Tree library is global (`window.TreeVisualization`)

---

## 🚢 Deployment

When ready to deploy:

1. Run production build:
   ```bash
   npm run build
   ```

2. Test the build:
   ```bash
   npm run preview
   ```

3. Deploy `dist/` folder to your hosting provider

4. Ensure `tree-visualization.js` is served correctly

---

## 📊 Progress Tracking

- [x] Infrastructure setup
- [x] State management
- [x] Build system
- [x] Styling
- [x] Stub components
- [x] Main App layout
- [ ] Tree visualization integration
- [ ] Connection canvas integration
- [ ] Config panel integration
- [ ] Node components integration
- [ ] Question components integration
- [ ] Visualization components integration
- [ ] Fuzzy truth table integration
- [ ] Dependency graph integration
- [ ] Full testing
- [ ] Performance optimization

---

**Ready to start integrating? Begin with Phase 1.1 - Tree Visualization!** 🚀
