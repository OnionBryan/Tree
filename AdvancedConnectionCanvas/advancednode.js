class AdvancedNode {
    constructor(config = {}) {
        // Identity
        this.id = config.id || generateUUID();
        this.name = config.name || `Node_${this.id.substr(0, 8)}`;
        this.layer = config.layer || 0;
        this.position = config.position || { x: 0, y: 0 };

        // Node Type Configuration
        this.nodeType = config.nodeType || 'decision';
        // Options: 'decision', 'logic_gate', 'fuzzy_gate',
        //          'probabilistic', 'multi_valued', 'hybrid', 'statistical'

        // Logic Configuration
        this.logicType = config.logicType || 'threshold';
        // Options: 'threshold', 'and', 'or', 'nand', 'nor',
        //          'xor', 'xnor', 'majority', 'threshold_k',
        //          'fuzzy_min', 'fuzzy_max', 'fuzzy_product',
        //          'ternary', 'quaternary', 'custom'

        // Branching Configuration
        this.branchCount = config.branchCount || 2;
        this.branches = new Array(this.branchCount).fill(null);
        this.branchLabels = config.branchLabels || this.generateDefaultLabels(this.branchCount);
        this.branchConditions = config.branchConditions || [];

        // Advanced Features
        this.truthTable = config.truthTable || null;
        this.fuzzyMembership = config.fuzzyMembership || null;
        this.probabilityDistribution = config.probabilityDistribution || null;
        this.customLogicFunction = config.customLogicFunction || null;

        // Connections (Graph Structure)
        this.inputs = [];  // Array of input edge IDs
        this.outputs = []; // Array of output edge IDs
        this.parents = []; // Array of parent node IDs
        this.children = []; // Array of child node IDs

        // Scoring and Evaluation
        this.scoringFunction = config.scoringFunction || 'linear';
        // Options: 'linear', 'tanh', 'sigmoid', 'relu', 'custom'
        this.weights = config.weights || [];
        this.thresholds = config.thresholds || [];
        this.bias = config.bias || 0;

        // State Management
        this.state = {
            value: null,
            active: false,
            visited: false,
            locked: false,
            error: null
        };

        // Metadata
        this.metadata = config.metadata || {};
        this.tags = config.tags || [];
        this.description = config.description || '';

        // Visual Properties
        this.visual = {
            shape: this.determineShape(),
            color: config.color || this.determineColor(),
            size: config.size || { width: 150, height: 80 },
            icon: config.icon || this.determineIcon(),
            style: config.style || 'default'
        };
    }

    /**
     * Generate default branch labels based on count
     */
    generateDefaultLabels(count) {
        switch(count) {
            case 2: return ['False', 'True'];
            case 3: return ['Low', 'Medium', 'High'];
            case 4: return ['Very Low', 'Low', 'High', 'Very High'];
            default:
                return Array.from({length: count}, (_, i) => `Branch ${i + 1}`);
        }
    }

    /**
     * Determine node shape based on type
     */
    determineShape() {
        const shapeMap = {
            'decision': 'rectangle',
            'logic_gate': 'trapezoid',
            'fuzzy_gate': 'ellipse',
            'probabilistic': 'diamond',
            'multi_valued': 'hexagon',
            'statistical': 'octagon'
        };
        return shapeMap[this.nodeType] || 'rectangle';
    }

    /**
     * Determine node color based on type
     */
    determineColor() {
        const colorMap = {
            'decision': '#4A90E2',
            'logic_gate': '#FFD700',
            'fuzzy_gate': '#9B59B6',
            'probabilistic': '#E74C3C',
            'multi_valued': '#2ECC71',
            'statistical': '#F39C12'
        };
        return colorMap[this.nodeType] || '#95A5A6';
    }

    /**
     * Determine node icon based on logic type
     */
    determineIcon() {
        const iconMap = {
            'and': '∧',
            'or': '∨',
            'nand': '⊼',
            'nor': '⊽',
            'xor': '⊕',
            'xnor': '⊙',
            'not': '¬',
            'majority': 'M',
            'fuzzy_min': 'MIN',
            'fuzzy_max': 'MAX',
            'threshold': 'θ'
        };
        return iconMap[this.logicType] || '';
    }

    /**
     * Evaluate the node based on inputs and logic type
     */
    evaluate(inputs = []) {
        switch(this.nodeType) {
            case 'logic_gate':
                return this.evaluateLogicGate(inputs);
            case 'fuzzy_gate':
                return this.evaluateFuzzyGate(inputs);
            case 'probabilistic':
                return this.evaluateProbabilistic(inputs);
            case 'multi_valued':
                return this.evaluateMultiValued(inputs);
            case 'decision':
            default:
                return this.evaluateDecision(inputs);
        }
    }

    /**
     * Evaluate as logic gate
     */
    evaluateLogicGate(inputs) {
        // Use the GateEvaluator from logic_gates.js
        if (typeof GateEvaluator !== 'undefined') {
            const evaluator = new GateEvaluator();
            try {
                evaluator.validateGate(this.logicType, inputs.length);

                if (this.truthTable) {
                    const customGate = evaluator.createCustomGate(this.truthTable);
                    return customGate(inputs) ? 1 : 0;
                }

                const result = evaluator.evaluate(this.logicType, inputs, {
                    k: this.thresholdK || 1
                });
                return typeof result === 'boolean' ? (result ? 1 : 0) : result;
            } catch (error) {
                console.error('Logic gate evaluation error:', error);
                return 0;
            }
        }
        return 0;
    }

    /**
     * Evaluate as fuzzy gate
     */
    evaluateFuzzyGate(inputs) {
        // Use fuzzy logic implementations
        switch(this.logicType) {
            case 'fuzzy_min':
                return Math.min(...inputs);
            case 'fuzzy_max':
                return Math.max(...inputs);
            case 'fuzzy_product':
                return inputs.reduce((a, b) => a * b, 1);
            case 'fuzzy_sum':
                let sum = inputs[0] || 0;
                for (let i = 1; i < inputs.length; i++) {
                    sum = sum + inputs[i] - sum * inputs[i];
                }
                return sum;
            case 'fuzzy_lukasiewicz_and':
                return Math.max(0, inputs.reduce((a, b) => a + b, 0) - inputs.length + 1);
            case 'fuzzy_lukasiewicz_or':
                return Math.min(1, inputs.reduce((a, b) => a + b, 0));
            case 'fuzzy_average':
                return inputs.reduce((a, b) => a + b, 0) / inputs.length;
            case 'fuzzy_geometric':
                return Math.pow(inputs.reduce((a, b) => a * b, 1), 1 / inputs.length);
            case 'fuzzy_weighted_average':
                // Use weights if available
                const weights = this.fuzzyWeights || new Array(inputs.length).fill(1);
                let sum = 0;
                let weightSum = 0;
                for (let i = 0; i < inputs.length; i++) {
                    sum += inputs[i] * weights[i];
                    weightSum += weights[i];
                }
                return weightSum === 0 ? 0 : sum / weightSum;
            default:
                return inputs[0] || 0;
        }
    }

    /**
     * Evaluate as probabilistic node
     */
    evaluateProbabilistic(inputs) {
        if (!this.probabilityDistribution) return 0;

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < this.probabilityDistribution.length; i++) {
            cumulative += this.probabilityDistribution[i];
            if (random <= cumulative) {
                return i;
            }
        }
        return this.probabilityDistribution.length - 1;
    }

    /**
     * Evaluate as multi-valued logic
     */
    evaluateMultiValued(inputs) {
        // Implementation will be added for ternary/quaternary logic
        return 0;
    }

    /**
     * Evaluate as decision node
     */
    evaluateDecision(inputs) {
        if (this.customLogicFunction) {
            return this.customLogicFunction(inputs);
        }

        // Default threshold-based evaluation
        const sum = inputs.reduce((acc, val) => acc + val, 0);
        const average = inputs.length > 0 ? sum / inputs.length : 0;

        // Apply scoring function
        let score = average;
        switch(this.scoringFunction) {
            case 'tanh':
                score = Math.tanh(score);
                break;
            case 'sigmoid':
                score = 1 / (1 + Math.exp(-score));
                break;
            case 'relu':
                score = Math.max(0, score);
                break;
        }

        // Find appropriate branch based on thresholds
        for (let i = 0; i < this.thresholds.length; i++) {
            if (score < this.thresholds[i]) {
                return i;
            }
        }
        return this.thresholds.length;
    }

    /**
     * Add an input connection
     */
    addInput(edgeId, parentNodeId) {
        if (!this.inputs.includes(edgeId)) {
            this.inputs.push(edgeId);
        }
        if (!this.parents.includes(parentNodeId)) {
            this.parents.push(parentNodeId);
        }
    }

    /**
     * Add an output connection
     */
    addOutput(edgeId, childNodeId) {
        if (!this.outputs.includes(edgeId)) {
            this.outputs.push(edgeId);
        }
        if (!this.children.includes(childNodeId)) {
            this.children.push(childNodeId);
        }
    }

    /**
     * Clone the node
     */
    clone() {
        return new AdvancedNode({
            ...this,
            id: generateUUID(),
            name: `${this.name}_copy`,
            inputs: [],
            outputs: [],
            parents: [],
            children: []
        });
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            layer: this.layer,
            position: this.position,
            nodeType: this.nodeType,
            logicType: this.logicType,
            branchCount: this.branchCount,
            branchLabels: this.branchLabels,
            branchConditions: this.branchConditions,
            truthTable: this.truthTable,
            fuzzyMembership: this.fuzzyMembership,
            probabilityDistribution: this.probabilityDistribution,
            scoringFunction: this.scoringFunction,
            weights: this.weights,
            thresholds: this.thresholds,
            bias: this.bias,
            metadata: this.metadata,
            visual: this.visual
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new AdvancedNode(json);
    }
}

