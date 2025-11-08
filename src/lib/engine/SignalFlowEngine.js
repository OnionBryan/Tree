/**
 * Signal Flow Execution Engine
 * Executes signal flow through node graph with loop detection
 * Extracted from Canvas #5 (tree-builder.html lines 10594-10957)
 */

export class SignalFlowEngine {
  constructor() {
    this.executionStack = [];
    this.executionHistory = [];
    this.loopCounters = new Map();
    this.signalValues = new Map();
    this.debugMode = false;
    this.maxLoopIterations = 100;
    this.executionPath = [];
  }

  executeFlow(startNodeId, initialInput = {}) {
    // Reset execution state
    this.executionStack = [startNodeId];
    this.executionHistory = [];
    this.loopCounters.clear();
    this.signalValues.clear();
    this.executionPath = [];

    // Set initial input
    this.signalValues.set('input', initialInput);

    const results = [];
    let iterations = 0;
    const maxIterations = 1000; // Global safety limit

    while (this.executionStack.length > 0 && iterations < maxIterations) {
      iterations++;
      const currentNodeId = this.executionStack.shift();

      // Check for loops
      if (this.detectLoop(currentNodeId)) {
        if (this.debugMode) {
          console.warn(`Loop detected at node ${currentNodeId}`);
        }
        const loopCount = this.loopCounters.get(currentNodeId) || 0;
        if (loopCount >= this.maxLoopIterations) {
          console.error(`Maximum loop iterations exceeded at node ${currentNodeId}`);
          break;
        }
        this.loopCounters.set(currentNodeId, loopCount + 1);
      }

      // Execute node
      const node = this.getNode(currentNodeId);
      if (!node) continue;

      const nodeResult = this.executeNode(node);
      results.push({
        nodeId: currentNodeId,
        result: nodeResult,
        timestamp: Date.now()
      });

      // Record execution
      this.executionHistory.push(currentNodeId);
      this.executionPath.push({
        nodeId: currentNodeId,
        input: this.signalValues.get(currentNodeId + '_input'),
        output: nodeResult
      });

      // Determine next nodes based on result
      const nextNodes = this.determineNextNodes(node, nodeResult);
      nextNodes.forEach(nextId => {
        if (!this.executionStack.includes(nextId)) {
          this.executionStack.push(nextId);
        }
      });

      // Handle special node types
      if (node.nodeType === 'merge') {
        this.handleMergeNode(node);
      } else if (node.nodeType === 'router') {
        this.handleRouterNode(node, nodeResult);
      }
    }

    if (iterations >= maxIterations) {
      console.error('Maximum global iterations exceeded');
    }

    return {
      results: results,
      path: this.executionPath,
      finalValues: Object.fromEntries(this.signalValues),
      loopCounts: Object.fromEntries(this.loopCounters)
    };
  }

  executeNode(node) {
    // Get input values
    const inputs = this.gatherInputs(node);

    // Execute based on node type
    switch (node.nodeType) {
      case 'logic_gate':
        return this.executeLogicGate(node, inputs);
      case 'fuzzy_gate':
        return this.executeFuzzyGate(node, inputs);
      case 'threshold':
        return this.executeThresholdGate(node, inputs);
      case 'router':
        return this.executeRouter(node, inputs);
      case 'merge':
        return this.executeMerge(node, inputs);
      case 'process':
        return this.executeProcess(node, inputs);
      default:
        return this.executeDecision(node, inputs);
    }
  }

  executeLogicGate(node, inputs) {
    const boolInputs = inputs.map(i => Boolean(i));

    switch (node.logicType) {
      case 'and':
        return boolInputs.every(i => i) ? 1 : 0;
      case 'or':
        return boolInputs.some(i => i) ? 1 : 0;
      case 'xor':
        return boolInputs.filter(i => i).length % 2 ? 1 : 0;
      case 'nand':
        return boolInputs.every(i => i) ? 0 : 1;
      case 'nor':
        return boolInputs.some(i => i) ? 0 : 1;
      case 'not':
        return boolInputs[0] ? 0 : 1;
      case 'majority':
        return boolInputs.filter(i => i).length > boolInputs.length / 2 ? 1 : 0;
      default:
        return 0;
    }
  }

  executeFuzzyGate(node, inputs) {
    const fuzzyInputs = inputs.map(i => Math.max(0, Math.min(1, Number(i) || 0)));

    switch (node.logicType) {
      case 'fuzzy_and':
        return Math.min(...fuzzyInputs);
      case 'fuzzy_or':
        return Math.max(...fuzzyInputs);
      case 'fuzzy_not':
        return 1 - fuzzyInputs[0];
      default:
        return fuzzyInputs[0] || 0;
    }
  }

  executeThresholdGate(node, inputs) {
    const value = inputs.reduce((sum, i) => sum + Number(i), 0);
    const thresholds = node.thresholds || node.parameters?.split(',').map(Number) || [0];

    for (let i = 0; i < thresholds.length; i++) {
      if (value < thresholds[i]) return i;
    }
    return thresholds.length;
  }

  executeRouter(node, inputs) {
    const routerOutputs = node.routerOutputs || parseInt(node.parameters) || 2;
    const inputValue = Number(inputs[0]) || 0;
    return Math.abs(inputValue) % routerOutputs;
  }

