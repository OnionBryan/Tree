import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiTrash2 } from 'react-icons/fi';
import { useLogicStore } from '../store/logicStore';
import toast from 'react-hot-toast';

const ConfigPanel = ({ node, onClose }) => {
  const { updateNode, removeNode } = useLogicStore();
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

  useEffect(() => {
    // Initialize Likert/Semantic/Hybrid metadata from node
    console.log('[ConfigPanel] Node loaded:', {
      id: node.id,
      name: node.name,
      nodeType: node.nodeType,
      logicType: node.logicType,
      metadata: node.metadata
    });

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
      console.log('[ConfigPanel] Setting Likert metadata:', metadata);
      setLikertMetadata(metadata);
      setLikertOutputPaths(node.metadata?.outputPaths || []);
    } else {
      setLikertMetadata(null);
      setLikertOutputPaths([]);
    }

    if (node.metadata?.isSemantic || node.nodeType === 'semantic_gate') {
      const metadata = {
        isSemantic: true,
        minLength: node.metadata?.minLength || 10,
        keywords: node.metadata?.keywords || [],
        sentimentRequired: node.metadata?.sentimentRequired || false,
        gateType: node.metadata?.gateType || 'SEMANTIC'
      };
      console.log('[ConfigPanel] Setting Semantic metadata:', metadata);
      setSemanticMetadata(metadata);
    } else {
      setSemanticMetadata(null);
    }
  }, [node]);

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
  }, [config.branchCount, config.nodeType]);

  const handleSave = () => {
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

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-xl h-full overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Node Configuration</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="input-field"
            placeholder="Node name..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="input-field"
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
            className="input-field"
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

        {/* Logic Operation - ALWAYS show ALL options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Logic Operation</label>
          <select
            value={config.logicType}
            onChange={(e) => setConfig({ ...config, logicType: e.target.value })}
            className="input-field"
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
                className="input-field"
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
                  className="input-field text-sm"
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
                <span className="text-xs text-gray-500 w-20">
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
                  className="input-field text-sm"
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
              className="input-field"
            >
              <option value="linear">Linear</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="tanh">Tanh</option>
              <option value="relu">ReLU</option>
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
                    const rawValue = e.target.value;
                    if (rawValue === '' || rawValue === '-') {
                      setLikertMetadata({ ...likertMetadata, min: rawValue });
                      return;
                    }
                    const newMin = parseInt(rawValue);
                    if (!isNaN(newMin)) {
                      setLikertMetadata({ ...likertMetadata, min: newMin });
                    }
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value;
                    if (rawValue === '' || rawValue === '-') {
                      setLikertMetadata({ ...likertMetadata, min: 1 });
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
                    const rawValue = e.target.value;
                    if (rawValue === '' || rawValue === '-') {
                      setLikertMetadata({ ...likertMetadata, max: rawValue });
                      return;
                    }
                    const newMax = parseInt(rawValue);
                    if (!isNaN(newMax)) {
                      setLikertMetadata({ ...likertMetadata, max: newMax });
                    }
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value;
                    if (rawValue === '' || rawValue === '-') {
                      setLikertMetadata({ ...likertMetadata, max: 7 });
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
                    const rawValue = e.target.value;
                    if (rawValue === '' || rawValue === '-' || rawValue === '.') {
                      setLikertMetadata({ ...likertMetadata, step: rawValue });
                      return;
                    }
                    const newStep = parseFloat(rawValue);
                    if (!isNaN(newStep) && newStep > 0) {
                      setLikertMetadata({ ...likertMetadata, step: newStep });
                    }
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value;
                    if (rawValue === '' || rawValue === '-' || rawValue === '.') {
                      setLikertMetadata({ ...likertMetadata, step: 1 });
                    }
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
              <strong>Current Range:</strong> [{likertMetadata?.min ?? 1} to {likertMetadata?.max ?? 7}]
              {(likertMetadata?.step ?? 1) !== 1 && ` (step: ${likertMetadata?.step ?? 1})`}
              <div className="mt-1 text-gray-700">
                <strong>⚡ No restrictions!</strong> Use any integers: -100 to 100, -5 to 5, 0 to 1000, etc.
              </div>
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

              <div className="text-xs text-gray-600 italic">
                Define value ranges for each output path. Example: -5 to -1, 0 to 2, 3 to 5
              </div>

              {likertOutputPaths.length === 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                  No output paths defined. Add paths to route different value ranges to different outputs.
                </div>
              )}

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

              {likertOutputPaths.length > 0 && (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  <strong>{likertOutputPaths.length} output path{likertOutputPaths.length > 1 ? 's' : ''} configured</strong>
                  <div className="mt-1 text-gray-700">
                    Node will have {likertOutputPaths.length} output handle{likertOutputPaths.length > 1 ? 's' : ''} routing values by range.
                  </div>
                </div>
              )}
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

                <div className="text-xs text-gray-600 bg-blue-100 p-2 rounded">
                  <strong>Trigger Condition:</strong> |response - mean| ≥ {likertMetadata?.sigmaMultiplier ?? 1.0}σ
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
              <div className="text-xs text-gray-600 mt-1">
                Minimum number of characters required
              </div>
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
              <div className="text-xs text-gray-600 mt-1">
                Optional keywords to match in the text
              </div>
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

            <div className="text-xs text-pink-700 bg-pink-100 p-2 rounded">
              <strong>Note:</strong> Semantic gates evaluate text input based on presence, length, keywords, and optionally sentiment.
            </div>
          </div>
        )}

        {/* Probability Distribution */}
        {config.nodeType === 'probabilistic' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Probability Distribution</label>
            <div className="text-xs text-gray-500 mb-1">Values should sum to 1.0</div>
            {Array.from({ length: config.branchCount }, (_, i) => (
              <input
                key={i}
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder={`P(Branch ${i + 1})`}
                className="input-field text-sm"
                onChange={(e) => {
                  // Handle probability distribution update
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <FiSave className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleDelete}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <FiTrash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;