/**
 * Edge - Connection between nodes with logic properties
 */
class Edge {
    constructor(source, target, config = {}) {
        // Identity
        this.id = config.id || generateUUID();
        this.source = source; // Source node ID
        this.target = target; // Target node ID
        this.sourcePort = config.sourcePort || 0; // Which output branch
        this.targetPort = config.targetPort || 0; // Which input port

        // Edge Properties
        this.weight = config.weight || 1.0;
        this.condition = config.condition || 'always';
        this.label = config.label || '';
        this.bidirectional = config.bidirectional || false;

        // Logic Properties
        this.operator = config.operator || 'direct';
        // Options: 'direct', 'negate', 'amplify', 'dampen', 'delay'
        this.transform = config.transform || null;
        this.delay = config.delay || 0;

        // Visual Properties
        this.visual = {
            style: config.style || 'solid',
            // Options: 'solid', 'dashed', 'dotted', 'double', 'wavy'
            color: config.color || '#666666',
            width: config.width || 2,
            animated: config.animated || false,
            curvature: config.curvature || 0.3
        };

        // State
        this.state = {
            active: false,
            value: null,
            flow: 0,
            error: null
        };

        // Metadata
        this.metadata = config.metadata || {};
        this.tags = config.tags || [];
    }

    /**
     * Evaluate edge transformation
     */
    evaluate(inputValue) {
        let value = inputValue * this.weight;

        switch(this.operator) {
            case 'negate':
                value = -value;
                break;
            case 'amplify':
                value = value * 2;
                break;
            case 'dampen':
                value = value * 0.5;
                break;
            case 'delay':
                // Delay logic would be handled by the graph executor
                break;
        }

        if (this.transform) {
            value = this.transform(value);
        }

        this.state.value = value;
        this.state.flow = Math.abs(value);

        return value;
    }

