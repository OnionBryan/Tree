/**
 * Graph Propagation Engine
 * Version: 1.0
 *
 * Provides multiple propagation strategies for evaluating logic graphs:
 * - Forward propagation (data flows from inputs to outputs)
 * - Backward propagation (goal-seeking from outputs to inputs)
 * - Bidirectional propagation (simultaneous forward and backward)
 * - BFS (Breadth-First Search) propagation
 * - DFS (Depth-First Search) propagation
 * - Topological propagation (dependency-aware ordering)
 * - Parallel propagation (concurrent evaluation of independent nodes)
 * - Lazy propagation (evaluate only when needed)
 * - Eager propagation (evaluate all nodes immediately)
 */

// ============================================================================
// Propagation Strategy Base Class
// ============================================================================

/**
 * Base class for all propagation strategies
 */
class PropagationStrategy {
    constructor(graph) {
        this.graph = graph;
        this.visited = new Set();
        this.results = new Map();
        this.stepHistory = [];
        this.animationDelay = 0;
        this.performanceMetrics = {
            startTime: 0,
            endTime: 0,
            nodesEvaluated: 0,
            edgesTraversed: 0,
            maxDepth: 0
        };
    }

    /**
     * Reset propagation state
     */
    reset() {
        this.visited.clear();
        this.results.clear();
        this.stepHistory = [];
        this.performanceMetrics = {
            startTime: 0,
            endTime: 0,
            nodesEvaluated: 0,
            edgesTraversed: 0,
            maxDepth: 0
        };
    }

    /**
     * Execute propagation (to be implemented by subclasses)
     */
    async propagate(startNodes, inputs) {
        throw new Error('propagate() must be implemented by subclass');
    }

    /**
     * Record a propagation step for animation
     */
    recordStep(nodeId, action, value, metadata = {}) {
        this.stepHistory.push({
            timestamp: Date.now(),
            nodeId: nodeId,
            action: action,
            value: value,
            metadata: metadata
        });
    }

    /**
     * Delay for animation purposes
     */
    async delay() {
        if (this.animationDelay > 0) {
            return new Promise(resolve => setTimeout(resolve, this.animationDelay));
        }
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.performanceMetrics,
            duration: this.performanceMetrics.endTime - this.performanceMetrics.startTime,
            avgTimePerNode: this.performanceMetrics.nodesEvaluated > 0
                ? (this.performanceMetrics.endTime - this.performanceMetrics.startTime) / this.performanceMetrics.nodesEvaluated
                : 0
        };
    }
}

// ============================================================================
// Forward Propagation
// ============================================================================

/**
 * Forward propagation: data flows from inputs to outputs
 */
class ForwardPropagation extends PropagationStrategy {
    async propagate(startNodes, inputs) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        const queue = [...startNodes];
        const nodeInputs = new Map();

        // Initialize start nodes with inputs
        startNodes.forEach((nodeId, idx) => {
            nodeInputs.set(nodeId, inputs[idx] || []);
        });

