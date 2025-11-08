/**
 * Tree Visualization Engine
 * Multi-Branch Tree Rendering with Interactive Features
 * Version: 2.0
 *
 * This module provides visualization capabilities for the advanced tree logic system,
 * including layout algorithms, rendering engines, and interactive features.
 */

// ============================================================================
// Core Data Structures
// ============================================================================

/**
 * Advanced Node with multi-branch capabilities
 */
class AdvancedNode {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.name = config.name || 'Untitled Node';
        this.description = config.description || '';
        this.nodeType = config.nodeType || 'decision';
        this.logicType = config.logicType || 'threshold';
        this.branchCount = config.branchCount || 2;
        this.branchLabels = config.branchLabels || this.getDefaultBranchLabels();
        this.position = config.position || { x: 0, y: 0 };
        this.inputs = config.inputs || [];
        this.children = config.children || [];
        this.parents = config.parents || [];
        this.metadata = config.metadata || {};
        this.state = {
            active: false,
            visited: false,
            error: false,
            value: null
        };
        this.visual = {
            shape: config.visual?.shape || this.determineShape(),
            size: config.visual?.size || { width: 80, height: 80 },
            color: config.visual?.color || this.determineColor(),
            icon: config.visual?.icon || ''
        };
    }

    generateId() {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getDefaultBranchLabels() {
        if (this.branchCount === 2) return ['False', 'True'];
        if (this.branchCount === 3) return ['Low', 'Medium', 'High'];
        if (this.branchCount === 4) return ['Very Low', 'Low', 'High', 'Very High'];
        return Array.from({ length: this.branchCount }, (_, i) => `Branch ${i + 1}`);
    }

    determineShape() {
        const shapeMap = {
            decision: 'diamond',
            logic_gate: 'trapezoid',
            fuzzy_gate: 'ellipse',
            probabilistic: 'hexagon',
            terminal: 'rectangle'
        };
        return shapeMap[this.nodeType] || 'circle';
    }

    determineColor() {
        const colorMap = {
            decision: '#4A90E2',
            logic_gate: '#FFD700',
            fuzzy_gate: '#9B59B6',
            probabilistic: '#E74C3C',
            multi_valued: '#2ECC71',
            terminal: '#95A5A6'
        };
        return colorMap[this.nodeType] || '#4A90E2';
    }
}

/**
 * Logic Graph for managing nodes and edges
 */
class LogicGraph {
    constructor(config = {}) {
        this.name = config.name || 'Untitled Graph';
        this.type = config.type || 'dag';
        this.nodes = new Map();
        this.edges = new Map();
        this.metadata = config.metadata || {};
    }

    addNode(node) {
        this.nodes.set(node.id, node);
        return node;
    }

    removeNode(nodeId) {
        // Remove all edges connected to this node
        for (const [edgeId, edge] of this.edges) {
            if (edge.source === nodeId || edge.target === nodeId) {
                this.edges.delete(edgeId);
            }
        }
        this.nodes.delete(nodeId);
    }

    addEdge(sourceId, targetId, config = {}) {
        const edge = {
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: sourceId,
            target: targetId,
            label: config.label || '',
            weight: config.weight || 1,
            visual: {
                color: config.color || '#666666',
                width: config.width || 2,
                style: config.style || 'solid',
                curvature: config.curvature || 0.2
            },
            state: {
                active: false
            }
        };
        this.edges.set(edge.id, edge);

        // Update node connections
        const sourceNode = this.nodes.get(sourceId);
        const targetNode = this.nodes.get(targetId);
        if (sourceNode) sourceNode.children.push(targetId);
        if (targetNode) targetNode.parents.push(sourceId);

        return edge;
    }

    removeEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (edge) {
            const sourceNode = this.nodes.get(edge.source);
            const targetNode = this.nodes.get(edge.target);
            if (sourceNode) {
                sourceNode.children = sourceNode.children.filter(id => id !== edge.target);
            }
            if (targetNode) {
                targetNode.parents = targetNode.parents.filter(id => id !== edge.source);
            }
        }
        this.edges.delete(edgeId);
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values()),
            metadata: this.metadata
        };
    }

    execute() {
        // Simple execution for testing
        const results = new Map();
        for (const [nodeId, node] of this.nodes) {
            node.state.active = true;
            results.set(nodeId, { value: Math.random() });
        }
        return results;
    }
}

// ============================================================================
// Layout Algorithms
// ============================================================================

/**
 * Tree layout algorithms for different graph types
 */
class TreeLayout {
    /**
     * Hierarchical layout using Sugiyama algorithm
     */
    static hierarchical(graph, options = {}) {
        const defaults = {
            levelSeparation: 150,
            nodeSeparation: 100,
            direction: 'TB', // TB, BT, LR, RL
            centerRoot: true
        };
        const config = { ...defaults, ...options };

        // Layer assignment using longest path
        const layers = this.assignLayers(graph);

        // Position nodes within layers
        const positions = new Map();

        layers.forEach((nodeIds, layer) => {
            const count = nodeIds.length;
            const startX = -(count - 1) * config.nodeSeparation / 2;

            nodeIds.forEach((nodeId, index) => {
                const x = startX + index * config.nodeSeparation;
                const y = layer * config.levelSeparation;

                // Apply direction transformation
                let finalX = x, finalY = y;
                switch(config.direction) {
                    case 'BT': finalY = -y; break;
                    case 'LR': [finalX, finalY] = [y, x]; break;
                    case 'RL': [finalX, finalY] = [-y, x]; break;
                }

                positions.set(nodeId, { x: finalX, y: finalY });

                // Update node position
                const node = graph.nodes.get(nodeId);
                if (node) {
                    node.position = { x: finalX, y: finalY };
                }
            });
        });

        return positions;
    }

    /**
     * Radial tree layout
     */
    static radial(graph, options = {}) {
        const defaults = {
            radius: 100,
            startAngle: 0,
            endAngle: 2 * Math.PI,
            centerX: 0,
            centerY: 0
        };
        const config = { ...defaults, ...options };

        const positions = new Map();
        const layers = this.assignLayers(graph);

        layers.forEach((nodeIds, layer) => {
            if (layer === 0) {
                // Root at center
                nodeIds.forEach(nodeId => {
                    positions.set(nodeId, { x: config.centerX, y: config.centerY });
                });
            } else {
                // Distribute nodes around circle
                const r = layer * config.radius;
                const angleStep = (config.endAngle - config.startAngle) / nodeIds.length;

                nodeIds.forEach((nodeId, index) => {
                    const angle = config.startAngle + index * angleStep;
                    positions.set(nodeId, {
                        x: config.centerX + r * Math.cos(angle),
                        y: config.centerY + r * Math.sin(angle)
                    });
                });
            }
        });

        return positions;
    }

    /**
     * Force-directed layout using Fruchterman-Reingold algorithm
     */
    static forceDirected(graph, options = {}) {
        const defaults = {
            iterations: 500,
            idealLength: 100,
            temperature: 100,
            cooling: 0.95,
            minTemp: 0.01
        };
        const config = { ...defaults, ...options };

        // Initialize random positions
        const positions = new Map();
        for (const [nodeId] of graph.nodes) {
            positions.set(nodeId, {
                x: Math.random() * 500 - 250,
                y: Math.random() * 500 - 250
            });
        }

        let temp = config.temperature;

        for (let iter = 0; iter < config.iterations && temp > config.minTemp; iter++) {
            const forces = new Map();

            // Calculate repulsive forces between all nodes
            for (const [id1, pos1] of positions) {
                let fx = 0, fy = 0;

                for (const [id2, pos2] of positions) {
                    if (id1 === id2) continue;

                    const dx = pos1.x - pos2.x;
                    const dy = pos1.y - pos2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

                    const repulsion = (config.idealLength * config.idealLength) / dist;
                    fx += (dx / dist) * repulsion;
                    fy += (dy / dist) * repulsion;
                }

                forces.set(id1, { x: fx, y: fy });
            }

            // Calculate attractive forces for edges
            for (const [, edge] of graph.edges) {
                const pos1 = positions.get(edge.source);
                const pos2 = positions.get(edge.target);
                if (!pos1 || !pos2) continue;

                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

                const attraction = (dist * dist) / config.idealLength;
                const fx = (dx / dist) * attraction;
                const fy = (dy / dist) * attraction;

                const f1 = forces.get(edge.source);
                const f2 = forces.get(edge.target);

                f1.x += fx;
                f1.y += fy;
                f2.x -= fx;
                f2.y -= fy;
            }

            // Apply forces with temperature
            for (const [nodeId, force] of forces) {
                const pos = positions.get(nodeId);
                const fMag = Math.sqrt(force.x * force.x + force.y * force.y) || 0.01;
                const scale = Math.min(temp, fMag) / fMag;

                pos.x += force.x * scale;
                pos.y += force.y * scale;
            }

            temp *= config.cooling;
        }

        return positions;
    }