    /**
     * Check if condition is met
     */
    checkCondition(context = {}) {
        if (this.condition === 'always') return true;
        if (this.condition === 'never') return false;

        // Custom condition evaluation
        if (typeof this.condition === 'function') {
            return this.condition(context);
        }

        // String-based condition (to be parsed)
        // This would need a proper expression parser
        return true;
    }

    /**
     * Clone the edge
     */
    clone() {
        return new Edge(this.source, this.target, {
            ...this,
            id: generateUUID()
        });
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            source: this.source,
            target: this.target,
            sourcePort: this.sourcePort,
            targetPort: this.targetPort,
            weight: this.weight,
            condition: this.condition,
            label: this.label,
            operator: this.operator,
            visual: this.visual,
            metadata: this.metadata
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Edge(json.source, json.target, json);
    }
}

/**
 * LogicGraph - Manages the overall graph structure
 */
class LogicGraph {
    constructor(config = {}) {
        this.id = config.id || generateUUID();
        this.name = config.name || 'Logic Graph';
        this.version = config.version || '2.0';

        // Graph structure
        this.nodes = new Map(); // Map of node ID to AdvancedNode
        this.edges = new Map(); // Map of edge ID to Edge
        this.layers = []; // Array of layer arrays containing node IDs

        // Graph properties
        this.type = config.type || 'dag'; // 'dag', 'cyclic', 'hypergraph'
        this.allowCycles = config.allowCycles || false;
        this.maxDepth = config.maxDepth || 100;

        // Execution configuration
        this.executionMode = config.executionMode || 'sequential';
        // Options: 'sequential', 'parallel', 'lazy'
        this.cacheResults = config.cacheResults || true;

        // State
        this.state = {
            executed: false,
            results: new Map(),
            errors: [],
            executionTime: 0
        };

        // Metadata
        this.metadata = config.metadata || {};
        this.created = config.created || new Date().toISOString();
        this.modified = new Date().toISOString();
    }