  executeMerge(node, inputs) {
    // Merge combines multiple inputs into single output
    // Can use different merge strategies
    const mergeStrategy = node.mergeStrategy || 'or';

    switch (mergeStrategy) {
      case 'and':
        return inputs.every(i => i) ? 1 : 0;
      case 'or':
        return inputs.some(i => i) ? 1 : 0;
      case 'sum':
        return inputs.reduce((sum, i) => sum + Number(i), 0);
      case 'average':
        return inputs.reduce((sum, i) => sum + Number(i), 0) / inputs.length;
      case 'max':
        return Math.max(...inputs.map(Number));
      case 'min':
        return Math.min(...inputs.map(Number));
      default:
        return inputs.find(i => i !== null && i !== undefined) || 0;
    }
  }

  executeProcess(node, inputs) {
    // Process nodes can transform input
    const processType = node.processType || 'passthrough';
    const input = inputs[0] || 0;

    switch (processType) {
      case 'multiply':
        return input * (node.factor || 2);
      case 'add':
        return input + (node.offset || 1);
      case 'modulo':
        return input % (node.divisor || 10);
      case 'clamp':
        const min = node.min || 0;
        const max = node.max || 1;
        return Math.max(min, Math.min(max, input));
      default:
        return input;
    }
  }

  executeDecision(node, inputs) {
    // Standard decision node execution
    // Returns branch index based on evaluation
    if (node.evaluate) {
      return node.evaluate(inputs);
    }

    // Default binary decision
    return inputs[0] ? 1 : 0;
  }

  gatherInputs(node) {
    const inputs = [];

    // Get inputs from parent nodes
    const parents = this.findNodeParents(node.id);
    parents.forEach(parent => {
      const parentOutput = this.signalValues.get(parent.id + '_output');
      if (parentOutput !== undefined) {
        inputs.push(parentOutput);
      }
    });

    // Get stored input value
    const storedInput = this.signalValues.get(node.id + '_input');
    if (storedInput !== undefined) {
      inputs.push(storedInput);
    }

    // Store gathered inputs
    this.signalValues.set(node.id + '_input', inputs);

    return inputs;
  }

  determineNextNodes(node, result) {
    const nextNodes = [];

    if (node.childIds && Array.isArray(node.childIds)) {
      const branchIndex = Math.min(result, node.childIds.length - 1);
      const nextNodeId = node.childIds[branchIndex];
      if (nextNodeId) {
        nextNodes.push(nextNodeId);
      }
    }

    // Handle special connections
    if (node.connectionMode === 'backward' && node.loopTarget) {
      nextNodes.push(node.loopTarget);
    } else if (node.connectionMode === 'skip') {
      // Skip to specified layer
      const skipTarget = this.findSkipTarget(node);
      if (skipTarget) nextNodes.push(skipTarget);
    }

    // Store output for next nodes
    this.signalValues.set(node.id + '_output', result);

    return nextNodes;
  }

  handleMergeNode(node) {
    // Wait for all inputs before proceeding
    const parents = this.findNodeParents(node.id);
    const allInputsReady = parents.every(parent =>
      this.signalValues.has(parent.id + '_output')
    );

    if (!allInputsReady) {
      // Re-queue node to wait for other inputs
      if (!this.executionStack.includes(node.id)) {
        this.executionStack.push(node.id);
      }
    }
  }

  handleRouterNode(node, result) {
    // Router sends signal to specific output based on result
    const routerOutputs = node.routerOutputs || parseInt(node.parameters) || 2;
    const outputIndex = result % routerOutputs;

    // Clear other outputs
    for (let i = 0; i < routerOutputs; i++) {
      if (i !== outputIndex) {
        this.signalValues.set(`${node.id}_output_${i}`, null);
      }
    }

    this.signalValues.set(`${node.id}_output_${outputIndex}`, 1);
  }

  detectLoop(nodeId) {
    // Check if node has been executed recently
    const recentHistory = this.executionHistory.slice(-10);
    return recentHistory.filter(id => id === nodeId).length > 1;
  }

  getNode(nodeId) {
    // Get node from tree builder
    if (window.treeBuilder && window.treeBuilder.nodes) {
      return window.treeBuilder.nodes.get(nodeId);
    }
    return null;
  }

  findNodeParents(nodeId) {
    const parents = [];
    if (window.treeBuilder && window.treeBuilder.nodes) {
      window.treeBuilder.nodes.forEach((node, id) => {
        if (node.childIds && node.childIds.includes(nodeId)) {
          parents.push(node);
        }
      });
    }
    return parents;
  }

  findSkipTarget(node) {
    // Find target node in specified layer
    const targetLayer = node.skipToLayer || node.layer + 2;
    if (window.treeBuilder && window.treeBuilder.layers) {
      const layer = window.treeBuilder.layers[targetLayer];
      if (layer && layer.nodes.length > 0) {
        return layer.nodes[0].id;
      }
    }
    return null;
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      console.log('Signal Flow Engine Debug Mode Enabled');
    }
  }

  visualizeExecutionPath() {
    // Create visual representation of execution path
    const pathViz = this.executionPath.map((step, index) => ({
      step: index + 1,
      node: step.nodeId,
      input: JSON.stringify(step.input),
      output: step.output
    }));

    console.table(pathViz);
    return pathViz;
  }
}
