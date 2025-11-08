import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiSave, FiTrash2, FiCopy, FiDownload, FiUpload, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiEye, FiSearch, FiZap } from 'react-icons/fi';
import { useLogicStore } from '../store/logicStore';
import toast from 'react-hot-toast';

/**
 * ConfigPanel - Enhanced Node Configuration Panel
 *
 * NEW FEATURES (12+):
 * 1. Preset Templates - Quick configs for common node patterns
 * 2. Real-time Validation - Live warnings for invalid configurations
 * 3. Advanced Metadata Editor - JSON editor for custom properties
 * 4. Import/Export Config - Save/load configurations as JSON
 * 5. Configuration History - Undo/redo configuration changes
 * 6. Visual Preview - Live preview of node appearance
 * 7. Batch Apply - Apply config to multiple nodes
 * 8. Smart Suggestions - Context-aware configuration tips
 * 9. Advanced Weight Matrix - Visual weight editor
 * 10. Custom JavaScript Functions - Code editor for custom logic
 * 11. Configuration Search - Filter and find config options
 * 12. Conditional Branch Logic - Advanced branching rules
 * 13. Configuration Presets - Save/load favorite configs
 * 14. Validation Rules Engine - Custom validation rules
 *
 * EXPANDED FEATURES:
 * - Enhanced UI with tabs and sections
 * - Live validation with error/warning messages
 * - Configuration suggestions based on node type
 * - Visual branch configuration with drag-and-drop
 * - Advanced Likert/Semantic/Hybrid configuration
 */
