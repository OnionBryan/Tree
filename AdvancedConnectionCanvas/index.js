/**
 * Advanced Connection Canvas - Exports
 * Main entry point for all Canvas #5 components and utilities
 */

// Main Component
export { default as AdvancedConnectionCanvas } from './AdvancedConnectionCanvas.jsx';

// Sub-components
export { default as ConnectionCanvas } from './ConnectionCanvas.jsx';
export { default as GatePalette } from './GatePalette.jsx';
export { default as ConnectionBuilderWizard } from './ConnectionBuilderWizard.jsx';
export { default as PortSelectorPopup } from './PortSelectorPopup.jsx';
export { default as ThresholdInputPopup } from './ThresholdInputPopup.jsx';
export { default as ConnectionEditorModal } from './ConnectionEditorModal.jsx';

// Constants
export * from './constants/gateConfig.js';
export * from './constants/canvasConfig.js';

// Utilities
export { CanvasRenderer, createCanvasRenderer } from './utils/CanvasRenderer.js';
export { CanvasStateManager, createCanvasState } from './utils/CanvasState.js';
export { ConnectionManager, createConnectionManager } from './utils/ConnectionManager.js';
export { NodeManager, createNodeManager } from './utils/NodeManager.js';
export * from './utils/DrawingUtils.js';
export * from './utils/MouseHandlers.js';

// Managers (Integration Wrappers for adLog.jsx + gateInsert.jsx)
export { advancedLogicManager } from './utils/AdvancedLogicManager.js';
export { gateInsertionManager } from './utils/GateInsertionManager.js';

// Engines
export { SignalFlowEngine } from './engine/SignalFlowEngine.js';
export { LoopDetector } from './engine/LoopDetector.js';
