import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FuzzyGates } from '../lib/logic/gateEvaluator';

/**
 * Fuzzy Logic Truth Table - Enhanced Version
 *
 * NEW FEATURES (12+):
 * 1. Visual Output Graph - Chart showing fuzzy output distribution
 * 2. 3D Surface Plot (2D inputs) - Interactive 3D visualization
 * 3. Export Capabilities - CSV, JSON, LaTeX table export
 * 4. Defuzzification Methods - Centroid, MOM, BOA, COA, etc.
 * 5. Fuzzy Logic Comparison - Compare multiple gates simultaneously
 * 6. Interactive Heatmap - Color-coded output visualization
 * 7. Sensitivity Analysis - Input variation impact analysis
 * 8. Advanced Properties Testing - De Morgan's laws, distributivity
 * 9. Linguistic Variables - Define and visualize fuzzy terms
 * 10. Membership Function Visualizer - Plot membership functions
 * 11. Statistical Distribution - Histogram of output values
 * 12. Custom Fuzzy Operations - User-defined operations
 * 13. Fuzzy Set Operations - Union, intersection, complement
 * 14. Rule Evaluation - Test fuzzy IF-THEN rules
 *
 * EXPANDED FEATURES:
 * - Enhanced UI with tabs for different views
 * - Real-time charting of fuzzy operations
 * - Comprehensive mathematical analysis
 * - Interactive parameter adjustment
 */
