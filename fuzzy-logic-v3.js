/**
 * Fuzzy Logic Implementation
 * Zadeh Operations, T-norms, S-norms, and Fuzzy Inference
 * Version: 3.0
 *
 * This module implements fuzzy logic operations for the advanced tree logic system,
 * including membership functions, fuzzy operators, and inference engines.
 *
 * Improvements in v3.0:
 * - Fixed unsafe `this` context issues
 * - Added input parameter validation
 * - Nilpotent handling for division by zero
 * - Configurable T-norms and S-norms in inference
 * - Multiple defuzzification methods (COG, MOM, BOA, LOM, SOM)
 * - Configurable defuzzification resolution
 * - Modern ES6+ syntax (arrow functions, const/let)
 * - Improved FuzzySet operations efficiency
 */

// ============================================================================
// Membership Functions
// ============================================================================

/**
 * Standard fuzzy membership functions with parameter validation
 */
const MembershipFunctions = {
    /**
     * Triangular membership function
     * Parameters: [left, peak, right]
     */
    triangular: (x, params) => {
        if (!params || params.length !== 3) {
            throw new Error('Triangular function requires 3 parameters: [left, peak, right]');
        }
        const [a, b, c] = params;
        if (a >= b || b >= c) {
            throw new Error('Triangular parameters must satisfy: left < peak < right');
        }
        if (x <= a || x >= c) return 0;
        if (x === b) return 1;
        if (x < b) return (x - a) / (b - a);
        return (c - x) / (c - b);
    },

    /**
     * Trapezoidal membership function
     * Parameters: [left, leftPeak, rightPeak, right]
     */
    trapezoidal: (x, params) => {
        if (!params || params.length !== 4) {
            throw new Error('Trapezoidal function requires 4 parameters: [left, leftPeak, rightPeak, right]');
        }
        const [a, b, c, d] = params;
        if (a >= b || b > c || c >= d) {
            throw new Error('Trapezoidal parameters must satisfy: left < leftPeak <= rightPeak < right');
        }
        if (x <= a || x >= d) return 0;
        if (x >= b && x <= c) return 1;
        if (x < b) return (x - a) / (b - a);
        return (d - x) / (d - c);
    },

    /**
     * Gaussian membership function
     * Parameters: [mean, standardDeviation]
     */
    gaussian: (x, params) => {
        if (!params || params.length !== 2) {
            throw new Error('Gaussian function requires 2 parameters: [mean, standardDeviation]');
        }
        const [mean, sigma] = params;
        if (sigma <= 0) {
            throw new Error('Standard deviation must be positive');
        }
        return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
    },

    /**
     * Bell-shaped membership function
     * Parameters: [width, slope, center]
     */
    bell: (x, params) => {
        if (!params || params.length !== 3) {
            throw new Error('Bell function requires 3 parameters: [width, slope, center]');
        }
        const [a, b, c] = params;
        if (a <= 0 || b <= 0) {
            throw new Error('Width and slope must be positive');
        }
        return 1 / (1 + Math.pow(Math.abs((x - c) / a), 2 * b));
    },

    /**
     * Sigmoid membership function
     * Parameters: [slope, inflectionPoint]
     */
    sigmoid: (x, params) => {
        if (!params || params.length !== 2) {
            throw new Error('Sigmoid function requires 2 parameters: [slope, inflectionPoint]');
        }
        const [a, c] = params;
        return 1 / (1 + Math.exp(-a * (x - c)));
    },

    /**
     * S-curve membership function
     * Parameters: [start, end]
     */
    sCurve: (x, params) => {
        if (!params || params.length !== 2) {
            throw new Error('S-curve function requires 2 parameters: [start, end]');
        }
        const [a, b] = params;
        if (a >= b) {
            throw new Error('S-curve parameters must satisfy: start < end');
        }
        if (x <= a) return 0;
        if (x >= b) return 1;
        const mid = (a + b) / 2;
        if (x <= mid) {
            return 2 * Math.pow((x - a) / (b - a), 2);
        }
        return 1 - 2 * Math.pow((x - b) / (b - a), 2);
    },

    /**
     * Z-curve membership function (complement of S-curve)
     * Parameters: [start, end]
     */
    zCurve: (x, params) => {
        return 1 - MembershipFunctions.sCurve(x, params);
    },

    /**
     * Pi-shaped membership function
     * Parameters: [leftFoot, leftShoulder, rightShoulder, rightFoot]
     */
    piShaped: (x, params) => {
        if (!params || params.length !== 4) {
            throw new Error('Pi-shaped function requires 4 parameters: [leftFoot, leftShoulder, rightShoulder, rightFoot]');
        }
        const [a, b, c, d] = params;
        if (a >= b || b > c || c >= d) {
            throw new Error('Pi-shaped parameters must satisfy: leftFoot < leftShoulder <= rightShoulder < rightFoot');
        }
        if (x <= a || x >= d) return 0;
        if (x >= b && x <= c) return 1;
        if (x < b) return MembershipFunctions.sCurve(x, [a, b]);
        return MembershipFunctions.zCurve(x, [c, d]);
    },

    /**
     * Custom piecewise linear function
     * Parameters: array of [x, y] points
     */
    piecewiseLinear: (x, points) => {
        if (!points || points.length < 2) {
            throw new Error('Piecewise linear function requires at least 2 points');
        }
        if (x <= points[0][0]) return points[0][1];
        if (x >= points[points.length - 1][0]) return points[points.length - 1][1];

        for (let i = 1; i < points.length; i++) {
            if (x <= points[i][0]) {
                const [x0, y0] = points[i - 1];
                const [x1, y1] = points[i];
                return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
            }
        }
        return 0;
    }
};

