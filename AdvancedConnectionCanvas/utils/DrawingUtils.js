/**
 * Canvas Drawing Utilities
 * All rendering functions for nodes, connections, ports, and UI elements
 * Extracted from Canvas #5 (tree-builder.html)
 */

import {
  GRID_CONFIG,
  NODE_CONFIG,
  PORT_CONFIG,
  CONNECTION_CONFIG
} from '../constants/canvasConfig.js';
import { GATE_COLORS } from '../constants/gateConfig.js';

/**
 * Draw grid background
 * From initializeConnectionCanvas drawing code
 */
export function drawGrid(ctx, canvas) {
  if (!GRID_CONFIG.enabled) return;

  ctx.strokeStyle = GRID_CONFIG.color;
  ctx.lineWidth = GRID_CONFIG.lineWidth;
  ctx.beginPath();

  // Vertical lines
  for (let x = 0; x < canvas.width; x += GRID_CONFIG.spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }

  // Horizontal lines
  for (let y = 0; y < canvas.height; y += GRID_CONFIG.spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.stroke();
}

/**
 * Draw a node (gate) on the canvas
 * From initializeConnectionCanvas and addGateToCanvas
 */
export function drawNode(ctx, node) {
  const { x, y, type } = node;
  const { width, height, strokeWidth, strokeColor, shadow, text } = NODE_CONFIG;

  // Save context
  ctx.save();

  // Draw shadow
  if (shadow.enabled) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
  }

  // Draw node body
  const color = GATE_COLORS[type] || GATE_COLORS.decision;
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y - height / 2, width, height);

  // Reset shadow for stroke
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw border
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(x - width / 2, y - height / 2, width, height);

  // Draw label
  ctx.fillStyle = text.color;
  ctx.font = text.font;
  ctx.textAlign = text.align;
  ctx.textBaseline = text.baseline;
  ctx.fillText((type || 'NODE').toUpperCase(), x, y);

  // Restore context
  ctx.restore();
}

/**
 * Draw input ports for a node
 */
