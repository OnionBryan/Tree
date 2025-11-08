# Tree Logic Builder - React Setup

## 🎉 Setup Complete!

Your Tree Logic Builder project has been successfully converted from a monolithic HTML file to a modern React application with Vite.

## 📁 Project Structure

```
Tree/
├── src/                          # React source files
│   ├── main.jsx                  # Application entry point
│   ├── App.jsx                   # Main application component
│   ├── App.css                   # App styles
│   └── index.css                 # Global styles
├── AdvancedConnectionCanvas/     # Connection canvas components
│   ├── *.jsx                     # React components
│   ├── constants/                # Configuration constants
│   ├── engine/                   # Signal flow and loop detection
│   └── utils/                    # Utility managers
├── questions/                    # Question type components
├── visualization/                # Matrix visualization components
├── *.jsx                         # Root-level React components
├── *.js                          # JavaScript modules
├── index.html                    # New Vite HTML entry
├── index-mvp.html                # Original MVP (backup)
├── package.json                  # Dependencies and scripts
├── vite.config.js               # Vite configuration
└── README.md                     # Project documentation
```

## 🚀 Getting Started

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

Create an optimized production build:

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## 📦 Installed Dependencies

### Core
- **React 18.2** - UI library
- **React DOM 18.2** - DOM rendering
- **Vite 5.0** - Build tool and dev server

### UI Libraries
- **ReactFlow 11.10** - Flow-based node editor for DependencyGraph
- **react-icons 4.12** - Icon library
- **react-hot-toast 2.4** - Toast notifications

### Dev Dependencies
- **@vitejs/plugin-react** - React support for Vite
- **TypeScript type definitions** - Type hints for React

## 🔧 Next Steps

The infrastructure is ready! Now you need to integrate your modular components into `src/App.jsx`:

### 1. Import Components

Uncomment and integrate the components in `src/App.jsx`:

```jsx
import TreeVisualizationReact from '../TreeVisualizationReact.jsx'
import AdvancedConnectionCanvas from '../AdvancedConnectionCanvas.jsx'
import ConfigPanel from '../ConfigPanel.jsx'
import FuzzyTruthTable from '../FuzzyTruthTable.jsx'
import DependencyGraph from '../DependencyGraph.jsx'
```

### 2. Set Up State Management

Some components (like ConfigPanel) reference a store at `../../store/logicStore`. You may need to:
- Create a state management solution (Context API, Zustand, etc.)
- Or refactor components to use local state and props

### 3. Copy JavaScript Modules

Your custom JavaScript modules should be accessible:
- `tree-visualization.js` - Referenced by TreeVisualizationReact
- `tree-demo.html` - May contain additional logic to extract
- Other `.js` files in the root

### 4. Handle Global Dependencies

TreeVisualizationReact expects `window.TreeVisualization`. You'll need to:
- Import `tree-visualization.js` in your main.jsx or index.html
- Or refactor to use ES6 imports

### 5. Styling

The MVP at `index-mvp.html` contains CSS that you may want to extract and integrate into your component styles.

## 📋 Available Components

### Node Components
- CustomNode, FuzzyNode, GateNode, HybridNode
- LikertNode, SemanticNode
- TextInputNode, MultipleChoiceNode, SliderNode
- CheckboxNode, MatrixNode, SemanticDifferentialNode
- ComboNode

### Canvas Components
- AdvancedConnectionCanvas - Main connection canvas
- ConnectionCanvas, GatePalette, ConnectionBuilderWizard
- PortSelectorPopup, ThresholdInputPopup
- ConnectionEditorModal, TruthTableModal

### Visualization Components
- TreeVisualizationReact - Tree rendering
- DependencyGraph - ReactFlow-based graph
- MatrixVisualization, MatrixHeatmap, MatrixNetworkGraph

### Other Components
- ConfigPanel - Node configuration
- FuzzyTruthTable - Fuzzy logic truth tables
- CanvasLogicBuilder - Logic canvas builder
- NodeLogicCanvasReact - Node-based logic canvas

## 🐛 Troubleshooting

### Module Not Found Errors

If you get import errors, check:
1. File paths are correct relative to the importing file
2. Extensions (.jsx, .js) are included in imports
3. Barrel exports in index.js files are working

### Missing Dependencies

If components use additional libraries not in package.json:
```bash
npm install <package-name>
```

### Port Already in Use

If port 3000 is taken, Vite will automatically use the next available port, or you can specify one in `vite.config.js`:

```js
server: {
  port: 3001
}
```

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [ReactFlow Documentation](https://reactflow.dev/)

## 🎯 Original MVP

Your original MVP is preserved at `index-mvp.html`. You can open it directly in a browser to reference the original functionality while building out the modular version.

---

Happy coding! 🚀
