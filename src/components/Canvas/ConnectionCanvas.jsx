import React, { useRef, useEffect } from 'react';

/**
 * Connection Canvas Stub Component
 * TODO: Integrate with AdvancedConnectionCanvas.jsx from root
 */
const ConnectionCanvas = ({ nodes, onNodesChange, onConnectionsChange }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear canvas
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw placeholder text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 Connection Canvas', width / 2, height / 2 - 20);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('TODO: Integrate AdvancedConnectionCanvas.jsx', width / 2, height / 2 + 10);
  }, [nodes]);

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      />
    </div>
  );
};

export default ConnectionCanvas;
