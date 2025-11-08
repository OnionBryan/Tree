/**
 * Gate Palette Component
 * Draggable sidebar with all available gate types
 * Extracted from Canvas #5 gate palette + inspired by treeconfig.jsx
 */

import React, { useState } from 'react';
import { GATE_TYPES, GATE_COLORS, GATE_METADATA, GATE_CATEGORIES } from './constants/gateConfig.js';

const PHI = 1.618; // Golden ratio for spacing

export const GatePalette = ({
  onGateDragStart,
  onGateClick,
  isOpen = true,
  onToggle,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter gates by category and search
   */
  const getFilteredGates = () => {
    let gates = Object.entries(GATE_TYPES);

    // Filter by category
    if (selectedCategory !== 'all') {
      gates = gates.filter(([, type]) => {
        const metadata = GATE_METADATA[type];
        return metadata && metadata.category === selectedCategory;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      gates = gates.filter(([name, type]) => {
        const metadata = GATE_METADATA[type];
        return (
          name.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query) ||
          (metadata && metadata.description.toLowerCase().includes(query))
        );
      });
    }

    return gates;
  };

  /**
   * Handle gate drag start
   */
  const handleDragStart = (e, gateType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ gateType }));

    if (onGateDragStart) {
      onGateDragStart(gateType);
    }
  };

  /**
   * Handle gate click (alternative to drag)
   */
  const handleGateClick = (gateType) => {
    if (onGateClick) {
      onGateClick(gateType);
    }
  };

  const filteredGates = getFilteredGates();

  if (!isOpen) {
    return (
      <div className={`gate-palette-collapsed ${className}`}>
        <button
          onClick={onToggle}
          className="palette-toggle"
          title="Open Gate Palette"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className={`gate-palette ${className}`}>
      {/* Header */}
      <div className="palette-header">
        <h3>Gate Palette</h3>
        <button
          onClick={onToggle}
          className="palette-toggle"
          title="Close Gate Palette"
        >
          ◀
        </button>
      </div>

      {/* Search */}
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search gates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Filter */}
      <div className="palette-categories">
        <button
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {Object.entries(GATE_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            className={selectedCategory === category.id ? 'active' : ''}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      {/* Gate List */}
      <div className="palette-gates">
        {filteredGates.length === 0 ? (
          <div className="no-results">No gates found</div>
        ) : (
          filteredGates.map(([name, type]) => {
            const metadata = GATE_METADATA[type];
            const color = GATE_COLORS[type] || '#6366F1';

            return (
              <div
                key={type}
                className="gate-item"
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                onClick={() => handleGateClick(type)}
                title={metadata ? metadata.description : ''}
              >
                <div
                  className="gate-icon"
                  style={{
                    backgroundColor: color,
                    borderColor: color
                  }}
                >
                  {metadata && metadata.symbol ? metadata.symbol : name.charAt(0)}
                </div>
                <div className="gate-info">
                  <div className="gate-name">{name}</div>
                  {metadata && (
                    <div className="gate-inputs">
                      {metadata.inputs} in / {metadata.outputs} out
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="palette-footer">
        <div className="palette-tip">
          💡 Drag gates onto canvas or click to add
        </div>
      </div>

      <style jsx>{`
        .gate-palette {
          width: ${250 / PHI}px;
          height: 100%;
          background: #1F2937;
          border-right: 1px solid #374151;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .gate-palette-collapsed {
          width: 40px;
          height: 100%;
          background: #1F2937;
          border-right: 1px solid #374151;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .palette-header {
          padding: ${16 / PHI}px 16px;
          border-bottom: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .palette-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #F9FAFB;
        }

        .palette-toggle {
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 16px;
        }

        .palette-toggle:hover {
          color: #F9FAFB;
        }

        .palette-search {
          padding: ${12 / PHI}px 12px;
          border-bottom: 1px solid #374151;
        }

        .search-input {
          width: 100%;
          padding: ${8 / PHI}px 8px;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 4px;
          color: #F9FAFB;
          font-size: 12px;
        }

        .search-input:focus {
          outline: none;
          border-color: #6366F1;
        }

        .palette-categories {
          padding: ${10 / PHI}px 10px;
          border-bottom: 1px solid #374151;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .palette-categories button {
          padding: ${4 / PHI}px 8px;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 4px;
          color: #9CA3AF;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .palette-categories button:hover {
          background: #4B5563;
          color: #F9FAFB;
        }

        .palette-categories button.active {
          background: #6366F1;
          border-color: #6366F1;
          color: #FFFFFF;
        }

        .palette-gates {
          flex: 1;
          overflow-y: auto;
          padding: ${10 / PHI}px;
        }

        .gate-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: ${10 / PHI}px;
          margin-bottom: 8px;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 6px;
          cursor: grab;
          transition: all 0.2s;
        }

        .gate-item:hover {
          background: #4B5563;
          border-color: #6B7280;
          transform: translateX(4px);
        }

        .gate-item:active {
          cursor: grabbing;
        }

        .gate-icon {
          width: ${36 / PHI}px;
          height: ${36 / PHI}px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid;
        }

        .gate-info {
          flex: 1;
        }

        .gate-name {
          font-size: 12px;
          font-weight: 600;
          color: #F9FAFB;
          margin-bottom: 2px;
        }

        .gate-inputs {
          font-size: 10px;
          color: #9CA3AF;
        }

        .no-results {
          text-align: center;
          padding: 20px;
          color: #6B7280;
          font-size: 12px;
        }

        .palette-footer {
          padding: ${12 / PHI}px 12px;
          border-top: 1px solid #374151;
          background: #111827;
        }

        .palette-tip {
          font-size: 11px;
          color: #6B7280;
          text-align: center;
        }

        /* Scrollbar */
        .palette-gates::-webkit-scrollbar {
          width: 6px;
        }

        .palette-gates::-webkit-scrollbar-track {
          background: #1F2937;
        }

        .palette-gates::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
        }

        .palette-gates::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default GatePalette;