    /**
     * Add a node to the graph
     */
    addNode(node) {
        if (!(node instanceof AdvancedNode)) {
            node = new AdvancedNode(node);
        }

        this.nodes.set(node.id, node);

        // Update layers
        while (this.layers.length <= node.layer) {
            this.layers.push([]);
        }
        if (!this.layers[node.layer].includes(node.id)) {
            this.layers[node.layer].push(node.id);
        }

        this.modified = new Date().toISOString();
        return node;
    }

    /**
     * Add an edge to the graph
     */
    addEdge(source, target, config = {}) {
        const edge = new Edge(source, target, config);
        this.edges.set(edge.id, edge);

        // Update node connections
        const sourceNode = this.nodes.get(source);
        const targetNode = this.nodes.get(target);

        if (sourceNode && targetNode) {
            sourceNode.addOutput(edge.id, target);
            targetNode.addInput(edge.id, source);
        }

        // Check for cycles if not allowed
        if (!this.allowCycles && this.detectCycle()) {
            this.edges.delete(edge.id);
            if (sourceNode) {
                sourceNode.outputs = sourceNode.outputs.filter(id => id !== edge.id);
                sourceNode.children = sourceNode.children.filter(id => id !== target);
            }
            if (targetNode) {
                targetNode.inputs = targetNode.inputs.filter(id => id !== edge.id);
                targetNode.parents = targetNode.parents.filter(id => id !== source);
            }
            throw new Error('Adding this edge would create a cycle');
        }

        this.modified = new Date().toISOString();
        return edge;
    }

    /**
     * Remove a node from the graph
     */
    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return false;

        // Remove all connected edges
        [...node.inputs, ...node.outputs].forEach(edgeId => {
            this.removeEdge(edgeId);
        });

        // Remove from layers
        if (this.layers[node.layer]) {
            this.layers[node.layer] = this.layers[node.layer].filter(id => id !== nodeId);
        }

