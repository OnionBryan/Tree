/**
 * Universal Truth Table Modal Component
 * Handles binary, trinary, quaternary, quinary, fuzzy logic, and n×m matrices
 * Supports all logic systems from tree-builder.html
 */

import React, { useMemo, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { GATE_METADATA } from './constants/gateConfig.js';

/**
 * Determine logic system and value range
 */
function getLogicSystem(gateType, metadata = {}) {
  const category = metadata.category || 'logic';

  if (category === 'fuzzy') {
    // Fuzzy logic: continuous [0, 1]
    return {
      type: 'fuzzy',
      values: null, // Continuous
      displaySamples: [0, 0.25, 0.5, 0.75, 1.0],
      precision: 2
    };
  }

  // Check for multi-valued logic
  if (gateType.includes('trinary') || metadata.logicType === 'trinary') {
    return { type: 'trinary', values: [0, 0.5, 1], precision: 1 };
  }

  if (gateType.includes('quaternary') || metadata.logicType === 'quaternary') {
    return { type: 'quaternary', values: [0, 0.33, 0.67, 1], precision: 2 };
  }

  if (gateType.includes('quinary') || metadata.logicType === 'quinary') {
    return { type: 'quinary', values: [0, 0.25, 0.5, 0.75, 1], precision: 2 };
  }

  // Default: binary
  return { type: 'binary', values: [0, 1], precision: 0 };
}

/**
 * Evaluate gate output for any logic system
 */
function evaluateGate(gateType, inputs, logicSystem) {
  const type = gateType.toLowerCase();

  // Fuzzy logic operations
  if (logicSystem.type === 'fuzzy') {
    switch (type) {
      case 'and':
      case 'fuzzy_and':
        return Math.min(...inputs);
      case 'or':
      case 'fuzzy_or':
        return Math.max(...inputs);
      case 'not':
      case 'fuzzy_not':
        return 1 - inputs[0];
      case 'xor':
      case 'fuzzy_xor':
        return Math.abs(inputs[0] - inputs[1]);
      default:
        return Math.min(...inputs);
    }
  }

  // Multi-valued logic (trinary, quaternary, quinary)
  if (logicSystem.type !== 'binary') {
    switch (type) {
      case 'and':
        return Math.min(...inputs);
      case 'or':
        return Math.max(...inputs);
      case 'not':
        return logicSystem.values[logicSystem.values.length - 1] - inputs[0];
      case 'xor':
        // Generalized XOR for multi-valued
        const sum = inputs.reduce((a, b) => a + b, 0);
        const maxVal = logicSystem.values[logicSystem.values.length - 1];
        return (sum % maxVal);
      default:
        return Math.min(...inputs);
    }
  }

  // Binary logic
  switch (type) {
    case 'and':
      return inputs.every(x => x === 1) ? 1 : 0;
    case 'or':
      return inputs.some(x => x === 1) ? 1 : 0;
    case 'not':
      return inputs[0] === 1 ? 0 : 1;
    case 'nand':
      return inputs.every(x => x === 1) ? 0 : 1;
    case 'nor':
      return inputs.some(x => x === 1) ? 0 : 1;
    case 'xor':
      return inputs.filter(x => x === 1).length % 2 === 1 ? 1 : 0;
    case 'xnor':
      return inputs.filter(x => x === 1).length % 2 === 0 ? 1 : 0;
    case 'buffer':
      return inputs[0];
    default:
      return 0;
  }
}

/**
 * Generate universal truth table for n×m matrix
 */
function generateUniversalTruthTable(gateType, numInputs, numOutputs, logicSystem) {
  const table = [];

  // For fuzzy logic, use sample points instead of exhaustive enumeration
  if (logicSystem.type === 'fuzzy') {
    const samples = logicSystem.displaySamples;
    const numSamples = Math.min(Math.pow(samples.length, numInputs), 32); // Limit to 32 rows

    for (let i = 0; i < numSamples; i++) {
      const inputs = [];
      let remaining = i;

      for (let j = 0; j < numInputs; j++) {
        inputs.unshift(samples[remaining % samples.length]);
        remaining = Math.floor(remaining / samples.length);
      }

      const outputs = [];
      for (let k = 0; k < numOutputs; k++) {
        outputs.push(evaluateGate(gateType, inputs, logicSystem));
      }

      table.push({ inputs, outputs });
    }

    return table;
  }

  // For discrete logic systems
  const values = logicSystem.values;
  const numRows = Math.pow(values.length, numInputs);

  for (let i = 0; i < numRows; i++) {
    const inputs = [];
    let remaining = i;

    for (let j = 0; j < numInputs; j++) {
      inputs.unshift(values[remaining % values.length]);
      remaining = Math.floor(remaining / values.length);
    }

    const outputs = [];
    for (let k = 0; k < numOutputs; k++) {
      outputs.push(evaluateGate(gateType, inputs, logicSystem));
    }

    table.push({ inputs, outputs });
  }

  return table;
}

/**
 * Format value for display
 */
function formatValue(value, logicSystem) {
  if (logicSystem.type === 'fuzzy') {
    return value.toFixed(logicSystem.precision);
  }
  return value.toFixed(logicSystem.precision);
}

/**
 * Get color for value based on logic system
 */
function getValueColor(value, logicSystem) {
  const maxVal = logicSystem.type === 'fuzzy' ? 1 :
                 logicSystem.values[logicSystem.values.length - 1];

  const normalized = value / maxVal;

  // Gradient from red (0) to green (1)
  if (normalized <= 0.25) return '#EF4444'; // Red
  if (normalized <= 0.5) return '#F59E0B';  // Orange
  if (normalized <= 0.75) return '#FCD34D'; // Yellow
  return '#10B981'; // Green
}

export const TruthTableModal = ({
  node,
  onClose,
  onSave
}) => {
  if (!node) return null;

  const gateType = node.type || node.metadata?.logicType || 'and';
  const numInputs = node.inputs?.length || 2;
  const numOutputs = node.outputs?.length || 1;
  const metadata = GATE_METADATA[gateType] || {};

  // Initialize thresholds from node data or defaults
  const [inputThresholds, setInputThresholds] = useState(() => {
    const thresholds = {};
    for (let i = 0; i < numInputs; i++) {
      thresholds[i] = node.inputs?.[i]?.threshold || node.inputs?.[i]?.weight || 0.5;
    }
    return thresholds;
  });

  const [outputThresholds, setOutputThresholds] = useState(() => {
    const thresholds = {};
    for (let i = 0; i < numOutputs; i++) {
      thresholds[i] = node.outputs?.[i]?.threshold || node.outputs?.[i]?.weight || 0.5;
    }
    return thresholds;
  });

  // Determine logic system
  const logicSystem = useMemo(() => {
    return getLogicSystem(gateType, metadata);
  }, [gateType, metadata]);

  // Generate truth table
  const truthTable = useMemo(() => {
    return generateUniversalTruthTable(gateType, numInputs, numOutputs, logicSystem);
  }, [gateType, numInputs, numOutputs, logicSystem]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        nodeId: node.id,
        inputThresholds,
        outputThresholds
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: '#1F2937',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #374151',
            paddingBottom: '12px'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#F9FAFB'
              }}
            >
              Truth Table: {node.label || gateType.toUpperCase()}
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: '#9CA3AF'
              }}
            >
              {metadata.description || `${gateType.toUpperCase()} gate logic table`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Gate Info */}
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#374151',
            borderRadius: '6px'
          }}
        >
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Type:</span>
              <span style={{ color: '#F9FAFB', fontSize: '14px', marginLeft: '8px', fontWeight: '500' }}>
                {gateType.toUpperCase()}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Logic System:</span>
              <span style={{ color: '#F9FAFB', fontSize: '14px', marginLeft: '8px', fontWeight: '500' }}>
                {logicSystem.type.charAt(0).toUpperCase() + logicSystem.type.slice(1)}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Dimensions:</span>
              <span style={{ color: '#F9FAFB', fontSize: '14px', marginLeft: '8px', fontWeight: '500' }}>
                {numInputs} × {numOutputs}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Category:</span>
              <span style={{ color: '#F9FAFB', fontSize: '14px', marginLeft: '8px', fontWeight: '500' }}>
                {metadata.category || 'logic'}
              </span>
            </div>
          </div>
        </div>

        {/* Truth Table */}
        <div
          style={{
            overflowX: 'auto',
            marginBottom: '20px'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#374151' }}>
                {Array.from({ length: numInputs }, (_, i) => (
                  <th
                    key={`input-${i}`}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#F9FAFB',
                      fontWeight: '600',
                      borderBottom: '2px solid #1F2937'
                    }}
                  >
                    In{i + 1}
                  </th>
                ))}
                {Array.from({ length: numOutputs }, (_, i) => (
                  <th
                    key={`output-${i}`}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#F9FAFB',
                      fontWeight: '600',
                      borderBottom: '2px solid #1F2937',
                      backgroundColor: '#4B5563'
                    }}
                  >
                    Out{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {truthTable.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? '#1F2937' : '#374151'
                  }}
                >
                  {row.inputs.map((input, inputIndex) => (
                    <td
                      key={`input-${rowIndex}-${inputIndex}`}
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: getValueColor(input, logicSystem),
                        fontWeight: '500',
                        fontFamily: 'monospace'
                      }}
                    >
                      {formatValue(input, logicSystem)}
                    </td>
                  ))}
                  {row.outputs.map((output, outputIndex) => (
                    <td
                      key={`output-${rowIndex}-${outputIndex}`}
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: getValueColor(output, logicSystem),
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        backgroundColor: rowIndex % 2 === 0 ? '#374151' : '#4B5563'
                      }}
                    >
                      {formatValue(output, logicSystem)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Boolean/Logic Expression */}
        <div
          style={{
            padding: '12px',
            backgroundColor: '#374151',
            borderRadius: '6px',
            marginBottom: '20px'
          }}
        >
          <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>
            Logic Expression:
          </div>
          <div
            style={{
              color: '#F9FAFB',
              fontSize: '16px',
              fontFamily: 'monospace',
              fontWeight: '500'
            }}
          >
            {getBooleanExpression(gateType, numInputs, logicSystem)}
          </div>
        </div>

        {/* Logic System Info */}
        <div
          style={{
            padding: '12px',
            backgroundColor: '#374151',
            borderRadius: '6px',
            marginBottom: '20px'
          }}
        >
          <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>
            Logic System Details:
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Value Range:</span>
              <span style={{ color: '#F9FAFB', fontSize: '14px', marginLeft: '8px', fontFamily: 'monospace' }}>
                {logicSystem.type === 'fuzzy' ? '[0.0, 1.0]' :
                 `{${logicSystem.values.map(v => formatValue(v, logicSystem)).join(', ')}}`}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Total States:</span>
              <span style={{ color: '#F9FAFB', fontSize: '14px', marginLeft: '8px', fontFamily: 'monospace' }}>
                {logicSystem.type === 'fuzzy' ? '∞ (continuous)' : truthTable.length}
              </span>
            </div>
          </div>
        </div>

        {/* Threshold/Weight Configuration */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#374151',
            borderRadius: '6px',
            marginBottom: '20px'
          }}
        >
          <div style={{ color: '#F9FAFB', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Threshold & Weight Configuration
          </div>
          <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '16px' }}>
            Adjust connection thresholds (weights) for each input and output. These act as activation thresholds or connection weights.
          </div>

          {/* Input Thresholds */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
              Input Weights/Thresholds:
            </div>
            {Array.from({ length: numInputs }, (_, i) => (
              <div key={`input-threshold-${i}`} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ color: '#F9FAFB', fontSize: '13px' }}>
                    Input {i + 1} ({String.fromCharCode(65 + i)}):
                  </label>
                  <span style={{ color: '#10B981', fontSize: '13px', fontFamily: 'monospace', fontWeight: '600' }}>
                    {inputThresholds[i].toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={inputThresholds[i]}
                  onChange={(e) => setInputThresholds(prev => ({
                    ...prev,
                    [i]: parseFloat(e.target.value)
                  }))}
                  style={{
                    width: '100%',
                    accentColor: '#10B981'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Output Thresholds */}
          <div>
            <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
              Output Weights/Thresholds:
            </div>
            {Array.from({ length: numOutputs }, (_, i) => (
              <div key={`output-threshold-${i}`} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ color: '#F9FAFB', fontSize: '13px' }}>
                    Output {i + 1}:
                  </label>
                  <span style={{ color: '#F59E0B', fontSize: '13px', fontFamily: 'monospace', fontWeight: '600' }}>
                    {outputThresholds[i].toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={outputThresholds[i]}
                  onChange={(e) => setOutputThresholds(prev => ({
                    ...prev,
                    [i]: parseFloat(e.target.value)
                  }))}
                  style={{
                    width: '100%',
                    accentColor: '#F59E0B'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const allThresholds = {};
                for (let i = 0; i < numInputs; i++) allThresholds[i] = 0.5;
                setInputThresholds(allThresholds);
                const outThresholds = {};
                for (let i = 0; i < numOutputs; i++) outThresholds[i] = 0.5;
                setOutputThresholds(outThresholds);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #4B5563',
                backgroundColor: '#1F2937',
                color: '#F9FAFB',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
            >
              Reset to 0.5
            </button>
            <button
              onClick={() => {
                const allThresholds = {};
                for (let i = 0; i < numInputs; i++) allThresholds[i] = 1.0;
                setInputThresholds(allThresholds);
                const outThresholds = {};
                for (let i = 0; i < numOutputs; i++) outThresholds[i] = 1.0;
                setOutputThresholds(outThresholds);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #4B5563',
                backgroundColor: '#1F2937',
                color: '#F9FAFB',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
            >
              Max (1.0)
            </button>
            <button
              onClick={() => {
                const allThresholds = {};
                for (let i = 0; i < numInputs; i++) allThresholds[i] = 0.0;
                setInputThresholds(allThresholds);
                const outThresholds = {};
                for (let i = 0; i < numOutputs; i++) outThresholds[i] = 0.0;
                setOutputThresholds(outThresholds);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #4B5563',
                backgroundColor: '#1F2937',
                color: '#F9FAFB',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
            >
              Min (0.0)
            </button>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #374151',
              backgroundColor: '#374151',
              color: '#F9FAFB',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#3B82F6',
              color: '#F9FAFB',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
          >
            Save Thresholds
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Get boolean/logic expression for all gate types and logic systems
 */
function getBooleanExpression(gateType, numInputs, logicSystem) {
  const inputs = Array.from({ length: numInputs }, (_, i) => String.fromCharCode(65 + i));
  const type = gateType.toLowerCase();

  // Fuzzy logic expressions
  if (logicSystem.type === 'fuzzy') {
    switch (type) {
      case 'and':
      case 'fuzzy_and':
        return `min(${inputs.join(', ')})`;
      case 'or':
      case 'fuzzy_or':
        return `max(${inputs.join(', ')})`;
      case 'not':
      case 'fuzzy_not':
        return `1 - ${inputs[0]}`;
      case 'xor':
      case 'fuzzy_xor':
        return `|${inputs[0]} - ${inputs[1]}|`;
      default:
        return `min(${inputs.join(', ')})`;
    }
  }

  // Multi-valued logic (trinary, quaternary, quinary)
  if (logicSystem.type !== 'binary') {
    const maxVal = logicSystem.values[logicSystem.values.length - 1];
    switch (type) {
      case 'and':
        return `min(${inputs.join(', ')})`;
      case 'or':
        return `max(${inputs.join(', ')})`;
      case 'not':
        return `${maxVal} - ${inputs[0]}`;
      case 'xor':
        return `(${inputs.join(' + ')}) mod ${maxVal}`;
      default:
        return `min(${inputs.join(', ')})`;
    }
  }

  // Binary logic expressions (traditional Boolean algebra)
  switch (type) {
    case 'and':
      return inputs.join(' · ');
    case 'or':
      return inputs.join(' + ');
    case 'not':
      return `¬${inputs[0]}`;
    case 'nand':
      return `¬(${inputs.join(' · ')})`;
    case 'nor':
      return `¬(${inputs.join(' + ')})`;
    case 'xor':
      return inputs.join(' ⊕ ');
    case 'xnor':
      return `¬(${inputs.join(' ⊕ ')})`;
    case 'buffer':
      return inputs[0];
    case 'implies':
      return `${inputs[0]} → ${inputs[1]}`;
    case 'inhibit':
      return `${inputs[0]} · ¬${inputs[1]}`;
    case 'equivalence':
      return `${inputs[0]} ≡ ${inputs[1]}`;
    default:
      return 'Custom Gate';
  }
}

export default TruthTableModal;