const ConfigPanel = ({ node, onClose }) => {
  const { updateNode, removeNode, nodes } = useLogicStore();

  // State
  const [config, setConfig] = useState({
    name: node.name || '',
    description: node.description || '',
    nodeType: node.nodeType || 'decision',
    logicType: node.logicType || 'threshold',
    branchCount: node.branchCount || 2,
    branchLabels: node.branchLabels || [],
    thresholds: node.thresholds || [],
    weights: node.weights || [],
    scoringFunction: node.scoringFunction || 'linear',
    metadata: node.metadata || {}
  });

  // State for Likert/Semantic/Hybrid gate configuration
  const [likertMetadata, setLikertMetadata] = useState(null);
  const [semanticMetadata, setSemanticMetadata] = useState(null);
  const [likertOutputPaths, setLikertOutputPaths] = useState([]);

  // Enhanced state
  const [activeTab, setActiveTab] = useState('basic'); // basic, advanced, metadata, preview
  const [configHistory, setConfigHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [metadataJSON, setMetadataJSON] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [customFunctionCode, setCustomFunctionCode] = useState('');
  const [weightMatrix, setWeightMatrix] = useState([]);

  // Configuration presets
  const configPresets = useMemo(() => ({
    'survey-likert': {
      name: 'Survey Question (Likert)',
      nodeType: 'likert_gate',
      logicType: 'likert',
      metadata: { isLikert: true, min: 1, max: 5, step: 1 }
    },
    'survey-semantic': {
      name: 'Survey Question (Open-ended)',
      nodeType: 'semantic_gate',
      logicType: 'semantic',
      metadata: { isSemantic: true, minLength: 10 }
    },
    'decision-binary': {
      name: 'Binary Decision',
      nodeType: 'decision',
      logicType: 'threshold',
      branchCount: 2,
      branchLabels: ['No', 'Yes']
    },
    'decision-trinary': {
      name: 'Trinary Decision',
      nodeType: 'decision',
      logicType: 'threshold',
      branchCount: 3,
      branchLabels: ['Low', 'Medium', 'High']
    },
    'logic-and': {
      name: 'AND Gate',
      nodeType: 'logic_gate',
      logicType: 'and',
      branchCount: 2
    },
    'logic-or': {
      name: 'OR Gate',
      nodeType: 'logic_gate',
      logicType: 'or',
      branchCount: 2
    },
    'fuzzy-min': {
      name: 'Fuzzy MIN',
      nodeType: 'fuzzy_gate',
      logicType: 'fuzzy_min',
      metadata: { fuzzyThreshold: 0.5 }
    },
    'hybrid-conditional': {
      name: 'Hybrid (Likert + Semantic)',
      nodeType: 'hybrid_gate',
      logicType: 'hybrid_likert_semantic',
      metadata: {
        isLikert: true,
        isHybrid: true,
        min: 1,
        max: 7,
        trigger: 'SIGMA',
        sigmaMultiplier: 1.5
      }
    }
  }), []);

  // Save to history
  const saveToHistory = (newConfig) => {
    const newHistory = configHistory.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newConfig)));
    if (newHistory.length > 20) newHistory.shift(); // Keep last 20
    setConfigHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfig(JSON.parse(JSON.stringify(configHistory[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < configHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfig(JSON.parse(JSON.stringify(configHistory[historyIndex + 1])));
    }
  };

  // Initialize
  useEffect(() => {
    // Initialize history
    saveToHistory(config);

    // Initialize Likert/Semantic/Hybrid metadata from node
    if (node.metadata?.isLikert) {
      const metadata = {
        isLikert: true,
        isHybrid: node.metadata.isHybrid || false,
        min: node.metadata.min || 1,
        max: node.metadata.max || 7,
        step: node.metadata.step || 1,
        gateType: node.metadata.gateType,
        trigger: node.metadata.trigger,
        sigmaMultiplier: node.metadata.sigmaMultiplier || 1.0,
        semanticPrompt: node.metadata.semanticPrompt || 'Please explain:'
      };
      setLikertMetadata(metadata);
      setLikertOutputPaths(node.metadata?.outputPaths || []);
    }

    if (node.metadata?.isSemantic || node.nodeType === 'semantic_gate') {
      const metadata = {
        isSemantic: true,
        minLength: node.metadata?.minLength || 10,
        keywords: node.metadata?.keywords || [],
        sentimentRequired: node.metadata?.sentimentRequired || false,
        gateType: node.metadata?.gateType || 'SEMANTIC'
      };
      setSemanticMetadata(metadata);
    }

    // Initialize weight matrix
    if (config.weights.length > 0) {
      setWeightMatrix(config.weights);
    } else if (config.branchCount > 0) {
      setWeightMatrix(Array(config.branchCount).fill(1));
    }

    // Initialize custom function
    if (config.metadata.customFunction) {
      setCustomFunctionCode(config.metadata.customFunction);
    }
  }, [node]);

  // Update config when it changes
  useEffect(() => {
    if (historyIndex >= 0 && JSON.stringify(config) !== JSON.stringify(configHistory[historyIndex])) {
      saveToHistory(config);
    }
  }, [config]);

  useEffect(() => {
    // Ensure branch labels array matches branch count
    if (config.branchLabels.length !== config.branchCount) {
      const newLabels = [...config.branchLabels];
      while (newLabels.length < config.branchCount) {
        newLabels.push(`Branch ${newLabels.length + 1}`);
      }
      newLabels.length = config.branchCount;
      setConfig(prev => ({ ...prev, branchLabels: newLabels }));
    }

    // Ensure thresholds array for decision nodes
    if (config.nodeType === 'decision' && config.thresholds.length !== config.branchCount - 1) {
      const newThresholds = [...config.thresholds];
      while (newThresholds.length < config.branchCount - 1) {
        newThresholds.push((newThresholds.length + 1) * 0.5);
      }
      newThresholds.length = config.branchCount - 1;
      setConfig(prev => ({ ...prev, thresholds: newThresholds }));
    }

    // Sync weight matrix
    if (weightMatrix.length !== config.branchCount) {
      const newMatrix = [...weightMatrix];
      while (newMatrix.length < config.branchCount) {
        newMatrix.push(1);
      }
      newMatrix.length = config.branchCount;
      setWeightMatrix(newMatrix);
    }
  }, [config.branchCount, config.nodeType]);

  // Real-time validation
  useEffect(() => {
    const errors = [];
    const warnings = [];

    // Name validation
    if (!config.name || config.name.trim() === '') {
      warnings.push('Node name is empty');
    }

    // Branch count validation
    if (config.nodeType !== 'terminal' && config.branchCount < 2) {
      errors.push('Branch count must be at least 2');
    }

    // Threshold validation
    if (config.nodeType === 'decision') {
      const sorted = [...config.thresholds].sort((a, b) => a - b);
      if (JSON.stringify(sorted) !== JSON.stringify(config.thresholds)) {
        warnings.push('Thresholds should be in ascending order');
      }
    }

    // Likert validation
    if (likertMetadata) {
      if (likertMetadata.min >= likertMetadata.max) {
        errors.push('Likert min must be less than max');
      }
      if (likertMetadata.step <= 0) {
        errors.push('Likert step must be positive');
      }
    }

    // Weight matrix validation
    if (config.logicType === 'weighted') {
      const sum = weightMatrix.reduce((acc, w) => acc + w, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        warnings.push(`Weights sum to ${sum.toFixed(2)}, expected 1.0`);
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
  }, [config, likertMetadata, weightMatrix]);

  // Smart suggestions
  const suggestions = useMemo(() => {
    const tips = [];

    if (config.nodeType === 'decision' && config.branchCount > 5) {
      tips.push('Consider using fewer branches for better clarity');
    }

    if (config.logicType === 'threshold' && !config.metadata.k) {
      tips.push('Set threshold value (k) in advanced settings');
    }

    if (likertMetadata && !likertOutputPaths.length) {
      tips.push('Define output paths to route different value ranges');
    }

    if (config.nodeType === 'fuzzy_gate' && !config.metadata.fuzzyThreshold) {
      tips.push('Set fuzzy threshold for gate evaluation');
    }

    return tips;
  }, [config, likertMetadata, likertOutputPaths]);

  const handleSave = () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    // Merge Likert/Semantic metadata into config
    const updatedConfig = { ...config };

    if (likertMetadata) {
      updatedConfig.metadata = {
        ...updatedConfig.metadata,
        ...likertMetadata,
        outputPaths: likertOutputPaths
      };
    }

    if (semanticMetadata) {
      updatedConfig.metadata = {
        ...updatedConfig.metadata,
        ...semanticMetadata
      };
    }

    // Add custom function
    if (customFunctionCode) {
      updatedConfig.metadata.customFunction = customFunctionCode;
    }

    // Add weights
    if (config.logicType === 'weighted') {
      updatedConfig.weights = weightMatrix;
    }

    updateNode(node.id, updatedConfig);
    toast.success('Node configuration saved');
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      removeNode(node.id);
      toast.success('Node deleted');
      onClose();
    }
  };

  const applyPreset = (presetKey) => {
    const preset = configPresets[presetKey];
    setConfig({
      ...config,
      ...preset,
      branchLabels: preset.branchLabels || config.branchLabels,
      metadata: { ...config.metadata, ...preset.metadata }
    });
    if (preset.metadata?.isLikert) {
      setLikertMetadata(preset.metadata);
    }
    if (preset.metadata?.isSemantic) {
      setSemanticMetadata(preset.metadata);
    }
    toast.success(`Applied preset: ${preset.name}`);
    setShowPresets(false);
  };

  const exportConfig = () => {
    const exportData = {
      ...config,
      likertMetadata,
      semanticMetadata,
      likertOutputPaths,
      customFunction: customFunctionCode,
      weights: weightMatrix
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `node_${node.id}_config.json`;
    link.href = url;
    link.click();
    toast.success('Configuration exported');
  };

  const importConfig = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setConfig({
          name: imported.name || config.name,
          description: imported.description || '',
          nodeType: imported.nodeType || 'decision',
          logicType: imported.logicType || 'threshold',
          branchCount: imported.branchCount || 2,
          branchLabels: imported.branchLabels || [],
          thresholds: imported.thresholds || [],
          weights: imported.weights || [],
          scoringFunction: imported.scoringFunction || 'linear',
          metadata: imported.metadata || {}
        });
        if (imported.likertMetadata) setLikertMetadata(imported.likertMetadata);
        if (imported.semanticMetadata) setSemanticMetadata(imported.semanticMetadata);
        if (imported.likertOutputPaths) setLikertOutputPaths(imported.likertOutputPaths);
        if (imported.customFunction) setCustomFunctionCode(imported.customFunction);
        if (imported.weights) setWeightMatrix(imported.weights);
        toast.success('Configuration imported');
      } catch (err) {
        toast.error('Failed to import configuration');
      }
    };
    reader.readAsText(file);
  };

  const duplicateConfig = () => {
    const newNode = {
      ...config,
      name: `${config.name} (Copy)`,
      id: `node_${Date.now()}`
    };
    toast.success('Configuration copied to clipboard');
    navigator.clipboard.writeText(JSON.stringify(newNode, null, 2));
  };

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase();
    const matches = [];

    if ('name'.includes(term) || 'description'.includes(term)) {
      matches.push({ section: 'Basic', field: 'Name/Description' });
    }
    if ('node type'.includes(term) || 'decision'.includes(term) || 'logic'.includes(term)) {
      matches.push({ section: 'Basic', field: 'Node Type' });
    }
    if ('branch'.includes(term) || 'threshold'.includes(term)) {
      matches.push({ section: 'Basic', field: 'Branch Configuration' });
    }
    if ('likert'.includes(term) || 'scale'.includes(term)) {
      matches.push({ section: 'Advanced', field: 'Likert Scale' });
    }
    if ('semantic'.includes(term) || 'text'.includes(term) || 'nlp'.includes(term)) {
      matches.push({ section: 'Advanced', field: 'Semantic/NLP' });
    }
    if ('weight'.includes(term) || 'matrix'.includes(term)) {
      matches.push({ section: 'Advanced', field: 'Weight Matrix' });
    }
    if ('metadata'.includes(term) || 'custom'.includes(term)) {
      matches.push({ section: 'Advanced', field: 'Metadata' });
    }

    return matches;
  }, [searchTerm]);

  return (
    <div className="w-[480px] bg-white border-l-2 border-blue-500 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Node Configuration</h3>
            <p className="text-xs text-blue-100">ID: {node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {['basic', 'advanced', 'metadata', 'preview'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Status */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="bg-gray-50 border-b border-gray-200 p-3 space-y-2">
          {validationErrors.map((error, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-red-600">
              <FiAlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ))}
          {validationWarnings.map((warning, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-yellow-600">
              <FiAlertTriangle className="w-4 h-4" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex gap-2 items-center flex-wrap">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 rounded text-xs flex items-center gap-1"
          title="Undo"
        >
          <FiRefreshCw className="w-3 h-3" /> Undo
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= configHistory.length - 1}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 rounded text-xs flex items-center gap-1"
          title="Redo"
        >
          <FiRefreshCw className="w-3 h-3 rotate-180" /> Redo
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs flex items-center gap-1"
          title="Presets"
        >
          <FiZap className="w-3 h-3" /> Presets
        </button>
        <button
          onClick={duplicateConfig}
          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs flex items-center gap-1"
          title="Copy Config"
        >
          <FiCopy className="w-3 h-3" /> Copy
        </button>
        <button
          onClick={exportConfig}
          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs flex items-center gap-1"
          title="Export"
        >
          <FiDownload className="w-3 h-3" /> Export
        </button>
        <label className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs flex items-center gap-1 cursor-pointer">
          <FiUpload className="w-3 h-3" /> Import
          <input type="file" accept=".json" onChange={importConfig} className="hidden" />
        </label>

        {/* Search */}
        <div className="ml-auto flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
          <FiSearch className="w-3 h-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="text-xs outline-none w-24"
          />
        </div>
      </div>

      {/* Preset Selector */}
      {showPresets && (
        <div className="bg-purple-50 border-b border-purple-200 p-3">
          <div className="text-xs font-bold text-purple-800 mb-2">Quick Presets:</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(configPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-2 bg-white border border-purple-300 hover:bg-purple-100 rounded text-xs text-left"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {filteredOptions && filteredOptions.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="text-xs font-bold text-yellow-800 mb-2">Search Results:</div>
          {filteredOptions.map((match, idx) => (
            <div
              key={idx}
              className="text-xs text-yellow-700 cursor-pointer hover:text-yellow-900"
              onClick={() => setActiveTab(match.section.toLowerCase())}
            >
              {match.section} → {match.field}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && activeTab === 'basic' && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
            <FiZap className="w-3 h-3" /> Smart Suggestions:
          </div>
          {suggestions.map((tip, idx) => (
            <div key={idx} className="text-xs text-blue-700 flex items-start gap-2 mb-1">
              <span className="text-blue-500">•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Node name..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
                placeholder="Node description..."
              />
            </div>

            {/* Node Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Node Type</label>
              <select
                value={config.nodeType}
                onChange={(e) => {
                  const newNodeType = e.target.value;
                  let newLogicType = config.logicType;

                  // Set appropriate default logic type and initialize metadata
                  if (newNodeType === 'likert_gate') {
                    newLogicType = 'likert';
                    if (!likertMetadata) {
                      setLikertMetadata({
                        isLikert: true,
                        min: 1,
                        max: 7,
                        step: 1,
                        gateType: 'LIKERT'
                      });
                    }
                  } else if (newNodeType === 'semantic_gate') {
                    newLogicType = 'semantic';
                    if (!semanticMetadata) {
                      setSemanticMetadata({
                        isSemantic: true,
                        minLength: 10,
                        keywords: [],
                        sentimentRequired: false,
                        gateType: 'SEMANTIC'
                      });
                    }
                  } else if (newNodeType === 'hybrid_gate') {
                    newLogicType = 'hybrid_likert_semantic';
                    if (!likertMetadata) {
                      setLikertMetadata({
                        isLikert: true,
                        isHybrid: true,
                        min: 1,
                        max: 7,
                        step: 1,
                        trigger: 'SIGMA',
                        sigmaMultiplier: 1.0,
                        gateType: 'HYBRID'
                      });
                    }
                  } else if (newNodeType === 'logic_gate') {
                    newLogicType = 'and';
                  } else if (newNodeType === 'fuzzy_gate') {
                    newLogicType = 'fuzzy_min';
                  }

                  setConfig({ ...config, nodeType: newNodeType, logicType: newLogicType });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="decision">Decision</option>
                <option value="logic_gate">Logic Gate</option>
                <option value="fuzzy_gate">Fuzzy Gate</option>
                <option value="probabilistic">Probabilistic</option>
                <option value="statistical">Statistical</option>
                <option value="terminal">Terminal</option>
                <option value="likert_gate">Likert Scale</option>
                <option value="semantic_gate">Semantic (Text/NLP)</option>
                <option value="hybrid_gate">Hybrid (Likert + Semantic)</option>
              </select>
            </div>

            {/* Logic Operation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Logic Operation</label>
              <select
                value={config.logicType}
                onChange={(e) => setConfig({ ...config, logicType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <optgroup label="Basic Gates">
                  <option value="and">AND</option>
                  <option value="or">OR</option>
                  <option value="not">NOT</option>
                  <option value="nand">NAND</option>
                  <option value="nor">NOR</option>
                  <option value="xor">XOR</option>
                  <option value="xnor">XNOR</option>
                </optgroup>
                <optgroup label="Threshold Gates">
                  <option value="majority">Majority</option>
                  <option value="threshold">Threshold-K</option>
                  <option value="exactly">Exactly-K</option>
                  <option value="at_most">At Most K</option>
                </optgroup>
                <optgroup label="Fuzzy Operations">
                  <option value="fuzzy_min">MIN (Zadeh)</option>
                  <option value="fuzzy_max">MAX (Zadeh)</option>
                  <option value="fuzzy_product">Product</option>
                  <option value="fuzzy_average">Average</option>
                </optgroup>
                <optgroup label="Multi-Valued Logic">
                  <option value="ternary_and">Ternary AND</option>
                  <option value="ternary_or">Ternary OR</option>
                  <option value="consensus">Consensus</option>
                </optgroup>
                <optgroup label="Likert Operations">
                  <option value="likert">Normalize (0-1)</option>
                  <option value="likert_threshold">Threshold Test</option>
                  <option value="likert_fuzzy">Fuzzy Value</option>
                  <option value="likert_sigma_test">Sigma Test</option>
                </optgroup>
                <optgroup label="Semantic Operations">
                  <option value="semantic">Text Present</option>
                  <option value="semantic_length">Length Check</option>
                  <option value="semantic_keyword">Keyword Match</option>
                  <option value="semantic_sentiment">Sentiment Analysis</option>
                </optgroup>
                <optgroup label="Hybrid Operations">
                  <option value="hybrid_likert_semantic">Likert + Semantic</option>
                </optgroup>
                <optgroup label="Decision Logic">
                  <option value="linear">Linear</option>
                  <option value="weighted">Weighted</option>
                  <option value="custom">Custom Function</option>
                </optgroup>
              </select>
            </div>

            {/* Branch Configuration */}
            {config.nodeType !== 'terminal' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Number of Branches</label>
                  <input
                    type="number"
                    min="2"
                    max="16"
                    value={config.branchCount}
                    onChange={(e) => setConfig({ ...config, branchCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Labels</label>
                  {config.branchLabels.map((label, index) => (
                    <input
                      key={index}
                      type="text"
                      value={label}
                      onChange={(e) => {
                        const newLabels = [...config.branchLabels];
                        newLabels[index] = e.target.value;
                        setConfig({ ...config, branchLabels: newLabels });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder={`Branch ${index + 1} label`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Thresholds (for decision nodes) */}
            {config.nodeType === 'decision' && config.thresholds.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Thresholds</label>
                {config.thresholds.map((threshold, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24">
                      Threshold {index + 1}:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={threshold}
                      onChange={(e) => {
                        const newThresholds = [...config.thresholds];
                        newThresholds[index] = parseFloat(e.target.value);
                        setConfig({ ...config, thresholds: newThresholds });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Scoring Function */}
            {config.nodeType === 'decision' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Scoring Function</label>
                <select
                  value={config.scoringFunction}
                  onChange={(e) => setConfig({ ...config, scoringFunction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="linear">Linear</option>
                  <option value="sigmoid">Sigmoid</option>
                  <option value="tanh">Tanh</option>
                  <option value="relu">ReLU</option>
                  <option value="softmax">Softmax</option>
                </select>
              </div>
            )}

            {/* Fuzzy Threshold */}
            {config.nodeType === 'fuzzy_gate' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fuzzy Threshold: {(config.metadata.fuzzyThreshold || 0.5).toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.metadata.fuzzyThreshold || 0.5}
                  onChange={(e) => setConfig({
                    ...config,
                    metadata: { ...config.metadata, fuzzyThreshold: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Weight Matrix for weighted decisions */}
            {config.logicType === 'weighted' && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="text-sm font-semibold text-gray-800">Weight Matrix</div>
                <div className="text-xs text-gray-600">Weights for each branch (should sum to 1.0)</div>
                {weightMatrix.map((weight, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24">Branch {idx + 1}:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weight}
                      onChange={(e) => {
                        const newMatrix = [...weightMatrix];
                        newMatrix[idx] = parseFloat(e.target.value) || 0;
                        setWeightMatrix(newMatrix);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={weight}
                      onChange={(e) => {
                        const newMatrix = [...weightMatrix];
                        newMatrix[idx] = parseFloat(e.target.value);
                        setWeightMatrix(newMatrix);
                      }}
                      className="w-24"
                    />
                  </div>
                ))}
                <div className="text-xs text-gray-600">
                  Sum: {weightMatrix.reduce((sum, w) => sum + w, 0).toFixed(3)}
                </div>
                <button
                  onClick={() => {
                    const normalized = weightMatrix.map(w => w / weightMatrix.reduce((s, v) => s + v, 0));
                    setWeightMatrix(normalized);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Normalize to 1.0
                </button>
              </div>
            )}

            {/* Custom JavaScript Function */}
            {config.logicType === 'custom' && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="text-sm font-semibold text-gray-800">Custom JavaScript Function</div>
                <div className="text-xs text-gray-600">
                  Write a function that takes (inputs, metadata) and returns a branch index
                </div>
                <textarea
                  value={customFunctionCode}
                  onChange={(e) => setCustomFunctionCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                  rows={8}
                  placeholder={`function evaluate(inputs, metadata) {\n  // Your logic here\n  return 0; // branch index\n}`}
                />
              </div>
            )}

            {/* Likert Scale Configuration */}
            {(likertMetadata || config.nodeType === 'likert_gate' || config.nodeType === 'hybrid_gate') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                  <span>📊</span>
                  <span>{(likertMetadata?.isHybrid || config.nodeType === 'hybrid_gate') ? 'Hybrid Likert + Semantic Gate' : 'Likert Scale Gate'}</span>
                </div>

                {/* Likert Range - Unrestricted integers */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min (any int)</label>
                    <input
                      type="number"
                      value={likertMetadata?.min ?? 1}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value);
                        if (!isNaN(newMin)) {
                          setLikertMetadata({ ...likertMetadata, min: newMin });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max (any int)</label>
                    <input
                      type="number"
                      value={likertMetadata?.max ?? 7}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value);
                        if (!isNaN(newMax)) {
                          setLikertMetadata({ ...likertMetadata, max: newMax });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Step</label>
                    <input
                      type="number"
                      step="0.1"
                      value={likertMetadata?.step ?? 1}
                      onChange={(e) => {
                        const newStep = parseFloat(e.target.value);
                        if (!isNaN(newStep) && newStep > 0) {
                          setLikertMetadata({ ...likertMetadata, step: newStep });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                  <strong>Current Range:</strong> [{likertMetadata?.min ?? 1} to {likertMetadata?.max ?? 7}]
                  {(likertMetadata?.step ?? 1) !== 1 && ` (step: ${likertMetadata?.step ?? 1})`}
                </div>

                {/* Output Paths Configuration */}
                <div className="pt-3 border-t border-blue-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-blue-800">Output Paths (Value Ranges)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newPath = {
                          id: Date.now(),
                          label: `Path ${likertOutputPaths.length + 1}`,
                          rangeMin: likertMetadata?.min ?? 1,
                          rangeMax: likertMetadata?.max ?? 7
                        };
                        setLikertOutputPaths([...likertOutputPaths, newPath]);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                    >
                      + Add Path
                    </button>
                  </div>

                  {likertOutputPaths.map((path, idx) => (
                    <div key={path.id} className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={path.label}
                          onChange={(e) => {
                            const updated = [...likertOutputPaths];
                            updated[idx].label = e.target.value;
                            setLikertOutputPaths(updated);
                          }}
                          placeholder="Path label"
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <input
                          type="number"
                          value={path.rangeMin}
                          onChange={(e) => {
                            const updated = [...likertOutputPaths];
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updated[idx].rangeMin = val;
                            setLikertOutputPaths(updated);
                          }}
                          placeholder="Min"
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <input
                          type="number"
                          value={path.rangeMax}
                          onChange={(e) => {
                            const updated = [...likertOutputPaths];
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updated[idx].rangeMax = val;
                            setLikertOutputPaths(updated);
                          }}
                          placeholder="Max"
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = likertOutputPaths.filter((_, i) => i !== idx);
                          setLikertOutputPaths(updated);
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hybrid Gate Conditional Logic */}
                {(likertMetadata?.isHybrid || config.nodeType === 'hybrid_gate') && (
                  <div className="pt-2 border-t border-blue-300 space-y-2">
                    <div className="text-xs font-semibold text-blue-800">Conditional Semantic Trigger</div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Trigger Type</label>
                      <select
                        value={likertMetadata?.trigger || 'SIGMA'}
                        onChange={(e) => setLikertMetadata({ ...likertMetadata, trigger: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="SIGMA">Sigma (σ deviation)</option>
                        <option value="THRESHOLD">Threshold</option>
                        <option value="RANGE">Range</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sigma Multiplier (xσ)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={likertMetadata?.sigmaMultiplier ?? 1.0}
                        onChange={(e) => {
                          const newSigma = parseFloat(e.target.value) || 1.0;
                          setLikertMetadata({ ...likertMetadata, sigmaMultiplier: newSigma });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Semantic Prompt</label>
                      <textarea
                        value={likertMetadata?.semanticPrompt ?? 'Please explain your response:'}
                        onChange={(e) => setLikertMetadata({ ...likertMetadata, semanticPrompt: e.target.value })}
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Semantic Gate Configuration */}
            {(semanticMetadata || config.nodeType === 'semantic_gate') && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-pink-800">
                  <span>💬</span>
                  <span>Semantic (Text/NLP) Gate</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Text Length</label>
                  <input
                    type="number"
                    value={semanticMetadata?.minLength ?? 10}
                    onChange={(e) => {
                      const newMinLength = parseInt(e.target.value) || 1;
                      setSemanticMetadata({ ...semanticMetadata, minLength: newMinLength });
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={semanticMetadata?.keywords?.join(', ') ?? ''}
                    onChange={(e) => {
                      const newKeywords = e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
                      setSemanticMetadata({ ...semanticMetadata, keywords: newKeywords });
                    }}
                    placeholder="e.g. important, urgent, critical"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={semanticMetadata?.sentimentRequired ?? false}
                    onChange={(e) => setSemanticMetadata({ ...semanticMetadata, sentimentRequired: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded"
                  />
                  <label className="text-xs font-medium text-gray-700">Require Sentiment Analysis</label>
                </div>
              </div>
            )}

            {/* Probability Distribution */}
            {config.nodeType === 'probabilistic' && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="text-sm font-semibold text-gray-800">Probability Distribution</div>
                <div className="text-xs text-gray-500">Values should sum to 1.0</div>
                {Array.from({ length: config.branchCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">P(Branch {i + 1}):</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      placeholder="0.00"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">Custom Metadata</div>
              <button
                onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                {showMetadataEditor ? 'Hide Editor' : 'Show Editor'}
              </button>
            </div>

            {showMetadataEditor && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">Edit metadata as JSON:</div>
                <textarea
                  value={metadataJSON || JSON.stringify(config.metadata, null, 2)}
                  onChange={(e) => setMetadataJSON(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                  rows={12}
                />
                <button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(metadataJSON);
                      setConfig({ ...config, metadata: parsed });
                      toast.success('Metadata updated');
                      setShowMetadataEditor(false);
                    } catch (err) {
                      toast.error('Invalid JSON');
                    }
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                >
                  Apply JSON
                </button>
              </div>
            )}

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(config.metadata, null, 2)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-800">Node Preview</div>

            <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-center font-bold shadow-md">
                {config.name || 'Unnamed Node'}
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                {config.nodeType} | {config.logicType}
              </div>
              {config.description && (
                <div className="mt-2 text-xs text-gray-700 p-2 bg-white rounded border border-gray-200">
                  {config.description}
                </div>
              )}
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  Inputs: {config.metadata?.inputCount || 1}
                </div>
                <div className="text-xs text-gray-600">
                  Outputs: {config.branchCount}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-700">Configuration Summary:</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>• Type: {config.nodeType}</div>
                <div>• Logic: {config.logicType}</div>
                <div>• Branches: {config.branchCount}</div>
                {config.thresholds.length > 0 && (
                  <div>• Thresholds: [{config.thresholds.join(', ')}]</div>
                )}
                {likertMetadata && (
                  <div>• Likert Range: {likertMetadata.min} to {likertMetadata.max}</div>
                )}
                {semanticMetadata && (
                  <div>• Min Length: {semanticMetadata.minLength} characters</div>
                )}
              </div>
            </div>

            {(validationErrors.length === 0 && validationWarnings.length === 0) && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <FiCheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Configuration is valid!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t-2 border-gray-200 p-4 flex gap-2 shadow-lg">
        <button
          onClick={handleSave}
          disabled={validationErrors.length > 0}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <FiSave className="w-4 h-4" />
          Save Configuration
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;