// ============================================================================
// T-norms (Triangular Norms) - Fuzzy AND Operations
// ============================================================================

/**
 * T-norm operators for fuzzy conjunction
 */
const TNorms = {
    /**
     * Zadeh MIN (Gödel t-norm)
     * Standard fuzzy AND
     */
    MIN: (a, b) => Math.min(a, b),

    /**
     * Algebraic Product (Probabilistic AND)
     */
    PRODUCT: (a, b) => a * b,

    /**
     * Łukasiewicz t-norm (Bounded difference)
     */
    LUKASIEWICZ: (a, b) => Math.max(0, a + b - 1),

    /**
     * Drastic Product
     */
    DRASTIC: (a, b) => {
        if (a === 1) return b;
        if (b === 1) return a;
        return 0;
    },

    /**
     * Hamacher Product
     * Parameter γ ≥ 0
     */
    HAMACHER: (a, b, gamma = 0) => {
        if (gamma === 0) return TNorms.PRODUCT(a, b);
        const denominator = gamma + (1 - gamma) * (a + b - a * b);
        return denominator === 0 ? 0 : (a * b) / denominator;
    },

    /**
     * Einstein Product
     */
    EINSTEIN: (a, b) => (a * b) / (2 - (a + b - a * b)),

    /**
     * Nilpotent Minimum
     */
    NILPOTENT: (a, b) => {
        if (a + b > 1) return Math.min(a, b);
        return 0;
    }
};

// ============================================================================
// S-norms (T-conorms) - Fuzzy OR Operations
// ============================================================================

/**
 * S-norm operators for fuzzy disjunction
 */
const SNorms = {
    /**
     * Zadeh MAX (Gödel s-norm)
     * Standard fuzzy OR
     */
    MAX: (a, b) => Math.max(a, b),

    /**
     * Probabilistic Sum (Algebraic Sum)
     */
    PROBABILISTIC: (a, b) => a + b - a * b,

    /**
     * Łukasiewicz s-norm (Bounded sum)
     */
    LUKASIEWICZ: (a, b) => Math.min(1, a + b),

    /**
     * Drastic Sum
     */
    DRASTIC: (a, b) => {
        if (a === 0) return b;
        if (b === 0) return a;
        return 1;
    },

    /**
     * Hamacher Sum
     * Parameter γ ≥ 0
     */
    HAMACHER: (a, b, gamma = 0) => {
        if (gamma === 0) return SNorms.PROBABILISTIC(a, b);
        const numerator = a + b - (2 - gamma) * a * b;
        const denominator = 1 - (1 - gamma) * a * b;
        return denominator === 0 ? 0 : numerator / denominator;
    },

    /**
     * Einstein Sum
     */
    EINSTEIN: (a, b) => (a + b) / (1 + a * b),

    /**
     * Nilpotent Maximum
     */
    NILPOTENT: (a, b) => {
        if (a + b < 1) return Math.max(a, b);
        return 1;
    }
};