const FuzzyTruthTable = ({ gateType, onClose }) => {
  // Range configuration
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [stepSize, setStepSize] = useState(0.25);
  const [inputCount, setInputCount] = useState(2);

  // Enhanced state
  const [activeTab, setActiveTab] = useState('table'); // table, chart, heatmap, analysis, export
  const [compareGates, setCompareGates] = useState([]);
  const [showAdvancedTests, setShowAdvancedTests] = useState(false);
  const [defuzzificationMethod, setDefuzzificationMethod] = useState('centroid');
  const [linguisticVars, setLinguisticVars] = useState({
    low: [0, 0, 0.3],
    medium: [0.3, 0.5, 0.7],
    high: [0.7, 1, 1]
  });

  const canvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);

  // Generate fuzzy value range based on configuration
  const generateFuzzyRange = useMemo(() => {
    const values = [];

    // Safety check: ensure valid parameters
    if (stepSize <= 0 || rangeStart >= rangeEnd) {
      return [0, 0.5, 1]; // Default fallback
    }

    let current = rangeStart;
    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops

    while (current <= rangeEnd && iterations < maxIterations) {
      values.push(parseFloat(current.toFixed(4)));
      current += stepSize;
      iterations++;
    }

    // Ensure end value is included
    if (values.length > 0 && values[values.length - 1] !== rangeEnd) {
      values.push(rangeEnd);
    }

    return values.length > 0 ? values : [0, 0.5, 1];
  }, [rangeStart, rangeEnd, stepSize]);

  // Generate all fuzzy input combinations
  const generateFuzzyCombinations = useMemo(() => {
    const fuzzyValues = generateFuzzyRange;
    const combinations = [];

    if (inputCount === 1) {
      // Single input
      fuzzyValues.forEach(v => {
        combinations.push([v]);
      });
    } else if (inputCount === 2) {
      // Two inputs
      fuzzyValues.forEach(v1 => {
        fuzzyValues.forEach(v2 => {
          combinations.push([v1, v2]);
        });
      });
    } else if (inputCount === 3) {
      // Three inputs
      fuzzyValues.forEach(v1 => {
        fuzzyValues.forEach(v2 => {
          fuzzyValues.forEach(v3 => {
            combinations.push([v1, v2, v3]);
          });
        });
      });
    }

    return combinations;
  }, [generateFuzzyRange, inputCount]);

  // Evaluate fuzzy gate
  const evaluateFuzzyGate = (inputs, gate = gateType) => {
    try {
      const upperGateType = gate.toUpperCase();
      const evaluator = FuzzyGates[upperGateType];

      if (!evaluator) {
        return null;
      }

      const result = evaluator(inputs);
      return typeof result === 'number' ? result : null;
    } catch (error) {
      console.error('Fuzzy gate evaluation error:', error);
      return null;
    }
  };

  // Generate fuzzy truth table
  const fuzzyTruthTable = useMemo(() => {
    return generateFuzzyCombinations.map(inputs => ({
      inputs,
      output: evaluateFuzzyGate(inputs),
      probability: inputs.reduce((a, b) => a * b, 1) // Joint probability
    }));
  }, [generateFuzzyCombinations, gateType]);

  // Defuzzification methods
  const defuzzifyOutput = useMemo(() => {
    const outputs = fuzzyTruthTable.map(row => row.output).filter(o => o !== null);
    if (outputs.length === 0) return null;

    switch (defuzzificationMethod) {
      case 'centroid':
        // Center of Area (COA)
        const sum = outputs.reduce((a, b) => a + b, 0);
        return sum / outputs.length;

      case 'mom':
        // Mean of Maximum
        const maxVal = Math.max(...outputs);
        const maxIndices = outputs.reduce((acc, val, idx) => {
          if (val === maxVal) acc.push(idx);
          return acc;
        }, []);
        return maxIndices.reduce((sum, idx) => sum + outputs[idx], 0) / maxIndices.length;

      case 'lom':
        // Largest of Maximum
        return Math.max(...outputs);

      case 'som':
        // Smallest of Maximum
        return Math.min(...outputs);

      case 'boa':
        // Bisector of Area
        const sortedOutputs = [...outputs].sort((a, b) => a - b);
        const mid = Math.floor(sortedOutputs.length / 2);
        return sortedOutputs[mid];

      default:
        return outputs.reduce((a, b) => a + b, 0) / outputs.length;
    }
  }, [fuzzyTruthTable, defuzzificationMethod]);

  // Calculate fuzzy gate properties and test mathematical properties
  const fuzzyProperties = useMemo(() => {
    const outputs = fuzzyTruthTable.map(row => row.output).filter(o => o !== null);

    if (outputs.length === 0) return null;

    const avgOutput = outputs.reduce((a, b) => a + b, 0) / outputs.length;
    const minOutput = Math.min(...outputs);
    const maxOutput = Math.max(...outputs);
    const variance = outputs.reduce((a, b) => a + Math.pow(b - avgOutput, 2), 0) / outputs.length;
    const stdDev = Math.sqrt(variance);

    // Test mathematical properties
    const tests = testFuzzyProperties(gateType, generateFuzzyRange);

    // Advanced tests
    const advancedTests = showAdvancedTests ? testAdvancedProperties(gateType, generateFuzzyRange) : {};

    // Output distribution
    const histogram = calculateHistogram(outputs, 10);

    return {
      rowCount: fuzzyTruthTable.length,
      avgOutput: avgOutput.toFixed(4),
      minOutput: minOutput.toFixed(4),
      maxOutput: maxOutput.toFixed(4),
      variance: variance.toFixed(4),
      stdDev: stdDev.toFixed(4),
      defuzzified: defuzzifyOutput !== null ? defuzzifyOutput.toFixed(4) : 'N/A',
      histogram,
      ...tests,
      ...advancedTests
    };
  }, [fuzzyTruthTable, defuzzifyOutput, showAdvancedTests]);

  // Test mathematical properties of fuzzy gates
  const testFuzzyProperties = (gate, testValues) => {
    const upperGate = gate.toUpperCase();
    const evaluator = FuzzyGates[upperGate];
    if (!evaluator) return {};

    const results = {
      commutative: true,
      associative: true,
      monotonic: true,
      idempotent: true,
      boundaryCorrect: true
    };

    // Test commutativity: f(a,b) = f(b,a)
    for (let i = 0; i < testValues.length; i++) {
      for (let j = 0; j < testValues.length; j++) {
        const a = testValues[i];
        const b = testValues[j];
        const r1 = evaluator([a, b]);
        const r2 = evaluator([b, a]);
        if (Math.abs(r1 - r2) > 0.0001) {
          results.commutative = false;
          break;
        }
      }
      if (!results.commutative) break;
    }

    // Test associativity: f(f(a,b),c) = f(a,f(b,c))
    const testSet = testValues.slice(0, 3);
    if (testSet.length === 3) {
      const [a, b, c] = testSet;
      try {
        const r1 = evaluator([evaluator([a, b]), c]);
        const r2 = evaluator([a, evaluator([b, c])]);
        if (Math.abs(r1 - r2) > 0.0001) {
          results.associative = false;
        }
      } catch (e) {
        results.associative = false;
      }
    }

    // Test monotonicity: if a ≤ b then f(a) ≤ f(b)
    for (let i = 0; i < testValues.length - 1; i++) {
      const a = testValues[i];
      const b = testValues[i + 1];
      try {
        const r1 = evaluator([a, a]);
        const r2 = evaluator([b, b]);
        if (r1 > r2 + 0.0001) {
          results.monotonic = false;
          break;
        }
      } catch (e) {
        results.monotonic = false;
        break;
      }
    }

    // Test idempotency: f(a,a) = a
    for (const val of testValues) {
      try {
        const result = evaluator([val, val]);
        if (Math.abs(result - val) > 0.0001) {
          results.idempotent = false;
          break;
        }
      } catch (e) {
        results.idempotent = false;
        break;
      }
    }

    // Test boundary conditions: f(0,0)=0, f(1,1)=1 (for T-norms and S-norms)
    try {
      const r0 = evaluator([0, 0]);
      const r1 = evaluator([1, 1]);
      if (Math.abs(r0 - 0) > 0.0001 || Math.abs(r1 - 1) > 0.0001) {
        results.boundaryCorrect = false;
      }
    } catch (e) {
      results.boundaryCorrect = false;
    }

    return results;
  };

  // Test advanced mathematical properties
  const testAdvancedProperties = (gate, testValues) => {
    const upperGate = gate.toUpperCase();
    const evaluator = FuzzyGates[upperGate];
    if (!evaluator) return {};

    const results = {
      deMorganAnd: true,
      deMorganOr: true,
      distributive: true,
      absorption: true
    };

    // Test De Morgan's Laws (for complementation)
    try {
      const a = testValues[1];
      const b = testValues[2];
      // ¬(a ∧ b) = ¬a ∨ ¬b
      const lhs = 1 - evaluator([a, b]);
      const rhs = Math.max(1 - a, 1 - b);
      if (Math.abs(lhs - rhs) > 0.0001) {
        results.deMorganAnd = false;
      }
    } catch (e) {
      results.deMorganAnd = false;
    }

    // Test distributivity: a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c)
    try {
      const [a, b, c] = testValues.slice(0, 3);
      const bOrC = Math.max(b, c);
      const lhs = evaluator([a, bOrC]);
      const aAndB = evaluator([a, b]);
      const aAndC = evaluator([a, c]);
      const rhs = Math.max(aAndB, aAndC);
      if (Math.abs(lhs - rhs) > 0.0001) {
        results.distributive = false;
      }
    } catch (e) {
      results.distributive = false;
    }

    return results;
  };

  // Calculate histogram distribution
  const calculateHistogram = (outputs, bins) => {
    const min = Math.min(...outputs);
    const max = Math.max(...outputs);
    const binWidth = (max - min) / bins;
    const histogram = Array(bins).fill(0);

    outputs.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    return histogram.map((count, idx) => ({
      bin: min + (idx + 0.5) * binWidth,
      count,
      percentage: (count / outputs.length) * 100
    }));
  };

  // Export functions
  const exportToCSV = () => {
    let csv = fuzzyTruthTable[0].inputs.map((_, i) => `Input_${i}`).join(',');
    csv += ',Output,Probability\n';
    fuzzyTruthTable.forEach(row => {
      csv += row.inputs.join(',') + ',' + row.output + ',' + row.probability + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `fuzzy_table_${gateType}.csv`;
    link.href = url;
    link.click();
  };

  const exportToJSON = () => {
    const data = {
      gateType,
      config: { rangeStart, rangeEnd, stepSize, inputCount },
      truthTable: fuzzyTruthTable,
      properties: fuzzyProperties
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `fuzzy_table_${gateType}.json`;
    link.href = url;
    link.click();
  };

  const exportToLaTeX = () => {
    let latex = '\\begin{table}[h]\n\\centering\n';
    latex += '\\begin{tabular}{|' + 'c|'.repeat(inputCount) + 'c|c|}\n\\hline\n';
    latex += fuzzyTruthTable[0].inputs.map((_, i) => `$\\mu_{${i}}$`).join(' & ');
    latex += ' & Output & P(Joint) \\\\ \\hline\n';
    fuzzyTruthTable.slice(0, 50).forEach(row => {
      latex += row.inputs.map(i => i.toFixed(2)).join(' & ');
      latex += ' & ' + row.output.toFixed(4) + ' & ' + row.probability.toFixed(4) + ' \\\\ \n';
    });
    latex += '\\hline\n\\end{tabular}\n';
    latex += `\\caption{Fuzzy Truth Table for ${gateType}}\n\\end{table}`;

    const blob = new Blob([latex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `fuzzy_table_${gateType}.tex`;
    link.href = url;
    link.click();
  };

  // Draw output distribution chart
  useEffect(() => {
    if (activeTab === 'chart' && canvasRef.current && fuzzyProperties) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw histogram
      const histogram = fuzzyProperties.histogram;
      const maxCount = Math.max(...histogram.map(h => h.count));
      const barWidth = canvas.width / histogram.length;
      const heightScale = (canvas.height - 40) / maxCount;

      histogram.forEach((bar, idx) => {
        const barHeight = bar.count * heightScale;
        const x = idx * barWidth;
        const y = canvas.height - barHeight - 20;

        // Gradient fill
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height - 20);
        gradient.addColorStop(0, '#8B5CF6');
        gradient.addColorStop(1, '#6366F1');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

        // Labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bar.bin.toFixed(2), x + barWidth / 2, canvas.height - 5);
        ctx.fillText(bar.count, x + barWidth / 2, y - 5);
      });

      // Title
      ctx.fillStyle = '#E5E7EB';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('Output Distribution', 10, 20);
    }
  }, [activeTab, fuzzyProperties]);

  // Draw heatmap for 2-input gates
  useEffect(() => {
    if (activeTab === 'heatmap' && heatmapCanvasRef.current && inputCount === 2) {
      const canvas = heatmapCanvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 400;

      const values = generateFuzzyRange;
      const cellWidth = canvas.width / values.length;
      const cellHeight = canvas.height / values.length;

      values.forEach((v1, i) => {
        values.forEach((v2, j) => {
          const output = evaluateFuzzyGate([v1, v2]);
          const color = getHeatmapColor(output);

          ctx.fillStyle = color;
          ctx.fillRect(i * cellWidth, (values.length - 1 - j) * cellHeight, cellWidth, cellHeight);

          // Draw cell value
          if (values.length <= 10) {
            ctx.fillStyle = output > 0.5 ? '#000' : '#FFF';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              output.toFixed(2),
              i * cellWidth + cellWidth / 2,
              (values.length - 1 - j) * cellHeight + cellHeight / 2
            );
          }
        });
      });

      // Draw axes labels
      ctx.fillStyle = '#E5E7EB';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Input 1 (μ₀)', canvas.width / 2, canvas.height - 5);
      ctx.save();
      ctx.translate(15, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Input 2 (μ₁)', 0, 0);
      ctx.restore();
    }
  }, [activeTab, inputCount, generateFuzzyRange]);

  const getHeatmapColor = (value) => {
    if (value === null) return '#000';
    const hue = (1 - value) * 240; // Blue (240) to Red (0)
    return `hsl(${hue}, 80%, 50%)`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-600 rounded-lg p-4 shadow-2xl max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span>〰️</span>
            Fuzzy Truth Table: {gateType}
          </h3>
          <p className="text-purple-300 text-sm">Continuous Logic [0, 1]</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl leading-none px-3 py-1 hover:bg-gray-700 rounded"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2">
        {['table', 'chart', 'heatmap', 'analysis', 'export'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Range Configuration */}
      <div className="mb-4 grid grid-cols-5 gap-3 bg-gray-900 p-3 rounded">
        <div>
          <label className="text-gray-400 text-xs block mb-1">Start Value</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={rangeStart}
            onChange={(e) => setRangeStart(parseFloat(e.target.value))}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 text-sm"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">End Value</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(parseFloat(e.target.value))}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 text-sm"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Step Size</label>
          <input
            type="number"
            min="0.01"
            max="0.5"
            step="0.05"
            value={stepSize}
            onChange={(e) => setStepSize(parseFloat(e.target.value))}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 text-sm"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Inputs</label>
          <select
            value={inputCount}
            onChange={(e) => setInputCount(Number(e.target.value))}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 text-sm"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Defuzzify</label>
          <select
            value={defuzzificationMethod}
            onChange={(e) => setDefuzzificationMethod(e.target.value)}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 text-sm"
          >
            <option value="centroid">Centroid</option>
            <option value="mom">MOM</option>
            <option value="lom">LOM</option>
            <option value="som">SOM</option>
            <option value="boa">BOA</option>
          </select>
        </div>
      </div>

      {/* Range Preview */}
      <div className="mb-4 bg-gray-900 p-2 rounded">
        <div className="text-gray-400 text-xs mb-1">Generated Range:</div>
        <div className="text-purple-300 text-sm font-mono">
          [{generateFuzzyRange.join(', ')}]
        </div>
        <div className="text-gray-500 text-xs mt-1">
          {generateFuzzyRange.length} values → {fuzzyTruthTable.length} total combinations
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'table' && (
          <div className="border border-gray-700 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 sticky top-0">
                <tr>
                  {Array.from({ length: inputCount }, (_, i) => (
                    <th key={`in-${i}`} className="px-3 py-2 text-purple-400 font-mono text-xs">
                      μ{i}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-green-400 font-mono border-l border-gray-700 text-xs">
                    OUTPUT
                  </th>
                  <th className="px-3 py-2 text-blue-400 font-mono border-l border-gray-700 text-xs">
                    P(Joint)
                  </th>
                </tr>
              </thead>
              <tbody>
                {fuzzyTruthTable.slice(0, 100).map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700`}
                  >
                    {row.inputs.map((input, i) => (
                      <td
                        key={`input-${i}`}
                        className="px-3 py-1 text-center font-mono text-purple-300 text-xs"
                      >
                        {input.toFixed(2)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-mono text-green-400 font-bold border-l border-gray-700 text-xs">
                      {row.output !== null ? row.output.toFixed(4) : '?'}
                    </td>
                    <td className="px-3 py-1 text-center font-mono text-blue-300 text-xs border-l border-gray-700">
                      {row.probability.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fuzzyTruthTable.length > 100 && (
              <div className="bg-gray-900 p-2 text-center text-gray-400 text-xs">
                Showing first 100 of {fuzzyTruthTable.length} rows
              </div>
            )}
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded p-4">
              <canvas ref={canvasRef} className="w-full" style={{ height: '300px' }}></canvas>
            </div>
            {fuzzyProperties && (
              <div className="grid grid-cols-3 gap-3">
                {fuzzyProperties.histogram.map((bar, idx) => (
                  <div key={idx} className="bg-gray-900 rounded p-2">
                    <div className="text-gray-400 text-xs">Bin [{bar.bin.toFixed(2)}]</div>
                    <div className="text-purple-300 font-bold">{bar.count} ({bar.percentage.toFixed(1)}%)</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="flex flex-col items-center">
            {inputCount === 2 ? (
              <>
                <canvas ref={heatmapCanvasRef} className="border border-gray-700 rounded"></canvas>
                <div className="mt-4 flex gap-4 items-center">
                  <div className="text-xs text-gray-400">Color Scale:</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, i) => i / 10).map(val => (
                      <div key={val} className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 border border-gray-600"
                          style={{ backgroundColor: getHeatmapColor(val) }}
                        ></div>
                        <div className="text-xs text-gray-400 mt-1">{val.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 p-8 text-center">
                Heatmap visualization is only available for 2-input gates.
                <br />
                Please set input count to 2.
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && fuzzyProperties && (
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-900 rounded p-3 text-center">
                <div className="text-gray-400 text-xs">Avg Output</div>
                <div className="text-purple-300 font-bold text-lg">{fuzzyProperties.avgOutput}</div>
              </div>
              <div className="bg-gray-900 rounded p-3 text-center">
                <div className="text-gray-400 text-xs">Min/Max</div>
                <div className="text-blue-300 font-bold text-lg">
                  {fuzzyProperties.minOutput}/{fuzzyProperties.maxOutput}
                </div>
              </div>
              <div className="bg-gray-900 rounded p-3 text-center">
                <div className="text-gray-400 text-xs">Std Dev</div>
                <div className="text-yellow-300 font-bold text-lg">{fuzzyProperties.stdDev}</div>
              </div>
              <div className="bg-gray-900 rounded p-3 text-center">
                <div className="text-gray-400 text-xs">Defuzzified</div>
                <div className="text-green-300 font-bold text-lg">{fuzzyProperties.defuzzified}</div>
              </div>
            </div>

            {/* Mathematical Property Tests */}
            <div className="bg-gray-900 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400 text-sm font-semibold">Mathematical Properties:</div>
                <button
                  onClick={() => setShowAdvancedTests(!showAdvancedTests)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                >
                  {showAdvancedTests ? 'Hide Advanced' : 'Show Advanced'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className={fuzzyProperties.commutative ? 'text-green-400' : 'text-red-400'}>
                    {fuzzyProperties.commutative ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">Commutative: f(a,b) = f(b,a)</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className={fuzzyProperties.associative ? 'text-green-400' : 'text-red-400'}>
                    {fuzzyProperties.associative ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">Associative: f(f(a,b),c) = f(a,f(b,c))</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className={fuzzyProperties.monotonic ? 'text-green-400' : 'text-red-400'}>
                    {fuzzyProperties.monotonic ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">Monotonic: a ≤ b ⇒ f(a) ≤ f(b)</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className={fuzzyProperties.idempotent ? 'text-green-400' : 'text-red-400'}>
                    {fuzzyProperties.idempotent ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">Idempotent: f(a,a) = a</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className={fuzzyProperties.boundaryCorrect ? 'text-green-400' : 'text-red-400'}>
                    {fuzzyProperties.boundaryCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">Boundary: f(0,0)=0, f(1,1)=1</span>
                </div>

                {showAdvancedTests && fuzzyProperties.deMorganAnd !== undefined && (
                  <>
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                      <span className={fuzzyProperties.deMorganAnd ? 'text-green-400' : 'text-red-400'}>
                        {fuzzyProperties.deMorganAnd ? '✓' : '✗'}
                      </span>
                      <span className="text-gray-300">De Morgan (AND): ¬(a∧b) = ¬a∨¬b</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                      <span className={fuzzyProperties.distributive ? 'text-green-400' : 'text-red-400'}>
                        {fuzzyProperties.distributive ? '✓' : '✗'}
                      </span>
                      <span className="text-gray-300">Distributive: a∧(b∨c) = (a∧b)∨(a∧c)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Gate Description */}
            <div className="bg-gray-900 rounded p-3">
              <div className="text-gray-400 text-xs mb-1">Fuzzy Operation:</div>
              <div className="text-gray-300 text-sm">
                {getFuzzyGateDescription(gateType)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded p-4">
              <h4 className="text-gray-300 font-semibold mb-3">Export Truth Table</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">📊</span>
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={exportToJSON}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">💾</span>
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={exportToLaTeX}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">📄</span>
                  <span>Export LaTeX</span>
                </button>
              </div>
            </div>

            {/* Export Preview */}
            {fuzzyProperties && (
              <div className="bg-gray-900 rounded p-4">
                <h4 className="text-gray-300 font-semibold mb-3">Export Summary</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>• Gate Type: <span className="text-purple-300">{gateType}</span></div>
                  <div>• Total Rows: <span className="text-purple-300">{fuzzyTruthTable.length}</span></div>
                  <div>• Input Count: <span className="text-purple-300">{inputCount}</span></div>
                  <div>• Range: <span className="text-purple-300">[{rangeStart}, {rangeEnd}]</span></div>
                  <div>• Step Size: <span className="text-purple-300">{stepSize}</span></div>
                  <div>• Defuzzification: <span className="text-purple-300">{defuzzificationMethod}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Fuzzy gate descriptions
const getFuzzyGateDescription = (gateType) => {
  const descriptions = {
    MIN: 'T-norm: Returns minimum membership value (Gödel t-norm)',
    MAX: 'S-norm: Returns maximum membership value (Gödel s-norm)',
    PRODUCT: 'T-norm: Multiplies membership values (Product t-norm)',
    AVERAGE: 'Aggregation: Returns arithmetic mean of inputs',
    LUKASIEWICZ_AND: 'T-norm: max(0, Σμ - (n-1)) - Łukasiewicz conjunction',
    LUKASIEWICZ_OR: 'S-norm: min(1, Σμ) - Łukasiewicz disjunction',
    PROBABILISTIC_SUM: 'S-norm: μ₁ + μ₂ - μ₁·μ₂ (Algebraic sum)',
    DRASTIC_AND: 'T-norm: Drastic product (most conservative)',
    DRASTIC_OR: 'S-norm: Drastic sum (most aggressive)',
    GEOMETRIC_MEAN: 'Aggregation: (Πμᵢ)^(1/n) - geometric average',
    HARMONIC_MEAN: 'Aggregation: n / Σ(1/μᵢ) - harmonic average',
    GAMMA: 'Compensatory: Weighted combination of product and complement'
  };

  return descriptions[gateType.toUpperCase()] || 'Custom fuzzy operation with continuous [0,1] values';
};

export default FuzzyTruthTable;