    /**
     * Assign nodes to layers for hierarchical layout
     */
    static assignLayers(graph) {
        const layers = new Map();
        const visited = new Set();

        // Find root nodes (no parents)
        const roots = [];
        for (const [nodeId, node] of graph.nodes) {
            if (node.parents.length === 0) {
                roots.push(nodeId);
            }
        }

        // BFS to assign layers
        const queue = roots.map(id => ({ id, layer: 0 }));

        while (queue.length > 0) {
            const { id, layer } = queue.shift();

            if (visited.has(id)) continue;
            visited.add(id);

            if (!layers.has(layer)) {
                layers.set(layer, []);
            }
            layers.get(layer).push(id);

            const node = graph.nodes.get(id);
            if (node) {
                for (const childId of node.children) {
                    if (!visited.has(childId)) {
                        queue.push({ id: childId, layer: layer + 1 });
                    }
                }
            }
        }

        return layers;
    }
}

// ============================================================================
// Canvas Renderer
// ============================================================================

/**
 * Canvas-based renderer for tree visualization
 */
class CanvasRenderer {
    constructor(canvas, graph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = graph;

        // View settings
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        // Interaction state
        this.selectedNode = null;
        this.hoveredNode = null;
        this.isDragging = false;
        this.dragStart = null;

        // Style configuration
        this.styles = {
            node: {
                radius: 30,
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                strokeWidth: 2
            },
            edge: {
                strokeWidth: 2,
                arrowSize: 10
            },
            colors: {
                decision: '#4A90E2',
                logic_gate: '#FFD700',
                fuzzy_gate: '#9B59B6',
                probabilistic: '#E74C3C',
                multi_valued: '#2ECC71',
                edge: '#666666',
                selected: '#FF6B6B',
                hovered: '#4ECDC4'
            }
        };

        this.setupEventListeners();
    }