// ============================================================================
// Fuzzy Complement Operations
// ============================================================================

/**
 * Fuzzy negation operators
 */
const FuzzyComplements = {
    /**
     * Standard complement (Zadeh)
     */
    STANDARD: a => 1 - a,

    /**
     * Sugeno complement
     * Parameter λ > -1
     */
    SUGENO: (a, lambda = 0) => (1 - a) / (1 + lambda * a),

    /**
     * Yager complement
     * Parameter w > 0
     */
    YAGER: (a, w = 1) => Math.pow(1 - Math.pow(a, w), 1/w)
};

// ============================================================================
// Fuzzy Implication Operations
// ============================================================================

/**
 * Fuzzy implication operators
 */
const FuzzyImplications = {
    /**
     * Kleene-Dienes implication
     */
    KLEENE_DIENES: (a, b) => Math.max(1 - a, b),

    /**
     * Łukasiewicz implication
     */
    LUKASIEWICZ: (a, b) => Math.min(1, 1 - a + b),

    /**
     * Gödel implication
     */
    GODEL: (a, b) => a <= b ? 1 : b,

    /**
     * Goguen implication (Residuum of product)
     */
    GOGUEN: (a, b) => a === 0 ? 1 : Math.min(1, b / a),

    /**
     * Mamdani implication (minimum)
     */
    MAMDANI: (a, b) => Math.min(a, b),

    /**
     * Larsen implication (product)
     */
    LARSEN: (a, b) => a * b
};

// ============================================================================
// Fuzzy Aggregation Operations
// ============================================================================

/**
 * Aggregation operators for multiple fuzzy values
 */
const FuzzyAggregation = {
    /**
     * Weighted Average
     */
    WEIGHTED_AVERAGE: (values, weights) => {
        if (values.length === 0) return 0;
        if (!weights) weights = new Array(values.length).fill(1);

        let sum = 0;
        let weightSum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i] * weights[i];
            weightSum += weights[i];
        }
        return weightSum === 0 ? 0 : sum / weightSum;
    },

    /**
     * Ordered Weighted Average (OWA)
     */
    OWA: (values, weights) => {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => b - a);
        return FuzzyAggregation.WEIGHTED_AVERAGE(sorted, weights);
    },

    /**
     * Geometric Mean
     * Handles 0 naturally (product becomes 0)
     */
    GEOMETRIC_MEAN: (values) => {
        if (values.length === 0) return 0;
        const product = values.reduce((a, b) => a * b, 1);
        return Math.pow(product, 1 / values.length);
    },

    /**
     * Harmonic Mean
     * Mathematically: harmonic mean of anything with 0 is 0 (similar to geometric mean)
     * Uses epsilon threshold for numerical stability to prevent division by near-zero values
     * Reference: https://stats.stackexchange.com/questions/37628/harmonic-mean-with-zero-value
     */
    HARMONIC_MEAN: (values, epsilon = 1e-10) => {
        if (values.length === 0) return 0;
        // If any value at or near zero, return 0 (mathematical definition + numerical stability)
        if (values.some(v => v < epsilon)) return 0;
        const sumReciprocals = values.reduce((sum, val) => sum + 1/val, 0);
        return values.length / sumReciprocals;
    }
};

// ============================================================================
// Fuzzy Set Operations
// ============================================================================

/**
 * Operations on fuzzy sets (improved iteration efficiency)
 */
