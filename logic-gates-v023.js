/**
 * Logic Gates Implementation
 * Digital, Multi-Valued, and Special Logic Operations
 * Version: 0.23
 * 
 * This module implements various logic gate operations for the advanced
 * tree logic system, including standard Boolean gates, multi-valued logic,
 * and specialized threshold gates.
 */

// ============================================================================
// Standard Boolean Logic Gates
// ============================================================================

/**
 * Standard logic gate implementations
 */
const LogicGates = {
    /**
     * AND Gate - All inputs must be true
     * Truth table: 00->0, 01->0, 10->0, 11->1
     */
    AND: function(inputs) {
        if (inputs.length === 0) return false;
        return inputs.every(input => Boolean(input));
    },
    
    /**
     * OR Gate - At least one input must be true
     * Truth table: 00->0, 01->1, 10->1, 11->1
     */
    OR: function(inputs) {
        if (inputs.length === 0) return false;
        return inputs.some(input => Boolean(input));
    },
    
    /**
     * NOT Gate - Inverts single input
     * Truth table: 0->1, 1->0
     */
    NOT: function(inputs) {
        if (inputs.length === 0) return true;
        return !Boolean(inputs[0]);
    },
    
    /**
     * NAND Gate - NOT AND
     * Truth table: 00->1, 01->1, 10->1, 11->0
     */
    NAND: function(inputs) {
        return !this.AND(inputs);
    },
    
    /**
     * NOR Gate - NOT OR
     * Truth table: 00->1, 01->0, 10->0, 11->0
     */
    NOR: function(inputs) {
        return !this.OR(inputs);
    },
    
    /**
     * XOR Gate - Exclusive OR (odd parity)
     * Truth table: 00->0, 01->1, 10->1, 11->0
     */
    XOR: function(inputs) {
        if (inputs.length === 0) return false;
        let result = Boolean(inputs[0]);
        for (let i = 1; i < inputs.length; i++) {
            result = result !== Boolean(inputs[i]);
        }
        return result;
    },
    
    /**
     * XNOR Gate - Exclusive NOR (even parity)
     * Truth table: 00->1, 01->0, 10->0, 11->1
     */
    XNOR: function(inputs) {
        return !this.XOR(inputs);
    },
    
    /**
     * IMPLY Gate - Material implication (A → B)
     * Truth table: 00->1, 01->1, 10->0, 11->1
     */
    IMPLY: function(inputs) {
        if (inputs.length < 2) return true;
        return !Boolean(inputs[0]) || Boolean(inputs[1]);
    },
    
    /**
     * NIMPLY Gate - NOT IMPLY
     * Truth table: 00->0, 01->0, 10->1, 11->0
     */
    NIMPLY: function(inputs) {
        if (inputs.length < 2) return false;
        return Boolean(inputs[0]) && !Boolean(inputs[1]);
    }
};

// ============================================================================
// Threshold Gates
// ============================================================================

/**
 * Threshold and majority gates
 */
const ThresholdGates = {
    /**
     * MAJORITY Gate - True if more than half inputs are true
     */
    MAJORITY: function(inputs) {
        if (inputs.length === 0) return false;
        const trueCount = inputs.filter(input => Boolean(input)).length;
        return trueCount > inputs.length / 2;
    },
    
    /**
     * MINORITY Gate - True if less than half inputs are true
     */
    MINORITY: function(inputs) {
        if (inputs.length === 0) return false;
        const trueCount = inputs.filter(input => Boolean(input)).length;
        return trueCount < inputs.length / 2;
    },
    
    /**
     * THRESHOLD-K Gate - True if at least K inputs are true
     */
    THRESHOLD: function(inputs, k = 1) {
        if (inputs.length === 0) return false;
        const trueCount = inputs.filter(input => Boolean(input)).length;
        return trueCount >= k;
    },
    
    /**
     * EXACTLY-K Gate - True if exactly K inputs are true
     */
    EXACTLY: function(inputs, k = 1) {
        if (inputs.length === 0) return k === 0;
        const trueCount = inputs.filter(input => Boolean(input)).length;
        return trueCount === k;
    },
    
    /**
     * AT-MOST-K Gate - True if at most K inputs are true
     */
    AT_MOST: function(inputs, k = 1) {
        if (inputs.length === 0) return true;
        const trueCount = inputs.filter(input => Boolean(input)).length;
        return trueCount <= k;
    }
};

// ============================================================================
// Multi-Valued Logic Gates (Ternary, Quaternary, etc.)
// ============================================================================

/**
 * Multi-valued logic operations
 * Values: 0 (False), 1 (Unknown/Maybe), 2 (True)
 * Can be extended to quaternary (0,1,2,3) and beyond
 */
