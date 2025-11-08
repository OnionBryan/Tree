import React, { useState, useMemo } from 'react';
import { FuzzyGates } from '../lib/logic/gateEvaluator';

/**
 * Fuzzy Logic Truth Table with Configurable Range Variables
 * Computes probability ranges and tests against fuzzy logic operations
 */
const FuzzyTruthTable = ({ gateType, onClose }) => {
  // Range configuration
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [stepSize, setStepSize] = useState(0.25);
  const [inputCount, setInputCount] = useState(2);

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
  const evaluateFuzzyGate = (inputs) => {
    try {
      const upperGateType = gateType.toUpperCase();
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

  // Calculate fuzzy gate properties and test mathematical properties
  const fuzzyProperties = useMemo(() => {
    const outputs = fuzzyTruthTable.map(row => row.output).filter(o => o !== null);

    if (outputs.length === 0) return null;

    const avgOutput = outputs.reduce((a, b) => a + b, 0) / outputs.length;
    const minOutput = Math.min(...outputs);
    const maxOutput = Math.max(...outputs);
    const variance = outputs.reduce((a, b) => a + Math.pow(b - avgOutput, 2), 0) / outputs.length;

    // Test mathematical properties
    const tests = testFuzzyProperties(gateType, generateFuzzyRange);

    return {
      rowCount: fuzzyTruthTable.length,
      avgOutput: avgOutput.toFixed(4),
      minOutput: minOutput.toFixed(4),
      maxOutput: maxOutput.toFixed(4),
      variance: variance.toFixed(4),
      ...tests
    };
  }, [fuzzyTruthTable]);

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

  return (
    <div className="bg-gray-800 border border-purple-600 rounded-lg p-4 shadow-xl max-w-4xl">
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
          className="text-gray-400 hover:text-white text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Range Configuration */}
      <div className="mb-4 grid grid-cols-4 gap-3 bg-gray-900 p-3 rounded">
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

      {/* Fuzzy Truth Table */}
      <div className="overflow-auto max-h-80 border border-gray-700 rounded mb-4">
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

      {/* Fuzzy Properties and Tests */}
      {fuzzyProperties && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-900 rounded p-2 text-center">
              <div className="text-gray-400 text-xs">Avg Output</div>
              <div className="text-purple-300 font-bold text-sm">{fuzzyProperties.avgOutput}</div>
            </div>
            <div className="bg-gray-900 rounded p-2 text-center">
              <div className="text-gray-400 text-xs">Min/Max</div>
              <div className="text-blue-300 font-bold text-sm">
                {fuzzyProperties.minOutput}/{fuzzyProperties.maxOutput}
              </div>
            </div>
            <div className="bg-gray-900 rounded p-2 text-center">
              <div className="text-gray-400 text-xs">Variance</div>
              <div className="text-yellow-300 font-bold text-sm">{fuzzyProperties.variance}</div>
            </div>
            <div className="bg-gray-900 rounded p-2 text-center">
              <div className="text-gray-400 text-xs">Rows</div>
              <div className="text-green-300 font-bold text-sm">{fuzzyProperties.rowCount}</div>
            </div>
          </div>

          {/* Mathematical Property Tests */}
          <div className="bg-gray-900 rounded p-3">
            <div className="text-gray-400 text-xs mb-2 font-semibold">Mathematical Properties:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={fuzzyProperties.commutative ? 'text-green-400' : 'text-red-400'}>
                  {fuzzyProperties.commutative ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Commutative: f(a,b) = f(b,a)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={fuzzyProperties.associative ? 'text-green-400' : 'text-red-400'}>
                  {fuzzyProperties.associative ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Associative: f(f(a,b),c) = f(a,f(b,c))</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={fuzzyProperties.monotonic ? 'text-green-400' : 'text-red-400'}>
                  {fuzzyProperties.monotonic ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Monotonic: a ≤ b ⇒ f(a) ≤ f(b)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={fuzzyProperties.idempotent ? 'text-green-400' : 'text-red-400'}>
                  {fuzzyProperties.idempotent ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Idempotent: f(a,a) = a</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={fuzzyProperties.boundaryCorrect ? 'text-green-400' : 'text-red-400'}>
                  {fuzzyProperties.boundaryCorrect ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Boundary: f(0,0)=0, f(1,1)=1</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Gate Description */}
      <div className="mt-4 bg-gray-900 rounded p-3">
        <div className="text-gray-400 text-xs mb-1">Fuzzy Operation:</div>
        <div className="text-gray-300 text-sm">
          {getFuzzyGateDescription(gateType)}
        </div>
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
