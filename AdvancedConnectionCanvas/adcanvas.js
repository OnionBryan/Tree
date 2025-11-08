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

        // Draw node icon
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

        // Draw edge label
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
            this.onMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.onMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
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