class FuzzySet {
    constructor(membershipFunction, params = {}) {
        this.membershipFunction = membershipFunction;
        this.params = params;
        this.elements = new Map();
    }

    /**
     * Get membership degree for an element
     */
    getMembership(x) {
        if (this.elements.has(x)) {
            return this.elements.get(x);
        }
        if (typeof this.membershipFunction === 'function') {
            return this.membershipFunction(x, this.params);
        }
        return 0;
    }

    /**
     * Set membership degree for an element
     */
    setMembership(x, degree) {
        this.elements.set(x, Math.max(0, Math.min(1, degree)));
    }

    /**
     * Union of two fuzzy sets (using S-norm)
     * Improved: iterate directly over Map entries
     */
    union(other, sNorm = SNorms.MAX) {
        const result = new FuzzySet();

        // Process this set's elements
        for (const [x, membership] of this.elements) {
            const otherMembership = other.getMembership(x);
            result.setMembership(x, sNorm(membership, otherMembership));
        }

        // Process other's elements not in this set
        for (const [x, membership] of other.elements) {
            if (!this.elements.has(x)) {
                const thisMembership = this.getMembership(x);
                result.setMembership(x, sNorm(thisMembership, membership));
            }
        }

        return result;
    }

    /**
     * Intersection of two fuzzy sets (using T-norm)
     * Improved: iterate directly over Map entries
     */
    intersection(other, tNorm = TNorms.MIN) {
        const result = new FuzzySet();

        // Process this set's elements
        for (const [x, membership] of this.elements) {
            const otherMembership = other.getMembership(x);
            result.setMembership(x, tNorm(membership, otherMembership));
        }

        // Process other's elements not in this set
        for (const [x, membership] of other.elements) {
            if (!this.elements.has(x)) {
                const thisMembership = this.getMembership(x);
                result.setMembership(x, tNorm(thisMembership, membership));
            }
        }

        return result;
    }

    /**
     * Complement of fuzzy set
     */
    complement(complementOp = FuzzyComplements.STANDARD) {
        const result = new FuzzySet();

        for (const [x, membership] of this.elements) {
            result.setMembership(x, complementOp(membership));
        }

        return result;
    }

    /**
     * Alpha-cut (crisp set of elements with membership ≥ alpha)
     */
    alphaCut(alpha = 0.5) {
        const result = [];
        for (const [x, membership] of this.elements) {
            if (membership >= alpha) {
                result.push(x);
            }
        }
        return result;
    }

    /**
     * Support (elements with membership > 0)
     */
    support() {
        return this.alphaCut(0.00001);
    }

    /**
     * Core (elements with membership = 1)
     */
    core() {
        return this.alphaCut(0.99999);
    }

    /**
     * Calculate cardinality (sum of membership degrees)
     */
    cardinality() {
        let sum = 0;
        for (const membership of this.elements.values()) {
            sum += membership;
        }
        return sum;
    }
}

// ============================================================================
// Defuzzification Methods
// ============================================================================

/**
 * Multiple defuzzification methods
 */