const MultiValuedGates = {
    /**
     * Łukasiewicz Logic Operations
     */
    LUKASIEWICZ: {
        // Strong conjunction: min(a, b)
        AND: function(inputs) {
            if (inputs.length === 0) return 0;
            return Math.min(...inputs);
        },
        
        // Strong disjunction: max(a, b)
        OR: function(inputs) {
            if (inputs.length === 0) return 0;
            return Math.max(...inputs);
        },
        
        // Negation: max_val - x
        NOT: function(input, maxVal = 2) {
            return maxVal - input;
        },
        
        // Implication: min(1, 1 - a + b)
        IMPLY: function(a, b, maxVal = 2) {
            return Math.min(maxVal, maxVal - a + b);
        }
    },
    
    /**
     * Post Algebra Operations (for n-valued logic)
     */
    POST: {
        // Cyclic negation: (x + 1) mod n
        CYCLIC_NOT: function(input, n = 3) {
            return (input + 1) % n;
        },
        
        // Min operation
        MIN: function(inputs) {
            if (inputs.length === 0) return 0;
            return Math.min(...inputs);
        },
        
        // Max operation
        MAX: function(inputs) {
            if (inputs.length === 0) return 0;
            return Math.max(...inputs);
        }
    },
    
    /**
     * Ternary specific operations
     * 0: False, 1: Unknown, 2: True
     */
    TERNARY: {
        // Kleene strong conjunction
        AND: function(a, b) {
            if (a === 0 || b === 0) return 0;
            if (a === 2 && b === 2) return 2;
            return 1;
        },
        
        // Kleene strong disjunction
        OR: function(a, b) {
            if (a === 2 || b === 2) return 2;
            if (a === 0 && b === 0) return 0;
            return 1;
        },
        
        // Kleene negation
        NOT: function(x) {
            return 2 - x;
        },
        
        // Consensus operator: returns value if both agree, else unknown
        CONSENSUS: function(a, b) {
            return a === b ? a : 1;
        }
    },
    
    /**
     * Quaternary logic operations
     * 0: False, 1: Weakly False, 2: Weakly True, 3: True
     */
    QUATERNARY: {
        AND: function(inputs) {
            if (inputs.length === 0) return 0;
            return Math.min(...inputs);
        },
        
        OR: function(inputs) {
            if (inputs.length === 0) return 0;
            return Math.max(...inputs);
        },
        
        NOT: function(x) {
            return 3 - x;
        },
        
        // Averaging operator
        AVERAGE: function(inputs) {
            if (inputs.length === 0) return 0;
            const sum = inputs.reduce((a, b) => a + b, 0);
            return Math.round(sum / inputs.length);
        }
    }
};

// ============================================================================
// Special Purpose Gates
// ============================================================================

/**
 * Special logic operations for specific use cases
 */
const SpecialGates = {
    /**
     * MUX - Multiplexer (selector)
     * First input is selector, remaining are data inputs
     */
    MUX: function(inputs) {
        if (inputs.length < 2) return false;
        const selector = Math.floor(inputs[0]);
        const dataIndex = selector + 1;
        return dataIndex < inputs.length ? Boolean(inputs[dataIndex]) : false;
    },
    
    /**
     * DEMUX - Demultiplexer
     * Returns array with selected output active
     */
    DEMUX: function(selector, data, outputCount = 2) {
        const outputs = new Array(outputCount).fill(false);
        const index = Math.floor(selector) % outputCount;
        outputs[index] = data;
        return outputs;
    },
    
    /**
     * ENCODER - Binary encoder
     * Converts one-hot to binary
     */
    ENCODER: function(inputs) {
        for (let i = 0; i < inputs.length; i++) {
            if (Boolean(inputs[i])) return i;
        }
        return 0;
    },
    
    /**
     * DECODER - Binary decoder
     * Converts binary to one-hot
     */
    DECODER: function(value, outputCount = 4) {
        const outputs = new Array(outputCount).fill(false);
        const index = Math.floor(value) % outputCount;
        outputs[index] = true;
        return outputs;
    },
    
    /**
     * PARITY - Even parity generator
     */
    PARITY: function(inputs) {
        const trueCount = inputs.filter(input => Boolean(input)).length;
        return trueCount % 2 === 0;
    },
    
    /**
     * COMPARATOR - Magnitude comparator
     * Returns: -1 (A<B), 0 (A=B), 1 (A>B)
     */
    COMPARATOR: function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
};

// ============================================================================
// Gate Evaluation Engine
// ============================================================================

/**
 * Main gate evaluator that integrates with AdvancedNode
 */