        this.nodes.delete(nodeId);
        this.modified = new Date().toISOString();
        return true;
    }

    /**
     * Remove an edge from the graph
     */
    removeEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (!edge) return false;

        // Update node connections
        const sourceNode = this.nodes.get(edge.source);
        const targetNode = this.nodes.get(edge.target);

        if (sourceNode) {
            sourceNode.outputs = sourceNode.outputs.filter(id => id !== edgeId);
            sourceNode.children = sourceNode.children.filter(id => id !== edge.target);
        }

        if (targetNode) {
            targetNode.inputs = targetNode.inputs.filter(id => id !== edgeId);
            targetNode.parents = targetNode.parents.filter(id => id !== edge.source);
        }

        this.edges.delete(edgeId);
        this.modified = new Date().toISOString();
        return true;
    }

    /**
     * Detect if adding an edge would create a cycle
     */
    detectCycle() {
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycleDFS = (nodeId) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const node = this.nodes.get(nodeId);
            if (node) {
                for (const childId of node.children) {
                    if (!visited.has(childId)) {
                        if (hasCycleDFS(childId)) return true;
                    } else if (recursionStack.has(childId)) {
                        return true;
                    }
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const [nodeId] of this.nodes) {
            if (!visited.has(nodeId)) {
                if (hasCycleDFS(nodeId)) return true;
            }
        }

        return false;
    }

    /**
     * Topological sort for DAG execution
     */
    topologicalSort() {
        const visited = new Set();
        const stack = [];

        const topSortDFS = (nodeId) => {
            visited.add(nodeId);
            const node = this.nodes.get(nodeId);

            if (node) {
                for (const childId of node.children) {
                    if (!visited.has(childId)) {
                        topSortDFS(childId);
                    }
                }
            }

            stack.push(nodeId);
        };

        for (const [nodeId] of this.nodes) {
            if (!visited.has(nodeId) && this.nodes.get(nodeId).parents.length === 0) {
                topSortDFS(nodeId);
            }
        }

        return stack.reverse();
    }

    /**
     * Execute the graph
     */
    execute(inputs = {}) {
        const startTime = performance.now();
        this.state.errors = [];
        this.state.results.clear();

        try {
            // Get execution order
            const executionOrder = this.allowCycles ?
                [...this.nodes.keys()] :
                this.topologicalSort();

            // Execute nodes in order
            for (const nodeId of executionOrder) {
                const node = this.nodes.get(nodeId);
                if (!node) continue;

                // Gather inputs
                const nodeInputs = [];
                for (const edgeId of node.inputs) {
                    const edge = this.edges.get(edgeId);
                    if (edge && edge.checkCondition(this.state)) {
                        const sourceResult = this.state.results.get(edge.source) ||
                                           inputs[edge.source] ||
                                           0;
                        nodeInputs.push(edge.evaluate(sourceResult));
                    }
                }

                // Execute node
                try {
                    const result = node.evaluate(nodeInputs);
                    this.state.results.set(nodeId, result);
                    node.state.value = result;
                    node.state.active = true;
                } catch (error) {
                    this.state.errors.push({
                        nodeId,
                        error: error.message
                    });
                    node.state.error = error.message;
                }
            }

            this.state.executed = true;
        } catch (error) {
            this.state.errors.push({
                graph: true,
                error: error.message
            });
        }

        this.state.executionTime = performance.now() - startTime;
        return this.state.results;
    }

    /**
     * Clear execution state
     */
    clearState() {
        this.state.executed = false;
        this.state.results.clear();
        this.state.errors = [];

        for (const [, node] of this.nodes) {
            node.state = {
                value: null,
                active: false,
                visited: false,
                locked: false,
                error: null
            };
        }

        for (const [, edge] of this.edges) {
            edge.state = {
                active: false,
                value: null,
                flow: 0,
                error: null
            };
        }
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            type: this.type,
            nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
            edges: Array.from(this.edges.values()).map(e => e.toJSON()),
            metadata: this.metadata,
            created: this.created,
            modified: this.modified
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        const graph = new LogicGraph({
            id: json.id,
            name: json.name,
            version: json.version,
            type: json.type,
            metadata: json.metadata,
            created: json.created
        });

        // Add nodes
        for (const nodeData of json.nodes) {
            graph.addNode(AdvancedNode.fromJSON(nodeData));
        }

        // Add edges
        for (const edgeData of json.edges) {
            graph.edges.set(
                edgeData.id,
                Edge.fromJSON(edgeData)
            );
        }

        return graph;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedNode,
        Edge,
        LogicGraph,
        generateUUID
    };
}

        // From fuzzy_logic.js
        /**
 * Fuzzy Logic Implementation
 * Zadeh Operations, T-norms, S-norms, and Fuzzy Inference
 * Version: 2.0
 *
 * This module implements fuzzy logic operations for the advanced tree logic system,
 * including membership functions, fuzzy operators, and inference engines.
 */

// ============================================================================
// Membership Functions
// ============================================================================

/**
 * Standard fuzzy membership functions
 */