    /**
     * Setup canvas event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    /**
     * Main render loop
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state
        this.ctx.save();

        // Apply transformations
        this.ctx.translate(
            this.canvas.width / 2 + this.panX,
            this.canvas.height / 2 + this.panY
        );
        this.ctx.scale(this.zoom, this.zoom);

        // Render edges
        for (const [, edge] of this.graph.edges) {
            this.renderEdge(edge);
        }

        // Render nodes
        for (const [, node] of this.graph.nodes) {
            this.renderNode(node);
        }

        // Restore context state
        this.ctx.restore();

        // Render UI overlays
        this.renderOverlays();
    }

    /**
     * Render a single node
     */
    renderNode(node) {
        const { x, y } = node.position;
        const isSelected = node.id === this.selectedNode;
        const isHovered = node.id === this.hoveredNode;

        // Determine node style based on type and state
        const color = isSelected ? this.styles.colors.selected :
                      isHovered ? this.styles.colors.hovered :
                      this.styles.colors[node.nodeType] || '#95A5A6';

        // Draw node shape based on type
        this.ctx.save();
        this.ctx.translate(x, y);

        switch(node.visual.shape) {
            case 'rectangle':
                this.drawRectangle(node.visual.size.width, node.visual.size.height, color);
                break;
            case 'trapezoid':
                this.drawTrapezoid(node.visual.size.width, node.visual.size.height, color);
                break;
            case 'ellipse':
                this.drawEllipse(node.visual.size.width, node.visual.size.height, color);
                break;
            case 'diamond':
                this.drawDiamond(node.visual.size.width, node.visual.size.height, color);
                break;
            case 'hexagon':
                this.drawHexagon(node.visual.size.width, color);
                break;
            default:
                this.drawCircle(this.styles.node.radius, color);
        }

        // Draw node label
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${this.styles.node.fontSize}px ${this.styles.node.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.name, 0, 0);

        // Draw node icon if exists
        if (node.visual.icon) {
            this.ctx.font = `bold ${this.styles.node.fontSize * 1.5}px ${this.styles.node.fontFamily}`;
            this.ctx.fillText(node.visual.icon, 0, -20);
        }

        // Draw state indicators
        if (node.state.active) {
            this.ctx.strokeStyle = '#2ECC71';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }

        if (node.state.error) {
            this.ctx.strokeStyle = '#E74C3C';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Render a single edge
     */
    renderEdge(edge) {
        const sourceNode = this.graph.nodes.get(edge.source);
        const targetNode = this.graph.nodes.get(edge.target);

        if (!sourceNode || !targetNode) return;

        const { x: x1, y: y1 } = sourceNode.position;
        const { x: x2, y: y2 } = targetNode.position;

        // Calculate edge path
        this.ctx.save();
        this.ctx.strokeStyle = edge.visual.color;
        this.ctx.lineWidth = edge.visual.width * (edge.state.active ? 2 : 1);

        // Set line style
        if (edge.visual.style === 'dashed') {
            this.ctx.setLineDash([5, 5]);
        } else if (edge.visual.style === 'dotted') {
            this.ctx.setLineDash([2, 3]);
        }

        // Draw curved edge
        this.ctx.beginPath();

        if (edge.visual.curvature === 0) {
            // Straight line
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
        } else {
            // Bezier curve
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const perpX = -(y2 - y1) * edge.visual.curvature;
            const perpY = (x2 - x1) * edge.visual.curvature;
            const ctrlX = midX + perpX;
            const ctrlY = midY + perpY;

            this.ctx.moveTo(x1, y1);
            this.ctx.quadraticCurveTo(ctrlX, ctrlY, x2, y2);
        }

        this.ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(y2 - y1, x2 - x1);
        this.drawArrow(x2, y2, angle, this.styles.edge.arrowSize);

        // Draw edge label if exists
        if (edge.label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            this.ctx.fillStyle = '#333333';
            this.ctx.font = `10px ${this.styles.node.fontFamily}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(edge.label, midX, midY - 10);
        }

        // Draw weight if visible
        if (edge.weight !== 1 && edge.state.active) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            this.ctx.fillStyle = '#666666';
            this.ctx.font = `italic 10px ${this.styles.node.fontFamily}`;
            this.ctx.fillText(`w=${edge.weight.toFixed(2)}`, midX, midY + 10);
        }

        this.ctx.restore();
    }

    /**
     * Draw shape primitives
     */
    drawCircle(radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.styles.node.strokeWidth;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawRectangle(width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.styles.node.strokeWidth;

        this.ctx.fillRect(-width/2, -height/2, width, height);
        this.ctx.strokeRect(-width/2, -height/2, width, height);
    }

    drawTrapezoid(width, height, color) {
        const topWidth = width * 0.7;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.styles.node.strokeWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(-topWidth/2, -height/2);
        this.ctx.lineTo(topWidth/2, -height/2);
        this.ctx.lineTo(width/2, height/2);
        this.ctx.lineTo(-width/2, height/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawEllipse(width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.styles.node.strokeWidth;

        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width/2, height/2, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawDiamond(width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.styles.node.strokeWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(0, -height/2);
        this.ctx.lineTo(width/2, 0);
        this.ctx.lineTo(0, height/2);
        this.ctx.lineTo(-width/2, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawHexagon(size, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.styles.node.strokeWidth;

        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawArrow(x, y, angle, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        this.ctx.beginPath();
        this.ctx.moveTo(-size, -size/2);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(-size, size/2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Render UI overlays
     */
    renderOverlays() {
        // Zoom indicator
        this.ctx.save();
        this.ctx.fillStyle = '#333333';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 10, 20);

        // Node count
        this.ctx.fillText(`Nodes: ${this.graph.nodes.size}`, 10, 35);
        this.ctx.fillText(`Edges: ${this.graph.edges.size}`, 10, 50);

        // Selected node info
        if (this.selectedNode) {
            const node = this.graph.nodes.get(this.selectedNode);
            if (node) {
                this.ctx.fillText(`Selected: ${node.name}`, 10, 70);
                this.ctx.fillText(`Type: ${node.nodeType}`, 10, 85);
                this.ctx.fillText(`Logic: ${node.logicType}`, 10, 100);
            }
        }

        this.ctx.restore();
    }

    /**
     * Event handlers
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on a node
        const node = this.getNodeAt(x, y);
        if (node) {
            this.selectedNode = node.id;
            this.isDragging = true;
            this.dragStart = { x, y };
        } else {
            // Start panning
            this.isDragging = true;
            this.dragStart = { x, y };
        }

        this.render();
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging && this.dragStart) {
            if (this.selectedNode) {
                // Move selected node
                const node = this.graph.nodes.get(this.selectedNode);
                if (node) {
                    const dx = (x - this.dragStart.x) / this.zoom;
                    const dy = (y - this.dragStart.y) / this.zoom;
                    node.position.x += dx;
                    node.position.y += dy;
                    this.dragStart = { x, y };
                }
            } else {
                // Pan view
                this.panX += x - this.dragStart.x;
                this.panY += y - this.dragStart.y;
                this.dragStart = { x, y };
            }
            this.render();
        } else {
            // Check hover
            const node = this.getNodeAt(x, y);
            const prevHovered = this.hoveredNode;
            this.hoveredNode = node ? node.id : null;

            if (prevHovered !== this.hoveredNode) {
                this.render();
            }
        }
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.dragStart = null;
    }

    onWheel(e) {
        e.preventDefault();

        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= scaleFactor;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));

        this.render();
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchEnd(e) {
        this.onMouseUp({});
    }

    onKeyDown(e) {
        switch(e.key) {
            case 'Delete':
                if (this.selectedNode) {
                    this.graph.removeNode(this.selectedNode);
                    this.selectedNode = null;
                    this.render();
                }
                break;
            case 'Escape':
                this.selectedNode = null;
                this.render();
                break;
            case 'f':
                // Fit to screen
                this.fitToScreen();
                break;
            case 'r':
                // Reset view
                this.zoom = 1;
                this.panX = 0;
                this.panY = 0;
                this.render();
                break;
        }
    }

    /**
     * Get node at screen coordinates
     */
    getNodeAt(screenX, screenY) {
        // Transform screen to world coordinates
        const worldX = (screenX - this.canvas.width / 2 - this.panX) / this.zoom;
        const worldY = (screenY - this.canvas.height / 2 - this.panY) / this.zoom;

        // Check each node
        for (const [, node] of this.graph.nodes) {
            const dx = worldX - node.position.x;
            const dy = worldY - node.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.styles.node.radius) {
                return node;
            }
        }

        return null;
    }

    /**
     * Fit graph to screen
     */
    fitToScreen() {
        if (this.graph.nodes.size === 0) return;

        // Find bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [, node] of this.graph.nodes) {
            minX = Math.min(minX, node.position.x);
            maxX = Math.max(maxX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxY = Math.max(maxY, node.position.y);
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Calculate zoom to fit
        const padding = 50;
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        this.zoom = Math.min(scaleX, scaleY, 2);

        // Center view
        this.panX = -centerX * this.zoom;
        this.panY = -centerY * this.zoom;

        this.render();
    }
}

// ============================================================================
// Configuration Panel
// ============================================================================

class TreeConfigPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentNode = null;
        this.currentGraph = null;
        this.callbacks = {};

        // Golden ratio for UI spacing
        this.phi = 1.618033988749895;

        if (this.container) {
            this.initializePanel();
        }
    }

    initializePanel() {
        // Panel initialization code would go here
        // Simplified for brevity
        console.log('TreeConfigPanel initialized');
    }

    loadNode(node, graph) {
        this.currentNode = node;
        this.currentGraph = graph;
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }
}

// ============================================================================
// Enhanced Tree Builder
// ============================================================================

class EnhancedTreeBuilder {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        this.graph = new LogicGraph({
            name: 'Research Survey Tree',
            type: 'dag'
        });

        // UI State
        this.mode = 'build';
        this.selectedNode = null;
        this.hoveredNode = null;
        this.draggedItem = null;
        this.connectionStart = null;
        this.defaultBranches = 2;

        // Visual settings
        this.gridSize = 20;
        this.nodeWidth = 180;
        this.nodeHeight = 80;
        this.gateSize = 40;

        this.init();
    }

    init() {
        this.createBuilderUI();
        this.setupEventHandlers();
        this.initializeCanvas();
    }

    createBuilderUI() {
        this.container.innerHTML = `
            <div class="enhanced-builder">
                <div class="builder-toolbar">
                    <div class="toolbar-section">
                        <button class="tool-btn active" data-mode="build">Build</button>
                        <button class="tool-btn" data-mode="connect">Connect</button>
                        <button class="tool-btn" data-mode="test">Test</button>
                    </div>
                    <div class="toolbar-section">
                        <button class="action-btn" onclick="window.treeBuilder.autoLayout()">Auto Layout</button>
                        <button class="action-btn" onclick="window.treeBuilder.saveTree()">Save</button>
                    </div>
                </div>
                <div class="canvas-container">
                    <canvas id="treeCanvas"></canvas>
                </div>
            </div>
        `;
        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .enhanced-builder {
                width: 100%;
                height: 600px;
                display: flex;
                flex-direction: column;
                background: #f8f9fa;
            }
            .builder-toolbar {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: white;
                border-bottom: 1px solid #e0e0e0;
            }
            .toolbar-section {
                display: flex;
                gap: 10px;
            }
            .tool-btn, .action-btn {
                padding: 8px 16px;
                border: 1px solid #d0d0d0;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .tool-btn.active {
                background: #0039A6;
                color: white;
            }
            .canvas-container {
                flex: 1;
                position: relative;
                background: #fafafa;
            }
            #treeCanvas {
                width: 100%;
                height: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventHandlers() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = btn.dataset.mode;
                this.setMode(mode);
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    initializeCanvas() {
        this.canvas = document.getElementById('treeCanvas');
        if (!this.canvas) return;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.renderer = new CanvasRenderer(this.canvas, this.graph);
        this.renderLoop();
    }

    renderLoop() {
        if (this.renderer) {
            this.renderer.render();
        }
        requestAnimationFrame(() => this.renderLoop());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setMode(mode) {
        this.mode = mode;
    }

    autoLayout() {
        TreeLayout.hierarchical(this.graph, {
            levelSeparation: 120,
            nodeSeparation: 100,
            direction: 'TB'
        });
    }

    saveTree() {
        const data = this.graph.toJSON();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `tree_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        console.log('Tree saved');
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }
}

// ============================================================================
// Export for Browser
// ============================================================================

if (typeof window !== 'undefined') {
    window.TreeVisualization = {
        AdvancedNode,
        LogicGraph,
        TreeLayout,
        CanvasRenderer,
        TreeConfigPanel,
        EnhancedTreeBuilder
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedNode,
        LogicGraph,
        TreeLayout,
        CanvasRenderer,
        TreeConfigPanel,
        EnhancedTreeBuilder
    };
}
