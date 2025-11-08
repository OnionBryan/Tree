/**
 * Decision Tree Core Classes
 * Port of original standalone functionality
 */

export class DecisionNode {
  constructor(question, depth = 0, id = null, threshold = 0, score = 0) {
    this.id = id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.question = question;
    this.depth = depth;
    this.threshold = threshold;
    this.thresholdMode = 'manual'; // 'manual', 'mean', 'median', 'percentile'
    this.score = score;
    this.isTerminal = false;
    this.x = 0;
    this.y = 0;
    this.parentId = null;
    this.left = null;
    this.leftId = null;
    this.right = null;
    this.rightId = null;
    this.userScore = null;
    this.surveyData = [];
    this.statistics = null;
  }

  getColor(colorScale) {
    const s = this.userScore !== null ? this.userScore : this.score;
    return getColorForValue(s, colorScale);
  }

  calculateStatistics() {
    if (this.surveyData.length === 0) return null;

    const scores = this.surveyData.map(d => d.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    this.statistics = {
      mean,
      median,
      stdDev,
      variance,
      min: Math.min(...scores),
      max: Math.max(...scores),
      count: scores.length,
      q1: sorted[Math.floor(scores.length * 0.25)],
      q3: sorted[Math.floor(scores.length * 0.75)]
    };

    return this.statistics;
  }
}

export class TreeBuilder {
  constructor() {
    this.layers = [];
    this.nodes = new Map();
    this.selectedNode = null;
    this.mode = 'build';
    this.history = [];
    this.historyIndex = -1;
    this.currentScale = { min: -5, max: 5 };
    this.allowDecimals = false;
  }

  addLayer() {
    const layerIndex = this.layers.length;
    const layer = {
      index: layerIndex,
      nodes: []
    };
    this.layers.push(layer);
    this.saveHistory('addLayer');
    return layer;
  }

  addNodeToLayer(layerIndex, question = '', threshold = 0, score = null) {
    if (layerIndex >= this.layers.length) {
      for (let i = this.layers.length; i <= layerIndex; i++) {
        this.addLayer();
      }
    }

    score = score ?? 0;

    const node = new DecisionNode(
      question || `Layer ${layerIndex} Node ${this.layers[layerIndex].nodes.length + 1}`,
      layerIndex,
      null,
      threshold,
      score
    );

    this.layers[layerIndex].nodes.push(node);
    this.nodes.set(node.id, node);

    // Auto-connect to parent if only one node in previous layer
    if (layerIndex > 0 && this.layers[layerIndex - 1].nodes.length === 1) {
      const parentNode = this.layers[layerIndex - 1].nodes[0];
      if (!parentNode.left) {
        parentNode.left = node;
        parentNode.leftId = node.id;
        node.parentId = parentNode.id;
      } else if (!parentNode.right) {
        parentNode.right = node;
        parentNode.rightId = node.id;
        node.parentId = parentNode.id;
      }
    }

    this.saveHistory('addNode');
    return node;
  }

  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const layer = this.layers[node.depth];
    layer.nodes = layer.nodes.filter(n => n.id !== nodeId);

    this.nodes.forEach(n => {
      if (n.leftId === nodeId) {
        n.left = null;
        n.leftId = null;
      }
      if (n.rightId === nodeId) {
        n.right = null;
        n.rightId = null;
      }
    });

    this.nodes.delete(nodeId);
    this.saveHistory('removeNode');
  }

  connectNodes(parentId, childId, branch) {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);

    if (!parent || !child) return;

    if (branch === 'left') {
      parent.left = child;
      parent.leftId = childId;
    } else {
      parent.right = child;
      parent.rightId = childId;
    }

