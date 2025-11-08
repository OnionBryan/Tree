/**
 * Logic Gate Evaluator
 * Evaluates boolean and fuzzy logic gates
 */

/**
 * Boolean logic gates
 */
export const BooleanGates = {
  AND: (inputs) => inputs.every(v => v),
  OR: (inputs) => inputs.some(v => v),
  NOT: (input) => !input,
  XOR: (inputs) => inputs.filter(v => v).length === 1,
  NAND: (inputs) => !inputs.every(v => v),
  NOR: (inputs) => !inputs.some(v => v),
  XNOR: (inputs) => inputs.filter(v => v).length !== 1
};

/**
 * Fuzzy logic gates (0-1 continuous values)
 */
export const FuzzyGates = {
  AND: (inputs) => Math.min(...inputs),
  OR: (inputs) => Math.max(...inputs),
  NOT: (input) => 1 - input,

  // Product AND
  PRODUCT: (inputs) => inputs.reduce((acc, val) => acc * val, 1),

  // Algebraic sum OR
  SUM: (inputs) => {
    return inputs.reduce((acc, val) => acc + val - (acc * val), 0);
  },

  // Lukasiewicz AND
  LUKASIEWICZ_AND: (inputs) => Math.max(0, inputs.reduce((sum, val) => sum + val, 0) - inputs.length + 1),

  // Lukasiewicz OR
  LUKASIEWICZ_OR: (inputs) => Math.min(1, inputs.reduce((sum, val) => sum + val, 0)),

  // Drastic AND
  DRASTIC_AND: (inputs) => {
    const max = Math.max(...inputs);
    return max === 1 ? Math.min(...inputs) : 0;
  },

  // Drastic OR
  DRASTIC_OR: (inputs) => {
    const min = Math.min(...inputs);
    return min === 0 ? Math.max(...inputs) : 1;
  },

  // Hamacher Product
  HAMACHER_PRODUCT: (inputs) => {
    return inputs.reduce((acc, val) => {
      return (acc * val) / (acc + val - acc * val);
    });
  },

  // Einstein Product
  EINSTEIN_PRODUCT: (inputs) => {
    return inputs.reduce((acc, val) => {
      return (acc * val) / (1 + (1 - acc) * (1 - val));
    });
  }
};

/**
 * Threshold-based gates
 */
export const ThresholdGates = {
  THRESHOLD: (inputs, k = 0.5) => {
    const avg = inputs.reduce((sum, val) => sum + val, 0) / inputs.length;
    return avg >= k ? 1 : 0;
  },

  MAJORITY: (inputs) => {
    const sum = inputs.reduce((s, v) => s + v, 0);
    return sum > inputs.length / 2 ? 1 : 0;
  },

  AT_LEAST_K: (inputs, k) => {
    const sum = inputs.reduce((s, v) => s + (v ? 1 : 0), 0);
    return sum >= k ? 1 : 0;
  }
};

/**
 * Main gate evaluator class
 */
export class GateEvaluator {
  constructor() {
    this.booleanGates = BooleanGates;
    this.fuzzyGates = FuzzyGates;
    this.thresholdGates = ThresholdGates;
  }

  /**
   * Evaluate a gate with given inputs
   */
  evaluate(gateType, inputs, params = {}) {
    const type = gateType.toUpperCase();

    // Check boolean gates
    if (this.booleanGates[type]) {
      return this.booleanGates[type](inputs);
    }

    // Check fuzzy gates
    if (this.fuzzyGates[type]) {
      return this.fuzzyGates[type](inputs);
    }

    // Check threshold gates
    if (this.thresholdGates[type]) {
      return this.thresholdGates[type](inputs, params.k);
    }

    throw new Error(`Unknown gate type: ${gateType}`);
  }
}

/**
 * Fuzzy gate evaluator with membership functions
 */
export class FuzzyGateEvaluator {
  constructor() {
    this.fuzzyGates = FuzzyGates;
  }

  /**
   * Evaluate fuzzy gate
   */
  evaluate(gateType, inputs) {
    const type = gateType.toUpperCase();

    if (!this.fuzzyGates[type]) {
      throw new Error(`Unknown fuzzy gate type: ${gateType}`);
    }

    return this.fuzzyGates[type](inputs);
  }

  /**
   * Triangular membership function
   */
  triangularMembership(x, a, b, c) {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x < b) return (x - a) / (b - a);
    return (c - x) / (c - b);
  }

  /**
   * Trapezoidal membership function
   */
  trapezoidalMembership(x, a, b, c, d) {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x < b) return (x - a) / (b - a);
    return (d - x) / (d - c);
  }

  /**
   * Gaussian membership function
   */
  gaussianMembership(x, mean, sigma) {
    return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
  }
}

export default { GateEvaluator, FuzzyGateEvaluator, BooleanGates, FuzzyGates, ThresholdGates };
