/**
 * IEEE Logic Gate Renderer
 * Renders standard IEEE symbols for logic gates
 * Version: 1.0
 *
 * This module provides rendering capabilities for IEEE standard logic gate symbols
 * including AND, OR, NOT, XOR, NAND, NOR, XNOR, and advanced gates
 */

class IEEEGateRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.scale = 1;
        this.lineWidth = 2;
        this.strokeColor = '#333333';
        this.fillColor = '#FFFFFF';
        this.gateSize = 40;
    }

    /**
     * Set rendering context (for switching between canvases)
     */
    setContext(ctx) {
        this.ctx = ctx;
    }

    /**
     * Set rendering scale
     */
    setScale(scale) {
        this.scale = scale;
    }

    /**
     * Set stroke style
     */
    setStrokeStyle(color, width) {
        this.strokeColor = color;
        this.lineWidth = width;
    }

    /**
     * Draw AND Gate - IEEE Symbol
     * D-shaped gate with flat left side
     */
    drawANDGate(x, y, size = null, inputs = 2, label = 'AND') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        // Set styles
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        // Draw gate body
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2, -size/2);
        this.ctx.lineTo(0, -size/2);
        this.ctx.arc(0, 0, size/2, -Math.PI/2, Math.PI/2);
        this.ctx.lineTo(-size/2, size/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw inputs
        this.drawInputLines(inputs, size);

        // Draw output
        this.ctx.beginPath();
        this.ctx.moveTo(size/2, 0);
        this.ctx.lineTo(size/2 + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Draw OR Gate - IEEE Symbol
     * Curved input side, pointed output
     */
    drawORGate(x, y, size = null, inputs = 2, label = 'OR') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        // Draw gate body
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2, -size/2);
        this.ctx.quadraticCurveTo(-size/4, 0, -size/2, size/2);
        this.ctx.quadraticCurveTo(size/4, size/2, size/2, 0);
        this.ctx.quadraticCurveTo(size/4, -size/2, -size/2, -size/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw inputs
        this.drawInputLines(inputs, size, true);

        // Draw output
        this.ctx.beginPath();
        this.ctx.moveTo(size/2, 0);
        this.ctx.lineTo(size/2 + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Draw NOT Gate - IEEE Symbol
     * Triangle with bubble
     */
    drawNOTGate(x, y, size = null, label = 'NOT') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        // Draw triangle
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2, -size/3);
        this.ctx.lineTo(size/3, 0);
        this.ctx.lineTo(-size/2, size/3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw bubble
        const bubbleRadius = size/10;
        this.ctx.beginPath();
        this.ctx.arc(size/3 + bubbleRadius, 0, bubbleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw input
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2 - size/3, 0);
        this.ctx.lineTo(-size/2, 0);
        this.ctx.stroke();

        // Draw output
        this.ctx.beginPath();
        this.ctx.moveTo(size/3 + 2*bubbleRadius, 0);
        this.ctx.lineTo(size/3 + 2*bubbleRadius + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, -size/2 - 10);
        }

        this.ctx.restore();
    }

    /**
     * Draw XOR Gate - IEEE Symbol
     * OR gate with extra curved line
     */
    drawXORGate(x, y, size = null, inputs = 2, label = 'XOR') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        // Draw OR gate first
        this.ctx.restore();
        this.drawORGate(x, y, size, inputs, '');
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        // Draw extra curved line for XOR
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2 - size/10, -size/2);
        this.ctx.quadraticCurveTo(-size/4 - size/10, 0, -size/2 - size/10, size/2);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Draw NAND Gate - IEEE Symbol
     * AND gate with bubble
     */
    drawNANDGate(x, y, size = null, inputs = 2, label = 'NAND') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        // Draw AND gate
        this.drawANDGate(x, y, size, inputs, '');

        // Add bubble
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        const bubbleRadius = size/10;
        this.ctx.beginPath();
        this.ctx.arc(size/2 + bubbleRadius, 0, bubbleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Extend output line
        this.ctx.beginPath();
        this.ctx.moveTo(size/2 + 2*bubbleRadius, 0);
        this.ctx.lineTo(size/2 + 2*bubbleRadius + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Draw NOR Gate - IEEE Symbol
     * OR gate with bubble
     */
    drawNORGate(x, y, size = null, inputs = 2, label = 'NOR') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        // Draw OR gate
        this.drawORGate(x, y, size, inputs, '');

        // Add bubble
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        const bubbleRadius = size/10;
        this.ctx.beginPath();
        this.ctx.arc(size/2 + bubbleRadius, 0, bubbleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Extend output line
        this.ctx.beginPath();
        this.ctx.moveTo(size/2 + 2*bubbleRadius, 0);
        this.ctx.lineTo(size/2 + 2*bubbleRadius + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Draw XNOR Gate - IEEE Symbol
     * XOR gate with bubble
     */
    drawXNORGate(x, y, size = null, inputs = 2, label = 'XNOR') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        // Draw XOR gate
        this.drawXORGate(x, y, size, inputs, '');

        // Add bubble
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        const bubbleRadius = size/10;
        this.ctx.beginPath();
        this.ctx.arc(size/2 + bubbleRadius, 0, bubbleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Extend output line
        this.ctx.beginPath();
        this.ctx.moveTo(size/2 + 2*bubbleRadius, 0);
        this.ctx.lineTo(size/2 + 2*bubbleRadius + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Draw Buffer Gate - IEEE Symbol
     * Triangle without bubble
     */
    drawBufferGate(x, y, size = null, label = 'BUF') {
        if (!this.ctx) return;

        size = size || this.gateSize;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        // Draw triangle
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2, -size/3);
        this.ctx.lineTo(size/3, 0);
        this.ctx.lineTo(-size/2, size/3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw input
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2 - size/3, 0);
        this.ctx.lineTo(-size/2, 0);
        this.ctx.stroke();

        // Draw output
        this.ctx.beginPath();
        this.ctx.moveTo(size/3, 0);
        this.ctx.lineTo(size/3 + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, -size/2 - 10);
        }

        this.ctx.restore();
    }

    /**
     * Draw Multiplexer - IEEE Symbol
     */
    drawMUXGate(x, y, size = null, selectors = 1, label = 'MUX') {
        if (!this.ctx) return;

        size = size || this.gateSize * 1.5;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        // Draw trapezoid body
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2, -size/2);
        this.ctx.lineTo(size/3, -size/3);
        this.ctx.lineTo(size/3, size/3);
        this.ctx.lineTo(-size/2, size/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw inputs (2^selectors inputs)
        const numInputs = Math.pow(2, selectors);
        for (let i = 0; i < numInputs; i++) {
            const yPos = -size/2 + (i + 0.5) * size/numInputs;
            this.ctx.beginPath();
            this.ctx.moveTo(-size/2 - size/4, yPos);
            this.ctx.lineTo(-size/2, yPos);
            this.ctx.stroke();
        }

        // Draw selector lines
        for (let i = 0; i < selectors; i++) {
            const xPos = -size/4 + (i + 0.5) * size/(2*selectors);
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, size/2);
            this.ctx.lineTo(xPos, size/2 + size/4);
            this.ctx.stroke();
        }

        // Draw output
        this.ctx.beginPath();
        this.ctx.moveTo(size/3, 0);
        this.ctx.lineTo(size/3 + size/3, 0);
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }

    /**
     * Helper function to draw input lines
     */
    drawInputLines(numInputs, gateSize, curved = false) {
        if (numInputs === 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(-gateSize/2 - gateSize/3, 0);
            this.ctx.lineTo(-gateSize/2, 0);
            this.ctx.stroke();
        } else {
            const spacing = gateSize / (numInputs + 1);
            for (let i = 0; i < numInputs; i++) {
                const yPos = -gateSize/2 + (i + 1) * spacing;
                this.ctx.beginPath();
                this.ctx.moveTo(-gateSize/2 - gateSize/3, yPos);
                if (curved) {
                    // For OR gates, adjust input position slightly
                    const xPos = -gateSize/2 + Math.abs(yPos) * 0.1;
                    this.ctx.lineTo(xPos, yPos);
                } else {
                    this.ctx.lineTo(-gateSize/2, yPos);
                }
                this.ctx.stroke();
            }
        }
    }

    /**
     * Draw a complete logic circuit
     */
    drawCircuit(nodes, connections) {
        if (!this.ctx) return;

        // First draw all connections
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;

        for (const conn of connections) {
            this.ctx.beginPath();
            this.ctx.moveTo(conn.from.x, conn.from.y);

            if (conn.type === 'curved') {
                this.ctx.quadraticCurveTo(
                    conn.control.x, conn.control.y,
                    conn.to.x, conn.to.y
                );
            } else {
                this.ctx.lineTo(conn.to.x, conn.to.y);
            }

            this.ctx.stroke();
        }

        // Then draw all nodes
        for (const node of nodes) {
            this.drawGate(node.type, node.x, node.y, node.size, node.inputs, node.label);
        }
    }

    /**
     * Generic gate drawing function
     */
    drawGate(type, x, y, size, inputs, label) {
        switch(type.toLowerCase()) {
            case 'and':
                this.drawANDGate(x, y, size, inputs, label);
                break;
            case 'or':
                this.drawORGate(x, y, size, inputs, label);
                break;
            case 'not':
                this.drawNOTGate(x, y, size, label);
                break;
            case 'xor':
                this.drawXORGate(x, y, size, inputs, label);
                break;
            case 'nand':
                this.drawNANDGate(x, y, size, inputs, label);
                break;
            case 'nor':
                this.drawNORGate(x, y, size, inputs, label);
                break;
            case 'xnor':
                this.drawXNORGate(x, y, size, inputs, label);
                break;
            case 'buffer':
            case 'buf':
                this.drawBufferGate(x, y, size, label);
                break;
            case 'mux':
                this.drawMUXGate(x, y, size, inputs, label);
                break;
            default:
                // Draw generic box for unknown gate types
                this.drawGenericGate(x, y, size, label || type.toUpperCase());
        }
    }

    /**
     * Draw a generic gate (box with label)
     */
    drawGenericGate(x, y, size, label) {
        if (!this.ctx) return;

        size = size || this.gateSize;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.fillStyle = this.fillColor;

        // Draw box
        this.ctx.beginPath();
        this.ctx.rect(-size/2, -size/2, size, size);
        this.ctx.fill();
        this.ctx.stroke();

        // Add label
        if (label) {
            this.ctx.fillStyle = this.strokeColor;
            this.ctx.font = `${10 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
        }

        this.ctx.restore();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IEEEGateRenderer;
}