const MembershipFunctions = {
    /**
     * Triangular membership function
     * Parameters: [left, peak, right]
     */
    triangular: function(x, params) {
        const [a, b, c] = params;
        if (x <= a || x >= c) return 0;
        if (x === b) return 1;
        if (x < b) return (x - a) / (b - a);
        return (c - x) / (c - b);
    },

    /**
     * Trapezoidal membership function
     * Parameters: [left, leftPeak, rightPeak, right]
     */
    trapezoidal: function(x, params) {
        const [a, b, c, d] = params;
        if (x <= a || x >= d) return 0;
        if (x >= b && x <= c) return 1;
        if (x < b) return (x - a) / (b - a);
        return (d - x) / (d - c);
    },

    /**
     * Gaussian membership function
     * Parameters: [mean, standardDeviation]
     */
    gaussian: function(x, params) {
        const [mean, sigma] = params;
        return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
    },

    /**
     * Bell-shaped membership function
     * Parameters: [width, slope, center]
     */
    bell: function(x, params) {
        const [a, b, c] = params;
        return 1 / (1 + Math.pow(Math.abs((x - c) / a), 2 * b));
    },

    /**
     * Sigmoid membership function
     * Parameters: [slope, inflectionPoint]
     */
    sigmoid: function(x, params) {
        const [a, c] = params;
        return 1 / (1 + Math.exp(-a * (x - c)));
    },

    /**
     * S-curve membership function
     * Parameters: [start, end]
     */
    sCurve: function(x, params) {
        const [a, b] = params;
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
    zCurve: function(x, params) {
        return 1 - this.sCurve(x, params);
    },

    /**
     * Pi-shaped membership function
     * Parameters: [leftFoot, leftShoulder, rightShoulder, rightFoot]
     */
    piShaped: function(x, params) {
        const [a, b, c, d] = params;
        if (x <= a || x >= d) return 0;
        if (x >= b && x <= c) return 1;
        if (x < b) return this.sCurve(x, [a, b]);
        return this.zCurve(x, [c, d]);
    },

    /**
     * Custom piecewise linear function
     * Parameters: array of [x, y] points
     */
    piecewiseLinear: function(x, points) {
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
    MIN: function(a, b) {
        return Math.min(a, b);
    },

    /**
     * Algebraic Product (Probabilistic AND)
     */
    PRODUCT: function(a, b) {
        return a * b;
    },

    /**
     * Łukasiewicz t-norm (Bounded difference)
     */
    LUKASIEWICZ: function(a, b) {
        return Math.max(0, a + b - 1);
    },

    /**
     * Drastic Product
     */
    DRASTIC: function(a, b) {
        if (a === 1) return b;
        if (b === 1) return a;
        return 0;
    },

    /**
     * Hamacher Product
     * Parameter γ ≥ 0
     */
    HAMACHER: function(a, b, gamma = 0) {
        if (gamma === 0) return this.PRODUCT(a, b);
        const denominator = gamma + (1 - gamma) * (a + b - a * b);
        return denominator === 0 ? 0 : (a * b) / denominator;
    },

    /**
     * Einstein Product
     */
    EINSTEIN: function(a, b) {
        return (a * b) / (2 - (a + b - a * b));
    },

    /**
     * Nilpotent Minimum
     */
    NILPOTENT: function(a, b) {
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
    MAX: function(a, b) {
        return Math.max(a, b);
    },

    /**
     * Probabilistic Sum (Algebraic Sum)
     */
    PROBABILISTIC: function(a, b) {
        return a + b - a * b;
    },

    /**
     * Łukasiewicz s-norm (Bounded sum)
     */
    LUKASIEWICZ: function(a, b) {
        return Math.min(1, a + b);
    },

    /**
     * Drastic Sum
     */
    DRASTIC: function(a, b) {
        if (a === 0) return b;
        if (b === 0) return a;
        return 1;
    },

    /**
     * Hamacher Sum
     * Parameter γ ≥ 0
     */
    HAMACHER: function(a, b, gamma = 0) {
        if (gamma === 0) return this.PROBABILISTIC(a, b);
        const numerator = a + b - (2 - gamma) * a * b;
        const denominator = 1 - (1 - gamma) * a * b;
        return denominator === 0 ? 0 : numerator / denominator;
    },

    /**
     * Einstein Sum
     */
    EINSTEIN: function(a, b) {
        return (a + b) / (1 + a * b);
    },

    /**
     * Nilpotent Maximum
     */
    NILPOTENT: function(a, b) {
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
    STANDARD: function(a) {
        return 1 - a;
    },

    /**
     * Sugeno complement
     * Parameter λ > -1
     */
    SUGENO: function(a, lambda = 0) {
        return (1 - a) / (1 + lambda * a);
    },

    /**
     * Yager complement
     * Parameter w > 0
     */
    YAGER: function(a, w = 1) {
        return Math.pow(1 - Math.pow(a, w), 1/w);
    }
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
    KLEENE_DIENES: function(a, b) {
        return Math.max(1 - a, b);
    },

    /**
     * Łukasiewicz implication
     */
    LUKASIEWICZ: function(a, b) {
        return Math.min(1, 1 - a + b);
    },

    /**
     * Gödel implication
     */
    GODEL: function(a, b) {
        return a <= b ? 1 : b;
    },

    /**
     * Goguen implication (Residuum of product)
     */
    GOGUEN: function(a, b) {
        return a === 0 ? 1 : Math.min(1, b / a);
    },

    /**
     * Mamdani implication (minimum)
     */
    MAMDANI: function(a, b) {
        return Math.min(a, b);
    },

    /**
     * Larsen implication (product)
     */
    LARSEN: function(a, b) {
        return a * b;
    }
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
    WEIGHTED_AVERAGE: function(values, weights) {
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
    OWA: function(values, weights) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => b - a);
        return this.WEIGHTED_AVERAGE(sorted, weights);
    },

    /**
     * Geometric Mean
     */
    GEOMETRIC_MEAN: function(values) {
        if (values.length === 0) return 0;
        const product = values.reduce((a, b) => a * b, 1);
        return Math.pow(product, 1 / values.length);
    },

    /**
     * Harmonic Mean
     */
    HARMONIC_MEAN: function(values) {
        if (values.length === 0) return 0;
        const sumReciprocals = values.reduce((sum, val) => sum + 1/val, 0);
        return values.length / sumReciprocals;
    }
};

// ============================================================================
// Fuzzy Set Operations
// ============================================================================

/**
 * Operations on fuzzy sets
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
     * Union of two fuzzy sets (using MAX)
     */
    union(other, sNorm = SNorms.MAX) {
        const result = new FuzzySet();
        const allElements = new Set([...this.elements.keys(), ...other.elements.keys()]);

        for (const x of allElements) {
            const membership = sNorm(this.getMembership(x), other.getMembership(x));
            result.setMembership(x, membership);
        }

        return result;
    }

    /**
     * Intersection of two fuzzy sets (using MIN)
     */
    intersection(other, tNorm = TNorms.MIN) {
        const result = new FuzzySet();
        const allElements = new Set([...this.elements.keys(), ...other.elements.keys()]);

        for (const x of allElements) {
            const membership = tNorm(this.getMembership(x), other.getMembership(x));
            result.setMembership(x, membership);
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
// Fuzzy Inference System
// ============================================================================

/**
 * Mamdani-style fuzzy inference system
 */
class FuzzyInferenceSystem {
    constructor() {
        this.inputs = {};
        this.outputs = {};
        this.rules = [];
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
     * Rule evaluation - compute firing strength
     */
    evaluateRules(fuzzifiedInputs) {
        const ruleOutputs = [];

        for (const rule of this.rules) {
            // Calculate antecedent activation (using MIN for AND)
            let activation = 1.0;
            for (const [input, term] of Object.entries(rule.antecedent)) {
                if (fuzzifiedInputs[input] && fuzzifiedInputs[input][term] !== undefined) {
                    activation = Math.min(activation, fuzzifiedInputs[input][term]);
                }
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
     * Aggregation - combine rule outputs
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
                // Use MAX for aggregation
                aggregated[variable][term] = Math.max(
                    aggregated[variable][term],
                    output.activation
                );
            }
        }

        return aggregated;
    }

    /**
     * Defuzzification - convert fuzzy outputs to crisp values
     * Using Center of Gravity (COG) method
     */
    defuzzify(aggregatedOutputs) {
        const crispOutputs = {};

        for (const [variable, terms] of Object.entries(aggregatedOutputs)) {
            if (!this.outputs[variable]) continue;

            const range = this.outputs[variable].range;
            const step = (range[1] - range[0]) / 100;
            let numerator = 0;
            let denominator = 0;

            // Sample points across the range
            for (let x = range[0]; x <= range[1]; x += step) {
                let membership = 0;

                // Calculate aggregated membership at this point
                for (const [term, activation] of Object.entries(terms)) {
                    const termMembership = this.outputs[variable].terms[term](x);
                    membership = Math.max(membership, Math.min(activation, termMembership));
                }

                numerator += x * membership;
                denominator += membership;
            }

            crispOutputs[variable] = denominator === 0 ?
                (range[0] + range[1]) / 2 :
                numerator / denominator;
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
        FuzzyGateEvaluator
    };
}

        // From logic_gates.js
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