class GateEvaluator {
    constructor() {
        this.gates = {
            // Boolean gates
            'and': LogicGates.AND,
            'or': LogicGates.OR,
            'not': LogicGates.NOT,
            'nand': LogicGates.NAND,
            'nor': LogicGates.NOR,
            'xor': LogicGates.XOR,
            'xnor': LogicGates.XNOR,
            'imply': LogicGates.IMPLY,
            'nimply': LogicGates.NIMPLY,
            
            // Threshold gates
            'majority': ThresholdGates.MAJORITY,
            'minority': ThresholdGates.MINORITY,
            'threshold': ThresholdGates.THRESHOLD,
            'exactly': ThresholdGates.EXACTLY,
            'at_most': ThresholdGates.AT_MOST,
            
            // Multi-valued gates
            'lukasiewicz_and': MultiValuedGates.LUKASIEWICZ.AND,
            'lukasiewicz_or': MultiValuedGates.LUKASIEWICZ.OR,
            'lukasiewicz_not': MultiValuedGates.LUKASIEWICZ.NOT,
            'ternary_and': MultiValuedGates.TERNARY.AND,
            'ternary_or': MultiValuedGates.TERNARY.OR,
            'ternary_not': MultiValuedGates.TERNARY.NOT,
            'consensus': MultiValuedGates.TERNARY.CONSENSUS,
            
            // Special gates
            'mux': SpecialGates.MUX,
            'encoder': SpecialGates.ENCODER,
            'parity': SpecialGates.PARITY,
            'comparator': SpecialGates.COMPARATOR
        };
    }
    
    /**
     * Evaluate a gate given its type and inputs
     */
    evaluate(gateType, inputs, params = {}) {
        const gate = this.gates[gateType.toLowerCase()];
        
        if (!gate) {
            throw new Error(`Unknown gate type: ${gateType}`);
        }
        
        // Handle gates with additional parameters
        if (gateType.toLowerCase() === 'threshold') {
            return gate(inputs, params.k || 1);
        } else if (gateType.toLowerCase() === 'exactly') {
            return gate(inputs, params.k || 1);
        } else if (gateType.toLowerCase() === 'at_most') {
            return gate(inputs, params.k || 1);
        }
        
        return gate(inputs);
    }
    
    /**
     * Evaluate with value normalization
     */
    evaluateNormalized(gateType, inputs, params = {}) {
        // Normalize inputs to [0,1] range
        const normalizedInputs = inputs.map(input => {
            if (typeof input === 'boolean') return input ? 1 : 0;
            return Math.max(0, Math.min(1, Number(input)));
        });
        
        const result = this.evaluate(gateType, normalizedInputs, params);
        
        // Return normalized result
        if (typeof result === 'boolean') return result ? 1 : 0;
        return result;
    }
    
    /**
     * Create a custom gate from a truth table
     */
    createCustomGate(truthTable) {
        return function(inputs) {
            // Convert inputs to binary string key
            const key = inputs.map(i => Boolean(i) ? '1' : '0').join('');
            return truthTable[key] || false;
        };
    }
    
    /**
     * Generate truth table for a gate
     */
    generateTruthTable(gateType, inputCount = 2) {
        const truthTable = {};
        const combinations = Math.pow(2, inputCount);
        
        for (let i = 0; i < combinations; i++) {
            const inputs = [];
            for (let j = 0; j < inputCount; j++) {
                inputs.push(Boolean(i & (1 << j)));
            }
            const key = inputs.map(b => b ? '1' : '0').join('');
            truthTable[key] = this.evaluate(gateType, inputs);
        }
        
        return truthTable;
    }
    
    /**
     * Validate gate configuration
     */
    validateGate(gateType, inputCount) {
        const minInputs = {
            'not': 1,
            'imply': 2,
            'nimply': 2,
            'comparator': 2
        };
        
        const min = minInputs[gateType.toLowerCase()] || 1;
        
        if (inputCount < min) {
            throw new Error(`${gateType} requires at least ${min} input(s)`);
        }
        
        return true;
    }
}

// ============================================================================
// Integration with AdvancedNode
// ============================================================================

/**
 * Extend AdvancedNode prototype to use gate evaluator
 */
if (typeof AdvancedNode !== 'undefined') {
    const evaluator = new GateEvaluator();
    
    // Override the evaluateLogicGate method
    AdvancedNode.prototype.evaluateLogicGate = function(inputs) {
        try {
            // Validate gate configuration
            evaluator.validateGate(this.logicType, inputs.length);
            
            // Use custom truth table if provided
            if (this.truthTable) {
                const customGate = evaluator.createCustomGate(this.truthTable);
                return customGate(inputs);
            }
            
            // Evaluate using built-in gate
            return evaluator.evaluateNormalized(
                this.logicType, 
                inputs,
                {
                    k: this.metadata.threshold || 1,
                    maxVal: this.metadata.maxValue || 2
                }
            );
        } catch (error) {
            console.error(`Gate evaluation error: ${error.message}`);
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
        LogicGates,
        ThresholdGates,
        MultiValuedGates,
        SpecialGates,
        GateEvaluator
    };
}