const DefuzzificationMethods = {
    /**
     * Center of Gravity (COG) / Centroid method
     * Most common, balances area under curve
     */
    COG: (membershipFunc, range, resolution = 100) => {
        const step = (range[1] - range[0]) / resolution;
        let numerator = 0;
        let denominator = 0;

        for (let x = range[0]; x <= range[1]; x += step) {
            const membership = membershipFunc(x);
            numerator += x * membership;
            denominator += membership;
        }

        return denominator === 0 ? (range[0] + range[1]) / 2 : numerator / denominator;
    },

    /**
     * Mean of Maxima (MOM)
     * Average of all points with maximum membership
     */
    MOM: (membershipFunc, range, resolution = 100) => {
        const step = (range[1] - range[0]) / resolution;
        let maxMembership = 0;
        const maxPoints = [];

        for (let x = range[0]; x <= range[1]; x += step) {
            const membership = membershipFunc(x);
            if (membership > maxMembership) {
                maxMembership = membership;
                maxPoints.length = 0;
                maxPoints.push(x);
            } else if (membership === maxMembership && membership > 0) {
                maxPoints.push(x);
            }
        }

        return maxPoints.length === 0 ?
            (range[0] + range[1]) / 2 :
            maxPoints.reduce((a, b) => a + b, 0) / maxPoints.length;
    },

    /**
     * Smallest of Maxima (SOM)
     * Leftmost point with maximum membership
     */
    SOM: (membershipFunc, range, resolution = 100) => {
        const step = (range[1] - range[0]) / resolution;
        let maxMembership = 0;
        let smallestMax = range[0];

        for (let x = range[0]; x <= range[1]; x += step) {
            const membership = membershipFunc(x);
            if (membership > maxMembership) {
                maxMembership = membership;
                smallestMax = x;
            }
        }

        return smallestMax;
    },

    /**
     * Largest of Maxima (LOM)
     * Rightmost point with maximum membership
     */
    LOM: (membershipFunc, range, resolution = 100) => {
        const step = (range[1] - range[0]) / resolution;
        let maxMembership = 0;
        let largestMax = range[0];

        for (let x = range[0]; x <= range[1]; x += step) {
            const membership = membershipFunc(x);
            if (membership >= maxMembership) {
                maxMembership = membership;
                largestMax = x;
            }
        }

        return largestMax;
    },

    /**
     * Bisector of Area (BOA)
     * Point that divides area under curve in half
     */
    BOA: (membershipFunc, range, resolution = 100) => {
        const step = (range[1] - range[0]) / resolution;
        let totalArea = 0;
        const areas = [];

        // Calculate cumulative areas
        for (let x = range[0]; x <= range[1]; x += step) {
            totalArea += membershipFunc(x);
            areas.push({ x, cumulativeArea: totalArea });
        }

        const halfArea = totalArea / 2;

        // Find bisector point
        for (const point of areas) {
            if (point.cumulativeArea >= halfArea) {
                return point.x;
            }
        }

        return (range[0] + range[1]) / 2;
    }
};

// ============================================================================
// Fuzzy Inference System (Enhanced)
// ============================================================================

/**
 * Mamdani-style fuzzy inference system with configurable operators
 */
class FuzzyInferenceSystem {
    constructor(config = {}) {
        this.inputs = {};
        this.outputs = {};
        this.rules = [];

        // Configurable operators
        this.tNorm = config.tNorm || TNorms.MIN;
        this.sNorm = config.sNorm || SNorms.MAX;
        this.implication = config.implication || FuzzyImplications.MAMDANI;
        this.defuzzMethod = config.defuzzMethod || 'COG';
        this.defuzzResolution = config.defuzzResolution || 100;
    }

    /**
     * Add input variable with linguistic terms
     */
    addInput(name, range, terms) {
        this.inputs[name] = {
            range: range,
            terms: terms,
            value: null
        };
    }

    /**
     * Add output variable with linguistic terms
     */
    addOutput(name, range, terms) {
        this.outputs[name] = {
            range: range,
            terms: terms,
            value: null
        };
    }

    /**
     * Add fuzzy rule
     * Format: { antecedent: {input1: 'term1', input2: 'term2'},
     *          consequent: {output1: 'term1'},
     *          weight: 1.0 }
     */
    addRule(rule) {
        this.rules.push({
            antecedent: rule.antecedent,
            consequent: rule.consequent,
            weight: rule.weight || 1.0
        });
    }

    /**
     * Fuzzification - convert crisp inputs to fuzzy values
     */
    fuzzify(inputValues) {
        const fuzzified = {};

        for (const [name, value] of Object.entries(inputValues)) {
            if (this.inputs[name]) {
                fuzzified[name] = {};
                for (const [term, membershipFunc] of Object.entries(this.inputs[name].terms)) {
                    fuzzified[name][term] = membershipFunc(value);
                }
            }
        }

        return fuzzified;
    }