export function drawInputPorts(ctx, node) {
  if (!node.inputs || node.inputs.length === 0) return;

  node.inputs.forEach((port, index) => {
    const isActive = port.value > 0;
    const color = isActive ? PORT_CONFIG.input.active : PORT_CONFIG.input.inactive;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(port.x, port.y, PORT_CONFIG.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = PORT_CONFIG.strokeColor;
    ctx.lineWidth = PORT_CONFIG.strokeWidth;
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * Draw output ports for a node
 */
export function drawOutputPorts(ctx, node) {
  if (!node.outputs || node.outputs.length === 0) return;

  node.outputs.forEach((port, index) => {
    const isActive = port.value > 0;
    const color = isActive ? PORT_CONFIG.output.active : PORT_CONFIG.output.inactive;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(port.x, port.y, PORT_CONFIG.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = PORT_CONFIG.strokeColor;
    ctx.lineWidth = PORT_CONFIG.strokeWidth;
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * Draw a Bezier curve connection between two ports
 * From initializeConnectionCanvas connection drawing
 */
export function drawConnection(ctx, fromPort, toPort, connection = {}) {
  const { strokeWidth, color, bezier, arrow, label: labelConfig } = CONNECTION_CONFIG;

  // Determine visual state (hovered or selected)
  const isHovered = connection.isHovered || false;
  const isSelected = connection.isSelected || false;

  ctx.save();

  // Apply hover/selection styling
  if (isSelected) {
    ctx.strokeStyle = '#3B82F6'; // Blue for selected
    ctx.lineWidth = (connection.strokeWidth || strokeWidth) * 1.8;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    ctx.shadowBlur = 8;
  } else if (isHovered) {
    ctx.strokeStyle = '#10B981'; // Green for hover
    ctx.lineWidth = (connection.strokeWidth || strokeWidth) * 1.5;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.3)';
    ctx.shadowBlur = 6;
  } else {
    ctx.strokeStyle = connection.color || color;
    ctx.lineWidth = connection.strokeWidth || strokeWidth;
  }

  // Draw bezier curve
  if (bezier.enabled) {
    const cp1x = fromPort.x + bezier.controlPointOffset;
    const cp2x = toPort.x - bezier.controlPointOffset;

    ctx.beginPath();
    ctx.moveTo(fromPort.x, fromPort.y);
    ctx.bezierCurveTo(cp1x, fromPort.y, cp2x, toPort.y, toPort.x, toPort.y);
    ctx.stroke();

    // Calculate midpoint for label (t = 0.5)
    const t = 0.5;
    const midX = Math.pow(1 - t, 3) * fromPort.x +
      3 * Math.pow(1 - t, 2) * t * cp1x +
      3 * (1 - t) * Math.pow(t, 2) * cp2x +
      Math.pow(t, 3) * toPort.x;
    const midY = Math.pow(1 - t, 3) * fromPort.y +
      3 * Math.pow(1 - t, 2) * t * fromPort.y +
      3 * (1 - t) * Math.pow(t, 2) * toPort.y +
      Math.pow(t, 3) * toPort.y;

    // Draw label if enabled
    if (labelConfig.enabled && connection.label !== undefined) {
      drawConnectionLabel(ctx, midX, midY, connection.label);
    }

    // Draw arrow at target
    if (arrow.enabled) {
      drawArrow(ctx, toPort.x, toPort.y, cp2x, toPort.y);
    }
  } else {
    // Simple straight line
    ctx.beginPath();
    ctx.moveTo(fromPort.x, fromPort.y);
    ctx.lineTo(toPort.x, toPort.y);
    ctx.stroke();

    // Draw arrow
    if (arrow.enabled) {
      const angle = Math.atan2(toPort.y - fromPort.y, toPort.x - fromPort.x);
      drawArrowAtAngle(ctx, toPort.x, toPort.y, angle);
    }
  }

  ctx.restore();
}

/**
 * Draw connection label at midpoint
 */
function drawConnectionLabel(ctx, x, y, label) {
  const { padding, font, backgroundColor, borderColor, borderWidth, textColor, textAlign, textBaseline } = CONNECTION_CONFIG.label;

  ctx.save();

  // Draw background box
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(x - padding.horizontal, y - padding.vertical, padding.horizontal * 2, padding.vertical * 2);

  // Draw border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(x - padding.horizontal, y - padding.vertical, padding.horizontal * 2, padding.vertical * 2);

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  ctx.fillText(String(label), x, y);

  ctx.restore();
}

/**
 * Draw arrow at endpoint
 */
function drawArrow(ctx, toX, toY, fromX, fromY) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  drawArrowAtAngle(ctx, toX, toY, angle);
}

/**
 * Draw arrow at specific angle
 */
function drawArrowAtAngle(ctx, x, y, angle) {
  const { width, height, color } = CONNECTION_CONFIG.arrow;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI); // Point backward
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, -height / 2);
  ctx.lineTo(width, height / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * Draw temporary connection line (while dragging)
 * From initializeConnectionCanvas temporary connection drawing
 */
export function drawTempConnection(ctx, fromPort, mousePos) {
  const { strokeWidth, color, dashArray } = CONNECTION_CONFIG.temporary;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.setLineDash(dashArray);
  ctx.beginPath();
  ctx.moveTo(fromPort.x, fromPort.y);
  ctx.lineTo(mousePos.x, mousePos.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Clear entire canvas
 */
export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Check if point is inside node bounds
 * For hit detection
 */
export function isPointInNode(x, y, node) {
  const { width, height } = NODE_CONFIG;
  return x >= node.x - width / 2 &&
    x <= node.x + width / 2 &&
    y >= node.y - height / 2 &&
    y <= node.y + height / 2;
}

/**
 * Check if point is near port
 * For port selection
 */
export function isPointNearPort(x, y, port) {
  const distance = Math.sqrt(
    Math.pow(x - port.x, 2) +
    Math.pow(y - port.y, 2)
  );
  return distance <= PORT_CONFIG.hitRadius;
}

/**
 * Check if point is near a connection (Bezier curve)
 * Uses multiple sample points along the curve for accurate hit detection
 * @param {number} x - Test point X
 * @param {number} y - Test point Y
 * @param {Object} fromPort - Start port {x, y}
 * @param {Object} toPort - End port {x, y}
 * @param {number} threshold - Distance threshold (default 8px)
 * @returns {boolean} True if point is near the connection
 */
export function isPointNearConnection(x, y, fromPort, toPort, threshold = 8) {
  const samples = 20; // Number of points to sample along the curve
  const dx = toPort.x - fromPort.x;

  // Calculate control points for Bezier curve (matching drawConnection)
  const controlPointOffset = Math.abs(dx) / 2;
  const cp1x = fromPort.x + controlPointOffset;
  const cp1y = fromPort.y;
  const cp2x = toPort.x - controlPointOffset;
  const cp2y = toPort.y;

  // Sample points along the Bezier curve
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;

    // Cubic Bezier formula
    const curveX =
      Math.pow(1 - t, 3) * fromPort.x +
      3 * Math.pow(1 - t, 2) * t * cp1x +
      3 * (1 - t) * Math.pow(t, 2) * cp2x +
      Math.pow(t, 3) * toPort.x;

    const curveY =
      Math.pow(1 - t, 3) * fromPort.y +
      3 * Math.pow(1 - t, 2) * t * cp1y +
      3 * (1 - t) * Math.pow(t, 2) * cp2y +
      Math.pow(t, 3) * toPort.y;

    // Check distance to this sample point
    const distance = Math.sqrt(
      Math.pow(x - curveX, 2) +
      Math.pow(y - curveY, 2)
    );

    if (distance <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate port positions for a node
 * From addGateToCanvas port calculation
 */
export function calculatePortPositions(node) {
  const { width } = NODE_CONFIG;
  const { offset } = PORT_CONFIG;

  // Input ports (left side)
  const inputCount = node.inputs?.length || 1;
  const inputs = [];
  for (let i = 0; i < inputCount; i++) {
    inputs.push({
      x: node.x - offset,
      y: node.y - 10 + (i * 20),
      value: 0
    });
  }

  // Output ports (right side)
  const outputCount = node.outputs?.length || node.branchCount || 2;
  const outputs = [];
  for (let i = 0; i < outputCount; i++) {
    outputs.push({
      x: node.x + offset,
      y: node.y - 10 + (i * 20),
      value: 0
    });
  }

  return { inputs, outputs };
}

/**
 * Redraw entire canvas (full render)
 * Main drawing loop
 */
export function redrawCanvas(ctx, canvas, nodes, connections, canvasState) {
  // Clear canvas
  clearCanvas(ctx, canvas);

  // Draw grid
  drawGrid(ctx, canvas);

  // Draw all connections first (behind nodes)
  connections.forEach(conn => {
    const fromNode = nodes.get(conn.from);
    const toNode = nodes.get(conn.to);

    if (fromNode && toNode) {
      const fromPort = fromNode.outputs[conn.fromPort] || { x: fromNode.x + 40, y: fromNode.y };
      const toPort = toNode.inputs[conn.toPort] || { x: toNode.x - 40, y: toNode.y };

      // Check if this connection is hovered or selected
      const isHovered = canvasState.hoveredConnection === conn.id;
      const isSelected = canvasState.selectedConnection === conn.id;

      drawConnection(ctx, fromPort, toPort, {
        label: conn.threshold !== undefined ? conn.threshold :
          conn.fromPort === 0 ? '< T' :
            conn.fromPort === 1 ? '≥ T' : `P${conn.fromPort + 1}`,
        isHovered,
        isSelected
      });
    }
  });

  // Draw temporary connection if dragging
  if (canvasState.isConnecting && canvasState.connectionStart) {
    const startNode = nodes.get(canvasState.connectionStart.nodeId);
    if (startNode && startNode.outputs[canvasState.connectionStart.portIndex]) {
      const port = startNode.outputs[canvasState.connectionStart.portIndex];
      drawTempConnection(ctx, port, canvasState.mousePos);
    }
  }

  // Draw all nodes
  nodes.forEach(node => {
    drawNode(ctx, node);
    drawInputPorts(ctx, node);
    drawOutputPorts(ctx, node);
  });
}