    child.parentId = parentId;
    this.saveHistory('connectNodes');
  }

  updateNodeProperties(nodeId, properties) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    Object.assign(node, properties);
    this.saveHistory('updateNode');
  }

  saveHistory(action) {
    const state = this.exportState();
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ action, state, timestamp: Date.now() });
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadState(this.history[this.historyIndex].state);
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadState(this.history[this.historyIndex].state);
      return true;
    }
    return false;
  }

  exportState() {
    return {
      layers: this.layers.map(layer => ({
        index: layer.index,
        nodes: layer.nodes.map(n => n.id)
      })),
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
        id,
        question: node.question,
        depth: node.depth,
        threshold: node.threshold,
        thresholdMode: node.thresholdMode,
        score: node.score,
        isTerminal: node.isTerminal,
        parentId: node.parentId,
        leftId: node.leftId,
        rightId: node.rightId,
        userScore: node.userScore,
        surveyData: node.surveyData
      })),
      currentScale: this.currentScale,
      allowDecimals: this.allowDecimals
    };
  }

  loadState(state) {
    this.nodes.clear();
    this.layers = [];

    // Recreate nodes
    state.nodes.forEach(nodeData => {
      const node = new DecisionNode(
        nodeData.question,
        nodeData.depth,
        nodeData.id,
        nodeData.threshold,
        nodeData.score
      );
      Object.assign(node, nodeData);
      this.nodes.set(node.id, node);
    });

    // Recreate layers
    state.layers.forEach(layerData => {
      const layer = {
        index: layerData.index,
        nodes: layerData.nodes.map(id => this.nodes.get(id)).filter(Boolean)
      };
      this.layers.push(layer);
    });

    // Reconnect node references
    this.nodes.forEach(node => {
      if (node.leftId) node.left = this.nodes.get(node.leftId);
      if (node.rightId) node.right = this.nodes.get(node.rightId);
    });

    this.currentScale = state.currentScale;
    this.allowDecimals = state.allowDecimals;
  }

  exportJSON() {
    return JSON.stringify(this.exportState(), null, 2);
  }

  importJSON(jsonString) {
    try {
      const state = JSON.parse(jsonString);
      this.loadState(state);
      return true;
    } catch (error) {
      console.error('Failed to import tree:', error);
      return false;
    }
  }

  getRootNode() {
    return this.layers[0]?.nodes[0] || null;
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  findNode(predicate) {
    return Array.from(this.nodes.values()).find(predicate);
  }

  traverseTree(callback, startNode = null) {
    const root = startNode || this.getRootNode();
    if (!root) return;

    const traverse = (node) => {
      if (!node) return;
      callback(node);
      if (node.left) traverse(node.left);
      if (node.right) traverse(node.right);
    };

    traverse(root);
  }
}

export function getColorForValue(value, colorScale) {
  const { min, max } = colorScale;
  const normalized = (value - min) / (max - min);

  if (normalized <= 0) return '#dc2626'; // Red for very low
  if (normalized < 0.25) return '#f97316'; // Orange
  if (normalized < 0.5) return '#eab308'; // Yellow
  if (normalized < 0.75) return '#84cc16'; // Light green
  return '#22c55e'; // Green for high
}

export function generateTreeTemplate(type) {
  const builder = new TreeBuilder();

  switch (type) {
    case 'simple':
      builder.addNodeToLayer(0, 'Root Decision', 0, 0);
      builder.addNodeToLayer(1, 'Low Score Path', -2, -3);
      builder.addNodeToLayer(1, 'High Score Path', 2, 3);
      break;

    case 'customer-satisfaction':
      builder.addNodeToLayer(0, 'Overall Satisfaction', 3, 0);
      builder.addNodeToLayer(1, 'Product Quality', 3, 0);
      builder.addNodeToLayer(1, 'Service Quality', 3, 0);
      builder.addNodeToLayer(2, 'Features', 2, 0);
      builder.addNodeToLayer(2, 'Reliability', 2, 0);
      builder.addNodeToLayer(2, 'Support', 2, 0);
      builder.addNodeToLayer(2, 'Speed', 2, 0);
      break;

    case 'performance-review':
      builder.addNodeToLayer(0, 'Overall Performance', 0, 0);
      builder.addNodeToLayer(1, 'Technical Skills', 0, 0);
      builder.addNodeToLayer(1, 'Soft Skills', 0, 0);
      builder.addNodeToLayer(2, 'Code Quality', 0, 0);
      builder.addNodeToLayer(2, 'Problem Solving', 0, 0);
      builder.addNodeToLayer(2, 'Communication', 0, 0);
      builder.addNodeToLayer(2, 'Teamwork', 0, 0);
      break;

    default:
      builder.addNodeToLayer(0, 'Root', 0, 0);
  }

  return builder;
}