    /**
     * Rule evaluation - compute firing strength using configurable T-norm
     */
    evaluateRules(fuzzifiedInputs) {
        const ruleOutputs = [];

        for (const rule of this.rules) {
            // Calculate antecedent activation using configured T-norm
            const antecedentValues = [];
            for (const [input, term] of Object.entries(rule.antecedent)) {
                if (fuzzifiedInputs[input] && fuzzifiedInputs[input][term] !== undefined) {
                    antecedentValues.push(fuzzifiedInputs[input][term]);
                }
            }

            // Apply T-norm to all antecedent values
            let activation = antecedentValues.length > 0 ? antecedentValues[0] : 0;
            for (let i = 1; i < antecedentValues.length; i++) {
                activation = this.tNorm(activation, antecedentValues[i]);
            }

            // Apply rule weight
            activation *= rule.weight;

            // Store output with activation level
            if (activation > 0) {
                ruleOutputs.push({
                    consequent: rule.consequent,
                    activation: activation
                });
            }
        }

        return ruleOutputs;
    }

    /**
     * Aggregation - combine rule outputs using configurable S-norm
     */
    aggregate(ruleOutputs) {
        const aggregated = {};

        for (const output of ruleOutputs) {
            for (const [variable, term] of Object.entries(output.consequent)) {
                if (!aggregated[variable]) {
                    aggregated[variable] = {};
                }
                if (!aggregated[variable][term]) {
                    aggregated[variable][term] = 0;
                }
                // Use configured S-norm for aggregation
                aggregated[variable][term] = this.sNorm(
                    aggregated[variable][term],
                    output.activation
                );
            }
        }

        return aggregated;
    }

    /**
     * Defuzzification - convert fuzzy outputs to crisp values
     * Supports multiple methods: COG, MOM, SOM, LOM, BOA
     */
    defuzzify(aggregatedOutputs) {
        const crispOutputs = {};

        for (const [variable, terms] of Object.entries(aggregatedOutputs)) {
            if (!this.outputs[variable]) continue;

            const range = this.outputs[variable].range;

            // Create aggregated membership function
            const aggregatedMembershipFunc = (x) => {
                let membership = 0;

                for (const [term, activation] of Object.entries(terms)) {
                    const termMembership = this.outputs[variable].terms[term](x);
                    membership = this.sNorm(membership, this.implication(activation, termMembership));
                }

                return membership;
            };

            // Apply selected defuzzification method
            const defuzzMethod = DefuzzificationMethods[this.defuzzMethod] || DefuzzificationMethods.COG;
            crispOutputs[variable] = defuzzMethod(
                aggregatedMembershipFunc,
                range,
                this.defuzzResolution
            );
        }

        return crispOutputs;
    }

    /**
     * Run the complete inference process
     */
    infer(inputValues) {
        const fuzzified = this.fuzzify(inputValues);
        const ruleOutputs = this.evaluateRules(fuzzified);
        const aggregated = this.aggregate(ruleOutputs);
        const crisp = this.defuzzify(aggregated);

        return {
            fuzzifiedInputs: fuzzified,
            ruleActivations: ruleOutputs,
            aggregatedOutputs: aggregated,
            crispOutputs: crisp
        };
    }
}

// ============================================================================
// Fuzzy Gate Evaluator
// ============================================================================

/**
 * Main fuzzy gate evaluator that integrates with AdvancedNode
 */
class FuzzyGateEvaluator {
    constructor() {
        this.tNorms = TNorms;
        this.sNorms = SNorms;
        this.complements = FuzzyComplements;
        this.implications = FuzzyImplications;
        this.aggregations = FuzzyAggregation;
    }