        while (queue.length > 0) {
            const nodeId = queue.shift();

            if (this.visited.has(nodeId)) continue;
            this.visited.add(nodeId);

            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            // Get inputs for this node
            const nodeInputValues = nodeInputs.get(nodeId) || [];

            // Evaluate node
            this.recordStep(nodeId, 'evaluate', nodeInputValues);
            const result = node.evaluate(nodeInputValues);
            this.results.set(nodeId, result);
            this.performanceMetrics.nodesEvaluated++;

            await this.delay();

            // Propagate to children
            const outgoingEdges = this.graph.getOutgoingEdges(nodeId);
            outgoingEdges.forEach(edge => {
                this.performanceMetrics.edgesTraversed++;

                // Apply edge transformation
                let transformedValue = result;
                if (edge.transform === 'negate') {
                    transformedValue = !transformedValue;
                } else if (edge.transform === 'amplify') {
                    transformedValue = typeof result === 'number' ? result * (edge.weight || 1.5) : result;
                } else if (edge.transform === 'dampen') {
                    transformedValue = typeof result === 'number' ? result * (edge.weight || 0.5) : result;
                }

                // Add to target node inputs
                if (!nodeInputs.has(edge.to)) {
                    nodeInputs.set(edge.to, []);
                }
                nodeInputs.get(edge.to).push(transformedValue);

                // Add to queue if not visited
                if (!this.visited.has(edge.to)) {
                    queue.push(edge.to);
                }
            });
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// Backward Propagation
// ============================================================================

/**
 * Backward propagation: goal-seeking from outputs to inputs
 */
class BackwardPropagation extends PropagationStrategy {
    async propagate(goalNodes, targetValues) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        const queue = [...goalNodes];
        const nodeTargets = new Map();

        // Initialize goal nodes with target values
        goalNodes.forEach((nodeId, idx) => {
            nodeTargets.set(nodeId, targetValues[idx]);
        });

        while (queue.length > 0) {
            const nodeId = queue.shift();

            if (this.visited.has(nodeId)) continue;
            this.visited.add(nodeId);

            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            const targetValue = nodeTargets.get(nodeId);
            this.recordStep(nodeId, 'backward_evaluate', targetValue);
            this.results.set(nodeId, targetValue);
            this.performanceMetrics.nodesEvaluated++;

            await this.delay();

            // Propagate backwards to parents
            const incomingEdges = this.graph.getIncomingEdges(nodeId);
            incomingEdges.forEach(edge => {
                this.performanceMetrics.edgesTraversed++;

                // Reverse edge transformation
                let backpropValue = targetValue;
                if (edge.transform === 'negate') {
                    backpropValue = !backpropValue;
                } else if (edge.transform === 'amplify' && typeof targetValue === 'number') {
                    backpropValue = targetValue / (edge.weight || 1.5);
                } else if (edge.transform === 'dampen' && typeof targetValue === 'number') {
                    backpropValue = targetValue / (edge.weight || 0.5);
                }

                nodeTargets.set(edge.from, backpropValue);

                if (!this.visited.has(edge.from)) {
                    queue.push(edge.from);
                }
            });
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// Bidirectional Propagation
// ============================================================================

/**
 * Bidirectional propagation: simultaneous forward and backward
 */
class BidirectionalPropagation extends PropagationStrategy {
    async propagate(startNodes, inputs, goalNodes, targetValues) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        const forwardStrategy = new ForwardPropagation(this.graph);
        const backwardStrategy = new BackwardPropagation(this.graph);

        forwardStrategy.animationDelay = this.animationDelay;
        backwardStrategy.animationDelay = this.animationDelay;

        // Run both propagations
        const [forwardResults, backwardResults] = await Promise.all([
            forwardStrategy.propagate(startNodes, inputs),
            backwardStrategy.propagate(goalNodes, targetValues)
        ]);

        // Merge results - forward takes precedence for conflicts
        this.results = new Map([...backwardResults, ...forwardResults]);

        // Merge metrics
        this.performanceMetrics.nodesEvaluated =
            forwardStrategy.performanceMetrics.nodesEvaluated +
            backwardStrategy.performanceMetrics.nodesEvaluated;
        this.performanceMetrics.edgesTraversed =
            forwardStrategy.performanceMetrics.edgesTraversed +
            backwardStrategy.performanceMetrics.edgesTraversed;

        this.stepHistory = [...forwardStrategy.stepHistory, ...backwardStrategy.stepHistory]
            .sort((a, b) => a.timestamp - b.timestamp);

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// BFS Propagation
// ============================================================================

/**
 * Breadth-First Search propagation
 */
class BFSPropagation extends PropagationStrategy {
    async propagate(startNodes, inputs) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        const queue = startNodes.map((nodeId, idx) => ({
            nodeId: nodeId,
            inputs: inputs[idx] || [],
            depth: 0
        }));

        let currentDepth = 0;

        while (queue.length > 0) {
            const { nodeId, inputs: nodeInputs, depth } = queue.shift();

            if (this.visited.has(nodeId)) continue;
            this.visited.add(nodeId);

            currentDepth = Math.max(currentDepth, depth);
            this.performanceMetrics.maxDepth = currentDepth;

            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            this.recordStep(nodeId, 'bfs_evaluate', nodeInputs, { depth });
            const result = node.evaluate(nodeInputs);
            this.results.set(nodeId, result);
            this.performanceMetrics.nodesEvaluated++;

            await this.delay();

            // Add children to queue
            const outgoingEdges = this.graph.getOutgoingEdges(nodeId);
            outgoingEdges.forEach(edge => {
                this.performanceMetrics.edgesTraversed++;

                if (!this.visited.has(edge.to)) {
                    queue.push({
                        nodeId: edge.to,
                        inputs: [result],
                        depth: depth + 1
                    });
                }
            });
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// DFS Propagation
// ============================================================================

/**
 * Depth-First Search propagation
 */
class DFSPropagation extends PropagationStrategy {
    async propagate(startNodes, inputs) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        const stack = startNodes.map((nodeId, idx) => ({
            nodeId: nodeId,
            inputs: inputs[idx] || [],
            depth: 0
        })).reverse();

        let maxDepth = 0;

        while (stack.length > 0) {
            const { nodeId, inputs: nodeInputs, depth } = stack.pop();

            if (this.visited.has(nodeId)) continue;
            this.visited.add(nodeId);

            maxDepth = Math.max(maxDepth, depth);
            this.performanceMetrics.maxDepth = maxDepth;

            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            this.recordStep(nodeId, 'dfs_evaluate', nodeInputs, { depth });
            const result = node.evaluate(nodeInputs);
            this.results.set(nodeId, result);
            this.performanceMetrics.nodesEvaluated++;

            await this.delay();

            // Add children to stack (in reverse order for left-to-right traversal)
            const outgoingEdges = this.graph.getOutgoingEdges(nodeId);
            const edgesArray = Array.from(outgoingEdges).reverse();

            edgesArray.forEach(edge => {
                this.performanceMetrics.edgesTraversed++;

                if (!this.visited.has(edge.to)) {
                    stack.push({
                        nodeId: edge.to,
                        inputs: [result],
                        depth: depth + 1
                    });
                }
            });
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// Topological Propagation
// ============================================================================

/**
 * Topological propagation: respects dependency ordering
 */
class TopologicalPropagation extends PropagationStrategy {
    /**
     * Perform topological sort using Kahn's algorithm
     */
    topologicalSort() {
        const inDegree = new Map();
        const allNodes = this.graph.getAllNodes();

        // Initialize in-degree
        allNodes.forEach(node => {
            inDegree.set(node.id, 0);
        });

        // Calculate in-degree
        allNodes.forEach(node => {
            const outgoing = this.graph.getOutgoingEdges(node.id);
            outgoing.forEach(edge => {
                inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
            });
        });

        // Queue nodes with no dependencies
        const queue = [];
        inDegree.forEach((degree, nodeId) => {
            if (degree === 0) {
                queue.push(nodeId);
            }
        });

        const sorted = [];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            sorted.push(nodeId);

            const outgoing = this.graph.getOutgoingEdges(nodeId);
            outgoing.forEach(edge => {
                const newDegree = inDegree.get(edge.to) - 1;
                inDegree.set(edge.to, newDegree);

                if (newDegree === 0) {
                    queue.push(edge.to);
                }
            });
        }

        // Check for cycles
        if (sorted.length !== allNodes.length) {
            throw new Error('Graph contains cycles - topological sort not possible');
        }

        return sorted;
    }

    async propagate(startNodes, inputs) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        // Get topologically sorted order
        const sortedNodes = this.topologicalSort();

        // Initialize inputs
        const nodeInputs = new Map();
        startNodes.forEach((nodeId, idx) => {
            nodeInputs.set(nodeId, inputs[idx] || []);
        });

        // Evaluate in topological order
        for (const nodeId of sortedNodes) {
            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            const inputValues = nodeInputs.get(nodeId) || [];

            this.recordStep(nodeId, 'topological_evaluate', inputValues);
            const result = node.evaluate(inputValues);
            this.results.set(nodeId, result);
            this.performanceMetrics.nodesEvaluated++;

            await this.delay();

            // Propagate result to children
            const outgoing = this.graph.getOutgoingEdges(nodeId);
            outgoing.forEach(edge => {
                this.performanceMetrics.edgesTraversed++;

                if (!nodeInputs.has(edge.to)) {
                    nodeInputs.set(edge.to, []);
                }
                nodeInputs.get(edge.to).push(result);
            });
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// Parallel Propagation
// ============================================================================

/**
 * Parallel propagation: evaluates independent nodes concurrently
 */
class ParallelPropagation extends PropagationStrategy {
    async propagate(startNodes, inputs) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        // Build dependency levels
        const levels = this.buildDependencyLevels(startNodes);

        // Initialize inputs
        const nodeInputs = new Map();
        startNodes.forEach((nodeId, idx) => {
            nodeInputs.set(nodeId, inputs[idx] || []);
        });

        // Evaluate level by level (nodes in same level can be parallel)
        for (let i = 0; i < levels.length; i++) {
            const levelNodes = levels[i];

            // Evaluate all nodes in this level in parallel
            const evaluations = levelNodes.map(async (nodeId) => {
                const node = this.graph.getNode(nodeId);
                if (!node) return;

                const inputValues = nodeInputs.get(nodeId) || [];

                this.recordStep(nodeId, 'parallel_evaluate', inputValues, { level: i });
                const result = node.evaluate(inputValues);
                this.results.set(nodeId, result);
                this.performanceMetrics.nodesEvaluated++;

                await this.delay();

                // Prepare inputs for next level
                const outgoing = this.graph.getOutgoingEdges(nodeId);
                outgoing.forEach(edge => {
                    this.performanceMetrics.edgesTraversed++;

                    if (!nodeInputs.has(edge.to)) {
                        nodeInputs.set(edge.to, []);
                    }
                    nodeInputs.get(edge.to).push(result);
                });

                return result;
            });

            // Wait for all nodes in this level to complete
            await Promise.all(evaluations);
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }

    /**
     * Build dependency levels for parallel execution
     */
    buildDependencyLevels(startNodes) {
        const levels = [];
        const nodeLevel = new Map();
        const visited = new Set();

        // BFS to assign levels
        const queue = startNodes.map(nodeId => ({ nodeId, level: 0 }));

        while (queue.length > 0) {
            const { nodeId, level } = queue.shift();

            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            // Ensure level array exists
            while (levels.length <= level) {
                levels.push([]);
            }

            levels[level].push(nodeId);
            nodeLevel.set(nodeId, level);

            // Add children to next level
            const outgoing = this.graph.getOutgoingEdges(nodeId);
            outgoing.forEach(edge => {
                if (!visited.has(edge.to)) {
                    queue.push({ nodeId: edge.to, level: level + 1 });
                }
            });
        }

        return levels;
    }
}

// ============================================================================
// Lazy Propagation
// ============================================================================

/**
 * Lazy propagation: evaluates only when result is requested
 */
class LazyPropagation extends PropagationStrategy {
    constructor(graph) {
        super(graph);
        this.memoized = new Map();
    }

    /**
     * Get value for a node (evaluates on demand)
     */
    async getValue(nodeId, providedInputs = null) {
        // Check if already computed
        if (this.memoized.has(nodeId)) {
            return this.memoized.get(nodeId);
        }

        const node = this.graph.getNode(nodeId);
        if (!node) return null;

        this.performanceMetrics.startTime = this.performanceMetrics.startTime || performance.now();

        let inputs = providedInputs;

        // If no inputs provided, get them from parent nodes
        if (inputs === null) {
            const incomingEdges = this.graph.getIncomingEdges(nodeId);
            inputs = await Promise.all(
                Array.from(incomingEdges).map(edge => this.getValue(edge.from))
            );

            incomingEdges.forEach(() => {
                this.performanceMetrics.edgesTraversed++;
            });
        }

        this.recordStep(nodeId, 'lazy_evaluate', inputs);
        const result = node.evaluate(inputs);
        this.memoized.set(nodeId, result);
        this.results.set(nodeId, result);
        this.performanceMetrics.nodesEvaluated++;

        await this.delay();

        this.performanceMetrics.endTime = performance.now();
        return result;
    }

    async propagate(targetNodes, inputs = null) {
        this.reset();

        // Evaluate all target nodes
        const results = await Promise.all(
            targetNodes.map((nodeId, idx) =>
                this.getValue(nodeId, inputs ? inputs[idx] : null)
            )
        );

        return this.results;
    }
}

// ============================================================================
// Eager Propagation
// ============================================================================

/**
 * Eager propagation: evaluates all nodes immediately
 */
class EagerPropagation extends PropagationStrategy {
    async propagate(startNodes, inputs) {
        this.reset();
        this.performanceMetrics.startTime = performance.now();

        const allNodes = this.graph.getAllNodes();
        const nodeInputs = new Map();

        // Initialize start nodes
        startNodes.forEach((nodeId, idx) => {
            nodeInputs.set(nodeId, inputs[idx] || []);
        });

        // Evaluate ALL nodes (using topological order if possible)
        let evaluationOrder;
        try {
            const topoStrategy = new TopologicalPropagation(this.graph);
            evaluationOrder = topoStrategy.topologicalSort();
        } catch (e) {
            // If topological sort fails, use all nodes
            evaluationOrder = allNodes.map(n => n.id);
        }

        for (const nodeId of evaluationOrder) {
            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            const inputValues = nodeInputs.get(nodeId) || [];

            this.recordStep(nodeId, 'eager_evaluate', inputValues);
            const result = node.evaluate(inputValues);
            this.results.set(nodeId, result);
            this.performanceMetrics.nodesEvaluated++;

            await this.delay();

            // Prepare inputs for connected nodes
            const outgoing = this.graph.getOutgoingEdges(nodeId);
            outgoing.forEach(edge => {
                this.performanceMetrics.edgesTraversed++;

                if (!nodeInputs.has(edge.to)) {
                    nodeInputs.set(edge.to, []);
                }
                nodeInputs.get(edge.to).push(result);
            });
        }

        this.performanceMetrics.endTime = performance.now();
        return this.results;
    }
}

// ============================================================================
// Propagation Engine
// ============================================================================

/**
 * Main propagation engine that manages different strategies
 */
class PropagationEngine {
    constructor(graph) {
        this.graph = graph;
        this.strategies = {
            'forward': new ForwardPropagation(graph),
            'backward': new BackwardPropagation(graph),
            'bidirectional': new BidirectionalPropagation(graph),
            'bfs': new BFSPropagation(graph),
            'dfs': new DFSPropagation(graph),
            'topological': new TopologicalPropagation(graph),
            'parallel': new ParallelPropagation(graph),
            'lazy': new LazyPropagation(graph),
            'eager': new EagerPropagation(graph)
        };
        this.currentStrategy = 'forward';
    }

    /**
     * Set the propagation strategy
     */
    setStrategy(strategyName) {
        if (!this.strategies[strategyName]) {
            throw new Error(`Unknown strategy: ${strategyName}`);
        }
        this.currentStrategy = strategyName;
        return this;
    }

    /**
     * Set animation delay for all strategies
     */
    setAnimationDelay(delay) {
        Object.values(this.strategies).forEach(strategy => {
            strategy.animationDelay = delay;
        });
        return this;
    }

    /**
     * Execute propagation with current strategy
     */
    async execute(...args) {
        const strategy = this.strategies[this.currentStrategy];
        return await strategy.propagate(...args);
    }

    /**
     * Get step history from current strategy
     */
    getStepHistory() {
        return this.strategies[this.currentStrategy].stepHistory;
    }

    /**
     * Get performance metrics from current strategy
     */
    getMetrics() {
        return this.strategies[this.currentStrategy].getMetrics();
    }

    /**
     * Compare performance of different strategies
     */
    async compareStrategies(strategyNames, startNodes, inputs) {
        const results = {};

        for (const strategyName of strategyNames) {
            if (!this.strategies[strategyName]) continue;

            const strategy = this.strategies[strategyName];
            strategy.reset();

            try {
                await strategy.propagate(startNodes, inputs);
                results[strategyName] = {
                    metrics: strategy.getMetrics(),
                    results: new Map(strategy.results),
                    success: true
                };
            } catch (error) {
                results[strategyName] = {
                    error: error.message,
                    success: false
                };
            }
        }

        return results;
    }
}

// ============================================================================
// Export
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PropagationStrategy,
        ForwardPropagation,
        BackwardPropagation,
        BidirectionalPropagation,
        BFSPropagation,
        DFSPropagation,
        TopologicalPropagation,
        ParallelPropagation,
        LazyPropagation,
        EagerPropagation,
        PropagationEngine
    };
}
