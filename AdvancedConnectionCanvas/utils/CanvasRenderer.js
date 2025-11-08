/**
 * Canvas Renderer for Advanced Connection Canvas
 * Adapted from adcanvas.js + merged with DrawingUtils.js
 * Handles all canvas rendering with pan/zoom, nodes, connections, ports
 */

import { NODE_CONFIG, PORT_CONFIG, CONNECTION_CONFIG, GRID_CONFIG, CANVAS_CONFIG } from '../constants/canvasConfig.js';
import { GATE_COLORS } from '../constants/gateConfig.js';

/**
 * Advanced Canvas Renderer Class
 * Complete rendering engine for connection canvas with gates
 */
export class CanvasRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // View settings
    this.zoom = options.zoom || 1;
    this.panX = options.panX || 0;
    this.panY = options.panY || 0;

    // Data references (set externally)
    this.nodes = options.nodes || new Map();
    this.connections = options.connections || new Map();

    // State
    this.hoveredNode = null;
    this.selectedNode = null;
    this.tempConnection = null; // { from: {x, y}, to: {x, y} }

    // Style configuration (merge defaults with options)
    this.styles = {
      node: { ...NODE_CONFIG, ...options.nodeStyles },
      port: { ...PORT_CONFIG, ...options.portStyles },
      connection: { ...CONNECTION_CONFIG, ...options.connectionStyles },
      grid: { ...GRID_CONFIG, ...options.gridStyles }
    };
  }

  /**
   * Set data references
   */
  setData(nodes, connections) {
    this.nodes = nodes;
    this.connections = connections;
  }

  /**
   * Set view transform
   */
  setView(zoom, panX, panY) {
    this.zoom = zoom;
    this.panX = panX;
    this.panY = panY;
  }

  /**
   * Main render loop
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply transformations (pan/zoom)
    this.ctx.translate(
      this.canvas.width / 2 + this.panX,
      this.canvas.height / 2 + this.panY
    );
    this.ctx.scale(this.zoom, this.zoom);

    // Draw grid
    if (this.styles.grid.enabled) {
      this.drawGrid();
    }

    // Draw connections
    for (const [, connection] of this.connections) {
      this.drawConnection(connection);
    }

    // Draw temporary connection (during dragging)
    if (this.tempConnection) {
      this.drawTempConnection(this.tempConnection);
    }

    // Draw nodes
    for (const [, node] of this.nodes) {
      this.drawNode(node);
    }

    // Restore context state
    this.ctx.restore();

    // Render UI overlays (not transformed)
    this.renderOverlays();
  }

  // ============================================================================
  // Grid Drawing
  // ============================================================================

  /**
   * Draw background grid
   */
  drawGrid() {
    const { size, color, lineWidth } = this.styles.grid;

    // Calculate visible grid bounds
    const worldBounds = this.getWorldBounds();
    const startX = Math.floor(worldBounds.minX / size) * size;
    const endX = Math.ceil(worldBounds.maxX / size) * size;
    const startY = Math.floor(worldBounds.minY / size) * size;
    const endY = Math.ceil(worldBounds.maxY / size) * size;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth / this.zoom;
    this.ctx.globalAlpha = 0.3;

    // Vertical lines
    for (let x = startX; x <= endX; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // ============================================================================
  // Node Drawing
  // ============================================================================

  /**
   * Draw a node with ports
   */
  drawNode(node) {
    const isSelected = node.id === this.selectedNode;
    const isHovered = node.id === this.hoveredNode;

    this.ctx.save();
    this.ctx.translate(node.x, node.y);

    // Draw node body
    this.drawNodeBody(node, isSelected, isHovered);

    // Draw node label
    this.drawNodeLabel(node);

    // Draw state indicators
    if (node.active) {
      this.drawActiveIndicator();
    }
    if (node.error) {
      this.drawErrorIndicator();
    }

    this.ctx.restore();

    // Draw ports (in world space)
    this.drawInputPorts(node);
    this.drawOutputPorts(node);
  }

  /**
   * Draw node body (rectangle with rounded corners)
   */
  drawNodeBody(node, isSelected, isHovered) {
    const { width, height, borderRadius } = this.styles.node;
    const { shadow } = this.styles.node;

    // Shadow
    if (shadow.enabled) {
      this.ctx.shadowColor = shadow.color;
      this.ctx.shadowBlur = shadow.blur;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 2;
    }

    // Fill
    this.ctx.fillStyle = node.color || GATE_COLORS[node.type] || '#6366F1';

    // Border for selection/hover
    if (isSelected || isHovered) {
      this.ctx.strokeStyle = isSelected ? '#F59E0B' : '#10B981';
      this.ctx.lineWidth = 3;
    } else {
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
    }

    // Draw rounded rectangle
    const x = -width / 2;
    const y = -height / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(x + borderRadius, y);
    this.ctx.lineTo(x + width - borderRadius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
    this.ctx.lineTo(x + width, y + height - borderRadius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
    this.ctx.lineTo(x + borderRadius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
    this.ctx.lineTo(x, y + borderRadius);
    this.ctx.quadraticCurveTo(x, y, x + borderRadius, y);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw node label
   */
  drawNodeLabel(node) {
    const { font, color } = this.styles.node.text;

    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(node.label || node.type.toUpperCase(), 0, 0);
  }

  /**
   * Draw active indicator (green border)
   */
  drawActiveIndicator() {
    const { width, height } = this.styles.node;

    this.ctx.strokeStyle = '#10B981';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(-width / 2, -height / 2, width, height);
  }

  /**
   * Draw error indicator (red border)
   */
  drawErrorIndicator() {
    const { width, height } = this.styles.node;

    this.ctx.strokeStyle = '#EF4444';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(-width / 2, -height / 2, width, height);
  }

  /**
   * Draw input ports on left side of node
   */
  drawInputPorts(node) {
    if (!node.inputs || node.inputs.length === 0) return;

    node.inputs.forEach(port => {
      this.drawPort(port, 'input', port.active || false);
    });
  }

  /**
   * Draw output ports on right side of node
   */
  drawOutputPorts(node) {
    if (!node.outputs || node.outputs.length === 0) return;

    node.outputs.forEach(port => {
      this.drawPort(port, 'output', port.active || false);
    });
  }

  /**
   * Draw a single port
   */
  drawPort(port, type, isActive) {
    const { radius, input, output } = this.styles.port;
    const colors = type === 'input' ? input : output;

    this.ctx.save();
    this.ctx.translate(port.x, port.y);

    // Port circle
    this.ctx.fillStyle = isActive ? colors.active : colors.inactive;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    // Port label (if enabled)
    if (this.styles.port.labelEnabled && port.label) {
      this.ctx.fillStyle = '#9CA3AF';
      this.ctx.font = '10px system-ui';
      this.ctx.textAlign = type === 'input' ? 'right' : 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(port.label, type === 'input' ? -10 : 10, 0);
    }

    this.ctx.restore();
  }

  // ============================================================================
  // Connection Drawing
  // ============================================================================

  /**
   * Draw a connection between two ports
   */
  drawConnection(connection) {
    const fromNode = this.nodes.get(connection.from);
    const toNode = this.nodes.get(connection.to);

    if (!fromNode || !toNode) return;

    const fromPort = fromNode.outputs?.[connection.fromPort];
    const toPort = toNode.inputs?.[connection.toPort];

    if (!fromPort || !toPort) return;

    const { bezier, arrow, label } = this.styles.connection;

    this.ctx.save();

    // Connection style
    this.ctx.strokeStyle = connection.active ? '#10B981' : '#6B7280';
    this.ctx.lineWidth = connection.active ? 3 : 2;

    this.ctx.beginPath();
    this.ctx.moveTo(fromPort.x, fromPort.y);

    if (bezier.enabled) {
      // Bezier curve
      const cp1x = fromPort.x + bezier.controlPointOffset;
      const cp1y = fromPort.y;
      const cp2x = toPort.x - bezier.controlPointOffset;
      const cp2y = toPort.y;

      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toPort.x, toPort.y);
    } else {
      // Straight line
      this.ctx.lineTo(toPort.x, toPort.y);
    }

    this.ctx.stroke();

    // Draw arrow at end
    if (arrow.enabled) {
      const angle = Math.atan2(toPort.y - fromPort.y, toPort.x - fromPort.x);
      this.drawArrow(toPort.x, toPort.y, angle, arrow.size);
    }

    // Draw label/threshold at midpoint
    if (label.enabled && (connection.label || connection.threshold !== null)) {
      const t = 0.5;
      const midX = Math.pow(1-t, 3) * fromPort.x +
                   3 * Math.pow(1-t, 2) * t * (fromPort.x + bezier.controlPointOffset) +
                   3 * (1-t) * Math.pow(t, 2) * (toPort.x - bezier.controlPointOffset) +
                   Math.pow(t, 3) * toPort.x;
      const midY = Math.pow(1-t, 3) * fromPort.y +
                   3 * Math.pow(1-t, 2) * t * fromPort.y +
                   3 * (1-t) * Math.pow(t, 2) * toPort.y +
                   Math.pow(t, 3) * toPort.y;

      this.drawConnectionLabel(
        midX, midY,
        connection.label || `T=${connection.threshold}`
      );
    }

    this.ctx.restore();
  }

  /**
   * Draw temporary connection (during dragging)
   */
  drawTempConnection(tempConn) {
    const { from, to } = tempConn;
    const { bezier } = this.styles.connection;

    this.ctx.save();
    this.ctx.strokeStyle = '#F59E0B';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);

    if (bezier.enabled) {
      const cp1x = from.x + bezier.controlPointOffset;
      const cp2x = to.x - bezier.controlPointOffset;
      this.ctx.bezierCurveTo(cp1x, from.y, cp2x, to.y, to.x, to.y);
    } else {
      this.ctx.lineTo(to.x, to.y);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draw connection label
   */
  drawConnectionLabel(x, y, text) {
    const { fontSize, padding, background, textColor } = this.styles.connection.label;

    this.ctx.save();

    // Measure text
    this.ctx.font = `${fontSize}px system-ui`;
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;

    // Background
    this.ctx.fillStyle = background;
    this.ctx.fillRect(
      x - textWidth / 2 - padding,
      y - fontSize / 2 - padding,
      textWidth + padding * 2,
      fontSize + padding * 2
    );

    // Text
    this.ctx.fillStyle = textColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  /**
   * Draw arrow head
   */
  drawArrow(x, y, angle, size) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(-size, -size / 2);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(-size, size / 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // ============================================================================
  // UI Overlays
  // ============================================================================

  /**
   * Render UI overlays (zoom, node count, etc.)
   */
  renderOverlays() {
    if (!CANVAS_CONFIG.showOverlays) return;

    this.ctx.save();
    this.ctx.fillStyle = '#1F2937';
    this.ctx.font = '12px monospace';

    // Zoom indicator
    this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 10, 20);

    // Stats
    this.ctx.fillText(`Nodes: ${this.nodes.size}`, 10, 35);
    this.ctx.fillText(`Connections: ${this.connections.size}`, 10, 50);

    // Selected node info
    if (this.selectedNode) {
      const node = this.nodes.get(this.selectedNode);
      if (node) {
        this.ctx.fillText(`Selected: ${node.label}`, 10, 70);
        this.ctx.fillText(`Type: ${node.type}`, 10, 85);
      }
    }

    this.ctx.restore();
  }

  // ============================================================================
  // Coordinate Transforms
  // ============================================================================

  /**
   * Transform screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.canvas.width / 2 - this.panX) / this.zoom,
      y: (screenY - this.canvas.height / 2 - this.panY) / this.zoom
    };
  }

  /**
   * Transform world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.canvas.width / 2 + this.panX,
      y: worldY * this.zoom + this.canvas.height / 2 + this.panY
    };
  }

  /**
   * Get visible world bounds
   */
  getWorldBounds() {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y
    };
  }

  // ============================================================================
  // Hit Testing
  // ============================================================================

  /**
   * Get node at screen coordinates
   */
  getNodeAt(screenX, screenY) {
    const world = this.screenToWorld(screenX, screenY);

    for (const [, node] of this.nodes) {
      if (this.isPointInNode(world.x, world.y, node)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Check if point is inside node
   */
  isPointInNode(x, y, node) {
    const { width, height } = this.styles.node;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return x >= node.x - halfWidth &&
           x <= node.x + halfWidth &&
           y >= node.y - halfHeight &&
           y <= node.y + halfHeight;
  }

  /**
   * Get port at screen coordinates
   */
  getPortAt(screenX, screenY) {
    const world = this.screenToWorld(screenX, screenY);
    const { hitRadius } = this.styles.port;

    for (const [, node] of this.nodes) {
      // Check output ports
      if (node.outputs) {
        for (let i = 0; i < node.outputs.length; i++) {
          const port = node.outputs[i];
          if (this.isPointNearPort(world.x, world.y, port, hitRadius)) {
            return { nodeId: node.id, portType: 'output', portIndex: i, port };
          }
        }
      }

      // Check input ports
      if (node.inputs) {
        for (let i = 0; i < node.inputs.length; i++) {
          const port = node.inputs[i];
          if (this.isPointNearPort(world.x, world.y, port, hitRadius)) {
            return { nodeId: node.id, portType: 'input', portIndex: i, port };
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if point is near port
   */
  isPointNearPort(x, y, port, radius = null) {
    const r = radius || this.styles.port.hitRadius;
    const dx = x - port.x;
    const dy = y - port.y;
    return Math.sqrt(dx * dx + dy * dy) <= r;
  }

  // ============================================================================
  // View Control
  // ============================================================================

  /**
   * Fit all nodes to screen
   */
  fitToScreen() {
    if (this.nodes.size === 0) return;

    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const [, node] of this.nodes) {
      const halfWidth = this.styles.node.width / 2;
      const halfHeight = this.styles.node.height / 2;

      minX = Math.min(minX, node.x - halfWidth);
      maxX = Math.max(maxX, node.x + halfWidth);
      minY = Math.min(minY, node.y - halfHeight);
      maxY = Math.max(maxY, node.y + halfHeight);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom to fit
    const padding = 100;
    const scaleX = (this.canvas.width - padding * 2) / width;
    const scaleY = (this.canvas.height - padding * 2) / height;
    this.zoom = Math.min(scaleX, scaleY, 2);

    // Center view
    this.panX = -centerX * this.zoom;
    this.panY = -centerY * this.zoom;
  }

  /**
   * Reset view to default
   */
  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Set temporary connection (during dragging)
   */
  setTempConnection(from, to) {
    this.tempConnection = from && to ? { from, to } : null;
  }

  /**
   * Set hovered node
   */
  setHoveredNode(nodeId) {
    this.hoveredNode = nodeId;
  }

  /**
   * Set selected node
   */
  setSelectedNode(nodeId) {
    this.selectedNode = nodeId;
  }
}

/**
 * Create a new canvas renderer
 */
export function createCanvasRenderer(canvas, options) {
  return new CanvasRenderer(canvas, options);
}