    /**
     * Evaluate fuzzy gate based on type
     */
    evaluate(gateType, inputs, params = {}) {
        // Normalize inputs to [0,1]
        const normalizedInputs = inputs.map(input =>
            Math.max(0, Math.min(1, Number(input)))
        );

        switch(gateType.toLowerCase()) {
            // T-norms (AND-like operations)
            case 'fuzzy_min':
            case 'fuzzy_and':
                return this.evaluateMultiple(normalizedInputs, TNorms.MIN);
            case 'fuzzy_product':
                return this.evaluateMultiple(normalizedInputs, TNorms.PRODUCT);
            case 'fuzzy_lukasiewicz_and':
                return this.evaluateMultiple(normalizedInputs, TNorms.LUKASIEWICZ);

            // S-norms (OR-like operations)
            case 'fuzzy_max':
            case 'fuzzy_or':
                return this.evaluateMultiple(normalizedInputs, SNorms.MAX);
            case 'fuzzy_sum':
                return this.evaluateMultiple(normalizedInputs, SNorms.PROBABILISTIC);
            case 'fuzzy_lukasiewicz_or':
                return this.evaluateMultiple(normalizedInputs, SNorms.LUKASIEWICZ);

            // Complement operations
            case 'fuzzy_not':
                return FuzzyComplements.STANDARD(normalizedInputs[0]);
            case 'fuzzy_sugeno_not':
                return FuzzyComplements.SUGENO(normalizedInputs[0], params.lambda || 0);

            // Implication operations
            case 'fuzzy_imply':
                return FuzzyImplications.KLEENE_DIENES(
                    normalizedInputs[0],
                    normalizedInputs[1]
                );
            case 'fuzzy_mamdani':
                return FuzzyImplications.MAMDANI(
                    normalizedInputs[0],
                    normalizedInputs[1]
                );

            // Aggregation operations
            case 'fuzzy_average':
                return FuzzyAggregation.WEIGHTED_AVERAGE(
                    normalizedInputs,
                    params.weights
                );
            case 'fuzzy_owa':
                return FuzzyAggregation.OWA(
                    normalizedInputs,
                    params.weights
                );

            default:
                return normalizedInputs[0] || 0;
        }
    }

    /**
     * Evaluate multiple inputs with binary operator
     */
    evaluateMultiple(inputs, operator) {
        if (inputs.length === 0) return 0;
        if (inputs.length === 1) return inputs[0];

        let result = inputs[0];
        for (let i = 1; i < inputs.length; i++) {
            result = operator(result, inputs[i]);
        }
        return result;
    }
}

// ============================================================================
// Integration with AdvancedNode
// ============================================================================

/**
 * Extend AdvancedNode prototype to use fuzzy evaluator
 */
if (typeof AdvancedNode !== 'undefined') {
    const fuzzyEvaluator = new FuzzyGateEvaluator();

    // Override the evaluateFuzzyGate method
    AdvancedNode.prototype.evaluateFuzzyGate = function(inputs) {
        try {
            // Use custom fuzzy membership function if provided
            if (this.fuzzyMembership) {
                const membershipValues = inputs.map(input =>
                    this.fuzzyMembership(input)
                );
                inputs = membershipValues;
            }

            // Evaluate using fuzzy gate
            const result = fuzzyEvaluator.evaluate(
                this.logicType,
                inputs,
                {
                    weights: this.weights,
                    lambda: this.metadata.lambda,
                    gamma: this.metadata.gamma
                }
            );

            // Determine output branch based on fuzzy result
            if (this.branchCount === 2) {
                // Binary branching based on threshold
                const threshold = this.metadata.fuzzyThreshold || 0.5;
                return result >= threshold ? 1 : 0;
            } else {
                // Multi-branch based on fuzzy ranges
                const step = 1 / this.branchCount;
                for (let i = 0; i < this.branchCount; i++) {
                    if (result <= (i + 1) * step) {
                        return i;
                    }
                }
                return this.branchCount - 1;
            }
        } catch (error) {
            console.error(`Fuzzy gate evaluation error: ${error.message}`);
            this.state.error = error.message;
            return 0;
        }
    };
}

// ============================================================================
// Export
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MembershipFunctions,
        TNorms,
        SNorms,
        FuzzyComplements,
        FuzzyImplications,
        FuzzyAggregation,
        FuzzySet,
        FuzzyInferenceSystem,
        FuzzyGateEvaluator,
        DefuzzificationMethods
    };
}
