/**
 * Loop Detection System
 * Detects cycles in node graphs using DFS
 * Extracted from Canvas #5 (tree-builder.html lines 10959-11064)
 */

export class LoopDetector {
  constructor() {
    this.adjacencyList = new Map();
    this.visitedNodes = new Set();
    this.recursionStack = new Set();
    this.loops = [];
  }

  buildGraph(nodes) {
    this.adjacencyList.clear();

    nodes.forEach((node, nodeId) => {
      const edges = [];
      if (node.childIds) {
        node.childIds.forEach(childId => {
          if (childId) edges.push(childId);
        });
      }

      // Check for backward connections
      if (node.connectionMode === 'backward' && node.loopTarget) {
        edges.push(node.loopTarget);
      }

      this.adjacencyList.set(nodeId, edges);
    });
  }

  detectAllLoops() {
    this.loops = [];
    this.visitedNodes.clear();
    this.recursionStack.clear();

    for (let nodeId of this.adjacencyList.keys()) {
      if (!this.visitedNodes.has(nodeId)) {
        this.detectLoopsDFS(nodeId, []);
      }
    }

    return this.loops;
  }

  detectLoopsDFS(nodeId, path) {
    this.visitedNodes.add(nodeId);
    this.recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = this.adjacencyList.get(nodeId) || [];
    for (let neighbor of neighbors) {
      if (this.recursionStack.has(neighbor)) {
        // Found a loop
        const loopStartIndex = path.indexOf(neighbor);
        const loop = path.slice(loopStartIndex);
        loop.push(neighbor); // Complete the loop
        this.loops.push({
          nodes: loop,
          startNode: neighbor,
          length: loop.length - 1
        });
      } else if (!this.visitedNodes.has(neighbor)) {
        this.detectLoopsDFS(neighbor, [...path]);
      }
    }

    this.recursionStack.delete(nodeId);
  }

  analyzeLoopComplexity() {
    const analysis = {
      totalLoops: this.loops.length,
      simpleLoops: 0,
      nestedLoops: 0,
      maxLoopLength: 0,
      loopNodes: new Set()
    };

    this.loops.forEach(loop => {
      if (loop.length <= 2) {
        analysis.simpleLoops++;
      } else {
        analysis.nestedLoops++;
      }

      analysis.maxLoopLength = Math.max(analysis.maxLoopLength, loop.length);
      loop.nodes.forEach(node => analysis.loopNodes.add(node));
    });

    return analysis;
  }

  visualizeLoops() {
    if (this.loops.length === 0) {
      console.log('No loops detected in the graph');
      return;
    }

    console.log(`Found ${this.loops.length} loops:`);
    this.loops.forEach((loop, index) => {
      console.log(`Loop ${index + 1}:`);
      console.log(`  Path: ${loop.nodes.join(' → ')}`);
      console.log(`  Start: ${loop.startNode}`);
      console.log(`  Length: ${loop.length}`);
    });
  }
}
